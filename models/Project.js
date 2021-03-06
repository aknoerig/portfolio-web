var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Project Model
 * ==========
 */

var Project = new keystone.List('Project', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Project.add({
	title: { type: String, required: true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	category: { type: Types.Relationship, ref: 'ProjectCategory' },
	featured: { type: Boolean, default: false, index: true },
	fromDate: { type: Types.Date },
	toDate: { type: Types.Date },
	role: { type: String },
	innovation: { type: String },
	link: { type: Types.Url },
	partners: { type: Types.Relationship, ref: 'Organization', many: true },
	clients: { type: Types.Relationship, ref: 'Organization', many: true },
	industries: { type: Types.Relationship, ref: 'Industry', many: true },
	technologies: { type: Types.Relationship, ref: 'Technology', many: true },
	interactions: { type: Types.Relationship, ref: 'Interaction', many: true },
	publications: { type: Types.Relationship, ref: 'Publication', many: true },
	activities: { type: Types.Relationship, ref: 'Activity', many: true },
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
	}
});

Project.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});


Project.relationship({ ref: 'Activity', path: 'works' });

Project.defaultColumns = 'title, clients|20%, toDate|20%, state|20%, featured';
Project.register();
