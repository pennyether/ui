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
        .EthGraph .graph {
            height: 300px;
            background: #FAFAFA;
        }
        .EthGraph .preview-ctnr {
            position: relative;
            height: 60px;
        }

    .Preview {
        width: 100%;
        height: 100%;
        background: #AAA;
    }

    .Preview .mini-graph {
        position: relative;
        height: 100%;
        width: 100%;
    }
        .Preview .mini-graph .group {
            position: absolute;
            height: 100%;
            bottom: 0px;
        }
            .Preview .mini-graph .bar {
                position: absolute;
                bottom: 0px;
                width: 5px;
                background: linear-gradient(to bottom, #888 0%, #CCC 100%);
            }

    .Preview .window {
        box-sizing: border-box;
        position: absolute;
        height: 100%;
        width: 20%;
        left: 50px;
        top: 0;
        user-select: none;
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
`;
    const style = document.createElement("style");
    style.type = 'text/css';
    if (style.styleSheet) style.styleSheet.cssText = css;
    else style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}());

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
            - low
            - high
            - numPreviewPoints
            - timeStrFn
    */
	this.init = function(params) {
        if (!params.sequences)  
            throw new Error(`Must provide "params.sequences"`);
        if (params.low === undefined)
            throw new Error(`Must provide "params.low"`);
        if (params.high === undefined)
            throw new Error(`Must provide "params.high"`);
        if (params.numPreviewPoints === undefined)
            throw new Error(`Must provide "params.numPreviewPoints"`);
        if (params.timeStrFn === undefined)
            throw new Error(`Must provide "params.timeStrFn"`);

        // Create graph sequences.
        const graphSequences = params.sequences.map(obj => {
            obj = Object.assign({}, obj);
            const seq = new Sequence();
            seq.init(obj);
            return seq;
        })
        _graph = new SvgGraph();
        _$graphCtnr.empty().append(_graph.$e);
        _graph.init({
            name: "MainGraph",
            exact: false,
            sequences: graphSequences
        });

        // Create preview sequences (only ones we want to show)
        const previewSequences = params.sequences.map(obj => {
            if (!obj.showInPreview) return null;
            obj = Object.assign({}, obj);
            obj.maxPoints = params.numPreviewPoints;
            const seq = new Sequence();
            seq.init(obj)
            return seq;
        }).filter(seq => seq !== null);

        _preview = new Preview();
        _$previewCtnr.empty().append(_preview.$e);
        _preview.init({
            low: params.low,
            high: params.high,
            numPoints: params.numPreviewPoints,
            timeStrFn: params.timeStrFn,
            sequences: previewSequences
        });
        _preview.onViewChanged((view)=>{
            _graph.setBounds(view.low, view.high);
        });
        
	};

    this.setView = function(low, high){
        _preview.setView(low, high);
    };
}

function Sequence() {
    const _maxQueueLength = 30;
    const _vals = {};
    const _valStack = [];
    const _valPromises = {};
    var _numLoading = 0;

    // Adds to stack to get a value. If stack is too large,
    //  previous entries are discarded (rejected). There is no
    //  guarantee this will succeed, but it will resolve/reject.
    this.getValue = function(x) {
        if (_vals[x]) return Promise.resolve(_vals[x]);
        else return _push(x);
    };
    this.init = function(params) {
        if (!params.name)
            throw new Error(`Sequence must be passed params.name`);
        if (!params.valFn)
            throw new Error(`Sequence must be passed params.valFn`);
        _name = params.name;
        _valFn = params.valFn;
    };
    this.name = () => _name;
    this.setMaxQueueLength = (num) => _maxQueueLength = num;

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
        if (_valStack.length > _maxQueueLength) {
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
        if (_valStack.length == 0 || _numLoading >= 2) return;
        
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
}

function Preview() {
    var _high;
    var _low;
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
        var _isDragging;
        var _dir;
        var _startX;
        var _startLeft; var _startWidth;
        function startDragging(dir, ev) {
            _dir = dir;
            _startX = ev.pageX;
            _startLeft = _$window.position().left;
            _startWidth = _$window.width();
            $(document).bind("mousemove", onMove)
            $(document).bind("mouseup", unBindAll);
            const isBoth = _dir=="both";
            $("body").addClass(isBoth ? "dragging" : "resizing");
            _$e.addClass(isBoth ? "dragging" : "resizing");
        }
        function unBindAll() {
            $(document).css("cursor", "")
            $(document).unbind("mousemove", onMove);
            $(document).unbind("mouseup", unBindAll);
            const isBoth = _dir=="both";
            $("body").removeClass(isBoth ? "dragging" : "resizing");
            _$e.removeClass(isBoth ? "dragging" : "resizing");
        }
        function onMove(ev) {
            if (_dir == "left") {
                const maxDelta = _startWidth - 20;
                const deltaX = Math.min(ev.pageX - _startX, maxDelta);
                const newLeft = Math.max(_startLeft + deltaX, 0);
                const newWidth = _startWidth + (_startLeft - newLeft);
                _$window.css("left", Math.ceil(newLeft));
                _$window.css("width", newWidth);
            } else if (_dir == "right") {
                const minDelta = -1*(_startWidth - 20);
                const maxWidth = _$e.width() - _startLeft;
                const deltaX = Math.max(ev.pageX - _startX, minDelta);
                const newWidth = Math.min(_startWidth + deltaX, maxWidth);
                _$window.css("left", _startLeft);
                _$window.css("width", newWidth);
            } else if (_dir == "both") {
                const maxDelta = _$e.width() - (_startLeft + _startWidth);
                var deltaX = Math.min(ev.pageX - _startX, maxDelta);
                const newLeft = Math.max(_startLeft + deltaX, 0);
                _$window.css("left", Math.ceil(newLeft));
            }
            _refreshInfo();
            _viewChangedCb(_getView());
        }
        _$view.bind("mousedown", (ev)=>startDragging("both", ev));
        _$leftHandle.bind("mousedown", (ev)=>startDragging("left", ev));
        _$rightHandle.bind("mousedown", (ev)=>startDragging("right", ev));
    }());

    this.onViewChanged = (fn) => _viewChangedCb = fn;

    /*
        low:
        high:
        numPoints:
        sequences:
        timeStrFn:
    */
    this.init = function(params) {
        if (params.low === undefined)
            throw new Error(`Preview must be passed "low" param`);
        if (params.high === undefined)
            throw new Error(`Preview must be passed "high" param`);
        if (params.numPoints === undefined)
            throw new Error(`Preview must be passed "numPoints" param`);
        if (params.sequences === undefined)
            throw new Error(`Preview must be passed "sequences" param`);
        if (params.timeStrFn === undefined)
            throw new Error(`Preview must be passed "timeStrFn" param`);
        _low = params.low;
        _high = params.high;
        _numPoints = params.numPoints;
        _sequences = params.sequences;
        _timeStrFn = params.timeStrFn;

        _graph = new SvgGraph();
        _$e.find(".mini-graph").append(_graph.$e);
        _graph.init({
            name: "Preview",
            exact: true,
            sequences: _sequences,
            maxPoints: _numPoints
        });
        _graph.setBounds(_low, _high);
    };

    /*
        // Window is sized by either oldest and newest, or one and width.
        low: <blockNum> || undefined,
        high: <blockNum> || currentBlock
    */
    this.setView = function(low, high){
        if (!_$e.is(":visible"))
            throw new Error(`Preview.setView() only works while visible.`);
        if (low===undefined)
            throw new Error(`Must provide low`);
        if (high===undefined)
            throw new Error(`Must provide high`);
        _set$View(low, high);
    };

    this.$e = _$e;

    // Extract the window params from the position of _$window()
    function _getView() {
        const lowPct = _$window.position().left / _$e.width();
        const widthPct = _$window.width() / _$e.width();
        const low = Math.max(_low + lowPct * (_high - _low), 0);
        const high = Math.min(low + widthPct * (_high - _low), _high);
        return {
            low: low,
            high: high,
            size: high - low
        };
    }

    function _set$View(low, high) {
        const max = _high;
        const min = _low;
        high = Math.min(high, max);
        low = Math.max(low, min);
        const leftPct = (low-min)/(max-min);
        const widthPct = (high-low)/(max-min);
        const width = _$e.width();
        _$window.css("left", leftPct*width);
        _$window.width(widthPct*width);
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
    $parent: <DOM>
    sequences: [Sequence(), ...],
    maxPoints: 20
*/
function SvgGraph() {
    var _name;
    var _sequences;
    var _maxPoints;

    // current bounds
    var _low;
    var _high;
    var _exact;
    // current _xs to display, and all vals
    var _xs;
    var _points = {};
    // { seq.name() => { x => {y, $point, etc} }}

    const _$e = $(`<svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg" style="background: pink;"></svg>`);

    this.setParent = function($parent) {
        _$parent = $parent;
    };
    this.init = function(params) {
        if (!params.sequences) throw new Error(`Expected a sequence.`);
        _name = params.name;
        _exact = params.exact;
        _sequences = params.sequences;
        _maxPoints = params.maxPoints || 20;

        _sequences.forEach(seq => {
            _points[seq.name()] = {
                latestLoaded: [],
                latestLoadedIndex: {}
            };
        });
    };
    this.setBounds = function(low, high) {
        _low = low;
        _high = high;
        _xs = _exact 
            ? _getExactXValues(low, high, _maxPoints)
            : _getQuantizedXValues(low, high, _maxPoints);
        _loadData();
    };
    this.$e = _$e;

    // Given xs, display all relevant points and position them correctly.
    function _refresh() {
        if (!_$e.is(":visible"))
            throw new Error(`Not refreshable unless visible.`);

        const yPadding = .2;
        const width = _$e.width();
        const height = _$e.height();
        function getX(pctLeft) {
            // compress into [5, width-5]
            // return (xPadding + pctLeft * (width - xPadding*2));
            return pctLeft * width;
        }
        function getY(pctTop) {
            // compress into [.2, .8]
            return (yPadding + (1-pctTop) * (1 - yPadding*2)) * height;
        }
        function $svg(type, params) {
            params = params || {};
            var el = document.createElementNS("http://www.w3.org/2000/svg", type);
            Object.keys(params).forEach(key=>{
                el.setAttributeNS(null, key, params[key]);
            });
            return $(el);
        }

        const t = +new Date();
        _$e.empty();
        _sequences.forEach(seq => {
            $seq = $getSequence(seq);
            _$e.append($seq);
        });

        function $getSequence(seq) {
            const $e = $svg("g");
            const points = _points[seq.name()];
            const xMin = _low;
            const xMax = _high;
            const xRange = xMax - xMin;
            var yMax;
            var yMin;
            var yRange;

            _xs.forEach(x => {
                const y = points[x].y;
                if (y === null || y === undefined) return;
                if (yMax === undefined || y.gt(yMax)) yMax = y;
                if (yMin === undefined || y.lt(yMin)) yMin = y;
            });
            yRange = yMax === undefined ? new BigNumber(0) : yMax.minus(yMin);

            // create a circle for each point, and draw lines between points.
            var prevPt = null;
            _xs.forEach(x => {
                const y = points[x].y;
                const xPct = (x - xMin)/(xRange);
                const xPos = getX(xPct).toFixed(5);
                if (y === null || y === undefined) {
                    const yPos = getY(.05).toFixed(5);
                    const $circle = $svg("circle", {
                        cx: xPos,
                        cy: yPos,
                        r: 2,
                        fill: "rgba(0,0,0,.2)"
                    }).appendTo($e);
                    return;
                }

                const yPct = yRange.equals(0) ? .5 : y.minus(yMin).div(yRange)
                const yPos = getY(yPct).toFixed(5);
                
                const $circle = $svg("circle", {cx: xPos, cy: yPos, r: 2}).appendTo($e);
                if (prevPt) {
                    const $line = $svg("line", {
                        x1: xPos, x2: prevPt.xPos,
                        y1: yPos, y2: prevPt.yPos,
                        "stroke-width": 2,
                        stroke: "black"
                    }).appendTo($e);
                }
                prevPt = {xPos: xPos, yPos: yPos};
            });

            return $e;
        }
    }

    // For each sequence, create the data object for this x.
    // Start loading value. Once loaded, store y and maybe call _refresh().
    function _loadData() {
        _sequences.forEach(seq => {
            // todo: check if seq is visible.
            const points = _points[seq.name()];
            _xs.forEach(x => {
                // get or create point. if y is set, don't load.
                if (!points[x]) points[x] = {};
                if (points[x].y !== undefined) return;

                // load the value, and maybe draw it.
                seq.getValue(x).then(val => {
                    if (!points[x]) return;         // pruned. ignore it.
                    points[x].y = val;              // set it.
                    if (_isVisible(x)) _refresh();  // draw it.
                }, (e) => {});
            });

            // Add these points to front of latestLoaded.
            const latestLoaded = points.latestLoaded;
            const latestLoadedIndex = points.latestLoadedIndex;
            _xs.forEach(x => {
                // if already added, remove it. otherwise set index to true.
                latestLoadedIndex[x]
                    ? latestLoaded.splice(latestLoaded.indexOf(x), 1)
                    : latestLoadedIndex[x] = true;
            });
            latestLoaded.push.apply(latestLoaded, _xs);

            // Prune points loaded the longest time ago.
            const MAX_POINTS_PER_SEQ = _maxPoints * 100;
            const numToDelete = latestLoaded.length - MAX_POINTS_PER_SEQ;
            if (numToDelete > 0) {
                const toDelete = latestLoaded.splice(0, numToDelete);
                toDelete.forEach(x => {
                    delete points[x];
                    delete latestLoadedIndex[x];
                });
            }
        });
        _refresh();
    }

    function _isVisible(x) {
        return x >= _low && x <= _high;
    }

    // Gets quantized blocks such that newest and oldest are included
    // It will obtain one block below newest and oldest.
    function _getQuantizedXValues(low, high, maxXValues) {
        const zoom = Math.floor(Math.log2((high - low)/(maxXValues / 2)));
        const quanta = Math.pow(2, zoom);

        // get all blocks spaced out by quanta
        const xs = [];
        var x = Math.floor((low - quanta) / quanta) * quanta;
        while (x < (high + quanta)) {
            xs.push(x);
            x += quanta;
        }
        return xs;
    }

    function _getExactXValues(low, high, numXValues) {
        const xs = [];
        const interval = (high - low) / numXValues;
        for (var i=0; i<=numXValues; i++){
            xs.push(low + i*interval);
        }
        return xs;
    }
}