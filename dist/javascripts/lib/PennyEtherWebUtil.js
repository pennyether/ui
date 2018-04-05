(function(){

	function PennyEtherWebUtil(niceWeb3) {
		var _self = this;

		this.bindToElement = function bindToElement(promise, element, doAppend) {
			if (element.length == 0) {
				console.warn("Element doesn't exist.");
				return;
			}

			element.empty().text("loading...");
			promise.then(function(res){
				doAppend
					? element.empty().append(res)
					: element.empty().text(res);
			},function(e){
				element.empty().text(`Error: ${e.message}`);
			});
		};

		this.bindToInput = 	function bindToInput(promise, element) {
			if (element.length == 0) {
				console.warn("Element doesn't exist.");
				return;
			}
			
			element.empty().text("loading...");
			promise.then(function(res){
				element.val(res);
			},function(e){
				element.val(`Error: ${e.message}`);
			});
		};

		this.$getLogs = function $getLogs(instance, allAtOnce) {
			const lv = new LogViewer({
				events: [{
					instance: instance,
					name: "all"
				}],
				order: "newest",
				allAtOnce: allAtOnce
			});
			return Promise.resolve(lv.$e);
		};

		this.$getLogViewer = function(opts) {
			const lv = new LogViewer(opts);
			return lv.$e;
		};

		this.getGasPriceSlider = function(defaultGWei, chooseInitialValue){
			return new GasPriceSlider(defaultGWei, chooseInitialValue);
		};

		this.$getTxStatus = function(p, opts) {
			const txStatus = new TxStatus(_self);
			txStatus.setTxPromise(p, opts);
			return txStatus.$e;
		};

		this.getTxStatus = function(opts) {
			const txStatus = new TxStatus(_self);
			txStatus.addOpts(opts);
			return txStatus;
		};

		this.getBetter = function(){
			return new Better();
		};

		this.$getShortAddrLink = function(addr) {
			const addrStr = addr.slice(0, 6) + "..." + addr.slice(-4);
			return _self.$getAddrLink(addrStr, addr);
		};
		this.$getAddrLink = function(name, addr){
			return niceWeb3.ethUtil.$getLink(name, addr || name, "address");
		};
		this.$getTxLink = function(name, tx){
			const shortName = name.length == 66
				? name.slice(0,10) + "..." + name.slice(-10)
				: name;
			return niceWeb3.ethUtil.$getLink(shortName, tx || name, "tx");
		};
		this.getLoadingBar = function(timeMs, speed, hideTip) {
			return new LoadingBar(timeMs, speed, true, hideTip);
		};
		this.$getLoadingBar = function(timeMs, p, hideTip) {
			var lb = new LoadingBar(timeMs, null, false, hideTip);
			if (p.getTxHash) p.getTxHash.then(lb.start)
			else lb.start();
			p.then(()=>lb.finish(500), ()=>lb.finish(500));
			return lb.$e;
		};

		this.toDateStr = function(timestampS, params){
			if (!params) params = {};
			if (timestampS.toNumber) timestampS = timestampS.toNumber();
			var options = {
				month: "short",
				day: "numeric"
			};
			if (params.scale) {
				const scale = params.scale;
				if (scale < 60*60*24*7) {
					options.hour = "2-digit";
					options.minute = "2-digit";
				}
				if (scale < 60*60) options.second = "2-digit";
			} else {
				options = {
					month: "short",
				    day: "numeric",
				    hour: "2-digit",
				    minute: "2-digit",
				    second: "2-digit"
				};
			}
			Object.keys(params).forEach(name=>{
				if (name=="scale") return;
				const val = params[name];
				if (!val) delete options[name];
				else options[name] = params[name];
			});

			if (timestampS == 0) return "n/a";
			return (new Date(timestampS*1000))
    			.toLocaleString(window.navigator.language, options);
		};

		this.getLocalTime = function(date){
			if (!date) date = new Date();
			return date.toLocaleString(window.navigator, {
				hour: "2-digit", minute: "2-digit", second: "2-digit"
			});
		};

		// returns something like "4h 3m 10s"
		this.toTime = function(timeS, numUnits, useColon) {
			try {
				numUnits = numUnits || 2;
				timeS = (new BigNumber(timeS)).round();
			} catch(e) {
				console.error("Val expected to be a number", timeS);
				return "<unknown>";
			}

			const units = [
				{label: "w", seconds: 60*60*24*7},
				{label: "d", seconds: 60*60*24},
				{label: "h", seconds: 60*60},
				{label: "m", seconds: 60},
				{label: "s", seconds: 1}
			];

			var chunks = [];
			var numUnitsDisplayed = 0;
			units.forEach(obj => {
				if (numUnitsDisplayed >= numUnits) return;
				const val = timeS.div(obj.seconds).floor();
				timeS = timeS.minus(val.mul(obj.seconds));
				if (val.gt(0) || numUnitsDisplayed>0 || (obj.label=="s" && numUnitsDisplayed==0)) {
					chunks.push(`${val}${obj.label}`);
					numUnitsDisplayed++;
				}
			});
			return chunks.join(" ");
		};

		this.toEthStr = function(wei, unit) {
			try { wei = new BigNumber(wei); }
			catch (e) { throw new Error(`${wei} is not convertable to a BigNumber`); }
			if (unit === undefined) unit = "ETH";

			// scale down "wei" to proper unit (at least .100 of the unit)
			var dispNum, dispUnit;
			if (wei.abs().gt(1e17)) {
				dispNum = wei.div(1e18);
				dispUnit = `${unit}`;
			} else if (wei.abs().gt(1e14)) {
				dispNum = wei.div(1e15);
				dispUnit = unit=="ETH" ? `finney` : `m${unit}`;
			} else if (wei.abs().gt(1e8)) {
				dispNum = wei.div(1e9);
				dispUnit = unit=="ETH" ? `gWei` : `n${unit}`;
			} else {
				dispNum = wei;
				dispUnit = unit=="ETH" ? `wei` : `wei-${unit}`;
			}

			// Show up to three decimals, eg: "123" "12.3" "1.23" ".123"
			var maxDecimals;
			const numDigits = Math.ceil(Math.log10(dispNum.abs().toNumber()));
			if (numDigits > 0) maxDecimals = Math.max(3 - numDigits, 0);
			else maxDecimals = 3;
			// Format the number to locale. No idea why win.nav.lang isn't the default.
			var ethStr = dispNum.toNumber().toLocaleString(window.navigator.language, {
				maximumFractionDigits: maxDecimals,
			});
			return `${ethStr} ${dispUnit}`;
		};

		this.debounce = function(timeout, fn) {
			var i;
			const ret = function(){
				clearTimeout(i);
				const args = arguments;
				i = setTimeout(()=>fn.apply(null, args), timeout);
			}
			ret();
			return ret;
		};

		this.delay = function(timeout, fn) {
			return ()=>setTimeout(fn, timeout);
		};
	}

	// loading bar that always looks like it'll take timeMs to complete.
	// speed tunes how fast the bar will load (but also the rate at which it slows)
	// exponential functions are such a mathematical gem.
	function LoadingBar(timeMs, speed, autoStart, hideTip) {
		const _$e = $(`
			<div class='LoadingBar' style='font-size: 0px;'>
				<div class='loaded' style='height: 100%; position: relative; left: 0px; width: 0%'>&nbsp;</div>
			</div>
		`);
		const _$loaded = _$e.find(".loaded");
		const _speed = 1 - (speed || .75);
		var _startTime;
		var _finished;

		const timeStr = util.toTime(Math.round(timeMs / 1000));
		if (!hideTip) {
			_$e.attr("title", `This is an estimate of time (~${timeStr}), based on the chosen gas price.`);
			if (tippy) {
				tippy(_$e[0], {
					trigger: "mouseenter",
					placement: "top",
					animation: "fade"
				});
			}
		}

		function _update() {
			if (_finished) return;
			const t = (+new Date()) - _startTime;
			var pct = (1 - Math.pow(_speed, t/timeMs)) * 100
			_$loaded.css("width", pct.toFixed(2) + "%");
			setTimeout(_update, 100);
		}

		this.start = function(){ 
			_startTime = (+new Date());
			_update();
		}
		this.finish = function(durationMs){
			return new Promise((res,rej)=>{
				_finished = true;
				const startTime = (+new Date());
				const startPct = Number(_$loaded[0].style.width.slice(0, -1));
				window.requestAnimationFrame(function update(){
					const t = Math.min(1, (+new Date() - startTime)/durationMs);
					const newPct = startPct + (100 - startPct)*t;
					_$loaded.css("width", `${newPct.toFixed(2)}%`);
					if (t == 1) res();
					else window.requestAnimationFrame(update);
				});
			});
		}
		this.$e = _$e;

		if (_speed <= 0 || _speed >= 1)
			throw new Error("Speed must be between 0 and 1");

		autoStart = autoStart === undefined
			? true
			: !!autoStart;
		if (autoStart) this.start();
	}

	/*
		opts: {
			events: [{
				instance:
				name:
				filter: {	// topics are ANDed
					topicName: value,
					topic2Name: value
				}
				formatters: {
					eventArg1: function(val){ ... }
					eventArg2: function(val){ ... }
				}
			},{ ... }],
			$head: content to put into head
			// which order to retrieve and display logs
			order: 'newest' || 'oldest',
			// if true, ignores min/max block. gets all logs in one request.
			allAtOnce: false,
			maxBlock: <currentBlock>,
			minBlock: <maxBlock - 500,000>,
			// formatting fns
			dateFn: (event, prevEvent, nextEvent)=>{str}
			valueFn: (event)=>{str}
		}
	*/
	function LogViewer(opts) {
		const _BLOCKS_PER_SEARCH = 50000;
		const _MAX_SEARCH = _BLOCKS_PER_SEARCH*10;

		const _$e = $(`
			<div class='LogViewer'>
				<div class='head'></div>
				<div class='logs' style='overflow-y: auto;'>
					<div class='empty'>No Logs Found</div>
					<table cellspacing="0" cellpadding="0"></table>
				</div>
				<div class='status'></div>
			</div>
		`);
		const _$logs = _$e.find(".logs").bind("scroll", _checkScroll)
		const _$head = _$e.find(".head");
		const _$table = _$e.find("table");
		const _$empty = _$e.find(".empty");
		const _$status = _$e.find(".status");

		if (!opts.order) opts.order = 'newest';
		if (!opts.events) throw new Error(`Must provide "events" option.`);
		const _order = opts.order || "newest";
		const _allAtOnce = opts.allAtOnce || false;
		const _maxBlock = opts.maxBlock || ethUtil.getCurrentBlockHeight().toNumber();
		const _minBlock = opts.minBlock || _maxBlock - _MAX_SEARCH;
		const _dateFn = opts.dateFn || _defaultDateFn;
		const _valueFn = opts.valueFn || _defaultValueFn;

		var _isDone = false;
		var _isLoading = false;
		var _prevFromBlock = _order=='newest' ? _maxBlock+1 : null;
		var _prevToBlock = _order=='oldest' ? _minBlock-1 : null;
		var _prevEvent = null;			// the previously loaded event
		var _$prevDateTd = null;		// the date cell of the _prevEvent
		var _leastFromBlock = Infinity;
		var _greatestToBlock = 0;

		function _checkScroll() {
			if (_isDone || _isLoading) return;

			const isNearBottom = _$logs[0].scrollHeight - _$logs.scrollTop() - _$logs.outerHeight() < 20;
  			if (!isNearBottom) return;
  			_loadMoreEvents().then(events=>{
  				if (events.length > 0) _$empty.hide();
  				events.forEach((event, i)=>{
  					const $row = $(`<tr></tr>`).appendTo(_$table);
  					const $dateTd = $(`<td class='date'></td>`).appendTo($row);
  					const $valueTd = $(`<td class='value'></td>`).appendTo($row);
  					const prevEvent = _order == 'newest' ? events[i+1] : _prevEvent;
  					const nextEvent = _order == 'newest' ? _prevEvent : events[i+1];
  					const $date = _dateFn(event, prevEvent, nextEvent);
  					const $value = _valueFn(event);
  					$dateTd.append($date);
  					$valueTd.append($value);
  					if (_$prevDateTd && i==0) {
  						const $lastDate = _dateFn(_prevEvent, prevEvent, nextEvent)
	  					_$prevDateTd.empty().append($lastDate);
	  				}
  					_isDone = _isDone || _stopFn(event);
					_prevEvent = event;
					_$prevDateTd = $dateTd;
  				});
  				_checkScroll();
  			});
		}

		// Loads _BLOCKS_PER_SEARCH at a time, until events are found or until
		// it is "done", that is, the search chunk exceeds _minBlock or _maxBlock.
		function _loadMoreEvents() {
			// return if _isDone or _isLoading
			if (_isDone || _isLoading) return Promise.resolve([]);

			// compute from/to block
			var fromBlock, toBlock;
			if (_allAtOnce) {
	  			fromBlock = _minBlock;
	  			toBlock = _maxBlock;
	  			_isDone = true;
	  		} else {
	  			if (_order == 'newest'){
	  				// search to where the last chunk started
	  				toBlock = _prevFromBlock - 1;
					fromBlock = Math.max(_prevToBlock - _BLOCKS_PER_SEARCH, _minBlock);
	  				if (fromBlock <= _minBlock) _isDone = true;
	  			} else {
	  				// search from where the last chunk ended
	  				fromBlock = _prevToBlock + 1;
	  				toBlock = Math.min(fromBlock + _BLOCKS_PER_SEARCH, _maxBlock);
	  				if (toBlock >= _maxBlock) _isDone = true;
	  			}
	  		}

  			// get promise for each event name
  			const promises = opts.events.map((ev)=>{
  				if (!ev.instance) throw new Error(`opts.events.instance not defined.`);
  				if (!ev.name) throw new Error(`opts.events.name not defined.`);
  				return ev.name == "all"
  					? ev.instance.getAllEvents(fromBlock, toBlock)
  					: ev.instance.getEvents(ev.name, ev.filter, fromBlock, toBlock);
  			});

  			// show that we're loading, update least/greatest
			_isLoading = true;
			_$status.text(`Scanning blocks: ${fromBlock} - ${toBlock}...`);
			_leastFromBlock = Math.min(_leastFromBlock, fromBlock);
	  		_greatestToBlock = Math.max(_greatestToBlock, toBlock);

  			// concat all events, and sort. if none, try again
  			return Promise.all(promises).then((arr)=>{
  				_isLoading = false;
  				_$status.text(`Scanned blocks: ${_leastFromBlock} - ${_greatestToBlock}.`);

  				// create events array, order by blockNumber / logIndex. (reverse for newest)
  				var allEvents = [];
  				arr.forEach((events) => { allEvents = allEvents.concat(events) });
  				allEvents.sort((a,b)=>{
					return a.blockNumber == b.blockNumber
						? a.logIndex - b.logIndex
						: a.blockNumber - b.blockNumber;
				});
				if (_order=="newest") allEvents.reverse();

				// If there were no events, try to load more
  				return allEvents.length > 0
  					? allEvents
  					: _loadMoreEvents();
  			});
		}

		function _defaultDateFn(e) {
			const dateStr = e.args && e.args.time
				? util.toDateStr(e.args.time)
				: `Block ${e.blockNumber}`;
			return util.$getTxLink(dateStr, e.transactionHash);
		}
		function _defaultValueFn(e) {
			var $argVals = {};
			if (!e.args) {
				$argVals["Error"] = "Unable to decode data.";
			} else {
				Object.keys(e.args || [])
					.filter(name=>name !== "time")
					.map(name=>{
						var eventDef = opts.events.find(def => def.name===e.name);
						if (!eventDef) eventDef = opts.events.find(def => def.name=="all");
						const defaultValue = _defaultFormatter(e.args[name], name);
						$argVals[name] = eventDef.formatters && eventDef.formatters[name]
							? eventDef.formatters[name](e.args[name], name, defaultValue)
							: defaultValue;
					})
					.filter(str => !!str);
			}
			
			const $e = $("<div class='event-value'></div>");
			const $name = $("<div class='event-name'></div>").text(e.name).appendTo($e);
			const $vals = $("<div class='event-args'></div>").appendTo($e);
			Object.keys($argVals).forEach(name => {
				const $arg = $("<span class='event-arg'></span>").appendTo($vals);
				$("<span class='event-arg-name'></span>").text(`${name}:`).appendTo($arg)
				$("<span class='event-arg-value'></span>").append($argVals[name]).appendTo($arg);
			});
			return $e;
		}
		function _defaultFormatter(val, name) {
			const $e = $("<span></span>");
			if (val.toNumber && val.gt(1000000000)){
				$e.append(util.toEthStr(val));	
			} else if (!val.toNumber && val.toString().length==42) {
				$e.append(util.$getShortAddrLink(val));
			} else if (!val.toNumber && val.toString().length==66) {
				// bytes32
				$e.append(niceWeb3.web3.toAscii(val));
			} else {
				$e.append(val.toString());
			}
			return $e;
		}

		this.$e = _$e;

		_$head.empty().append(opts.$head || "Log Viewer");
		_checkScroll();
	}

	// A slider to help the user choose a gas price.
	// When .refresh() is called:
	//   - Pulls data from EthGasStatus, sets default to lowest cost for <=60 second mining.
	// .getValue() returns the current value (Number):
	//		- defaultGWei (or 0)
	//		- autochosen value if its been refreshed
	//		- or value selected by user
	// .getWaitTimeS() returns (Number):
	//		- null if no value chosen
	//		- otherwise a regular Number
	function GasPriceSlider(defaultGWei, autoChoose){
		const AUTO_WAIT_TIME_S = 60;
		if (autoChoose===undefined) autoChoose = true;
		
		const _$e = $(`
			<div class="GasPriceSlider">
				<div class='head'>Choose Gas Price</div>
				<div class='loading'></div>
				<div class='content'>
					<input type="range" increment="1" class="slider">
					<div class='description'>
						<div class='gasPrice'></div>
						<div class='wait'></div>
						<div class='refresh'>↻</div>
					</div>
				</div>
			</div>
		`);
		const _$head = _$e.find(".head");
		const _$loading = _$e.find(".loading").text("Not initialized.").show();
		const _$content = _$e.find(".content").hide();
		const _$gasPrice = _$e.find(".gasPrice");
		const _$wait = _$e.find(".wait");
		const _$slider = _$e.find("input").on("input", _onSliderChanged);
		const _$refresh = _$e.find(".refresh").hide().click(()=>_refresh(true));
		var _gasData = {};
		var _value = defaultGWei || new BigNumber(0);
		var _waitTimeS = null;
		var _onChangeCb;

		// Retrieves gas data (up to 60s old)
		// Populates available gasPrices:
		//	- All gWei between 2 blocks and 2 hours waitTime, incremented by 1 GWei
		//	- discards gasPrices that are too slow or pointlessly expensive
		// If autoChoose is true:
		//	- selects least expensive gas price with waitTimeS <= AUTO_WAIT_TIME_S
		// If autoChoose is false
		//	- selects defaultGWei gas price, which will snap to closest available gasPrice
		function _refresh(fresh) {
			_$loading.show().text(`Loading gas data...`);
			_$content.hide();
			ethUtil.getGasPrices(fresh).then(data=>{
				var min = null;
				var max = null;
				var auto = Infinity;
				_gasData = {};
				data.forEach(d=>{
					_gasData[d.gasPrice] = d;
					// set min/max to first value that meets criteria
					if (!min && d.waitTimeS <= 2*60*60) min = d.gasPrice;
					if (!max && d.waitBlocks <= 2) max = d.gasPrice;
					// autochoose value to smallest value that meets criteria
					if (autoChoose && d.waitTimeS <= AUTO_WAIT_TIME_S) auto = Math.min(auto, d.gasPrice);
				});
				if (auto !== Infinity) _value = auto;
				if (min < 1) { max = max + min; }
				_$slider.attr("min", min).attr("max", max).val(_value);
				if (_$slider.val() > max) _$slider.val(max);
				if (_$slider.val() < min) _$slider.val(min);
				_$loading.hide();
				_$content.show();
				_onSliderChanged();
			}, (e)=>{
				_$loading.show().text(`Error: ${e.message}`);
				_$content.hide();
			});
		}

		// sets _value and _waitTimeS to the closest matching _gasData[] value.
		// updates display of _$wait and _$gasPrice
		function _onSliderChanged() {
			var val = _$slider.val();
			if (!_gasData[val]) {
				val = Object.keys(_gasData).reduce((prev, cur)=>{
					return Math.abs(cur - val) < Math.abs(prev - val) ? cur : prev;
				});
			}
			const data = _gasData[val];
			const blocks = data.waitBlocks;
			const timeStr = util.toTime(Math.round(data.waitTimeS));

			_value = val;
			_waitTimeS = data.waitTimeS;
			_$gasPrice.text(`${val} GWei`);
			_$wait.text(`~${blocks} Blocks (${timeStr})`);
			_$wait.removeClass("fast slow");
			if (data.waitTimeS <= 60) _$wait.addClass("fast");
			else if (data.waitTimeS > 60*15) _$wait.addClass("slow");
			if (_onChangeCb) _onChangeCb(val);
		}

		this.onChange = function(fn) {
			_onChangeCb = fn;
		};
		this.getValue = function(defaultValue){
			return (new BigNumber(_value)).mul(1e9);
		};
		this.getWaitTimeS = function(){
			return _waitTimeS;
		};
		this.enable = function(bool) {
			if (bool) {
				_$slider.removeAttr("disabled");
				_$e.removeClass("disabled");
			} else {
				_$slider.attr("disabled","disabled");
				_$e.addClass("disabled");
			}
		}
		this.refresh = _refresh;
		this.$e = _$e;
		this.$head = _$head;
		this.$refresh = _$refresh;
	}

	// A container that shows the progress of a NiceWeb3 txPromise
	// Includes many options, and can be used to show non-tx errors
	//
	// Options:
	//	- .miningMsg: what to show while waiting for promise
	//  - .successMsg: what to show after successful promise
	//  - .waitTimeMs: estimated wait time, controls status bar speed
	//  - .onSuccess: (res)=>{} - called after tx succeeds
	//  - .onClear: ()=>{} - called when user clears success/error message
	function TxStatus(_util) {
		const _$e = $(`
			<div class='TxStatus'>
				<div class='clear'>×</div>
				<div class='status'></div>
			</div>
		`);
		const _opts = {};
		const _$clear = _$e.find(".clear").hide();
		const _$status = _$e.find(".status");

		_$clear.click(function(){
			_$e.remove();
			(_opts.onClear || function(){})();
		});

		function _setTxPromise(p, opts) {
			_addOpts(opts);
			const miningMsg = _opts.miningMsg || "Your transaction is being mined...";
			const successMsg = _opts.successMsg || "Your transaction was mined!";
			const waitTimeMs = _opts.waitTimeMs || 30000;
			const onSuccess = _opts.onSuccess || function(){};
			const onFailure = _opts.onFailure || function(){};
			var txId;
			var loadingBar;

			_$status.text("Waiting for signature...");
			if (p.getTxHash){
				p.getTxHash.then(function(tId){
					txId = tId;
					loadingBar = _util.getLoadingBar(waitTimeMs);
					_$status.empty()
						.append(_util.$getTxLink(miningMsg, txId))
						.append(loadingBar.$e);
				});
			}

			p.then(function(res){
				if (loadingBar) {
					loadingBar.finish(500).then(()=>{
						_$clear.show();
						_$status.empty().append(_util.$getTxLink(successMsg, txId));
						onSuccess(res);
					});
				} else {
					onSuccess(res);
				}
			}).catch((e)=>{
				_$clear.show();
				_$e.addClass("error");
				if (txId) {
					loadingBar.finish(500).then(()=>{
						_$status.empty()
							.append(util.$getTxLink("Your tx failed.", txId))
							.append(`<br>${e.message}`);
						onFailure();
					});
				} else {
					_$status.text(`${e.message.split("\n")[0]}`);	
					onFailure();
				}
			});
		}

		function _addOpts(opts) {
			if (!opts) return;
			Object.assign(_opts, opts);
		}

		this.setTxPromise = (p, opts) => { _setTxPromise(p, opts); };
		this.setStatus = (str) => { _$status.text(str); };
		this.addOpts = (opts) => { _addOpts(opts); };
		this.fail = (str) => { _$clear.show(); _$status.text(str); };
		this.$e = _$e;
		this.$status = _$status;
		this.$clear = _$clear;
	}

	// Displays a betting slider / text combo:
	//  Features:
	//    - automatically adjusts increment of slider
	//    - shows invalid bets, and reasons for it
	//    - allows user to choose "credits" instead of "eth"
	//  Usage:
	//    .setMaxValue() / .setMinValue(): does what you expect.
	//    .getValue(): returns BigNumber (in wei) or null.
	//    .onChange(fn): triggered when value changed
	//    .freeze(bool): disables elements, prevents user interaction
	function Better() {
	    const _self = this;

	    const _$e = $(`
	        <div class="Better">
	            <div class="value">
	                <div class="topLabel">Bet</div>
	                <input class="betTxt" type="number" value=".1" step=".01" min=".01" max=".60">
	                <div class="bottomLabel">
	                    <div class="both">
	                        <label><input type="radio" name="betUnit" value="eth" checked>ETH</label>
	                        <label><input type="radio" name="betUnit" value="credits">Credits</label>
	                    </div>
	                    <div class="eth">
	                        ETH
	                    </div>
	                    <div class="credits">
	                        Credits
	                    </div>
	                </div>
	            </div>
	            <div class="slider">
	                <input class="betSlider" type="range" value=".1" step=".01" min=".01" max=".60">
	                <div class="betErr"></div>
	            </div>
	        </div>
	    `)
	    const _$slider = _$e.find(".betSlider");
	    const _$txt = _$e.find(".betTxt");
	    const _$err = _$e.find(".betErr").hide();
	    const _$both = _$e.find(".both").hide();
	    const _$eth = _$e.find(".eth").hide();
	    const _$credits = _$e.find(".credits").hide();
	    const _$label = _$e.find(".bottomLabel");
	    const _$radEth = _$label.find("input[value=eth]");
	    const _$radCredits = _$label.find("input[value=credits]");

	    var _prevBet = null;
	    var _minBet = new BigNumber(0);
	    var _maxBet = new BigNumber(0);
	    var _credits = new BigNumber(0);
	    var _mode = "eth";
	    var _betType = "eth";
	    var _onChange = ()=>{};

	    _$label.find("input").change(function(){
	        _betType = _$label.find("input:checked").val();
	        _refreshBet();
	    });
	    _$txt.on("focus", function(){
	        $(this).select();
	    });
	    _$txt.on("input", function(){
	        const ether = Number($(this).val());
	        if (Number.isNaN(ether)) return;
	        _$slider.val(ether);
	        _refreshBet();
	    });
	    _$slider.on("input", function(){
	        const ether = Number($(this).val());
	        _$txt.val(ether);
	        _refreshBet();
	    });

	    this.setCredits = function(v) {
	        _credits = v || new BigNumber(0);
	        _self.refresh();
	    };
	    this.setMax = function(v) {
	        _maxBet = v || new BigNumber(0);
	        _self.refresh();
	    };
	    this.setMin = function(v) {
	        _minBet = v || new BigNumber(0);
	        _self.refresh();
	    };
	    this.setMode = function(mode) {
	        mode = mode.toLowerCase();
	        const allowed = ["eth", "credits", "both"];
	        if (allowed.indexOf(mode) === -1)
	            throw new Error(`Incorrect mode: ${mode}. Allowed: ${allowed}`);

	        _mode = mode;
	        _betType = _mode=="both" ? _betType : _mode;
	        _self.refresh();
	    };
	    this.setBet = function(v) {
	        v = new BigNumber(v);
	        _$txt.val(v.div(1e18));
	        _refreshBet();
	    }
	    this.freeze = function(bool) {
	        if (bool) {
	            _$e.addClass("disabled");
	            _$e.find("input").attr("disabled", "disabled");
	        } else {
	            _$e.removeClass("disabled");
	            _$e.find("input").removeAttr("disabled");
	        }
	    };

	    this.refresh = util.debounce(10, _refresh);
	    this.onChange = function(fn) {
	        _onChange = fn;
	    }
	    this.getValue = function() {
	        var bet = _getBet();
	        if (!bet || bet.lt(_minBet) || bet.gt(_getMaxAllowedBet())) return null;
	        return bet;
	    }
	    this.getBetType = function() {
	        return _betType;
	    }
	    this.$e = _$e;

	    function _refresh() {
	        _refreshLabel();
	        _refreshScale();
	        _refreshBet();
	    }

	    // Display proper label, select proper radio box
	    function _refreshLabel() {
	        _$both.hide();
	        _$eth.hide();
	        _$credits.hide();
	        if (_mode == "both") {
	            if (_credits.lt(_minBet)) {
	                _betType = "eth";
	                _$eth.show();
	            } else {
	                _$both.show();
	            }
	        } 
	        if (_mode == "eth") _$eth.show();
	        if (_mode == "credits") _$credits.show();
	    }

	    // Set scale of slider based on min/max
	    function _refreshScale() {
	        // Get min/max bet in ether
	        let minBetEther = _minBet.div(1e18);
	        let maxBetEther = _maxBet.div(1e18);       
	        let difference = maxBetEther.minus(minBetEther);
	        if (difference <= .1) _rounding = .001;
	        else _rounding = .01;

	        // set the wager inputs accordingly
	        let minBetRounded = minBetEther.div(_rounding).ceil().mul(_rounding).toNumber();
	        let maxBetRounded = maxBetEther.div(_rounding).floor().mul(_rounding).toNumber();
	        _$slider.attr("min", minBetRounded)
	            .attr("max", maxBetRounded)
	            .attr("step", _rounding);
	        _$txt.attr("min", minBetRounded)
	            .attr("max", maxBetRounded)
	            .attr("step", _rounding);

	        // wagerRange to be positioned correctly relative to bet
	        var bet = _getBet().div(1e18);
	        if (bet !== null){
	            bet = Math.min(maxBetRounded, bet);
	            bet = Math.max(minBetRounded, bet);
	            _$txt.val(bet);
	            _$slider.val(bet);
	        }
	    }

	    // updates the bet txt and range, as well as payouts
	    function _refreshBet() {
	        const bet = _getBet();

	        // Show error if it's not a number.
	        _$err.hide();
	        if (bet === null) _$err.text("Bet must be a number").show();
	        else if (bet.lt(_minBet)) _$err.text(`Bet must be above ${_eth(_minBet)}`).show();
	        else if (bet.gt(_maxBet)) _$err.text(`Bet must be below ${_eth(_maxBet)}`).show();
	        else if (bet.gt(_getMaxAllowedBet())) _$err.text(`You do not have enough credits.`).show();

	        const newBet = _self.getValue();
	        const betChanged = newBet==null || _prevBet==null ? newBet!==_prevBet : !newBet.equals(_prevBet);
	        _prevBet = newBet;
	        if (betChanged) _onChange();
	    }

	    function _getBet() {
	        var bet = _$txt.val();
	        try { bet = (new BigNumber(bet)).mul(1e18); }
	        catch (e) { bet = null; }
	        return bet;
	    }

	    function _getMaxAllowedBet() {
	        return _betType == "credits"
	            ? BigNumber.min(_maxBet, _credits)
	            : _maxBet;
	    }

	    function _eth(v) {
	        return ethUtil.toEthStr(v, 5, "ETH", true);
	    }

	    (function init(){
	        _refresh();
	    }())
	}
	
	window.PennyEtherWebUtil = PennyEtherWebUtil;
}())