'use strict';

jest.mock('keystone', () => ({}));

const middleware = require('../routes/middleware');

function makeRes() {
	return { locals: {} };
}

describe('initLocals', () => {
	it('populates navLinks with the four top-level sections', () => {
		const req = { user: null };
		const next = jest.fn();

		const res = makeRes();
		middleware.initLocals(req, res, next);

		expect(res.locals.navLinks).toHaveLength(4);
		const hrefs = res.locals.navLinks.map(l => l.href);
		expect(hrefs).toEqual(['/works', '/activities', '/bio', '/contact']);
	});

	it('forwards req.user to res.locals.user', () => {
		const user = { id: 'u1', name: 'André' };
		const req = { user };
		const res = makeRes();
		const next = jest.fn();

		middleware.initLocals(req, res, next);

		expect(res.locals.user).toBe(user);
	});

	it('sets res.locals.user to null when req.user is absent', () => {
		const req = { user: null };
		const res = makeRes();
		const next = jest.fn();

		middleware.initLocals(req, res, next);

		expect(res.locals.user).toBeNull();
	});

	it('calls next()', () => {
		const next = jest.fn();
		middleware.initLocals({ user: null }, makeRes(), next);
		expect(next).toHaveBeenCalledTimes(1);
	});
});

describe('flashMessages', () => {
	function makeReqWithFlash(overrides = {}) {
		return {
			flash: (type) => overrides[type] || [],
		};
	}

	it('sets messages to false when all flash queues are empty', () => {
		const req = makeReqWithFlash();
		const res = makeRes();
		const next = jest.fn();

		middleware.flashMessages(req, res, next);

		expect(res.locals.messages).toBe(false);
		expect(next).toHaveBeenCalledTimes(1);
	});

	it('exposes flash messages when the error queue has entries', () => {
		const req = makeReqWithFlash({ error: ['Something went wrong'] });
		const res = makeRes();
		const next = jest.fn();

		middleware.flashMessages(req, res, next);

		expect(res.locals.messages).toBeTruthy();
		expect(res.locals.messages.error).toEqual(['Something went wrong']);
	});

	it('exposes flash messages when the success queue has entries', () => {
		const req = makeReqWithFlash({ success: ['Saved!'] });
		const res = makeRes();

		middleware.flashMessages(req, res, jest.fn());

		expect(res.locals.messages.success).toEqual(['Saved!']);
		expect(res.locals.messages.error).toEqual([]);
	});

	it('exposes multiple queues when several have entries', () => {
		const req = makeReqWithFlash({ info: ['FYI'], warning: ['Careful'] });
		const res = makeRes();

		middleware.flashMessages(req, res, jest.fn());

		expect(res.locals.messages.info).toEqual(['FYI']);
		expect(res.locals.messages.warning).toEqual(['Careful']);
	});

	it('calls next()', () => {
		const next = jest.fn();
		middleware.flashMessages(makeReqWithFlash(), makeRes(), next);
		expect(next).toHaveBeenCalledTimes(1);
	});
});

describe('requireUser', () => {
	it('calls next() when a user is authenticated', () => {
		const req = { user: { id: 'u1' } };
		const next = jest.fn();

		middleware.requireUser(req, makeRes(), next);

		expect(next).toHaveBeenCalledTimes(1);
	});

	it('redirects to the sign-in page when no user is present', () => {
		const req = { user: null, flash: jest.fn() };
		const res = { ...makeRes(), redirect: jest.fn() };
		const next = jest.fn();

		middleware.requireUser(req, res, next);

		expect(res.redirect).toHaveBeenCalledWith('/keystone/signin');
		expect(next).not.toHaveBeenCalled();
	});

	it('sets an error flash message before redirecting', () => {
		const req = { user: null, flash: jest.fn() };
		const res = { ...makeRes(), redirect: jest.fn() };

		middleware.requireUser(req, res, jest.fn());

		expect(req.flash).toHaveBeenCalledWith('error', 'Please sign in to access this page.');
	});
});
