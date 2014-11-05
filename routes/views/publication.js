var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Set locals
	locals.section = 'activities';
	locals.filters = {
		publication: req.params.publication
	};
	locals.data = {
		activities: []
	};
	
	// Load the current publication
	view.on('init', function(next) {
		
		var q = keystone.list('Publication').model.findOne({
			state: 'published',
			slug: locals.filters.publication
		}).populate('author categories');
		
		q.exec(function(err, result) {
			locals.data.publication = result;
			next(err);
		});
		
	});
	
	// Load other activities
	view.on('init', function(next) {
		
		var q = keystone.list('Publication').model.find().where('state', 'published').sort('-publishedDate').populate('author').limit('4');
		
		q.exec(function(err, results) {
			locals.data.activities = results;
			next(err);
		});
		
	});
	
	// Render the view
	view.render('publication');
	
};
