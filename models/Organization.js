var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * Organization Model
 * ==================
 */

var Organization = new keystone.List('Organization', {
	autokey: { from: 'name', path: 'key', unique: true }
});

Organization.add({
	name: { type: String, required: true },
	logo: { type: Types.CloudinaryImage },
	link: { type: Types.Url }
});

Organization.relationship({ ref: 'Project', path: 'partners' });
Organization.relationship({ ref: 'Project', path: 'clients' });

Organization.register();
