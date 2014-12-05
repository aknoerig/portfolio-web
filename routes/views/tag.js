var keystone = require('keystone'),
	async = require('async');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'works';
	
	locals.filters = {
		tag: req.params.tag
	};
	locals.data = {
		projects: [],
		industries: [],
		technologies: [],
		interactions: [],
	};


	// Load all tags

	view.on('init', function(next) {
		
		keystone.list('Industry').model.find().sort('name').exec(function(err, results) {
			
			if (err || !results.length) {
				return next(err);
			}
			
			locals.data.industries = results;

			next(err);
		});

	});

	view.on('init', function(next) {

		keystone.list('Technology').model.find().sort('name').exec(function(err, results) {
			
			if (err || !results.length) {
				return next(err);
			}
			
			locals.data.technologies = results;
		
			next(err);
		});

	});

	view.on('init', function(next) {

		keystone.list('Interaction').model.find().sort('name').exec(function(err, results) {
			
			if (err || !results.length) {
				return next(err);
			}
			
			locals.data.interactions = results;
		
			next(err);
		});

	});

	// Load the current tag filter
	view.on('init', function(next) {
		
		if (req.params.tag && !locals.data.tag) {
			keystone.list('Industry').model.findOne({ key: locals.filters.tag }).exec(function(err, result) {
				locals.data.tag = result;
				locals.data.property = 'industries';
				next(err);
			});
		} else {
			next();
		}
		
	});

	view.on('init', function(next) {
		
		if (req.params.tag && !locals.data.tag) {
			keystone.list('Technology').model.findOne({ key: locals.filters.tag }).exec(function(err, result) {
				locals.data.tag = result;
				locals.data.property = 'technologies';
				next(err);
			});
		} else {
			next();
		}
		
	});

	view.on('init', function(next) {
		
		if (req.params.tag && !locals.data.tag) {
			keystone.list('Interaction').model.findOne({ key: locals.filters.tag }).exec(function(err, result) {
				locals.data.tag = result;
				locals.data.property = 'interactions';
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
			.populate('industries technologies interactions');
		
		if (locals.data.tag) {
			q.where(locals.data.property).in([locals.data.tag]);
		}
		
		q.exec(function(err, results) {
			locals.data.projects = results;
			next(err);
		});
		
	});


	// Render the view
	view.render('tag');
	
};
