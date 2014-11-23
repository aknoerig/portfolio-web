var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Activity Model
 * ==================
 */

var Activity = new keystone.List('Activity', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Activity.add({
	title: { type: String, required: true },
	subtitle: { type: String },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	category: { type: Types.Relationship, ref: 'ActivityCategory' },
	date: { type: Types.Date, index: true },
	place: { type: String },
	placeLink: { type: Types.Url },
	location: { type: String },
	featured: { type: Boolean, default: false, index: true },
	link: { type: Types.Url },
	keyImage: { type: Types.CloudinaryImage },
	gallery: { type: Types.CloudinaryImages },
	content: {
		brief: { type: Types.Html, wysiwyg: true, height: 150 },
		extended: { type: Types.Html, wysiwyg: true, height: 400 }
	},
	works: { type: Types.Relationship, ref: 'Project', many: true },
});

Activity.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});

Activity.relationship({ ref: 'Project', path: 'activities' });

Activity.defaultColumns = 'title, category, place, date, state, featured';

Activity.register();
