// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone');

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

	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': 'q!ckvQh`v>ku}}.H[<m@abwXs9?r<g@/f4zdV{d6pyy3IrBoC<]`hvSds$w[N9RW',

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
