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
        .EthGraph .preview {
            position: relative;
            height: 60px;
        }
            .EthGraph .mini-graph {
                position: relative;
                height: 100%;
                width: 100%;
            }
                .EthGraph .mini-graph .group {
                    position: absolute;
                    height: 100%;
                    bottom: 0px;
                }
                    .EthGraph .mini-graph .bar {
                        position: absolute;
                        bottom: 0px;
                        width: 5px;
                        background: linear-gradient(to bottom, #888 0%, #CCC 100%);
                    }

            .EthGraph .window {
                box-sizing: border-box;
                position: absolute;
                height: 100%;
                width: 20%;
                left: 50px;
                top: 0;
                user-select: none;
            }
            .EthGraph .window .view {
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
                .EthGraph:not(.resizing) .window .view:hover,
                .EthGraph.dragging .window .view {
                    background: rgba(0,0,255,.3);
                }

            .EthGraph .window .left-handle,
            .EthGraph .window .right-handle {
                position: absolute;
                top: 0;
                height: 100%;
                width: 3px;
                background: rgba(0,0,0,.5);
                cursor: ew-resize;
                transition: background .3s;
            }
                .EthGraph .window .left-handle:hover,
                .EthGraph .window .right-handle:hover,
                .EthGraph.resizing .window .left-handle,
                .EthGraph.resizing .window .right-handle {
                    background: rgba(0,0,128,.5);
                }
            .EthGraph .window .left-handle {
                left: 0;
            }
            .EthGraph .window .right-handle {
                right: 0;
            }

            .EthGraph .window .info-ctnr {
                position: absolute;
                text-align: center;
                top: -20px;
                left: 50%;
                transform: translateX(-50%);
                opacity: 0;
                transition: opacity .5s, top .5s;
            }
                .EthGraph .window:hover .info-ctnr,
                .EthGraph.resizing .window .info-ctnr,
                .EthGraph.dragging .window .info-ctnr {
                    top: -35px;
                    opacity: .9;
                }
                .EthGraph .window .info {
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
    /*
        Opts:
            - avgBlocktime,
            - values: [{
                  name: "",
                  $label: <text-or-dom>,
                  valueFn: < fn(blockNum) => Promise(<BigNumber>) >,
                  tipFn: < fn({block, value}) => <dom> >
                  decorateFn: < fn( {point: <dom>, line: <dom>, bar: <dom>} ) => void >,
                  type: "bar" || "line",
                  showInPreview: < boolean > || true
              }, ...]
            - preview: {
                  numPoints: <number> || 20,
                  newest: < blockNum >,
                  oldest: < blockNum >
              }
    */
    var _self = this;
    var _opts;
    var _cancelRefreshGraph = ()=>{};
    var _cancelRefreshPreview = ()=>{};
    var _ethUtil = niceWeb3.ethUtil;

	const _$e = $(`
		<div class="EthGraph">
			<div class="graph">
				No data to show.
			</div>
			<div class="preview">
				<div class="mini-graph"></div>
				<div class="window">
                    <div class="view"></div>
					<div class="left-handle"></div>
					<div class="right-handle"></div>
                    <div class="info-ctnr">
                        <div class="info">
                            <span class="oldest">4,439,342</span> to <span class="newest">5,342,123</span><br>
                            <span class="total">1,383,092</span> blocks. <span class="time">(~4 months)</span>
                        </div>
                    </div>
				</div>
			</div>
		</div>
	`);
    const _$graph = _$e.find(".graph");
    const _$preview = _$e.find(".preview");
    const _$miniGraph = _$preview.find(".mini-graph");
    const _$window = _$preview.find(".window");
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
            const isBoth = _dir=="both" || _dir=="both-reverse";
            $("body").addClass(isBoth ? "dragging" : "resizing");
            _$e.addClass(isBoth ? "dragging" : "resizing");
        }
        function unBindAll() {
            $(document).css("cursor", "")
            $(document).unbind("mousemove", onMove);
            $(document).unbind("mouseup", unBindAll);
            const isBoth = _dir=="both" || _dir=="both-reverse";
            $("body").removeClass(isBoth ? "dragging" : "resizing");
            _$e.removeClass(isBoth ? "dragging" : "resizing");
            _refreshGraph();
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
                const maxWidth = _$preview.width() - _startLeft;
                const deltaX = Math.max(ev.pageX - _startX, minDelta);
                const newWidth = Math.min(_startWidth + deltaX, maxWidth);
                _$window.css("left", _startLeft);
                _$window.css("width", newWidth);
            } else if (_dir == "both" || _dir == "both-reverse") {
                const maxDelta = _$preview.width() - (_startLeft + _startWidth);
                var deltaX = ev.pageX - _startX;
                if (_dir == "both-reverse") deltaX = deltaX * -1;
                var deltaX = Math.min(deltaX, maxDelta);
                const newLeft = Math.max(_startLeft + deltaX, 0);
                _$window.css("left", Math.ceil(newLeft));
            }
            _refreshInfo();
        }
        _$graph.bind("mousedown", (ev)=>startDragging("both-reverse",ev));
        _$view.bind("mousedown", (ev)=>startDragging("both", ev));
        _$leftHandle.bind("mousedown", (ev)=>startDragging("left", ev));
        _$rightHandle.bind("mousedown", (ev)=>startDragging("right", ev));
    }());

	function _refreshAll() {
		// _refreshPreview();
	}

    var _loadGraphPoints;
    function _refreshGraph() {
        if (_loadGraphPoints) _loadGraphPoints.cancel();
        const win = _getWindow();
        _loadGraphPoints = _loadPoints(win.newest, win.oldest, 20, function(points){
            _$getGraph(points, {
                $parent: _$graph
            });
        });
    }

    var _loadPreviewPoints;
    function _refreshPreview() {
        if (_loadPreviewPoints) _loadPreviewPoints.cancel();
        const newest = _opts.preview.newest;
        const oldest = _opts.preview.oldest;
        const numPoints = _opts.preview.numPoints;
        _loadPreviewPoints = _loadPoints(newest, oldest, numPoints, function(points){
            _$getGraph(points, {
                $parent: _$miniGraph
            });
        });
    }

    function _refreshInfo() {
        const win = _getWindow();
        _$info.find(".oldest").text(win.oldest.toLocaleString());
        _$info.find(".newest").text(win.newest.toLocaleString());
        _$info.find(".total").text(win.numBlocks.toLocaleString());
        const timeStr = util.toTime(Math.round(win.numBlocks * _opts.avgBlocktime));
        _$info.find(".time").text(`~${timeStr}`);
    }

    // Extract the window params from the position of _$window()
    function _getWindow() {
        const oldestPct = _$window.position().left / _$preview.width();
        const widthPct = _$window.width() / _$preview.width();
        const _oldest = _opts.preview.oldest;
        const _newest = _opts.preview.newest;

        const oldest = Math.max(Math.round(_oldest + oldestPct * (_newest - _oldest)), 0);
        const newest = Math.min(Math.round(oldest + widthPct * (_newest - _oldest)), _newest);
        return {
            oldest: oldest,
            newest: newest,
            numBlocks: newest-oldest
        };
    }

    function _set$Window(newest, oldest) {
        const max = _opts.preview.newest;
        const min = _opts.preview.oldest;
        newest = Math.min(newest, max);
        oldest = Math.max(oldest, min);
        const leftPct = (oldest-min)/(max-min);
        const widthPct = (newest-oldest)/(max-min);
        const width = _$preview.width();
        _$window.css("left", leftPct*width);
        _$window.width(widthPct*width);
        _refreshInfo();
        _refreshGraph();
    }

    function _loadPoints(newest, oldest, numPoints, callbackFn) {
        // Object to return.
        var res, rej, cancel;
        const returnObj = {
            cancel: ()=>{cancel = true},
            promise: new Promise((resolve,reject)=>{res = resolve; rej = reject;})
        };

        // Get numPoints blocks, 2 at a time.
        const chunks = _chunkify(newest, oldest, numPoints, 2);

        // Init all the points to zero.
        const points = [];
        chunks.forEach(chunk => {
            chunk.forEach(block => {
                points[block] = {};
                _opts.values.forEach(obj => points[block][obj.name] = null);
            });
        });

        // Load all values for each chunk, one at a time.
        (function doNextChunk() {
            if (chunks.length==0) {
                res(points);
                return;
            }
            const chunk = chunks.shift();
            const promises = [];
            chunk.forEach(block => {
                _opts.values.forEach(obj => {
                    const promise = Promise.resolve(obj.valueFn(block)).then(val => {
                        points[block][obj.name] = val;
                    });
                    promises.push(promise);
                });
            })
            Promise.all(promises).then(()=>{
                if (cancel) return;
                if (callbackFn) callbackFn(points);
                doNextChunk();
            });
        }());
        return returnObj;
    }

    function _chunkify(newest, oldest, numPoints, chunkSize) {
        const interval = (newest - oldest) / numPoints;
        const chunks = [];
        var cur_chunk;
        for (var i=newest; i>=oldest; i-=interval) {
            if (!cur_chunk) {
                cur_chunk = [];
                chunks.push(cur_chunk);
            }
            cur_chunk.push(Math.floor(i));
            if (cur_chunk.length == chunkSize){
                cur_chunk = null;
            }
        }
        return chunks;
    }

    // returns an SVG object that is scaled to opts.parent
    function _$getGraph(points, opts) {
        const $parent = opts.$parent.empty();
        const xPadding = Number(opts.xPadding) || 5;
        const yPadding = Number(opts.yPadding) || .2;
        const width = $parent.width();
        const height = $parent.height();
        function getX(pctLeft) {
            // compress into [5, width-5]
            return (xPadding + pctLeft * (width - xPadding*2));
        }
        function getY(pctTop) {
            // compress into [.2, .8]
            return (yPadding + (1-pctTop) * (1 - yPadding*2)) * height;
        }
        function $svg(type, params) {
            var el = document.createElementNS("http://www.w3.org/2000/svg", type);
            Object.keys(params).forEach(key=>{
                el.setAttributeNS(null, key, params[key]);
            });
            return $(el);
        }

        const $e = $(`<svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"></svg>`)

        // compute minBlock, maxBlock, range
        // and max/min value per valName
        const blocks = Object.keys(points).map(p => Number(p)).sort();
        const blockMin = blocks[0];
        const blockMax = blocks[blocks.length-1];
        const maxVal = {};
        const minVal = {}
        blocks.forEach(block => {
            Object.keys(points[block]).forEach(valName => {
                const val = points[block][valName];
                if (val === null) return;
                if (maxVal[valName]===undefined || maxVal[valName].lt(val))
                    maxVal[valName] = val;
                if (minVal[valName]===undefined || minVal[valName].gt(val))
                    minVal[valName] = val;
            });
        });

        // create a circle for each point, and draw lines between points.
        var prevPts = {};
        blocks.forEach(block => {
            const x = getX((block - blockMin)/(blockMax - blockMin));
            Object.keys(points[block]).forEach(valName => {
                const val = points[block][valName];
                const max = maxVal[valName];
                const min = minVal[valName];
                const valRange = max.minus(min);
                if (val === null) {
                    const $circle = $svg("circle", {cx: x.toFixed(2), cy: height-2, r: 2}).appendTo($e);
                    return;
                }

                const y = getY(valRange.equals(0) ? .5 : val.minus(min).div(valRange));
                const $circle = $svg("circle", {cx: x.toFixed(2), cy: y.toFixed(2), r: 2}).appendTo($e);
                const prevPt = prevPts[valName];
                if (prevPt) {
                    const $line = $svg("line", {x1: x, x2: prevPt.x, y1: y, y2: prevPt.y, "stroke-width":2, stroke: "black"}).appendTo($e);
                }
                prevPts[valName] = {x: x, y: y};
            });
        });

        $e.appendTo($parent);
    }


	this.$e = _$e;

	this.setOpts = function(opts) {
		_opts = opts;
        if (!opts.avgBlocktime) {
            console.warn("No avgBlocktime provided in opts. Defaulting to 0.");
            opts.avgBlocktime = 15;
        }
        if (!opts.preview.oldest)
            throw new Error("Must provide opts.preview.oldest");
        if (!opts.preview.newest)
            throw new Error("Must provide opts.preview.newest");
        if (opts.preview.newest < opts.preview.oldest) {
            throw new Error("Newest block must be > oldest block");
        }

        _refreshPreview();
	};

    /*
        // Window is sized by either oldest and newest, or one and width.
        oldest: <blockNum> || undefined,
        newest: <blockNum> || currentBlock,
        duration: {blocks: <Number>} || {seconds: <Number>} (defaults to 1 day),
        numPoints: <Number> || 20
    */
    this.setWindow = function(opts){
        if (!opts) opts = {};

        var oldest = opts.oldest;
        var newest = opts.newest;
        var numBlocks;

        // if oldest and newest are both set, use them.
        if (oldest !== undefined && newest !== undefined) {
            _set$Window(newest, oldest);
            return;
        } 
        // calc numBlocks
        duration = opts.duration || {};
        if (duration.seconds)
            numBlocks = Math.round(duration.seconds / _opts.avgBlocktime);
        else if (duration.blocks)
            numBlocks = duration.blocks;
        else
            numBlocks = 60*60*25/_opts.avgBlocktime;

        // if oldest is defined, then use it.
        if (oldest !== undefined) {
            _set$window(oldest, oldest + numBlocks);
            return;
        }
        // otherwise, use newest.
        newest = newest || _opts.preview.newest;
        setTimeout(() => { _set$Window(newest, newest - numBlocks); }, 0);
    };
}