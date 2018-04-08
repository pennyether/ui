Loader.require("reg", "comp", "tr", "token")
.then(function(reg, comp, tr, token){
	_initGovernance();
	_initProfits();

	ethUtil.getCurrentState().then(() => {
		_refreshAll();	
	});

	function _refreshAll() {
		return Promise.all([
			_refreshReserve(),
			_refreshCapitalAllocation(),
			_refreshFundingStatus(),
			_refreshGovernance(),
			_refreshProfits(),
			_refreshTotalProfits(),
		]).then(()=>{
			tr.getEvents("Created").then(arr => {
				return arr[0].blockNumber;
			}).then(creationBlockNum => {
				_initTotalProfits(creationBlockNum);
				_initEvents(creationBlockNum);
			});
		});
	}

	function _refreshReserve() {
		const $e = $(".reserve");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var reserve;
		var totalSupply;
		return Promise.all([
			tr.reserve(),
			token.totalSupply()
		]).then(arr => {
			reserve = arr[0];
			totalSupply = arr[1];
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
			const $bar = $e.find(".bar").hide();
			const $barAmt = $e.find(".amt");
			const $barTxt = $e.find(".txt");
			const $na = $e.find(".not-applicable").hide();
			const $met = $e.find(".met").hide();
			const $unmet = $e.find(".unmet").hide();
			const $totalSupply = $e.find(".total-supply");

			if (totalSupply.lte(1)) {
				$na.show();
				return;
			}

			const expReserve = totalSupply.div(2).floor();
			const pct = reserve.div(expReserve);
			$bar.show();
			$barAmt.width(`${pct.toFixed()}%`);
			$totalSupply.text(util.toEthStr(totalSupply));
			if (reserve.gte(expReserve)) {
				$met.show();
			} else {
				$unmet.show();
			}
		}
	}

	function _refreshCapitalAllocation() {
		const $e = $(".allocation");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var balances = [];  // array of: {addr, allocated, recallable}
		var capAvailable;
		var capAllocated = new BigNumber(0);
		var capRecallable = new BigNumber(0);
		return Promise.all([
			tr.capital(),
			tr.capitalLedger()
		]).then(arr => {
			capAvailable = arr[0];
			return Ledger.at(arr[1]).balances();
		}).then(arr => {
			const addresses = arr[0];
			const amounts = arr[1];
			addresses.forEach((addr, i)=>{
				balances.push({addr: addr, allocated: amounts[i]});
				capAllocated = capAllocated.plus(amounts[i]);
			});
			return Promise.all(
				addresses.map(addr => Bankrollable.at(addr).bankrollAvailable())
			);
		}).then(recallable => {
			recallable.forEach((amt, i) => {
				balances[i].recallable = BigNumber.min(amt, balances[i].allocated);
				capRecallable = capRecallable.plus(amt);
			});
			doRefresh();
		}).then(() => {
			$loading.hide();
			$doneLoading.show();
		}, e => {
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
			throw e;
		});

		function doRefresh() {
			const $capAvailable = $e.find(".cap-available");
			const $capAllocated = $e.find(".cap-allocated");
			const $capRecallable = $e.find(".cap-recallable");
			const $capTotal = $e.find(".cap-total");
			const $tbody = $e.find(".table tbody");

			$capAvailable.text(util.toEthStr(capAvailable, ""));
			$capAllocated.text(util.toEthStr(capAllocated, ""));
			$capRecallable.text(util.toEthStr(capRecallable, ""));
			$capTotal.text(util.toEthStr(capAvailable.plus(capRecallable), ""));

			balances.forEach(obj=>{
				const name = Loader.linkOf(obj.addr);
				const allocated = util.toEthStr(obj.allocated);
				const recallable = util.toEthStr(obj.recallable);
				$tbody.append(`<tr><td>${name}</td><td>${allocated}</td><td>${recallable}</td></tr>`);
			})
		}
	}

	function _refreshFundingStatus() {
		const $e = $(".funding-status");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var capitalRaised;
		var capitalTarget;
		return Promise.all([
			tr.capitalRaised(),
			tr.capitalRaisedTarget()
		]).then(arr => {
			capitalRaised = arr[0];
			capitalTarget = arr[1];
			doRefresh();
		}).then(() => {
			$loading.hide();
			$doneLoading.show();
		}, e => {
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh() {
			const $targetTxt = $e.find(".target .txt");
			const $targetAmt = $e.find(".target .amt");
			const $raisedTxt = $e.find(".raised .txt");
			const $raisedAmt = $e.find(".raised .amt");
			const $met = $e.find(".met").hide();
			const $notmet = $e.find(".not-met").hide();

			$targetTxt.text(util.toEthStr(capitalTarget));
			$raisedTxt.text(util.toEthStr(capitalRaised));
			var max = BigNumber.max(capitalTarget, capitalRaised);
			if (max.equals(0)) {
				$targetAmt.width(0);
				$raisedAmt.width(0);
			} else {
				const targetPct = capitalTarget.div(max).mul(100).toFixed(2);
				const raisedPct = capitalRaised.div(max).mul(100).toFixed(2);
				$targetAmt.width(`${targetPct}%`);
				$raisedAmt.width(`${raisedPct}%`);
			}

			if (capitalTarget.gt(capitalRaised)) {
				$unmet.show();
			} else {
				$met.show();
			}
		}
	}

	function _initGovernance() {
		$(".cell.governance select").change(_refreshGovernance);
	}
	function _refreshGovernance() {
		const $e = $(".governance");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		const state = $e.find("select").val().toLowerCase();
		const getNumFn = () => {
			if (state=="all") return tr.curRequestId();
			if (state=="pending") return tr.numPendingRequests();
			if (state=="executed") return tr.numCompletedRequests();
			if (state=="cancelled") return tr.numCancelledRequests();
			throw new Error(`Unknown request state: ${state}`);
		};
		const getRequestFn = (index) => {
			if (state=="all") return tr.getRequest([index+1]);
			if (state=="pending") return tr.pendingRequestIds([index]).then((id)=>tr.getRequest([id]))
			if (state=="executed") return tr.completedRequestIds([index]).then((id)=>tr.getRequest([id]))
			if (state=="cancelled") return tr.cancelledRequestIds([index]).then((id)=>tr.getRequest([id]))
			throw new Error(`Unknown request state: ${state}`);
		};

		var requests = [];
		return getNumFn().then(num => {
			const end = num - 1;
			const start = Math.max(end - 5, 0);
			const pArr = [];
			for (var i=end; i>=start; i--) {
				pArr.push(getRequestFn(i));
			}
			return Promise.all(pArr);
		}).then(pArr => {
			requests = pArr.map(arr => {
				return {
					id: arr[0], typeId: arr[1], target: arr[2], value: arr[3],
					executedSuccessfully: arr[4],
					dateCreated: arr[5], dateCancelled: arr[6], dateExecuted: arr[7],
					createdMsg: arr[8], cancelledMsg: arr[9], executedMsg: arr[10]
				};
			});
			doRefresh();
		}).then(()=>{
			$loading.hide();
			$doneLoading.show();
		}).catch(e => {
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh() {
			const $template = $e.find(".request.template");
			const $ctnr = $e.find(".requests").empty();

			if (requests.length == 0) {
				$ctnr.text(`There are no ${state} Requests.`);
				return;
			}
			requests.forEach(r => {
				const $e = $template.clone().removeClass("template").show().appendTo($ctnr);
				const type = ({0: "SendCapital", 1: "RecallCapital", 2: "RaiseCapitalTarget"})[r.typeId];
				const status = r.dateExecuted.gt(0)
					? "Executed"
					: r.dateCancelled.gt(0) ? "Cancelled" : "Pending";
				const target = Loader.linkOf(r.target);
				
				$e.find(".type").text(type);
				if (type == "SendCapital"){
					$e.find(".to-from").text("to");
					$e.find(".eth").text(util.toEthStr(r.value));
				} else if (type == "RecallCapital") {
					$e.find(".to-from").text("from");
					$e.find(".eth").text(util.toEthStr(r.value));
				} else {
					$e.find(".to-from").hide();
					$e.find(".target").hide();
					$e.find(".eth").text(util.toEthStr(r.value));
				}
				$e.find(".target").text(target);
				$e.find(".description").text(r.createdMsg);
				$e.find(".status").text(status);
				$e.find(".id").text(r.id);
				$e.find(".date-created").text(util.toDateStr(r.dateCreated));
				$e.find(".executed").hide();
				$e.find(".cancelled").hide();
				if (status == "Executed") {
					$e.find(".executed").show();
					$e.find(".date-executed").text(util.toDateStr(r.dateExecuted));
					$e.find(".result").text(r.executedSuccessfully ? "(successfully)" : "(with failure)");
				} else if (status == "Cancelled") {
					$e.find(".cancelled").show();
					$e.find(".date-cancelled").text(util.toDateStr(r.dateCancelled));
					$e.find(".result").text(`Reason: ${r.cancelledMsg}`);
				}
			});
		}
	}

	function _initProfits() {
		const $select = $(".cell.profits select").change(_refreshProfits);
	}
	function _refreshProfits() {
		function getTargetBlock(numDays) {
			numDays = Number(numDays);
			const DAY_TO_S = 60*60*24;
			const curTime = ethUtil.getCurrentBlockTime();
			return ethUtil.getBlockNumberAtTimestamp(curTime - numDays*DAY_TO_S, DAY_TO_S);
		};

		const $e = $(".profits");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		const lookbackDays = $e.find("select").val();
		const curBlock = ethUtil.getCurrentBlockHeight().toNumber();
		const targetBlock = lookbackDays == "all"
			? Promise.resolve(curBlock)
			: getTargetBlock(lookbackDays)

		const bankrollables = Loader.getBankrollables();
		const profits = [];	// array of {addr, profits}
		return targetBlock.then((targetBlock)=>{
			return Promise.all(
				// Get current and previous value of `uint profitsSent`.
				// This should be slot #1 for all Bankrollable contracts.
				bankrollables.map(addr => {
					const cur = Bankrollable.at(addr).profitsSent();
					const prev = targetBlock==curBlock
						? 0
						: _niceWeb3.ethUtil.getStorageAt(addr, 1, targetBlock);
					return Promise.all([cur, prev]);
				})
			);
		}).then(arr => {
			arr.forEach((data, i) => {
				const profitsSent = data[0].minus(data[1]);
				profits.push({address: bankrollables[i], profitsSent: profitsSent});
			});
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
			const $tbody = $e.find(".table tbody").empty();
			profits.forEach(obj => {
				const name = Loader.linkOf(obj.address);
				const val = util.toEthStr(obj.profitsSent);
				const runrate = 
				$tbody.append(`<tr><td>${name}</td><td>${val}</td></tr>`);
			});
		}
	}

	
	function _initTotalProfits(creationBlockNum) {
		Promise.all([
			_niceWeb3.ethUtil.getAverageBlockTime(),
			ethUtil.getBlock(creationBlockNum),
		]).then(arr => {
			const avgBlocktime = arr[0].toNumber();
			const minBlock = arr[1];
			const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

			const $e = $(".total-profits");
			const graph = new EthGraph(_niceWeb3);
			$e.find(".graph-ctnr").append(graph.$e);

			const profits = (block) => {
				block = Math.round(block);
				return _niceWeb3.ethUtil
					.getStorageAt(tr.address, 16, block)
					.then(gwei => {
						if (gwei == "0x") return null;
						return new BigNumber(gwei);
					});
			};
			const dividends = (block) => {
				block = Math.round(block);
				return _niceWeb3.ethUtil
					.getStorageAt(tr.address, 15, block)
					.then(gwei => {
						if (gwei == "0x") return null;
						return new BigNumber(gwei);
					});
			};
			const getFormattedTitle = (low, high) => {
				return Promise.all([
					_niceWeb3.ethUtil.getBlock(Math.round(low)),
					_niceWeb3.ethUtil.getBlock(Math.round(high)),
				]).then(arr => {
					const lowBlock = arr[0];
					const highBlock = arr[1];
					const diff = highBlock.timestamp - lowBlock.timestamp;
					const lowDateStr = util.toDateStr(lowBlock.timestamp, {scale: diff});
					const highDateStr = util.toDateStr(highBlock.timestamp, {scale: diff});
					const timeStr = util.toTime(diff);
					return `<b>${lowDateStr}</b> to <b>${highDateStr}</b> (${timeStr})`;
				});
			};
			const xTicks = (function(){
				return [minBlock, maxBlock].map(b => {
					return {
						x: b.number,
						label: util.toDateStr(b.timestamp, {second: null})
					};
				});
			}());

			graph.init({
				sequences: [{
					name: "profits",
					valFn: profits,
					showInPreview: true,
					maxPoints: 20,
					color: "blue",
					yScaleHeader: "Profits",
					yTickCount: 3,
					yFormatFn: util.toEthStr,
				},{
					name: "dividends",
					valFn: dividends,
					showInPreview: true,
					maxPoints: 20,
					color: "navy",
					yScaleHeader: "Dividends",
					yTickCount: 3,
					yFormatFn: util.toEthStr,
				}],
				min: minBlock.number,
				max: maxBlock.number,
				previewXTicks: xTicks,
				previewNumPoints: 20,
				previewFormatFn: (low, high) => {
					const num = Math.round(high-low).toLocaleString();
					const timeStr = util.toTime(Math.round((high-low) * avgBlocktime));
					return `${num} blocks. (~${timeStr})`;
				},
				titleFormatFn: getFormattedTitle,
			});

			const dayInBlocks = 60*60*24 / avgBlocktime;
			graph.setView(maxBlock.number - dayInBlocks, maxBlock.number);
		});
	}
	function _refreshTotalProfits() {
		const $e = $(".total-profits");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var profits, dividends;
		return Promise.all([
			tr.profitsTotal(),
			tr.profitsSent()
		]).then(arr => {
			profits = arr[0];
			dividends = arr[1];
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
			const $profits = $e.find(".profits");
			const $divs = $e.find(".dividends");
			$profits.text(util.toEthStr(profits, ""));
			$divs.text(util.toEthStr(dividends, ""));
		}
	}

	function _initEvents(creationBlockNum) {
		const formatters = {
			// ExecuteCapitalAdded / Removed
			bankrollable: (val) => Loader.linkOf(val),
			// CapitalAdded/Removed, ProfitsReceived, 
			sender: (val) => Loader.linkOf(val),
			recipient: (val) => Loader.linkOf(val),
			// DistributeSuccess/Failure
			token: (val) => Loader.linkOf(val),
			// All
			amount: (val) => util.toEthStr(val)
		};

		// Create "events" array
		const events = [{
			instance: tr,
			name: "Created"
		}];
		// append to events using labels
		const labels = {
			"Capital": [true, ["CapitalAdded", "CapitalRemoved", "CapitalRaised"]],
			"Reserve": [true, ["ReserveAdded", "ReserveRemoved"]],
			"Profits": [true, ["ProfitsReceived"]],
			"Dividends": [true, ["DistributeSuccess", "DistributeFailure"]],
			"Governance": [false, ["ExecutedSendCapital", "ExecutedRecallCapital", "ExecutedRaiseCapital"]]
		}
		Object.keys(labels).forEach(groupName => {
			const selected = labels[groupName][0];
			const eventNames = labels[groupName][1];
			eventNames.forEach(eventName => {
				events.push({
					instance: tr,
					name: eventName,
					formatters: formatters,
					label: groupName,
					selected: selected
				})
			})
		});

		// create log viewer
		var $lv = util.$getLogViewer({
			events: events,
			order: "newest",
			minBlock: creationBlockNum
		});
		$(".events .events-ctnr").empty().append($lv);
	}
});

