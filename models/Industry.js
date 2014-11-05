var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Industry Model
 * ==================
 */

var Industry = new keystone.List('Industry', {
	autokey: { from: 'name', path: 'key', unique: true }
});

Industry.add({
	name: { type: String, required: true }
});

Industry.relationship({ ref: 'Project', path: 'industries' });

Industry.register();
