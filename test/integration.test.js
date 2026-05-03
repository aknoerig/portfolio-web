'use strict';

const path = require('path');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const helmet = require('helmet');

const PROJECT_ROOT = path.join(__dirname, '..');

// ─── MongoDB driver patches ───────────────────────────────────────────────────
// Mirror the patches in keystone.js so Keystone's pagination and indexing work
// with the current MongoDB Node.js driver (which removed these deprecated APIs).
(function patchMongoDeprecations() {
	const Collection = require('mongodb/lib/collection');
	if (Collection.prototype.__testPatched) return;
	Collection.prototype.ensureIndex = function(fieldOrSpec, options, callback) {
		if (typeof options === 'function') { callback = options; options = {}; }
		return this.createIndex(fieldOrSpec, options || {}, callback);
	};
	Collection.prototype.count = function(query, options, callback) {
		if (typeof query === 'function') { callback = query; query = {}; options = {}; }
		else if (typeof options === 'function') { callback = options; options = {}; }
		return this.countDocuments(query || {}, options || {}, callback);
	};
	Collection.prototype.__testPatched = true;
}());

const keystone = require('keystone');

// ─── Test lifecycle ───────────────────────────────────────────────────────────
let mongod;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();

	// Patch pluralization so Mongoose collection names match atlas convention
	// (mirrors keystone.js). Must run after keystone is required.
	const pluralize = keystone.mongoose.pluralize();
	keystone.prefixModel = function(key) {
		const modelPrefix = keystone.get('model prefix');
		if (modelPrefix) key = modelPrefix + '_' + key;
		return pluralize(key);
	};

	keystone.init({
		'module root': PROJECT_ROOT,
		'name': 'Test',
		'brand': 'Test',
		'views': 'templates/views',
		'view engine': 'pug',
		'static': 'public',
		'favicon': 'public/favicon.ico',
		'emails': 'templates/emails',
		'mongo': mongod.getUri(),
		'mongo options': { useNewUrlParser: true, useUnifiedTopology: true, dbName: 'test' },
		'cookie secret': 'test-cookie-secret-for-integration',
		'session': true,
		'auth': false,    // no Passport setup; req.user will be null (handled by initLocals)
		'user model': 'User', // session restore still needs this even without auth
		// CloudinaryImage and Embedly field types validate their config at model
		// definition time. Provide dummy values so models can register in tests.
		'cloudinary config': { cloud_name: 'test', api_key: 'test', api_secret: 'test' },
		'embedly api key': 'test',
		'auto update': false,
		'headless': true, // skip admin UI routes
		'logger': false,
		'compress': false,
		'frame guard': false,
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

	// Add the CSP header middleware to the pre:routes hook — same as keystone.js.
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

	// Load models through Jest's module registry so every model file and every
	// view controller all share the same keystone instance. keystone.import()
	// uses Node's native require (it runs inside node_modules), which can produce
	// a separate instance from the one Jest gave us.
	require('../models/User');
	require('../models/Project');
	require('../models/ProjectCategory');
	require('../models/Activity');
	require('../models/ActivityCategory');
	require('../models/Post');
	require('../models/PostCategory');
	require('../models/Publication');
	require('../models/PublicationCategory');
	require('../models/Industry');
	require('../models/Interaction');
	require('../models/Technology');
	require('../models/Organization');
	require('../models/Enquiry');

	// Register middleware hooks — mirrors what routes/index.js normally does.
	const middleware = require('../routes/middleware');
	keystone.pre('routes', middleware.initLocals);
	keystone.pre('render', middleware.flashMessages);

	// Wire up routes by requiring view controllers directly through Jest's module
	// registry. This keeps them in the same registry as the initialized keystone
	// instance, avoiding the cross-registry mismatch that keystone.importer()
	// causes (importer runs in node_modules and uses Node's native require).
	keystone.set('routes', function(app) {
		const v = {
			index:       require('../routes/views/index'),
			works:       require('../routes/views/works'),
			project:     require('../routes/views/project'),
			activities:  require('../routes/views/activities'),
			activity:    require('../routes/views/activity'),
			publication: require('../routes/views/publication'),
			tag:         require('../routes/views/tag'),
			blog:        require('../routes/views/blog'),
			post:        require('../routes/views/post'),
			bio:         require('../routes/views/bio'),
			contact:     require('../routes/views/contact'),
			imprint:     require('../routes/views/imprint'),
		};
		app.get('/', v.index);
		app.get('/works/:category?', v.works);
		app.get('/works/project/:project', v.project);
		app.get('/activities/:category?', v.activities);
		app.get('/activities/activity/:activity', v.activity);
		app.get('/activities/publication/:publication', v.publication);
		app.get('/tags/:tag?', v.tag);
		app.get('/blog/:category?', v.blog);
		app.get('/blog/post/:post', v.post);
		app.all('/bio', v.bio);
		app.all('/contact', v.contact);
		app.all('/imprint', v.imprint);
	});

	keystone.initExpressApp();

	await new Promise((resolve, reject) => {
		keystone.openDatabaseConnection(err => err ? reject(err) : resolve());
	});

	// Stub email sending so the Enquiry post-save hook doesn't attempt to load
	// keystone-email (an uninstalled optional dep) and call process.exit(1).
	keystone.Email = function NoopEmail() {};
	keystone.Email.prototype.send = function(opts, cb) { if (cb) cb(); };
}, 60000);

afterAll(async () => {
	await new Promise(resolve => keystone.closeDatabaseConnection(resolve));
	await mongod.stop();
}, 30000);

// ─── Static pages ─────────────────────────────────────────────────────────────
describe('Static GET routes', () => {
	it('GET /bio returns 200', async () => {
		const res = await request(keystone.app).get('/bio');
		expect(res.status).toBe(200);
	});

	it('GET /imprint returns 200', async () => {
		const res = await request(keystone.app).get('/imprint');
		expect(res.status).toBe(200);
	});

	it('GET /contact returns 200', async () => {
		const res = await request(keystone.app).get('/contact');
		expect(res.status).toBe(200);
	});
});

// ─── Data-driven GET routes ───────────────────────────────────────────────────
// These routes query MongoDB; the in-memory DB starts empty so they must handle
// zero results gracefully (which the controllers do with initial empty arrays).
describe('Data-driven GET routes', () => {
	it('GET / returns 200', async () => {
		const res = await request(keystone.app).get('/');
		expect(res.status).toBe(200);
	});

	it('GET /works returns 200', async () => {
		const res = await request(keystone.app).get('/works');
		expect(res.status).toBe(200);
	});

	it('GET /blog returns 200', async () => {
		const res = await request(keystone.app).get('/blog');
		expect(res.status).toBe(200);
	});
});

// ─── Security headers ─────────────────────────────────────────────────────────
describe('Security headers', () => {
	it('responses include a Content-Security-Policy header', async () => {
		const res = await request(keystone.app).get('/bio');
		expect(res.headers['content-security-policy']).toBeDefined();
	});
});

// ─── Unknown routes ───────────────────────────────────────────────────────────
describe('Unknown routes', () => {
	it('GET /nonexistent returns 404', async () => {
		const res = await request(keystone.app).get('/nonexistent');
		expect(res.status).toBe(404);
	});
});

// ─── POST /contact ────────────────────────────────────────────────────────────
describe('POST /contact', () => {
	it('creates an Enquiry document when all required fields are supplied', async () => {
		const Enquiry = keystone.list('Enquiry');
		const before = await Enquiry.model.countDocuments();

		await request(keystone.app)
			.post('/contact')
			.type('form')
			.send([
				'action=contact',
				'name[first]=Test',
				'name[last]=User',
				'email=test@example.com',
				'message=Integration+test+enquiry',
			].join('&'));

		const after = await Enquiry.model.countDocuments();
		expect(after).toBe(before + 1);
	});

	it('does not create an Enquiry when required fields are missing', async () => {
		const Enquiry = keystone.list('Enquiry');
		const before = await Enquiry.model.countDocuments();

		await request(keystone.app)
			.post('/contact')
			.type('form')
			.send('action=contact&name[first]=Incomplete');   // missing email + message

		const after = await Enquiry.model.countDocuments();
		expect(after).toBe(before);
	});
});
