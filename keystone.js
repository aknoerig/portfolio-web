// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

if (!process.env.COOKIE_SECRET) {
	console.error('FATAL: COOKIE_SECRET environment variable is not set. Copy .env.example to .env and fill it in.');
	process.exit(1);
}

// Node.js 22+ throws ERR_INVALID_ARG_VALUE from url.parse() for comma-separated
// hosts (e.g. "mongodb://host1,host2/db"). MongoDB driver 3.x uses url.parse()
// only as a discard-result validation step before its own HOSTS_RX parser takes
// over. Suppress the throw so the driver can continue correctly.
(function patchUrlParseForMongoMultiHost() {
	var urlModule = require('url');
	var orig = urlModule.parse;
	urlModule.parse = function(urlStr, parseQueryString, slashesDenoteHost) {
		try {
			return orig.call(urlModule, urlStr, parseQueryString, slashesDenoteHost);
		} catch (e) {
			if (e.code === 'ERR_INVALID_ARG_VALUE' &&
					typeof urlStr === 'string' &&
					urlStr.startsWith('mongodb://') &&
					urlStr.indexOf(',') !== -1) {
				return {};
			}
			throw e;
		}
	};
}());


// MongoDB driver emits deprecation warnings for collection.ensureIndex and
// collection.count. Mongoose's auto-index path uses ensureIndex, and Keystone's
// paginate/getUniqueValue helpers use count. Redirect both to their replacements
// before any module requires the driver so NativeCollection's dynamic method
// lookup picks up the patched prototypes at call time.
(function patchMongoDeprecations() {
	var Collection = require('mongodb/lib/collection');

	Collection.prototype.ensureIndex = function (fieldOrSpec, options, callback) {
		if (typeof options === 'function') { callback = options; options = {}; }
		return this.createIndex(fieldOrSpec, options || {}, callback);
	};

	Collection.prototype.count = function (query, options, callback) {
		if (typeof query === 'function') { callback = query; query = {}; options = {}; }
		else if (typeof options === 'function') { callback = options; options = {}; }
		return this.countDocuments(query || {}, options || {}, callback);
	};
}());

// Require keystone
var keystone = require('keystone');
var helmet = require('helmet');

// Keystone v4 calls toCollectionName(key) without a pluralize function; in
// Mongoose 5.13+ that returns the key unchanged ('Project' not 'projects').
// The live Atlas data was written under the lowercase-plural convention, so
// restore it by passing mongoose.pluralize() when building collection names.
(function patchPrefixModelPluralization() {
	var pluralize = keystone.mongoose.pluralize();
	keystone.prefixModel = function (key) {
		var modelPrefix = keystone.get('model prefix');
		if (modelPrefix) key = modelPrefix + '_' + key;
		return pluralize(key);
	};
}());

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

keystone.init({

	'name': 'André Knörig',
	'brand': 'André Knörig',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'pug',

	'emails': 'templates/emails',

	'wysiwyg images': true,
	'wysiwyg cloudinary images': true,
	'wysiwyg additional buttons': 'formatselect removeformat blockquote',

	'cloudinary secure': true,

	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': process.env.COOKIE_SECRET,
	'force ssl': process.env.NODE_ENV === 'production',

	'mongo': process.env.MONGO_URI,
	'mongo options': {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		dbName: 'andreknoerig'
	},

	'google api key': process.env.GOOGLE_API_KEY,
	'embedly api key': process.env.EMBEDLY_API_KEY,

	'ga property': process.env.GA_PROPERTY,
	'ga domain': process.env.GA_DOMAIN
});

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('underscore'),
	moment: require('moment'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
	ga_property: keystone.get('ga property'),
	ga_domain: keystone.get('ga domain'),
	embedly_api_key: keystone.get('embedly api key')
});

// Load your project's Routes

keystone.set('routes', require('./routes'));

keystone.pre('routes', helmet({
	contentSecurityPolicy: {
		directives: {
			...helmet.contentSecurityPolicy.getDefaultDirectives(),
			'img-src': ["'self'", 'data:', 'https://res.cloudinary.com', 'https://*.googleapis.com', 'https://*.gstatic.com', 'https://i.ytimg.com', 'https://i.vimeocdn.com'],
			'frame-src': ["'self'", 'https://cdn.embedly.com'],
			'script-src': [
				"'self'",
				"'unsafe-inline'",
				'code.jquery.com',
				'https://maxcdn.bootstrapcdn.com',
				'https://www.googletagmanager.com',
				'http://cdn.embed.ly',
				'https://*.googleapis.com',
				'https://*.gstatic.com',
			],
			'connect-src': [
				"'self'",
				'https://www.google-analytics.com',
				'https://analytics.google.com',
				'https://stats.g.doubleclick.net',
				'https://*.googleapis.com',
				'https://*.gstatic.com',
			],
			'font-src': ["'self'", 'https://fonts.gstatic.com'],
		},
	},
}));

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

keystone.set('email locals', {
	logo_src: '/images/logo-email.gif',
	logo_width: 194,
	logo_height: 76,
	theme: {
		email_bg: '#f9f9f9',
		link_color: '#2697de',
		buttons: {
			color: '#fff',
			background_color: '#2697de',
			border_color: '#1a7cb7'
		}
	}
});

// Setup replacement rules for emails, to automate the handling of differences
// between development a production.

// ..

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'works': ['projects', 'project-categories'],
	'activities': ['activities', 'activity-categories', 'publications', 'publication-categories'],
	'tags': ['organizations', 'industries', 'interactions', 'technologies'],
	'blog': ['posts', 'post-categories'],
	'contact': 'enquiries',
	'users': 'users'
});

// Start Keystone to connect to your database and initialise the web server

keystone.start();
