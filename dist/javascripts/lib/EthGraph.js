(function(){
    const css = `

    body.dragging * {
        cursor: grabbing !important;
        cursor: -moz-grabbing !important;
        cursor: -webkit-grabbing !important;
    }
    body.resizing * {
        cursor: ew-resize !important;
    }

    .EthGraph {
        border-radius: 5px;
    }
        .EthGraph > .graph-ctnr {
            height: 220px;
        }
        .EthGraph > .preview-ctnr {
            height: 60px;
        }

    .Preview {
        position: relative;
        width: 100%;
        height: 100%;
        background: #AAA;
        user-select: none;
    }
        .Preview .mini-graph {
            height: 100%;
            width: 100%;
        }
        .Preview .window {
            box-sizing: border-box;
            position: absolute;
            height: 100%;
            width: 20%;
            left: 50px;
            top: 0;
        }
        .Preview .window .view {
            box-sizing: border-box;
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            cursor: move; /* fallback if grab cursor is unsupported */
            cursor: grab;
            cursor: -moz-grab;
            cursor: -webkit-grab;
            border-top: 1px solid rgba(0,0,0,.2);
            border-bottom: 1px solid rgba(0,0,0,.2);
            background: rgba(0,0,255,.2);
            transition: background .3s;
        }
            .Preview:not(.resizing) .window .view:hover,
            .Preview.dragging .window .view {
                background: rgba(0,0,255,.3);
            }

        .Preview .window .left-handle,
        .Preview .window .right-handle {
            position: absolute;
            top: 0;
            height: 100%;
            width: 3px;
            background: rgba(0,0,0,.5);
            cursor: ew-resize;
            transition: background .3s;
        }
            .Preview .window .left-handle:hover,
            .Preview .window .right-handle:hover,
            .Preview.resizing .window .left-handle,
            .Preview.resizing .window .right-handle {
                background: rgba(0,0,128,.5);
            }
        .Preview .window .left-handle {
            left: 0;
        }
        .Preview .window .right-handle {
            right: 0;
        }

        .Preview .window .info-ctnr {
            position: absolute;
            text-align: center;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity .5s, top .5s;
        }
            .Preview .window:hover .info-ctnr,
            .Preview.resizing .window .info-ctnr,
            .Preview.dragging .window .info-ctnr {
                top: -35px;
                opacity: .9;
            }
            .Preview .window .info {
                display: inline-block;
                font-size: 80%;
                white-space: nowrap;
                padding: 2px 4px;
                border-radius: 5px;
                box-shadow: 3px 3px 3px 0px rgba(0,0,0,.2);
                background: linear-gradient(to bottom, #CCC 0%, #999 100%);
            }

    .SvgGraph {
        user-select: none;
    }
    .SvgGraph .info {
        background: green;
    }
    .SvgGraph .graph-ctnr {
        background: yellow;
    }
    .SvgGraph .scale {
        
    }
`;
    const style = document.createElement("style");
    style.type = 'text/css';
    if (style.styleSheet) style.styleSheet.cssText = css;
    else style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}());


/*
    Links together a Preview to a Graph, so that when the Preview
    changes, the Graph is updated, and vice versa.
*/
function EthGraph(niceWeb3) {
    var _self = this;
    var _preview;
    var _graph;

	const _$e = $(`
		<div class="EthGraph">
			<div class="graph-ctnr"></div>
			<div class="preview-ctnr"></div>
		</div>
	`);
    const _$graphCtnr = _$e.find(".graph-ctnr");
    const _$previewCtnr = _$e.find(".preview-ctnr");


	this.$e = _$e;

    /*
        Opts:
            - sequences: [{
                  name: "",
                  valueFn: < fn(blockNum) => Promise(<BigNumber>) >,
                  maxPoints: 25,
                  showInPreview
              }, ...]
            - min
            - max
            - numPreviewPoints
            - timeStrFn
    */
	this.init = function(params) {
        if (!params.sequences)  
            throw new Error(`Must provide "params.sequences"`);
        if (params.min === undefined)
            throw new Error(`Must provide "params.min"`);
        if (params.max === undefined)
            throw new Error(`Must provide "params.max"`);
        if (params.numPreviewPoints === undefined)
            throw new Error(`Must provide "params.numPreviewPoints"`);
        if (params.timeStrFn === undefined)
            throw new Error(`Must provide "params.timeStrFn"`);

        // Create graph sequences.
        const graphSequences = params.sequences.map(obj => {
            obj = Object.assign({}, obj);
            obj.exact = false;
            const seq = new Sequence();
            seq.init(obj);
            return seq;
        })
        _graph = new SvgGraph();
        _$graphCtnr.empty().append(_graph.$e);
        _graph.init({
            name: "MainGraph",
            sequences: graphSequences,
            allowHover: true,
            showInfo: true,
            showScales: true
        });
        _graph.onBoundsChanged((newLow, newHigh, type) => {
            _preview.setView(newLow, newHigh, type=="move");
        });

        // Create preview sequences (only ones we want to show)
        const previewSequences = params.sequences.map(obj => {
            if (!obj.showInPreview) return null;
            obj = Object.assign({}, obj);
            obj.maxPoints = params.numPreviewPoints;
            obj.exact = true;
            const seq = new Sequence();
            seq.init(obj);
            return seq;
        }).filter(seq => seq !== null);

        _preview = new Preview();
        _$previewCtnr.empty().append(_preview.$e);
        _preview.init({
            min: params.min,
            max: params.max,
            numPoints: params.numPreviewPoints,
            timeStrFn: params.timeStrFn,
            sequences: previewSequences
        });
        _preview.onViewChanged((view)=>{
            _graph.setBounds(view.low, view.high);
        });
        
	};

    this.setView = function(low, high){
        _preview.setView(low, high, true);
    };
}

/*
    Object that represents a sequence, with a current domain.

    Internally, it ensures a maximum of 2 requests are made a time,
    and will purge old requests that are no longer relevant.

    Params:
        - name: Used to identify this sequence
        - valFn: Given an x, should return a BigNumber y
        - maxPoints: Maximum points to show for a given domain
        - exact: If false, quantizes points within domain to powers of 2
        - yFormatFn: Given a y, returns text
        - yScaleHeader: Header for yScale
        - numTicks: A target number of ticks

    Exposes:
        .setDomain(low, high, callback)
            Sets the domain to a set of points (exact or quantized),
            and calls callback anytime a point is available.
        .getDomain()
            Returns information about the current domain:
                - min: minimum point in domain
                - max: maximum point in domain
                - range: max - min
                - points: An object mapped by x value, containing a y value
                          or null if it is loading.
        .getRange()
            Returns information about the currenet range:
                - isUndefined: true if no loaded points
                - min: lowest y value
                - max: highest y value
                - range: max - min, or null if isUndefined
                - ticks: An array of nice ticks - {y, label}

*/
function Sequence() {
    const _self = this;
    const _MAX_CONCURRENCY = 2;

    // data stuff
    var _name;
    var _valFn;
    var _maxPoints;
    var _exact;

    // visual stuff
    var _color;
    var _yScaleHeader;
    var _yTickCount;
    var _yFormatFn;

    // Loading of vals
    const _vals = {};
    const _valStack = [];
    const _valPromises = {};
    var _numLoading = 0;

    // Storing of points
    var _xs = [];
    var _points = {};
    var _latestLoaded = [];
    var _latestLoadedIndex = {};

    this.init = function(params) {
        [
            "name", "valFn", "maxPoints", "exact",
            "color", "yScaleHeader", "yTickCount", "yFormatFn"
        ].forEach(name => {
            if (params[name]===undefined)
                throw new Error(`Sequence must be passed "${name}" param.`)
        });
        _name = params.name;
        _valFn = params.valFn;
        _exact = params.exact;
        _maxPoints = params.maxPoints;

        _color = params.color;
        _yScaleHeader = params.yScaleHeader;
        _yTickCount = params.yTickCount;
        _yFormatFn = params.yFormatFn;
    };
    this.name = () => _name;
    this.setExact = (bool) => _exact = !!bool;
    this.color = () => _color;

    // Loads points for the domain, calling cb(x) on each one.
    //  This also prunes old points.
    this.setDomain = (low, high, pointLoadedCallback) => {
        _xs = _exact 
            ? _getExactValues(low, high, _maxPoints)
            : _getQuantizedValues(low, high, _maxPoints);

        _xs.forEach(x => {
            // get or create point. if y is set, don't load.
            if (!_points[x]) _points[x] = {x: x};
            if (_points[x].y !== undefined) return;

            // load the value, and maybe draw it.
            _self.getValue(x).then(val => {
                if (!_points[x]) return;    // it's been purged.
                _points[x].y = val;
                pointLoadedCallback(x);
            }, (e) => {});
        });

        // Mark as loaded and remove from array. Then add all to array.
        _xs.forEach(x => {
            _latestLoadedIndex[x]
                ? _latestLoaded.splice(_latestLoaded.indexOf(x), 1)
                : _latestLoadedIndex[x] = true;
        });
        _latestLoaded.push.apply(_latestLoaded, _xs);

        // Prune points loaded the longest time ago.
        // This will never prune newest added points.
        const MAX_POINTS_TO_HOLD = _maxPoints * 100;
        const numToDelete = _latestLoaded.length - MAX_POINTS_TO_HOLD;
        if (numToDelete > 0) {
            const toDelete = _latestLoaded.splice(0, numToDelete);
            toDelete.forEach(x => {
                delete _points[x];
                delete _latestLoadedIndex[x];
            });
        }
    };

    this.getDomain = () => {
        const points = {};
        _xs.forEach(x => points[x] = _points[x]);

        const min = _xs[0];
        const max = _xs[_xs.length-1];
        return {
            min: min,
            max: max,
            range: max - min,
            points: points,
            ticks: _getNiceNumbers(min, max, 5)
                .map(xTick => {
                    return {x: xTick.toNumber(), label: `${xTick}`}
                })
        }
    };
    
    this.getRange = () => {
        var max;
        var min;
        _xs.forEach(x => {
            if (!_points[x]) return;
            const y = _points[x].y;
            if (y === null || y === undefined) return;
            if (max === undefined || y.gt(max)) max = y;
            if (min === undefined || y.lt(min)) min = y;
        });

        const isUndefined = max === undefined;
        const ticks = _getNiceNumbers(min, max, _yTickCount)
            .map(yTick => {
                return {y: yTick, label: _yFormatFn(yTick)}
            });

        return {
            min: min,
            max: max,
            isUndefined: isUndefined,
            range: isUndefined ? null : max.minus(min),
            ticks: ticks,
            scaleHeader: _yScaleHeader,
        }
    };

    // Adds to stack to get a value. If stack is too large,
    //  previous entries are discarded (rejected). There is no
    //  guarantee this will succeed, but it will resolve/reject.
    this.getValue = function(x) {
        if (_vals[x]) return Promise.resolve(_vals[x]);
        else return _push(x);
    };

    this.formatY = function(y) {
        if (y===null || y===undefined) return "Loading...";
        return _yFormatFn(y);
    };

    // A promise that can resolve / reject itself.
    function CreateDeferred() {
        var resolve, reject;
        const promise = new Promise((res, rej)=>{
            resolve = res;
            reject = rej;
        });
        promise.resolve = (val) => { resolve(val); return promise; };
        promise.reject = (e) => { reject(e); return promise; };
        return promise;
    }

    // Adds item to top of stack, and returns a Promise for it.
    // Promise will be resolved with val, or rejected if kicked of queue.
    function _push(x) {
        // If it's in the queue, move it to front and return promise.
        const index = _valStack.indexOf(x);
        if (index !== -1) {
            _valStack.splice(index, 1);
            _valStack.push(x);
            return _valPromises[x];
        }
        // If it's not in queue, but is in flight, return promise.
        if (_valPromises[x]) {
            return _valPromises[x];
        }
        
        // Push it to end, create promise, execute if able.
        _valStack.push(x);
        _valPromises[x] = CreateDeferred();
        _pop();

        // Delete from front if stack too big.
        const MAX_QUEUE_SIZE = Math.floor(_maxPoints * 1.5)
        if (_valStack.length > MAX_QUEUE_SIZE) {
            const toDelete = _valStack.shift();
            _valPromises[toDelete].reject(new Error(`Kicked off queue.`));
            delete _valPromises[toDelete];
        }
        
        return _valPromises[x];
    }
    // Do as many requests if possible.
    // Increment _numLoading and Resolve _valPromises[x] with valFn(x).
    //  - On success, store val
    //  - Always call _onLoaded afterwards
    function _pop() {
        if (_valStack.length == 0 || _numLoading >= _MAX_CONCURRENCY) return;
        
        _numLoading++;
        const x = _valStack.pop();
        const onLoaded = ()=>_onLoaded(x);
        _valPromises[x].resolve(
            _valFn(x).then(val => {
                onLoaded();
                return _vals[x] = val;
            }, onLoaded)
        );
        _pop();
    }
    // Remove from _valPromises, decrement _numLoading, execute more.
    function _onLoaded(x) {
        _numLoading--;
        delete _valPromises[x];
        _pop();
    }

    // Gets values that equally spaced by some power of 2, such that
    //  there are up to maxValues. One value below and above low and high
    //  are included.
    function _getQuantizedValues(low, high, maxValues) {
        const rawInterval = (high - low) / (maxValues / 2);
        const expInterval = Math.floor( Math.log2(rawInterval) );
        const interval = Math.pow(2, expInterval);

        // get all blocks spaced out by quanta
        const xs = [];
        const min = Math.floor(low / interval);
        const max = Math.ceil(high / interval);
        for (var i=min; i<=max; i++){
            xs.push(i * interval);
        }
        return xs;
    }

    function _getExactValues(low, high, numValues) {
        const xs = [];
        const interval = (high - low) / numValues;
        for (var i=0; i<=numValues; i++){
            xs.push(low + i*interval);
        }
        return xs;
    }

    function _getNiceNumbers(low, high, numValues) {
        if (low === undefined || high === undefined) {
            return [];
        }

        low = new BigNumber(low);
        high = new BigNumber(high);
        if (high.minus(low).equals(0)) {
            return [high];
        }

        function getNiceInterval(low, high, n) {
            const rawInterval = high.minus(low).div(numValues);
            const rawExponent = new BigNumber(Math.log10(rawInterval.toNumber()).toFixed(10));

            const TEN = new BigNumber(10);
            var nicestInterval = null;
            var nicestDeviation = null;
            [rawExponent.floor(), rawExponent.ceil()].forEach(exp => {
                [1, 5].forEach(base => {
                    base = new BigNumber(base);
                    const interval = base.mul(TEN.pow(exp));
                    const numIntervals = high.minus(low).div(interval).floor().plus(1);
                    if (numIntervals == 1) return;
                    const deviation = numIntervals.minus(numValues).abs();
                    if (nicestInterval == null || deviation.lt(nicestDeviation)) {
                        nicestInterval = interval;
                        nicestDeviation = deviation;
                    }
                });
            });
            return nicestInterval;
        }

        const interval = getNiceInterval(low, high, numValues);
        const numbers = [];
        const min = Math.floor(low / interval);
        const max = Math.ceil(high / interval);
        for (var i=min; i<=max; i++){
            numbers.push(interval.mul(i));
        }
        return numbers;
    }
}

/*
    This displays a graph, along with an adjustable window that can be used
    to zoom in or out. A callback is triggered whenever the "view" is changed.
    View can be set manually view .setView()
*/
function Preview() {
    var _max;
    var _min;
    var _numPoints;
    var _avgBlocktime;
    var _sequences;
    var _graph;

    var _viewChangedCb = (view)=>{};

    const _$e = $(`
        <div class="Preview">
            <div class="mini-graph"></div>
            <div class="window">
                <div class="view"></div>
                <div class="left-handle"></div>
                <div class="right-handle"></div>
                <div class="info-ctnr">
                    <div class="info">
                        <span class="lowest"></span> to <span class="highest"></span><br>
                        <span class="size"></span> blocks. <span class="time"></span>
                    </div>
                </div>
            </div>
        </div>
    `);
    const _$window = _$e.find(".window");
    const _$view = _$window.find(".view");
    const _$leftHandle = _$window.find(".left-handle");
    const _$rightHandle = _$window.find(".right-handle");
    const _$info = _$window.find(".info");

    // Set up drag+drop of window
    (function initWindow(){
        var startLow, startHigh, pixelsPerX;
        function onDragStart(cls) {
            const view = _getView();
            pixelsPerX = _$e.width() / (_max - _min);
            startLow = view.low;
            startHigh = view.high;
            $("body").addClass(cls);
            _$e.addClass(cls);
        }
        function onDragEnd(cls) {
            $("body").removeClass(cls);
            _$e.removeClass(cls)
        }
        function move(deltaX, deltaY) {
            const shift = deltaX / pixelsPerX;
            _set$View(startLow + shift, startHigh + shift, true);
        }
        function growLeft(deltaX, deltaY) {
            const shift = deltaX / pixelsPerX;
            _set$View(startLow + shift, startHigh, false);
        }
        function growRight(deltaX, deltaY) {
            const shift = deltaX / pixelsPerX;
            _set$View(startLow, startHigh + shift, false);
        }

        Draggable({
            $e: _$view,
            onDragStart: ()=>onDragStart("dragging"),
            onDragEnd: ()=>onDragEnd("dragging"),
            onDrag: move
        });
        Draggable({
            $e: _$leftHandle,
            onDragStart: ()=>onDragStart("resizing"),
            onDragEnd: ()=>onDragEnd("resizing"),
            onDrag: growLeft
        });
        Draggable({
            $e: _$rightHandle,
            onDragStart: ()=>onDragStart("resizing"),
            onDragEnd: ()=>onDragEnd("resizing"),
            onDrag: growRight
        });
    }());

    this.onViewChanged = (fn) => _viewChangedCb = fn;

    /*
        min: lowest X to display
        max: highest X to display
        numPoints: how many points to load in graph
        sequences: which sequences to display
        timeStrFn: converts two X points to a time duration
    */
    this.init = function(params) {
        if (params.min === undefined)
            throw new Error(`Preview must be passed "min" param`);
        if (params.max === undefined)
            throw new Error(`Preview must be passed "max" param`);
        if (params.numPoints === undefined)
            throw new Error(`Preview must be passed "numPoints" param`);
        if (params.sequences === undefined)
            throw new Error(`Preview must be passed "sequences" param`);
        if (params.timeStrFn === undefined)
            throw new Error(`Preview must be passed "timeStrFn" param`);
        _min = params.min;
        _max = params.max;
        _numPoints = params.numPoints;
        _sequences = params.sequences.map(seq => {
            seq.setExact(true);
            return seq;
        });
        _timeStrFn = params.timeStrFn;

        _graph = new SvgGraph();
        _$e.find(".mini-graph").append(_graph.$e);
        _graph.init({
            name: "Preview",
            sequences: _sequences,
            allowHover: false,
            showInfo: false,
            showScales: false
        });
        _graph.setBounds(_min, _max);
    };

    /*
        // Window is sized by either oldest and newest, or one and width.
        low: <blockNum> || undefined,
        high: <blockNum> || currentBlock
    */
    this.setView = function(low, high, lockRange){
        if (!_$e.is(":visible"))
            throw new Error(`Preview.setView() only works while visible.`);
        if (low===undefined)
            throw new Error(`Must provide low`);
        if (high===undefined)
            throw new Error(`Must provide high`);
        _set$View(low, high, lockRange);
    };
    this.max = ()=>_max;
    this.min = ()=>_min;
    this.$e = _$e;

    // Extract the window params from the position of _$window()
    function _getView() {
        const lowPct = _$window.position().left / _$e.width();
        const widthPct = _$window.width() / _$e.width();
        const low = Math.max(_min + lowPct * (_max - _min), 0);
        const high = Math.min(low + widthPct * (_max - _min), _max);
        return {
            low: low,
            high: high,
            size: high - low
        };
    }

    function _set$View(low, high, lockRange) {
        if (lockRange) {
            const overflow = high - _max;
            if (overflow > 0) {
                high -= overflow;
                low -= overflow;
            }
            const underflow = _min - low;
            if (underflow > 0) {
                low += underflow;
                high += underflow;
            }
        }

        high = Math.min(high, _max);
        low = Math.max(low, _min);
        const leftPct = (low - _min) / (_max - _min);
        const widthPct = (high - low) / (_max - _min);
        const width = _$e.width();
        const newLeft = width * leftPct;
        const newWidth = width * widthPct;
        if (newWidth >= 10) {
            _$window.css("left", newLeft);
            _$window.width(newWidth);
        }
        _refreshInfo();
        _viewChangedCb(_getView());
    }

    function _refreshInfo() {
        const view = _getView();
        _$info.find(".lowest").text(Math.round(view.low).toLocaleString());
        _$info.find(".highest").text(Math.round(view.high).toLocaleString());
        _$info.find(".size").text(Math.round(view.size).toLocaleString());
        const timeStr = _timeStrFn(view.low, view.high);
        _$info.find(".time").text(`~${timeStr}`);
    }
}

/*
    Returns an SVG of the current sequences, within the bounds set via .setBounds().

    By default, will quantize all X values within low/high, so that zooming in and out
     is seamless and up to maxPoints are only ever displayed. This can be disabled by
     setting "exact" to true.

    Currently this redraws the entire graph, but with some effort can be optimized to
    save SVG DOM elements and hide/show/scale them as needed. It already purges old,
    unviewed data, which in the future can hold DOM elements as well.
*/
function SvgGraph() {
    // Set via init.
    var _name;
    var _sequences;
    var _allowHover;
    var _showScales;
    var _showInfo;

    // Current bounds, and display
    var _low;
    var _high;
    var _display = [];

    // Callbacks
    var _boundsChangedCb = (newLow, newHigh, type)=>{};

    const _$e = $(
        `<div class="SvgGraph" style="width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden;">
            <div class="info">Info would go here.</div>
            <div style="flex-grow: 1; display: flex;">
                <div style="flex-grow: 1;">
                    <svg class="graphs" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"></svg>
                </div>
                <div class="y-scale-ctnr">
                    <svg class="y-scales" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"></svg>
                </div>
            </div>
            <div class="x-scale-ctnr" style="display: flex; height: 20px;">
                <div style="flex-grow: 1;">
                    <svg class="x-scale" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg" overflow="visible"></svg>
                </div>
                <div class="bottom-right" style="height: 100%;"></div>
            </div>
        </div>
    `);
    const _$info = _$e.find(".info");
    const _$graphs = _$e.find(".graphs");
    const _$yScaleCtnr = _$e.find(".y-scale-ctnr");
    const _$yScales = _$e.find(".y-scales");
    const _$xScaleCtnr = _$e.find(".x-scale-ctnr");
    const _$xScale = _$e.find(".x-scale");
    const _$bottomRight = _$e.find(".bottom-right");
    
    // hover stuff
    var _hoverPt = null;
    var _$graphsHover = _$svg("g");
    var _$yScalesHover = _$svg("g");
    var _$xScaleHover = _$svg("g");

    (function initDragging(){
        var startHigh, startLow, pixelsPerX;
        Draggable({
            $e: _$graphs,
            onDragStart: ()=>{
                pixelsPerX = _$graphs.width() / (_high - _low);
                startHigh = _high;
                startLow = _low;
            },
            onDragEnd: ()=>{},
            onDrag: (deltaX) => {
                deltaX = -deltaX / pixelsPerX;
                _boundsChangedCb(startLow + deltaX, startHigh + deltaX, "move");
            }
        })
    }());

    (function initScrolling(){
        _$graphs.bind("wheel mousewheel", function(ev) {
            ev.preventDefault();
            var delta = parseInt(ev.originalEvent.wheelDelta || -ev.originalEvent.detail);
            // negative means zoom out.
            const range = _high - _low;
            const newRange = range * Math.pow(1.001, -delta);
            const deltaRange = newRange - range;
            // we have a new range. map it to _low, _high via pctLow
            const pctLow = ev.offsetX / _$graphs.width();
            const newLow = _low - (deltaRange * pctLow);
            const newHigh = _high + (deltaRange * (1-pctLow));
            _boundsChangedCb(newLow, newHigh, "zoom");
        });
    }());

    (function initHover(){
        _$graphs.on("mousemove", function(ev){
            _setHoverPt(ev.offsetX, ev.offsetY);
            _refreshHoverThrottled();
        });
        _$graphs.on("mouseleave", function(ev){
            _setHoverPt(null, null);
            _refreshHoverThrottled();
        });
    }());

    this.setParent = function($parent) {
        _$parent = $parent;
    };
    this.init = function(params) {
        ["sequences", "name", "allowHover", "showInfo", "showScales"].forEach(name => {
            if (params[name]===undefined) throw new Error(`SvgGraph must be passed "${name}"`);
        })
        _name = params.name;
        _sequences = params.sequences;
        _allowHover = params.allowHover;
        _showInfo = params.showInfo;
        _showScales = params.showScales;
        if (!_showInfo) _$info.hide();
        if (!_showScales) {
            _$xScaleCtnr.hide();
            _$yScaleCtnr.hide();
        }
    };
    this.setBounds = function(low, high) {
        _low = low;
        _high = high;
        _loadDataThrottled();
    };
    this.onBoundsChanged = fn => _boundsChangedCb = fn;
    this.$e = _$e;

    // Limit the amount of times per second these functions can be called.
    const _refreshThrottled = throttle(_refresh, 30);
    const _refreshHoverThrottled = throttle(_refreshHover, 30);
    const _loadDataThrottled = throttle(_loadData, 30);

    // Given xs, display all relevant points and position them correctly.
    function _refresh() {
        if (!_$e.is(":visible"))
            throw new Error(`Not refreshable unless visible.`);

        _$graphs.empty();
        _$yScales.empty();
        _$xScale.empty();

        // create domain and range, with .getYPos and .getXPos
        _display = [];
        _sequences.forEach(seq => {
            const range = seq.getRange();
            range.getYPos = function(y) {
                if (y === null || y === undefined) {
                    pctTop = 0;
                } else if (range.isUndefined || range.max.equals(range.min)){
                    pctTop = new BigNumber(.5);
                } else {
                    pctTop = y.minus(range.min).div(range.range);
                }
                pctTop = .1 + pctTop * .8;
                return `${((1 - pctTop)*100).toFixed(5)}%`;
            };

            const domain = seq.getDomain();
            domain.getXPos = function(x) {
                const pctLeft = (x - _low) / (_high - _low);
                return `${(pctLeft * 100).toFixed(5)}%`;
            };
            domain.getXFromOffset = function(offsetX) {
                const width = _$graphs.width();
                return _low + (offsetX / width) * (_high - _low);
            }

            // add data to _display
            _display.push({
                seq: seq,
                range: range,
                domain: domain,
            });
        });

        if (_showScales) {
            var yScaleOffset = 0;
            _display.forEach(disp => {
                disp.yScaleOffset = yScaleOffset;

                const $yScale = _$getYScale(disp.seq, disp.range)
                    .appendTo(_$yScales)
                    .attr("transform", `translate(${yScaleOffset}, 0)`);

                yScaleOffset += $yScale[0].getBoundingClientRect().width + 10;
            });

            // Set right side sizes.
            _$yScales.width(`${yScaleOffset}px`);
            _$bottomRight.width(`${yScaleOffset}px`);
                
            // Draw ticks on the graph and on xScale
            const domain = _display[0].domain;
            _$getXScale(domain).appendTo(_$xScale);
            domain.ticks.forEach(tick => {
                const xPos = domain.getXPos(tick.x);
                if (parseFloat(xPos)>100) return;

                _$svg("line", {
                    x1: xPos, y1: 0,
                    x2: xPos, y2: "100%",
                    "stroke-width": 1,
                    stroke: "rgba(0,0,0,.1)"
                }).appendTo(_$graphs);
            })
        }

        // draw each graph
        _display.forEach(disp => {
            const $graph = _$getGraph(disp.seq, disp.domain, disp.range)
                .appendTo(_$graphs);
        });

        // draw hover container
        if (_allowHover) {
            _$graphsHover.appendTo(_$graphs);
            _$yScalesHover.appendTo(_$yScales);
            _$xScaleHover.appendTo(_$xScale)
            _refreshHover();
        }
    }

    function _setHoverPt(offsetX, offsetY) {
        _hoverPt = offsetX === null && offsetY === null
            ? null
            : {x: offsetX, y: offsetY};
    }
    function _refreshHover() {
        _$graphsHover.empty();
        _$yScalesHover.empty();
        _$xScaleHover.empty();
        if (_hoverPt == null || !_allowHover || _display.length==0) return;

        // draw a line down to x-axis
        (function(){
            const domain = _display[0].domain;
            const x = domain.getXFromOffset(_hoverPt.x);
            const xPos = domain.getXPos(x);
            _$svg("line", {
                x1: xPos, y1: 0,
                x2: xPos, y2: "100%",
                "stroke-width": 1,
                "stroke-dasharray": [3,3],
                stroke: "rgba(0,0,0,.3)",
                opacity: .5
            }).appendTo(_$graphsHover);

            _$textBox({
                $parent: _$xScaleHover,
                x: xPos,
                y: 2,
                vAlign: "top",
                hAlign: "middle",
                text: Math.round(x),
                padding: 2,
                fontSize: "10px",
                textColor: "white",
                background: "rgba(0,0,0,.5)",
                borderRadius: "3"
            }).attr("opacity", .8);
        }());

        // draw a line up and over to the corresponding scales
        _display.forEach(disp => {
            const x = _getClosestX(_hoverPt.x, disp.domain);
            const y = disp.domain.points[x].y;
            if (y === null || y === undefined) return;

            const xPos = disp.domain.getXPos(x);
            const yPos = disp.range.getYPos(y);

            _$svg("line", {
                x1: xPos, y1: yPos,
                x2: `100%`, y2: yPos,
                "stroke-width": 1,
                "stroke-dasharray": [3,3],
                stroke: disp.seq.color(),
                opacity: .5
            }).appendTo(_$graphsHover);

            _$svg("circle", {
                cx: disp.yScaleOffset, cy: yPos, r: 2,
                fill: disp.seq.color(),
                opacity: .5
            }).appendTo(_$yScalesHover);

            _$textBox({
                $parent: _$yScalesHover,
                x: disp.yScaleOffset + 4,
                y: yPos,
                vAlign: "middle",
                text: disp.seq.formatY(y),
                padding: 2,
                fontSize: "10px",
                textColor: "white",
                background: disp.seq.color(),
                borderRadius: "3"
            }).attr("opacity", .8);

            _$svg("line", {
                x1: 0, y1: yPos,
                x2: disp.yScaleOffset, y2: yPos,
                "stroke-width": 1,
                "stroke-dasharray": [3,3],
                stroke: disp.seq.color(),
                opacity: .5
            }).appendTo(_$yScalesHover);
        });
    }

    function _getClosestX(offsetX, domain) {
        const x = domain.getXFromOffset(offsetX);
        var closetX = null;
        Object.keys(domain.points).forEach(_x => {
            if (closetX == null) closetX = _x;
            if (Math.abs(_x - x) < Math.abs(closetX - x)) {
                closetX = _x;
            }
        });
        return closetX;
    }

    function _$getXScale(domain) {
        const $e = _$svg("g");
        const color = "rgba(0,0,0,.5)";

        _$svg("line", {
            x1: 0, y1: 1,
            x2: "100%", y2: 1,
            "stroke-width": 1,
            stroke: color
        }).appendTo($e);

        _$svg("line", {
            x1: "100%", y1: 1,
            x2: "500%", y2: 1,
            "stroke-width": 1,
            stroke: "rgba(0,0,0,.1)"
        }).appendTo($e);

        domain.ticks.forEach(tick => {
            const xPos = domain.getXPos(tick.x);
            if (parseFloat(xPos)<0 || parseFloat(xPos)>100) return;

            _$svg("line", {
                x1: xPos, y1: 1,
                x2: xPos, y2: 3,
                "stroke-width": 1,
                stroke: color
            }).appendTo($e);
            const $text = _$svg("text", {
                x: xPos, y: 5,
                "alignment-baseline": "hanging",
                "font-size": "10px",
                fill: color
            }).append(tick.label).appendTo($e);

            $text.attr("title", "test");
            tippy($text[0])
        });

        return $e;
    }

    function _$getYScale(seq, range) {
        const $e = _$svg("g");

        // draw vertical line
        _$svg("line", {
            x1: 0, y1: 0,
            x2: 0, y2: "100%",
            "stroke-width": 1,
            stroke: seq.color()
        }).appendTo($e);

        // draw ticks in places, with label.
        range.ticks.forEach(tick => {
            const yPos = range.getYPos(tick.y);
            if (parseFloat(yPos) < 2 || parseFloat(yPos) > 98) return;

            _$svg("line", {
                x1: 0, y1: yPos,
                x2: 3, y2: yPos,
                "stroke-width": 1,
                stroke: seq.color()
            }).appendTo($e);

            _$svg("text", {
                x: 5, y: yPos,
                "alignment-baseline": "middle",
                "font-size": "10px",
                fill: seq.color()
            }).append(tick.label).appendTo($e);
        });

        return $e;
    }

    function _$getGraph(seq, domain, range) {
        const $e = _$svg("g");

        // create a circle for each point, and draw lines between points.
        var prevPt = null;
        const xs = Object.keys(domain.points).sort().reverse();
        xs.forEach(x => {
            const point = domain.points[x];
            //const x = point.x;
            const y = point.y;
            const xPos = domain.getXPos(x);
            const yPos = range.getYPos(y);

            // draw "loading" circle
            if (y === null || y === undefined) {
                _$svg("circle", {
                    cx: xPos, cy: (prevPt ? prevPt.yPos : yPos), r: 2,
                    fill: "rgba(0,0,0,.2)"
                }).appendTo($e);
                return;
            }

            // draw circle
            _$svg("circle", {
                cx: xPos, cy: yPos, r: 2,
                fill: seq.color()
            }).appendTo($e);

            // draw line between this and last
            if (prevPt) {
                _$svg("line", {
                    x1: xPos, x2: prevPt.xPos,
                    y1: yPos, y2: prevPt.yPos,
                    "stroke-width": 2,
                    stroke: seq.color()
                }).appendTo($e);
            }
            prevPt = {xPos: xPos, yPos: yPos};
        });

        return $e;
    }

    // For each sequence, create the data object for this x.
    // Start loading value. Once loaded, store y and maybe call _refresh().
    function _loadData() {
        _sequences.forEach(seq => {
            seq.setDomain(_low, _high, _refreshThrottled);
        });
        _refreshThrottled();
    }

    // Props: text, padding, fontSize, textColor, padding, borderRadius, background
    //        vAlign: "top" or "middle", hAlign: "middle" or "left"
    function _$textBox(props) {
        const $parent = props.$parent;
        const text = props.text;
        const padding = props.padding;

        const $svg = _$svg("svg", {
            overflow: "visible",
            x: props.x, y: props.y
        }).appendTo($parent);
        const $g = _$svg("g").appendTo($svg);

        const $text = _$svg("text", {
            x: padding, y: padding,
            "alignment-baseline": "hanging",
            "font-size": props.fontSize,
            fill: props.textColor
        }).text(text).appendTo($g);

        const box = $text[0].getBBox();
        _$svg("rect", {
            x: 0, y: 0,
            width: box.width + padding*2,
            height: box.height + padding*2,
            rx: props.borderRadius, ry: props.borderRadius,
            fill: props.background,
        }).prependTo($g);

        if (props.hAlign == "middle" || props.vAlign == "middle") {
            const whole = $g[0].getBBox();
            const tx = props.hAlign == "middle" ? -whole.width/2 : 0;
            const ty = props.vAlign == "middle" ? -whole.height/2 : 0;
            $g.attr("transform", `translate(${tx},${ty})`);
        }

        return $svg;
    }

    function _$svg(type, params) {
        params = params || {};
        var el = document.createElementNS("http://www.w3.org/2000/svg", type);
        Object.keys(params).forEach(key => {
            if (key === undefined) return;
            el.setAttributeNS(null, key, params[key]);
        });
        return $(el);
    }
}

function Draggable(opts) {
    const _$e = opts.$e;
    const _onDragStart = opts.onDragStart || (()=>{});
    const _onDragEnd = opts.onDragEnd || (()=>{});
    const _onDrag = opts.onDrag || ((deltaX, deltaY)=>{});

    var _startX, _startY;
    function startDragging(ev) {
        _startX = ev.pageX;
        _startY = ev.pageY;
        $(document).bind("mousemove", drag)
        $(document).bind("mouseup", stopDragging);
        _$e.unbind("mousedown", startDragging);
        _onDragStart();
    }
    function stopDragging() {
        $(document).unbind("mousemove", drag);
        $(document).unbind("mouseup", stopDragging);
        _$e.bind("mousedown", startDragging);
        _onDragEnd();
    }
    function drag(ev) {
        const deltaX = ev.pageX - _startX;
        const deltaY = ev.pageY - _startY;
        _onDrag(deltaX, deltaY);
    }
    _$e.bind("mousedown", startDragging);
}

// Calls fn at most once per "speed"-ms, and calls it with latest args.
function throttle(fn, speed) {
    var isQueued = false;
    var latestArgs = null;
    return function(){
        if (isQueued) {
            latestArgs = arguments;
            return;
        };

        isQueued = true;
        setTimeout(() => {
            isQueued = false;
            fn.apply(null, latestArgs);
        }, speed);
    }
}