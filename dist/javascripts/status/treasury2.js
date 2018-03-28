Loader.require("reg", "comp", "tr")
.then(function(reg, comp, tr){
	ethUtil.getCurrentState().then(_refreshAll);

	_initGovernance();

	function _refreshAll() {
		_refreshReserve();
		_refreshCapitalAllocation();
		_refreshFundingStatus();
		_refreshGovernance();
	}

	function _refreshReserve() {
		const $e = $(".reserve");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var reserve;
		var token;
		var totalSupply;
		Promise.all([
			tr.token(),
			tr.reserve()
		]).then(arr => {
			token = DividendToken.at(arr[0]);
			reserve = arr[1];
			return token.totalSupply();
		}).then(ts => {
			totalSupply = ts;
			doRefresh();
		}).then(()=>{
			$loading.hide();
			$doneLoading.show();
		},e => {
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});


		const $bar = $e.find(".bar").hide();
		const $barAmt = $e.find(".amt");
		const $barTxt = $e.find(".txt");
		const $na = $e.find(".not-applicable").hide();
		const $met = $e.find(".met").hide();
		const $unmet = $e.find(".unmet").hide();
		const $totalSupply = $e.find(".total-supply");
		function doRefresh() {
			if (totalSupply.lte(1)) {
				$na.show();
				return;
			}

			const expReserve = totalSupply.div(2).floor();
			const pct = reserve.div(expReserve);
			$bar.show();
			$barAmt.width(`${pct.toFixed()}%`);
			$totalSupply.text(ethUtil.toEthStr(totalSupply));
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
		Promise.all([
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

		const $capAvailable = $e.find(".cap-available");
		const $capAllocated = $e.find(".cap-allocated");
		const $capRecallable = $e.find(".cap-recallable");
		const $capTotal = $e.find(".cap-total");
		const $tbody = $e.find(".table tbody");
		function doRefresh() {
			const format = (v)=>ethUtil.toEthStr(v, 2, "", true);
			$capAvailable.text(format(capAvailable));
			$capAllocated.text(format(capAllocated));
			$capRecallable.text(format(capRecallable));
			$capTotal.text(format(capAvailable.plus(capRecallable)));

			balances.forEach(obj=>{
				const name = Loader.linkOf(obj.addr);
				const allocated = _toEthStr(obj.allocated);
				const recallable = _toEthStr(obj.recallable);
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
		Promise.all([
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

		const $targetTxt = $e.find(".target .txt");
		const $targetAmt = $e.find(".target .amt");
		const $raisedTxt = $e.find(".raised .txt");
		const $raisedAmt = $e.find(".raised .amt");
		const $met = $e.find(".met").hide();
		const $notmet = $e.find(".not-met").hide();
		function doRefresh() {
			$targetTxt.text(ethUtil.toEthStr(capitalTarget));
			$raisedTxt.text(ethUtil.toEthStr(capitalRaised));
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
		const $e = $(".governance");
		const $select = $e.find("select").change(function(){
			_refreshGovernance();
		});
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
		getNumFn().then(num => {
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

		const $template = $e.find(".request.template");
		const $ctnr = $e.find(".requests").empty();
		function doRefresh() {
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
					$e.find(".eth").text(_toEthStr(r.value));
				} else if (type == "RecallCapital") {
					$e.find(".to-from").text("from");
					$e.find(".eth").text(_toEthStr(r.value));
				} else {
					$e.find(".to-from").hide();
					$e.find(".target").hide();
					$e.find(".eth").text(_toEthStr(r.value));
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

	function _refreshXyz() {
		const $e = $(".funding-status");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		Promise.all([
		]).then(arr => {

		}).then(()=>{
			$loading.hide();
			$doneLoading.show();
		}, e=>{
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});
	}

	function _toEthStr(amt) {
		return ethUtil.toEthStr(amt, 2, "Eth", true);
	}
});