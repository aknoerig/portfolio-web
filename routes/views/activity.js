var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Set locals
	locals.section = 'activities';
	locals.filters = {
		activity: req.params.activity
	};
	locals.data = {
		activities: []
	};
	locals.mapsApiKey = keystone.get('google api key');
	
	// Load the current activity
	view.on('init', function(next) {
		
		var q = keystone.list('Activity').model.findOne({
			state: 'published',
			slug: locals.filters.activity
		}).populate('author categories works industries technologies interactions');
		
		q.exec(function(err, result) {
			locals.data.activity = result;
			next(err);
		});
		
	});
	
	// Load other activities
	view.on('init', function(next) {
		
		var q = keystone.list('Activity').model.find().where('state', 'published').sort('-publishedDate').populate('author').limit('4');
		
		q.exec(function(err, results) {
			locals.data.activities = results;
			next(err);
		});
		
	});
	
	// Render the view
	view.render('activity');
	
};
