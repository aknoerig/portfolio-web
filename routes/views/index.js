var _ = require('underscore'),
	keystone = require('keystone');

exports = module.exports = function(req, res) {
	
	var view = new keystone.View(req, res),
		locals = res.locals;
	
	// locals.section is used to set the currently selected
	// item in the header navigation.
	locals.section = 'home';

	locals.data = {
		projects : [],
	}


	// load 3 featured projects	
	view.on('init', function(next) {
		
		keystone.list('Project').model.find()
			.where('state', 'published')
			.where('featured', true)
			.sort('-toDate')
			.populate('category')
			.exec(function(err, results) {
			
				if (err || !results.length) {
					return next(err);
				}

				locals.data.projects = _.chain(results).shuffle().first(3).value();
				
				next(err);
			
			});
		
	});
	
	// Render the view
	view.render('index');
	
};
