var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Set locals
	locals.section = 'works';
	locals.filters = {
		project: req.params.project
	};
	locals.data = {
		projects: []
	};
	
	// Load the current project
	view.on('init', function(next) {
		
		var q = keystone.list('Project').model.findOne({
			state: 'published',
			slug: locals.filters.project
		}).populate('author categories');
		
		q.exec(function(err, result) {
			locals.data.project = result;
			next(err);
		});
		
	});
	
	// Load other projects
	view.on('init', function(next) {
		
		var q = keystone.list('Project').model.find().where('state', 'published').sort('-publishedDate').populate('author').limit('4');
		
		q.exec(function(err, results) {
			locals.data.projects = results;
			next(err);
		});
		
	});
	
	// Render the view
	view.render('project');
	
};
