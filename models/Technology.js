var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Technology Model
 * ==================
 */

var Technology = new keystone.List('Technology', {
	autokey: { from: 'name', path: 'key', unique: true }
});

Technology.add({
	name: { type: String, required: true }
});

Technology.relationship({ ref: 'Project', path: 'technologies' });

Technology.register();
