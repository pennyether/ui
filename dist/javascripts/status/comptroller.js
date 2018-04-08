Loader.require("comp", "tr")
.then(function(comp, tr){
	ethUtil.getCurrentState().then(() => {
		_refreshAll();	
	});

	function _refreshAll(){
		_refreshContracts();
		_refreshCrowdSale();
		_refreshOutcomes();
		comp.getEvents("Created").then(arr => {
			return arr[0].blockNumber;
		}).then(creationBlockNum => {
			_initEvents(creationBlockNum);
		});
	}

	function _refreshContracts(){
		const $e = $(".status");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var wallet, treasury, token, locker, softCapMet, capitalFundable;
		return Promise.all([
			comp.wallet(),
			comp.treasury(),
			comp.token(),
			comp.locker(),
			comp.wasSoftCapMet(),
			comp.capitalFundable()
		]).then(arr => {
			wallet = arr[0];
			treasury = arr[1];
			token = arr[2];
			locker = arr[3];
			softCapMet = arr[4];
			capitalFundable = arr[5];
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
			const $eWallet = $e.find(".wallet-info");
			util.$getAddrLink("etherscan", wallet).appendTo($eWallet);
			$(`<a href="/about/contracts.html#wallet" target="_blank">info</a>`).appendTo($eWallet);

			const $eTreasury = $e.find(".treasury-info");
			$(`<a href="/status/treasury.html" target="_blank">status</a>`).appendTo($eTreasury);
			util.$getAddrLink("etherscan", treasury).appendTo($eTreasury);
			$(`<a href="/about/contracts.html#treasury" target="_blank">info</a>`).appendTo($eTreasury);

			const $eToken = $e.find(".token-info");
			$(`<a href="/status/token.html" target="_blank">status</a>`).appendTo($eToken);
			util.$getAddrLink("etherscan", token).appendTo($eToken);
			$(`<a href="/about/contracts.html#token" target="_blank">info</a>`).appendTo($eToken);

			const $eLocker = $e.find(".locker-info");
			util.$getAddrLink("etherscan", token).appendTo($eLocker);
			$(`<a href="/about/contracts.html#token-locker" target="_blank">info</a>`).appendTo($eLocker);

			if (!softCapMet) {
				return;
			} else if (capitalFundable.gt(0)) {
				$e.find(".is-funding").show();
				const capitalNeeded = util.toEthStr(capitalFundable.div(2));
				const tokensNeeded = util.toEthStr(capitalFundable, "PENNY");
				$e.find(".capital-needed").text(capitalNeeded);
				$e.find(".tokens-needed").text(tokensNeeded);
			} else {
				$e.find(".is-not-funding").show();
			}
		}
	}

	function _refreshCrowdSale(){
		const $e = $(".crowdsale");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var dateSaleStarted, dateSaleEnded, softCap, hardCap, bonusCap, targetCapital
		return Promise.all([
			comp.dateSaleStarted(),
			comp.dateSaleEnded(),
			comp.softCap(),
			comp.hardCap(),
			comp.bonusCap(),
			comp.targetCapital(),
			comp.totalRaised(),
			comp.wasSaleStarted(),
		]).then(arr => {
			dateSaleStarted = arr[0];
			dateSaleEnded = arr[1];
			softCap = arr[2];
			hardCap = arr[3];
			bonusCap = arr[4];
			targetCapital = arr[5];
			totalRaised = arr[6];
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
			$e.find(".date-sale-started").text(util.toDateStr(dateSaleStarted));
			$e.find(".date-sale-ended").text(util.toDateStr(dateSaleEnded));
			$e.find(".soft-cap").text(util.toEthStr(softCap));
			$e.find(".hard-cap").text(util.toEthStr(hardCap));
			$e.find(".bonus-cap").text(util.toEthStr(bonusCap));
			$e.find(".target-capital").text(util.toEthStr(targetCapital));

			if (dateSaleStarted.equals(0)) {
				$e.find(".not-configured").show();
				return;
			}
			Promise.all([
				comp.totalRaised(),
				comp.wasSaleStarted(),
				comp.wasSaleEnded()
			]).then(arr => {
				if (!arr[1]) {
					$e.find(".not-started").show();
					const curTime = ethUtil.getCurrentBlockTime();
					const timeLeft = util.toTime(dateSaleStarted.minus(curTime));
					$e.find(".timeleft").text(timeLeft);
				} else if (!arr[2]) {
					$e.find(".pending").show();
					$e.find(".raised").text(util.toEthStr(arr[0]));
				} else {
					$e.find(".completed").show();
					$e.find(".raised").text(util.toEthStr(arr[0]));
				}
			});
		}
	}

	function _refreshOutcomes(){
		const $e = $(".outcomes");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		var softCap, hardCap, bonusCap, targetCapital;
		return Promise.all([
			comp.softCap(),
			comp.hardCap(),
			comp.bonusCap(),
			comp.targetCapital()
		]).then(arr => {
			softCap = arr[0];
			hardCap = arr[1];
			bonusCap = arr[2];
			capital = arr[3];
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

		}
	}

	function _initEvents(creationBlockNum){
		const formatters = {
			// BuyTokens, BurnTokens
			account: (val) => util.$getShortAddrLink(val),
			tokenHolder: (val) => util.$getShortAddrLink(val),
			// BuyTokens, UserRefunded
			refund: (val) => util.toEthStr(val),
			funded: (val) => util.toEthStr(val),
			// BuyTokensSuccess, BurnTokens
			numTokens: (val) => util.toEthStr(val, "PENNY")
		};
		
		// Create "events" array
		const events = [{
			instance: comp,
			name: "Created",
			formatters: {
				wallet: addr => Loader.linkOf(addr),
				treasury: addr => Loader.linkOf(addr),
				token: addr => Loader.linkOf(addr),
				locker: addr => Loader.linkOf(addr)
			}
		}];
		// define legends, build events from this.
		const labels = {
			"CrowdSale": [true, ["SaleInitalized", "SaleStarted", "SaleSuccessful", "SaleFailed"]],
			"Tokens Bought": [false, ["BuyTokensSuccess", "BuyTokensFailure", "UserRefunded"]],
			"Tokens Burnt": [false, ["BurnTokensSuccess", "BurnTokensFailure"]],
		}
		Object.keys(labels).forEach(groupName => {
			const selected = labels[groupName][0];
			const eventNames = labels[groupName][1];
			eventNames.forEach(eventName => {
				events.push({
					instance: comp,
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
		$(".events .log-viewer").empty().append($lv);
	}
});

