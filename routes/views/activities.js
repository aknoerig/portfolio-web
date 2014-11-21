var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// Init locals
	locals.section = 'activities';
	locals.filters = {
		category: req.params.category
	};
	locals.data = {
		activities: [],
		categories: []
	};
	
	// Load all categories
	view.on('init', function(next) {
		
		keystone.list('ActivityCategory').model.find().sort('name').exec(function(err, results) {
			
			if (err || !results.length) {
				return next(err);
			}
			
			locals.data.categories = results;
			
			// Load the counts for each category
			async.each(locals.data.categories, function(category, next) {
				
				keystone.list('Activity').model.count().where('category').in([category.id]).exec(function(err, count) {
					category.activityCount = count;
					next(err);
				});
				
			}, function(err) {
				next(err);
			});
			
		});
		
	});
	
	// Load the current category filter
	view.on('init', function(next) {
		
		if (req.params.category) {
			keystone.list('ActivityCategory').model.findOne({ key: locals.filters.category }).exec(function(err, result) {
				locals.data.category = result;
				next(err);
			});
		} else {
			next();
		}
		
	});
	
	// Load the Activities
	view.on('init', function(next) {
		
		var q = keystone.list('Activity').paginate({
				page: req.query.page || 1,
				perPage: 10,
				maxPages: 10
			})
			.where('state', 'published')
			.sort('-date')
			.populate('category');
		
		if (locals.data.category) {
			q.where('category').in([locals.data.category]);
		}
		
		q.exec(function(err, results) {
			locals.data.activities = results;
			next(err);
		});
		
	});
	
	// Render the view
	view.render('activities');
	
};
