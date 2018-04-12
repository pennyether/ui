Loader.require("token")
.then(function(token){
	ethUtil.getCurrentState().then(() => {
		_refreshAll();
	});

	function _refreshAll(){
		Promise.all([
			_refreshStatus(),
			_refreshDividends(),
			_refreshSupply()
		]).then(()=>{
			token.getEvents("Created").then(arr => {
				return arr[0].blockNumber;
			}).then(creationBlockNum => {
				_initEventLog(creationBlockNum);
				Promise.all([
					ethUtil.getBlock(creationBlockNum),
					_niceWeb3.ethUtil.getAverageBlockTime(),
				]).then(arr => {
					_initDividends(arr[0], arr[1]);
					_initSupply(arr[0], arr[1]);
				});
			});
		});
		// _refreshCrowdSale();
		// _refreshOutcomes();
		// _refreshCapitalFunding();
		// comp.getEvents("Created").then(arr => {
		// 	return arr[0].blockNumber;
		// }).then(creationBlockNum => {
		// 	_initEventLog(creationBlockNum);
		// });
	}

	function _refreshStatus(){
		const $e = $(".cell.status");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		// comptro
		return Promise.obj({
			comptroller: token.comptroller(),
			isFrozen: token.isFrozen(),
			supply: token.totalSupply(),
			burned: token.totalBurned(),
		}).then(doRefresh).then(()=>{
			$loading.hide();
			$doneLoading.show();
		},e => {
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh(obj) {
			$e.find(".total-supply").text(util.toEthStrFixed(obj.supply, 4, ""));
			$e.find(".total-burned").text(util.toEthStrFixed(obj.burned, 4, ""));

			const $eComptroller = $e.find(".comptroller-info");
			$(`<a href="/status/comptroller.html" target="_blank">status</a>`).appendTo($eComptroller);
			util.$getAddrLink("etherscan", obj.comptroller).appendTo($eComptroller.append(" "));
			$(`<a href="/about/contracts.html#comptroller" target="_blank">info</a>`).appendTo($eComptroller.append(" "));

			$e.find(".is-frozen").text(obj.isFrozen);
		}
	}

	function _initDividends(creationBlock, avgBlocktime) {
		const minBlock = creationBlock;
		const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

		const $e = $(".cell.dividends");
		const graph = new EthGraph();
		$e.find(".graph-ctnr").append(graph.$e);

		const getTotalDividends = (block) => {
			return token.dividendsTotal([], {defaultBlock: Math.round(block)});
		};
		const getTotalCollected = (block) => {
			return token.dividendsCollected([], {defaultBlock: Math.round(block)});
		};
		graph.init({
			sequences: [{
				name: "totalDividends",
				valFn: getTotalDividends,
				showInPreview: true,
				maxPoints: 20,
				color: "green",
				yScaleHeader: "Total Dividends",
				yTickCount: 3,
				yFormatFn: util.toEthStr,
			},{
				name: "totalCollected",
				valFn: getTotalCollected,
				showInPreview: true,
				maxPoints: 20,
				color: "navy",
				yScaleHeader: "Total Collected",
				yTickCount: 3,
				yFormatFn: util.toEthStr,
			}],
			min: minBlock.number,
			max: maxBlock.number,
			previewXTicks: graph.createPreviewXTicks(minBlock, maxBlock, util),
			previewNumPoints: 20,
			previewFormatFn: graph.createPreviewFormatFn(util, avgBlocktime),
			titleFormatFn: graph.createTitleFormatter(_niceWeb3.ethUtil, util),
		});

		const dayInBlocks = 60*60*24 / avgBlocktime;
		graph.setView(maxBlock.number - dayInBlocks, maxBlock.number);
	}
	function _refreshDividends() {
		const $e = $(".cell.dividends");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		return Promise.obj({
			total: token.dividendsTotal(),
			collected: token.dividendsCollected()
		}).then(doRefresh).then(()=>{
			$loading.hide();
			$doneLoading.show();
		}, e=>{
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh(obj) {
			$e.find(".total-dividends").text(util.toEthStrFixed(obj.total, 3, ""));
			$e.find(".total-collected").text(util.toEthStrFixed(obj.collected, 3, ""));
			$e.find(".total-uncollected").text(util.toEthStrFixed(obj.total.minus(obj.collected), 3, ""));
		}
	}

	function _initSupply(creationBlock, avgBlocktime) {
		const minBlock = creationBlock;
		const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

		const $e = $(".cell.supply");
		const graph = new EthGraph();
		$e.find(".graph-ctnr").append(graph.$e);

		const getTotalSupply = (block) => {
			return token.totalSupply([], {defaultBlock: Math.round(block)});
		};
		const getTotalBurned = (block) => {
			return token.totalBurned([], {defaultBlock: Math.round(block)});
		};
		graph.init({
			sequences: [{
				name: "totalSupply",
				valFn: getTotalSupply,
				showInPreview: true,
				maxPoints: 20,
				color: "blue",
				yScaleHeader: "TotalSupply",
				yTickCount: 3,
				yFormatFn: (y) => util.toEthStr(y, "PENNY"),
			},{
				name: "dividends",
				valFn: getTotalBurned,
				showInPreview: true,
				maxPoints: 20,
				color: "red",
				yScaleHeader: "TotalBurned",
				yTickCount: 3,
				yFormatFn: (y) => util.toEthStr(y, "PENNY"),
			}],
			min: minBlock.number,
			max: maxBlock.number,
			previewXTicks: graph.createPreviewXTicks(minBlock, maxBlock, util),
			previewNumPoints: 20,
			previewFormatFn: graph.createPreviewFormatFn(util, avgBlocktime),
			titleFormatFn: graph.createTitleFormatter(_niceWeb3.ethUtil, util),
		});

		const dayInBlocks = 60*60*24 / avgBlocktime;
		graph.setView(maxBlock.number - dayInBlocks, maxBlock.number);
	}
	function _refreshSupply() {
		const $e = $(".cell.supply");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		return Promise.obj({
			supply: token.totalSupply(),
			burned: token.totalBurned()
		}).then(doRefresh).then(()=>{
			$loading.hide();
			$doneLoading.show();
		}, e=>{
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh(obj) {
			$e.find(".total-supply").text(util.toEthStrFixed(obj.supply, 4, ""));
			$e.find(".total-burned").text(util.toEthStrFixed(obj.burned, 4, ""));
		}
	}

	function _initEventLog(creationBlockNum) {
		// event Transfer(address indexed from, address indexed to, uint amount);
		// event TokensMinted(uint time, address indexed account, uint amount, uint newTotalSupply);
		// event TokensBurned(uint time, address indexed account, uint amount, uint newTotalSupply);
		// event CollectedDividends(uint time, address indexed account, uint amount);
		// event DividendReceived(uint time, address indexed sender, uint amount);
		const formatters = {
			from: (val) => util.$getShortAddrLink(val),
			to: (val) => util.$getShortAddrLink(val),
			account: (val) => util.$getShortAddrLink(val),
			sender: (val) => util.$getShortAddrLink(val),
			amount: (val) => util.toEthStr(val),
			newTotalSupply: (val) => util.toEthStr(val, "PENNY"),
		};
		
		// Create "events" array
		const events = [{
			instance: token,
			name: "Created"
		}];
		// define legends, build events from this.
		const labels = {
			"Dividend Received": [true, ["DividendReceived"]],
			"Dividend Collected": [false, ["CollectedDividends"]],
			"Minted": [false, ["TokensMinted"]],
			"Burned": [false, ["TokensBurned"]],
			"Transferred": [false, ["Transfer"]],
		}
		Object.keys(labels).forEach(groupName => {
			const selected = labels[groupName][0];
			const eventNames = labels[groupName][1];
			eventNames.forEach(eventName => {
				events.push({
					instance: token,
					name: eventName,
					formatters: formatters,
					label: groupName,
					selected: selected
				});
			})
		});

		// create log viewer
		var $lv = util.$getLogViewer({
			events: events,
			order: "newest",
			minBlock: creationBlockNum
		});
		$(".cell.events .log-viewer").empty().append($lv);
	}
	
});

