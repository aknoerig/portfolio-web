var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Init locals
	locals.section = 'works';
	locals.filters = {
		category: req.params.category
	};
	locals.data = {
		projects: [],
		categories: []
	};
	
	// Load all categories
	view.on('init', function(next) {
		
		keystone.list('ProjectCategory').model.find().sort('name').exec(function(err, results) {
			
			if (err || !results.length) {
				return next(err);
			}
			
			locals.data.categories = results;
			
			next(err);
			
		});
		
	});
	
	// Load the current category filter
	view.on('init', function(next) {
		
		if (req.params.category) {
			keystone.list('ProjectCategory').model.findOne({ key: locals.filters.category }).exec(function(err, result) {
				locals.data.category = result;
				next(err);
			});
		} else {
			next();
		}
		
	});
	
	// Load the Projects
	view.on('init', function(next) {
		
		var q = keystone.list('Project').paginate({
				page: req.query.page || 1,
				perPage: 12,
				maxPages: 10
			})
			.where('state', 'published')
			.sort('-toDate')
			.populate('category');
		
		if (locals.data.category) {
			q.where('category').in([locals.data.category]);
		}
		
		q.exec(function(err, results) {
			locals.data.projects = results;
			next(err);
		});
		
	});
	
	// Render the view
	view.render('works');
	
};
