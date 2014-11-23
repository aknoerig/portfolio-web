var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Init locals
	locals.section = 'tags';
	locals.filters = {
		tag: req.params.tag
	};
	locals.data = {
		projects: [],
		tags: []
	};
	
	// Load all tags
	view.on('init', function(next) {
		
		keystone.list('Industry').model.find().sort('name').exec(function(err, results) {
			if (err || !results.length) {
				return next(err);
			}
			locals.data.tags = results;
		});
		
	});
	
	// Load the current tag filter
	view.on('init', function(next) {
		
		if (req.params.tag) {
			keystone.list('Industry').model.findOne({ key: locals.filters.tag }).exec(function(err, result) {
				locals.data.tag = result;
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
				perPage: 10,
				maxPages: 10
			})
			.where('state', 'published')
			.sort('-toDate')
			.populate('industries');
		
		if (locals.data.tag) {
			q.where('industries').in([locals.data.tag]);
		}
		
		q.exec(function(err, results) {
			locals.data.projects = results;
			next(err);
		});
		
	});
	
	// Render the view
	view.render('tag');
	
};
