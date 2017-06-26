createTaskQueue = require("../lib/task-queue");

function createNode(type, name, parentNode, run, opts) {
	opts = strictExtend({
		only: false,
		skip: false,
		retries: 0,
		timeout: 0,
		slow: 500
	}, opts);

	return {
		// set when node is created
		type: type,
		name: name,
		parent: type=="root" ? null : parentNode,
		run: run,

		// opts used when running
		only: opts.only,
		skip: opts.skip,
		retries: opts.retries,
		timeout: opts.timeout,
		slow: opts.slow,

		// set during initial run
		children: [],
		before: null,
		beforeEach: null,
		after: null,
		afterEach: null,

		// set after initial run
		queue: null,
		runTime: null,
		runError: null,
		queueError: null,
		skipReason: null,

		addChild: function(node) {
			if (this.runTime) {
				throw new Error(`${this.type} '${this.name}': Cannot add a child once node has started.`);
			}
			this.children.push(node);
		},
		resetQueue: function() {
			this.queue = createTaskQueue(true);
		},
		getParents: function() {
			if (this.parent == null) return [];
			return this.parent.getParents().concat(this.parent);
		}
	};
}

// puts opts onto obj, throws if opts has a prop that obj doenst.
function strictExtend(obj, opts){
	Object.keys(opts || {}).forEach((key) => {
		if (!obj.hasOwnProperty(key))
			throw new Error(`Unsupported opt: '${key}'`);
		obj[key] = opts[key];
	});
	return obj;
}

module.exports = createNode;