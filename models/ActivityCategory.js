var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * ActivityCategory Model
 * ==================
 */

var ActivityCategory = new keystone.List('ActivityCategory', {
	autokey: { from: 'name', path: 'key', unique: true }
});

ActivityCategory.add({
	name: { type: String, required: true }
});

ActivityCategory.relationship({ ref: 'Activity', path: 'categories' });

ActivityCategory.register();
