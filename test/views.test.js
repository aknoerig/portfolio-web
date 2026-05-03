'use strict';

// ─── MockView ─────────────────────────────────────────────────────────────────
// Captures event handlers registered by a view controller and runs them when
// render() is called. renderPromise resolves once the full chain completes.

let _lastView = null;

class MockView {
	constructor(req, res) {
		this.req = req;
		this.res = res;
		this._init = [];
		this._post = [];
		this._renderHandlers = [];
		this.renderedTemplate = null;
		this.renderPromise = null;
		_lastView = this;
	}

	on(event, optionsOrFn, fn) {
		const handler = typeof optionsOrFn === 'function' ? optionsOrFn : fn;
		if (event === 'init') this._init.push(handler);
		else if (event === 'post') this._post.push({ options: optionsOrFn, handler: fn });
		else if (event === 'render') this._renderHandlers.push(handler);
	}

	render(template) {
		this.renderedTemplate = template;
		this.renderPromise = this._run();
	}

	_cb(h) {
		return new Promise((resolve, reject) => h(err => (err ? reject(err) : resolve())));
	}

	async _run() {
		for (const h of this._init) await this._cb(h);
		for (const { options, handler } of this._post) {
			if (this.req.method === 'POST' &&
				(!options.action || this.req.body.action === options.action)) {
				await this._cb(handler);
			}
		}
		for (const h of this._renderHandlers) await this._cb(h);
	}
}

// ─── Query builder ────────────────────────────────────────────────────────────
// Every chainable method returns `this`; exec calls the callback with (err, result).
function makeQuery(result, err = null) {
	const q = { exec: jest.fn().mockImplementation(cb => cb(err, result)) };
	['where', 'sort', 'populate', 'in', 'limit'].forEach(m => {
		q[m] = jest.fn().mockReturnThis();
	});
	return q;
}

// ─── Keystone mock ────────────────────────────────────────────────────────────
jest.mock('keystone', () => ({ View: null, list: jest.fn(), get: jest.fn() }));
const keystone = require('keystone');
keystone.View = MockView;

// contact.js calls keystone.list('Enquiry') at module load time, so this must
// be configured before that module is required.
const enquiryInstance = { getUpdateHandler: jest.fn() };

const listMocks = {
	Project: {
		model: { find: jest.fn(), findOne: jest.fn() },
		paginate: jest.fn(),
	},
	ProjectCategory: {
		model: { find: jest.fn(), findOne: jest.fn() },
	},
	Post: {
		model: { count: jest.fn(), findOne: jest.fn() },
		paginate: jest.fn(),
	},
	PostCategory: {
		model: { find: jest.fn(), findOne: jest.fn() },
	},
	Enquiry: {
		model: jest.fn().mockImplementation(() => enquiryInstance),
		fields: { enquiryType: { ops: [{ value: 'question', label: 'Question' }] } },
	},
};

keystone.list.mockImplementation(name => listMocks[name]);

// ─── View controllers ─────────────────────────────────────────────────────────
const indexView   = require('../routes/views/index');
const worksView   = require('../routes/views/works');
const contactView = require('../routes/views/contact');
const blogView    = require('../routes/views/blog');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeReq = (o = {}) => ({ params: {}, query: {}, method: 'GET', body: {}, ...o });
const makeRes = ()        => ({ locals: {} });
const run = (view, req, res) => { view(req, res); return _lastView.renderPromise; };

// Clear call history before each test; implementations are preserved.
beforeEach(() => jest.clearAllMocks());

// ─── index view ───────────────────────────────────────────────────────────────
describe('index view', () => {
	beforeEach(() => {
		listMocks.Project.model.find.mockReturnValue(
			makeQuery([{ _id: '1' }, { _id: '2' }, { _id: '3' }, { _id: '4' }])
		);
	});

	it('sets locals.section to "home"', async () => {
		const res = makeRes();
		await run(indexView, makeReq(), res);
		expect(res.locals.section).toBe('home');
	});

	it('renders the "index" template', async () => {
		await run(indexView, makeReq(), makeRes());
		expect(_lastView.renderedTemplate).toBe('index');
	});

	it('loads up to 3 projects into locals.data.projects', async () => {
		const res = makeRes();
		await run(indexView, makeReq(), res);
		expect(res.locals.data.projects).toHaveLength(3);
	});

	it('leaves projects empty when the DB returns no results', async () => {
		listMocks.Project.model.find.mockReturnValue(makeQuery([]));
		const res = makeRes();
		await run(indexView, makeReq(), res);
		expect(res.locals.data.projects).toEqual([]);
	});
});

// ─── works view ───────────────────────────────────────────────────────────────
describe('works view', () => {
	const category = { _id: 'cat1', name: 'Design', key: 'design' };

	beforeEach(() => {
		listMocks.ProjectCategory.model.find.mockReturnValue(makeQuery([category]));
		listMocks.ProjectCategory.model.findOne.mockReturnValue(makeQuery(category));
		listMocks.Project.paginate.mockImplementation(() => makeQuery({ results: [] }));
	});

	it('sets locals.section to "works"', async () => {
		const res = makeRes();
		await run(worksView, makeReq(), res);
		expect(res.locals.section).toBe('works');
	});

	it('renders the "works" template', async () => {
		await run(worksView, makeReq(), makeRes());
		expect(_lastView.renderedTemplate).toBe('works');
	});

	it('reflects req.params.category in locals.filters.category', async () => {
		const res = makeRes();
		await run(worksView, makeReq({ params: { category: 'design' } }), res);
		expect(res.locals.filters.category).toBe('design');
	});

	it('does not look up a category when no param is given', async () => {
		await run(worksView, makeReq(), makeRes());
		expect(listMocks.ProjectCategory.model.findOne).not.toHaveBeenCalled();
	});

	it('looks up and sets the category when a param is given', async () => {
		const res = makeRes();
		await run(worksView, makeReq({ params: { category: 'design' } }), res);
		expect(listMocks.ProjectCategory.model.findOne).toHaveBeenCalledWith({ key: 'design' });
		expect(res.locals.data.category).toEqual(category);
	});
});

// ─── contact view ─────────────────────────────────────────────────────────────
describe('contact view', () => {
	beforeEach(() => {
		enquiryInstance.getUpdateHandler = jest.fn().mockReturnValue({
			process: jest.fn().mockImplementation((body, opts, cb) => cb(null)),
		});
	});

	it('sets locals.section to "contact"', async () => {
		const res = makeRes();
		await run(contactView, makeReq(), res);
		expect(res.locals.section).toBe('contact');
	});

	it('sets locals.enquiryTypes from the Enquiry model', async () => {
		const res = makeRes();
		await run(contactView, makeReq(), res);
		expect(res.locals.enquiryTypes).toEqual([{ value: 'question', label: 'Question' }]);
	});

	it('renders the "contact" template', async () => {
		await run(contactView, makeReq(), makeRes());
		expect(_lastView.renderedTemplate).toBe('contact');
	});

	it('leaves enquirySubmitted false on GET', async () => {
		const res = makeRes();
		await run(contactView, makeReq(), res);
		expect(res.locals.enquirySubmitted).toBe(false);
	});

	it('sets enquirySubmitted to true on a successful POST', async () => {
		const res = makeRes();
		await run(contactView, makeReq({
			method: 'POST',
			body: { action: 'contact', name: 'André', email: 'a@b.com', message: 'Hi' },
		}), res);
		expect(res.locals.enquirySubmitted).toBe(true);
	});

	it('populates validationErrors and keeps enquirySubmitted false on POST error', async () => {
		enquiryInstance.getUpdateHandler = jest.fn().mockReturnValue({
			process: jest.fn().mockImplementation((body, opts, cb) =>
				cb({ errors: { email: 'Invalid email' } })
			),
		});
		const res = makeRes();
		await run(contactView, makeReq({
			method: 'POST',
			body: { action: 'contact' },
		}), res);
		expect(res.locals.validationErrors).toEqual({ email: 'Invalid email' });
		expect(res.locals.enquirySubmitted).toBe(false);
	});
});

// ─── blog view ────────────────────────────────────────────────────────────────
describe('blog view', () => {
	beforeEach(() => {
		// Fresh category objects each test so postCount mutations don't bleed over.
		const categories = [
			{ _id: 'cat1', id: 'cat1', name: 'Design' },
			{ _id: 'cat2', id: 'cat2', name: 'Code' },
		];
		listMocks.PostCategory.model.find.mockReturnValue(makeQuery(categories));
		listMocks.PostCategory.model.findOne.mockReturnValue(makeQuery(null));
		listMocks.Post.model.count.mockImplementation(() => makeQuery(7));
		listMocks.Post.paginate.mockImplementation(() => makeQuery({ results: [] }));
	});

	it('sets locals.section to "blog"', async () => {
		const res = makeRes();
		await run(blogView, makeReq(), res);
		expect(res.locals.section).toBe('blog');
	});

	it('renders the "blog" template', async () => {
		await run(blogView, makeReq(), makeRes());
		expect(_lastView.renderedTemplate).toBe('blog');
	});

	it('loads all categories into locals.data.categories', async () => {
		const res = makeRes();
		await run(blogView, makeReq(), res);
		expect(res.locals.data.categories).toHaveLength(2);
	});

	it('fetches a post count for each category', async () => {
		const res = makeRes();
		await run(blogView, makeReq(), res);
		expect(listMocks.Post.model.count).toHaveBeenCalledTimes(2);
		expect(res.locals.data.categories[0].postCount).toBe(7);
		expect(res.locals.data.categories[1].postCount).toBe(7);
	});
});
