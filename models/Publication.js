var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Publication Model
 * ==================
 */

var Publication = new keystone.List('Publication', {
	map: { name: 'title' },
	autokey: { path: 'slug', from: 'title', unique: true }
});

Publication.add({
	title: { type: String, required: true },
	state: { type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true },
	categories: { type: Types.Relationship, ref: 'PublicationCategory', many: true },
	authors: { type: String },
	citation: { type: String },
	year: { type: Types.Date, index: true },
	featured: { type: Boolean, default: false, index: true },
	file: { type: Types.S3File },
	link: { type: Types.Url },
	image: { type: Types.CloudinaryImage },
	content: {
		brief: { type: Types.Html, wysiwyg: true, height: 150 },
		extended: { type: Types.Html, wysiwyg: true, height: 400 }
	}
});

Publication.schema.virtual('content.full').get(function() {
	return this.content.extended || this.content.brief;
});

Publication.relationship({ ref: 'Project', path: 'publications' });

Publication.register();
