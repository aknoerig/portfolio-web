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
	featured: { type: Boolean, default: false, index: true },
	link: { type: Types.Url },
	date: { type: Types.Date, index: true },
	place: { type: String },
	placeLink: { type: Types.Url },
	geoLocation: { type: Types.Location },
	industries: { type: Types.Relationship, ref: 'Industry', many: true },
	technologies: { type: Types.Relationship, ref: 'Technology', many: true },
	interactions: { type: Types.Relationship, ref: 'Interaction', many: true },
	keyImage: { type: Types.CloudinaryImage },
	keyEmbedUrl: { type: String },
	keyEmbedCode: { type: Types.Embedly, from: 'keyEmbedUrl' },
	gallery: { type: Types.CloudinaryImages },
	embedUrl1: { type: String },
	embedCode1: { type: Types.Embedly, from: 'embedUrl1' },
	embedUrl2: { type: String },
	embedCode2: { type: Types.Embedly, from: 'embedUrl2' },
	embedUrl3: { type: String },
	embedCode3: { type: Types.Embedly, from: 'embedUrl3' },
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
