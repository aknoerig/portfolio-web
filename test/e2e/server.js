'use strict';

// Mirror the patches from keystone.js before any module loads the driver.
(function patchMongoDeprecations() {
	const Collection = require('mongodb/lib/collection');
	Collection.prototype.ensureIndex = function(fieldOrSpec, options, callback) {
		if (typeof options === 'function') { callback = options; options = {}; }
		return this.createIndex(fieldOrSpec, options || {}, callback);
	};
	Collection.prototype.count = function(query, options, callback) {
		if (typeof query === 'function') { callback = query; query = {}; options = {}; }
		else if (typeof options === 'function') { callback = options; options = {}; }
		return this.countDocuments(query || {}, options || {}, callback);
	};
}());

const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const keystone = require('keystone');
const helmet = require('helmet');

const PORT = Number(process.env.E2E_PORT) || 3001;
const PROJECT_ROOT = path.join(__dirname, '../..');

async function main() {
	const mongod = await MongoMemoryServer.create();

	const pluralize = keystone.mongoose.pluralize();
	keystone.prefixModel = function(key) {
		const modelPrefix = keystone.get('model prefix');
		if (modelPrefix) key = modelPrefix + '_' + key;
		return pluralize(key);
	};

	keystone.init({
		'name': 'André Knörig',
		'brand': 'André Knörig',
		'module root': PROJECT_ROOT,
		'views': 'templates/views',
		'view engine': 'pug',
		'static': 'public',
		'favicon': 'public/favicon.ico',
		'emails': 'templates/emails',
		'mongo': mongod.getUri(),
		'mongo options': { useNewUrlParser: true, useUnifiedTopology: true, dbName: 'e2e' },
		'cookie secret': 'e2e-test-secret',
		'session': true,
		'auth': false,
		'user model': 'User',
		'cloudinary config': { cloud_name: 'test', api_key: 'test', api_secret: 'test' },
		'embedly api key': 'test',
		'auto update': false,
		'headless': true,
		'logger': false,
		'compress': false,
		'frame guard': false,
		'port': PORT,
	});

	keystone.set('locals', {
		_: require('underscore'),
		moment: require('moment'),
		env: 'testing',
		utils: keystone.utils,
		editable: () => '',
		ga_property: '',
		ga_domain: '',
		embedly_api_key: '',
	});

	keystone.import('models');

	keystone.set('routes', require('../../routes'));

	keystone.pre('routes', helmet({
		contentSecurityPolicy: {
			directives: {
				...helmet.contentSecurityPolicy.getDefaultDirectives(),
				'img-src': ["'self'", 'data:', 'https://res.cloudinary.com'],
				'frame-src': ["'self'", 'https://cdn.embedly.com'],
				'script-src': ["'self'", "'unsafe-inline'", 'code.jquery.com'],
			},
		},
	}));

	// Stub email so the Enquiry post-save hook doesn't call process.exit(1).
	keystone.Email = function NoopEmail() {};
	keystone.Email.prototype.send = function(opts, cb) { if (cb) cb(); };

	keystone.start();

	const shutdown = async () => {
		keystone.closeDatabaseConnection(() => {});
		await mongod.stop();
		process.exit(0);
	};
	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}

main().catch(err => {
	console.error('E2E server failed to start:', err);
	process.exit(1);
});
