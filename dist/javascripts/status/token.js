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
		var comptroller, isFrozen;
		return Promise.all([
			token.comptroller(),
			token.isFrozen()
		]).then(arr => {
			comptroller = arr[0];
			isFrozen = arr[1];
			totalSupply = arr[2];
			totalBurned = arr[3];
			doRefresh();
		}).then(()=>{
			$loading.hide();
			$doneLoading.show();
		},e => {
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh() {
			const $eComptroller = $e.find(".comptroller-info");
			$(`<a href="/status/comptroller.html" target="_blank">status</a>`).appendTo($eComptroller);
			util.$getAddrLink("etherscan", comptroller).appendTo($eComptroller.append(" "));
			$(`<a href="/about/contracts.html#comptroller" target="_blank">info</a>`).appendTo($eComptroller.append(" "));

			$e.find(".is-frozen").text(isFrozen);
		}
	}

	function _initDividends(creationBlock, avgBlocktime) {
		const minBlock = creationBlock;
		const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

		const $e = $(".cell.dividends");
		const graph = new EthGraph();
		$e.find(".graph-ctnr").append(graph.$e);

		const getTotalDividends = (block) => {
			block = Math.round(block);
			return _niceWeb3.ethUtil
				.getStorageAt(token.address, 7, block)
				.then(gwei => {
					if (gwei == "0x") return null;
					return new BigNumber(gwei);
				});
		};
		const getTotalCollected = (block) => {
			block = Math.round(block);
			return _niceWeb3.ethUtil
				.getStorageAt(token.address, 8, block)
				.then(gwei => {
					if (gwei == "0x") return null;
					return new BigNumber(gwei);
				});
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

		var totalDividends, collectedDividends;
		return Promise.all([
			token.totalDividends(),
			token.collectedDividends()
		]).then(arr => {
			totalDividends = arr[0];
			collectedDividends = arr[1];
			doRefresh();
		}).then(()=>{
			$loading.hide();
			$doneLoading.show();
		}, e=>{
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh() {
			$e.find(".total-dividends").text(util.toEthStrFixed(totalDividends, 3, ""));
			$e.find(".total-collected").text(util.toEthStrFixed(collectedDividends, 3, ""));
			$e.find(".total-uncollected").text(util.toEthStrFixed(totalDividends.minus(collectedDividends), 3, ""));
		}
	}

	function _initSupply(creationBlock, avgBlocktime) {
		const minBlock = creationBlock;
		const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

		const $e = $(".cell.supply");
		const graph = new EthGraph();
		$e.find(".graph-ctnr").append(graph.$e);

		const getTotalSupply = (block) => {
			block = Math.round(block);
			return _niceWeb3.ethUtil
				.getStorageAt(token.address, 3, block)
				.then(gwei => {
					if (gwei == "0x") return null;
					return new BigNumber(gwei);
				});
		};
		const getTotalBurned = (block) => {
			block = Math.round(block);
			return _niceWeb3.ethUtil
				.getStorageAt(token.address, 10, block)
				.then(gwei => {
					if (gwei == "0x") return null;
					return new BigNumber(gwei);
				});
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

		var totalSupply, totalBurned;
		return Promise.all([
			token.totalSupply(),
			token.totalBurned()
		]).then(arr => {
			totalSupply = arr[0];
			totalBurned = arr[1];
			doRefresh();
		}).then(()=>{
			$loading.hide();
			$doneLoading.show();
		}, e=>{
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh() {
			$e.find(".total-supply").text(util.toEthStrFixed(totalSupply, 4, ""));
			$e.find(".total-burned").text(util.toEthStrFixed(totalBurned, 4, ""));
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

