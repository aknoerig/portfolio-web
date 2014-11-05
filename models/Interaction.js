var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Interaction Model
 * ==================
 */

var Interaction = new keystone.List('Interaction', {
	autokey: { from: 'name', path: 'key', unique: true }
});

Interaction.add({
	name: { type: String, required: true }
});

Interaction.relationship({ ref: 'Project', path: 'interactions' });

Interaction.register();
