var keystone = require('keystone'),
	async = require('async'),
	_ = require('underscore');

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
		categories: [],
		markers: []
	};
	locals.mapsApiKey = keystone.get('google api key');

	
	// Load all categories
	view.on('init', function(next) {
		
		keystone.list('ActivityCategory').model.find().sort('name').exec(function(err, results) {
			
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
				perPage: 100,
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


    // Create the array of activity map markers
    view.on('render', function(next) {

    	if (locals.data.activities) {

        	locals.data.markers = _.map( locals.data.activities.results, 
        		function(activity) {
            		return { 
            			geo: activity.geoLocation.geo, 
            			title: activity.title,
            			description: activity.subtitle + ' at ' + activity.place + '<br/>' + activity.geoLocation.name + ', ' + activity.geoLocation.suburb + ', ' + activity.geoLocation.country,
            			slug: activity.slug 
            		};
        	});

        }

        next();

    });
	
	// Render the view
	view.render('activities');
	
};
