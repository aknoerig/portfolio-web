var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * PublicationCategory Model
 * ==================
 */

var PublicationCategory = new keystone.List('PublicationCategory', {
	autokey: { from: 'name', path: 'key', unique: true }
});

PublicationCategory.add({
	name: { type: String, required: true }
});

PublicationCategory.relationship({ ref: 'Publication', path: 'category' });

PublicationCategory.register();
