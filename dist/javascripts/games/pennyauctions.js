Loader.require("pac")
.then(function(pac){
	$("#Title").addClass("loaded");
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshAllAuctions();
	});

	const _GAS_PRICE_SLIDER = util.getGasPriceSlider(20);
	const _activeAuctions = {};
	const _endedAuctions = {};
	const _$activeAuctions = $(".activeAuctions .auctions").empty();
	const _$endedAuctions = $(".endedAuctions .auctions").empty();

	// returns all Auction objects
	function getAllAuctions() {
		return Object
			.values(_activeAuctions)
			.concat(Object.values(_endedAuctions));
	}

	// get active auction contracts.
	function getActiveAuctionContracts() {
		return pac.numDefinedAuctions().then(num=>{
			const auctions = [];
			for (var i=0; i<num; i++){
				auctions.push(pac.getAuction([i]));
			}
			return Promise.all(auctions);
		}).then(addrs=>{
			return addrs
				.filter(addr => addr != ethUtil.NO_ADDRESS)
				.map(addr => PennyAuction.at(addr));
		});
	}

	// get up to 10 last ended auction contracts
	// todo: if optimization is needed, we can update 
	// this only when numEndedAuctions has changed.
	function getEndedAuctionContracts() {
		return pac.numEndedAuctions().then(len=>{
			const max = Math.min(len, 10);
			const auctions = [];
			for (var i=1; i<=max; i++){
				auctions.push(pac.endedAuctions([len-i]));
			}
			return Promise.all(auctions);
		}).then(addrs=>{
			return addrs
				.filter(addr => addr != ethUtil.NO_ADDRESS)
				.map(addr => PennyAuction.at(addr));
		});	
	}

	// add each cAuction to aMap, delete any aMap auction not present.
	function getOrCreateAuctions(aMap, cAuctions, $e) {
		// remove any auctions in array that are not in cAuctions
		Object.keys(aMap).forEach(addr => {
			if (!cAuctions.some(c=>c.address)){
				aMap[addr].$e.remove();
				delete aMap[addr];
			}
		});
		if (cAuctions.length == 0) {
			$e.parent().find(".none").show();
		} else {
			$e.parent().find(".none").hide();
		}

		// for each cAuction, getOrCreate it.
		return cAuctions.map((c)=>{
			if (aMap[c.address]) return aMap[c.address];
			const auction = new Auction(c);
			auction.$e.appendTo($e);
			aMap[c.address] = auction;
			return auction;
		});
	}

	function refreshAllAuctions(){
		$("body").addClass("refreshing");
		var blocktime;
		Promise.resolve().then(()=>{
			// first refresh all active auctions.
			return getActiveAuctionContracts().then(arr => {
				return getOrCreateAuctions(_activeAuctions, arr, _$activeAuctions)
					.map(a=> a.refresh());
			});
		}).then(()=>{
			// next update the blocktime on active auctions
			return ethUtil.getAverageBlockTime().then(b=>{
				blocktime = b;
				Object.values(_activeAuctions)
					.forEach(a=>a.setBlocktime(blocktime));
			});
		}).then(()=>{
			// lastly, refresh all ended auctions.
			return getEndedAuctionContracts().then(arr => {
				return getOrCreateAuctions(_endedAuctions, arr, _$endedAuctions)
					.map(a => {
						a.setBlocktime(blocktime);
						return a.refresh();
					});
			});
		}).then(()=>{
			$("body").removeClass("refreshing");
		});
	}

	(function refreshTimes(){
		getAllAuctions().forEach(a=>a.updateTimeLeft());
		setTimeout(refreshTimes, 1000);
	}());

	function Auction(auction) {
		const _self = this;
		const _$e = $(".auction.template")
			.clone()
			.show()
			.removeClass("template")
			.attr("id", auction.address)
		const _auction = auction;
		const _lsKey = `${_auction.address}-alerts`;
		var _initialized;
		var _isEnded;
		var _isPaid;
		var _paymentEvent;

		var _blocktime = new BigNumber(15);
		var _bidPrice;
		var _bidIncr;
		var _bidAddBlocks;
		var _estTimeLeft;
		var _estTimeLeftAt;
		var _curBlocksLeft = null;
		var _curAmWinner = null;
		var _curPrize = null;
		var _curCurrentWinner = null;
		var _curBlockEnded = null;
		var _alerts = {};

		// initialize dom elements
		const _$status = _$e.find(".status");
		const _$txStatus = _$e.find(".txStatus");
		const _$statusCell = _$e.find(".statusCell");
		const _$currentWinnerCell = _$e.find(".currentWinnerCell");
		const _$bottomCell = _$e.find(".bottomCell");
		const _$prize = _$e.find(".prize .value");
		const _$blocksLeftCtnr = _$e.find(".blocksLeftCtnr");
		const _$blocksLeft = _$e.find(".blocksLeft");
		const _$timeLeft = _$e.find(".timeLeft");
		const _$bidPrice = _$e.find(".bidPrice");
		const _$currentWinner = _$e.find(".currentWinner .value");
		const _$btn = _$e.find(".bid button");
		const _$sendPrizeTip = _$e.find(".sendPrizeTip");
		const _$sendPrizeIcon = _$sendPrizeTip.find(".sendPrizeIcon");
		const _$sendPrizeBtn = _$sendPrizeTip.find(".sendPrizeBtn")
			.click(function(){
				_$sendPrizeIcon[0]._tippy.hide(0);
				_self.sendPrize();
			});

		const _$alertsTip = _$e.find(".alertsTip");
		const _$alertsIcon = _$e.find(".alertsIcon");
		function _initAlertsTip(){
			_loadAlerts();

			// attach tippy
			tippy(_$alertsIcon[0], {
				theme: "light",
				animation: "fade",
				placement: "right",
				html: _$alertsTip.show()[0],
				onShow: function(){
					_self.refreshAlertsTip();
				}
			});

			// hook up "Enabled Notification" button
			const $alertBtn = _$alertsTip.find("button").click(function(){
				Notification.requestPermission(() => _self.refreshAlertsTip(true));
			});
			// hook up all the checkboxes and dropdowns
			_$alertsTip.find("input").change(function(){
				const $sel = $(this).parent().find("select");
				const name = $(this).data("alert-name");
				if (this.checked){
					_alerts[name] = $sel.length ? $sel.val() : true;
				} else {
					delete _alerts[name];
				}
				_storeAlerts();
			});
			_$alertsTip.find("select").change(function(){
				$(this).parent().find("input").change();
			});
		}

		// load _alerts from localStorage, set state of checkboxes and icon
		function _loadAlerts() {
			try {
				_alerts = JSON.parse(localStorage.getItem(_lsKey)) || {};
			} catch (e) {}

			_$alertsTip.find("input").toArray().forEach(e=>{
				const name = $(e).data("alert-name"); 
				const value = _alerts[name];
				if (value) {
					$(e).parent().find("select").val(value);
					e.checked = true;
				}
			});
			Object.keys(_alerts).length > 0
				? _$alertsIcon.addClass("on")
				: _$alertsIcon.removeClass("on");
		}
		// store alerts, update icon
		function _storeAlerts() {
			try {
				localStorage.setItem(_lsKey, JSON.stringify(_alerts));
			} catch (e) {}
			Object.keys(_alerts).length > 0
				? _$alertsIcon.addClass("on")
				: _$alertsIcon.removeClass("on");
		}
		// remove alerts, remove icon
		function _clearAlerts() {
			localStorage.removeItem(_lsKey);
			_alerts = {};
			_$alertsIcon.remove();
		}

		function _triggerAlerts(blocksLeft, amNowLoser, newWinner){
			if (Object.keys(_alerts).length==0) return;
			const timeStr = util.getLocalTime();
			const newWinnerStr = _curCurrentWinner == ethUtil.getCurrentAccount()
				? "You"
				: _curCurrentWinner.slice(0, 10) + "...";
			const title = `Auction @ ${_auction.address.slice(0,10)}...`;

			// alert one or none of: Not Winner, New Winner
			if (_alerts["whenNowLoser"] && amNowLoser) {
				new Notification(title, {
					tag: `${_auction.address}-bidAfter`,
					renotify: true,
					body: `${timeStr} - You were bid after by ${newWinnerStr}`,
					requireInteraction: true
				});
			} else {
				if (_alerts["whenNewWinner"] && newWinner) {
					new Notification(title, {
						tag: `${_auction.address}-newWinner`,
						renotify: true,
						body: `${timeStr} - Bid placed by ${newWinnerStr}`,
						requireInteraction: true
					})
				}	
			}
			// alert one or none of: Ended, N blocks Left
			const isEnded = blocksLeft < 1;
			if (_alerts["whenEnded"] && isEnded) {
				new Notification(title, {
					tag: `${_auction.address}-blocksLeft`,
					renotify: true,
					body: `${timeStr} - Auction ended.`,
					requireInteraction: true
				});
			} else {
				if (_alerts["whenBlocksLeft"]){
					if (blocksLeft < _alerts["whenBlocksLeft"]) {
						const body = blocksLeft <= 0
							? `${timeStr} - Auction ended.`
							: `${timeStr} - Only ${blocksLeft} blocks left.`
						new Notification(title, {
							tag: `${_auction.address}-blocksLeft`,
							renotify: true,
							body: body,
							requireInteraction: true
						});	
					}
				}
			}
		}

		// shows alertsTip in state depending on window.Notification.permission
		this.refreshAlertsTip = function(fromUserClick){
			_$alertsTip.removeClass("disabled");
			if (!window.Notification) {
				_$alertsTip.addClass("disabled");
				_$alertsTip.find(".request").text("Your browser does not support notifications.");
				return;
			}
			if (Notification.permission !== "granted") {
				_$alertsTip.addClass("disabled");
				if (fromUserClick) {
					_$alertsTip.find(".request").text("Notification permission was denied.");
				}
				return;
			}
		}

		const _$moreTip = _$e.find(".moreTip");
		this.refreshMoreTip = function(){
			const $lv = util.$getLogViewer({
				$head: "Bid History",
				events: [{
					instance: _auction,
					name: "BidOccurred",
				},{
					instance: _auction,
					name: "Started"
				}],
				order: "newest",
				startBlock: Math.min(_curBlockEnded, ethUtil.getCurrentBlockHeight()),
				stopFn: (event)=>event.name=="Started",
				dateFn: (event, prevEvent, nextEvent) => {
					if (!prevEvent){
						return util.toDateStr(event.args.time);
					} else {
						const timeDiff = event.args.time.minus(prevEvent.args.time);
						return `${util.toTime(timeDiff)} later`;
					}
				},
				valueFn: (event)=>{
					if (event.name=="BidOccurred"){
						const $txLink = util.$getTxLink("Bid", event.transactionHash);
						const $bidderLink = util.$getShortAddrLink(event.args.bidder);
						return $("<div></div>").append($txLink).append(" by: ").append($bidderLink);
					} else if (event.name=="Started"){
						return "<b>Auction Started</b>";
					}
				}
			});
			_$moreTip.empty().append($lv);
		}

		this.setBlocktime = function(blocktime) {
			_blocktime = blocktime;
		}

		// updates the _$timeLeft string according to how
		// much time has elapsed since the last estimate was recorded.
		this.updateTimeLeft = function(){
			if (!_curBlocksLeft) return;

			const timeElapsed = (+new Date()/1000) - _estTimeLeftAt;
			const newTimeLeft = Math.round(_estTimeLeft - timeElapsed);
			if (newTimeLeft < 0) {
				const newTimeLeftStr = util.toTime(-1*newTimeLeft, 2);
				_$timeLeft.text(`${newTimeLeftStr} ago`);
			} else {
				const newTimeLeftStr = util.toTime(newTimeLeft, 3);
				_$timeLeft.text(newTimeLeftStr);
			}

			_$e.removeClass("half-minute one-minute two-minutes five-minutes");
			if (_curBlocksLeft <= 0) return;

			if (newTimeLeft <= 30){
				_$e.addClass("half-minute");
			} else if (newTimeLeft <= 60){
				_$e.addClass("one-minute");
			} else if (newTimeLeft <= 120){
				_$e.addClass("two-minutes");
			} else if (newTimeLeft <= 300){
				_$e.addClass("five-minutes");
			}
		}

		this.updateEndedStatus = function(){
			_$status.empty();
			// display who won.
			const $winnerLink = util.$getShortAddrLink(_curCurrentWinner);
			if (_curAmWinner) $winnerLink.text("You");
			const $curWinner = $("<div></div>").append($winnerLink).append(_curAmWinner ? " won!" : " won.");
			_$status.append($curWinner);

			Promise.resolve().then(()=>{
				// maybe load isPaid
				if (_isPaid) return;
				return _auction.isPaid().then(isPaid=>{ _isPaid = isPaid });
			}).then(()=>{
				// maybe load paymentEvent
				if (!_isPaid || _paymentEvent) return;
				return _auction.getEvents("SendPrizeSuccess").then(evs=>{
					if (evs.length!==1) return;
					_paymentEvent = evs[0];
				});
			}).then(()=>{
				// clear status again, since .updateEndedStatus() may be backlogged.
				_$status.empty().append($curWinner);
				// display whether or not they've been paid
				if (_curAmWinner) {
					if (_isPaid){
						if (_paymentEvent){
							const txHash = _paymentEvent.transactionHash;
							const $link = util.$getTxLink("✓ You have been paid.", txHash);
							_$status.append($("<div></div>").append($link));
						}else{
							_$status.append($("<div></div>").append("✓ You have been paid."));
						}
					} else {
						_$status.append(_$sendPrizeIcon);
					}
					return;
				}
				// display `winner has been paid` as event or text.
				if (_isPaid){
					if (_paymentEvent) {
						const txHash = _paymentEvent.transactionHash;
						const $link = util.$getTxLink("✓ Winner has been paid.", txHash);
						_$status.append($("<div></div>").append($link));
					} else {
						const $paid = $("<div>✓ Winner has been paid.</div>");
						_$status.append($paid);
					}
				}
			})
		}

		// Loads newest data about this game, detects deltas, and does things accordingly.
		// General workflow:
		//  - detect things that changed
		//  - update local values
		//	- update static DOM things (timeleft, prize, currentWinner)
		//  - 
		this.refresh = function() {
			function flashClass(className) {
				_$e.removeClass(className);
				setTimeout(()=>_$e.addClass(className), 30);
			}

			return Promise.obj({
				initialized: _initialized,
				isPaid: _isEnded && !_isPaid ? _auction.isPaid() : null,
				prize: _isEnded ? _curPrize : _auction.prize(),
				currentWinner: _isEnded ? _curCurrentWinner : _auction.currentWinner(),
				blockEnded: _isEnded ? new BigNumber(_curBlockEnded) : _auction.blockEnded()
			}).then(obj => {
				const isPaid = obj.isPaid;
				const prize = obj.prize;
				const currentWinner = obj.currentWinner;
				const blockEnded = obj.blockEnded;

				// update most recent estimate of time left
				const blocksLeft = blockEnded - ethUtil.getCurrentBlockHeight();
				_estTimeLeft = _blocktime.mul(blocksLeft).toNumber();
				_estTimeLeftAt = (+new Date()/1000);
				_self.updateTimeLeft();

				// compute useful things, store state
				const amWinner = currentWinner === ethUtil.getCurrentAccount();
				const amNowWinner = !_curAmWinner && amWinner;
				const amNowLoser = _curAmWinner && !amWinner;
				const isNewWinner = _curCurrentWinner && currentWinner != _curCurrentWinner;
				const isEnded = blocksLeft < 1;
				const isNewEnded = isEnded && !_isEnded;
				const isNewBlock = _curBlocksLeft && blocksLeft != _curBlocksLeft;
				const isNewPrize = _curPrize && !_curPrize.equals(prize);
				_isEnded = isEnded;
				_curPrize = prize;
				_curAmWinner = amWinner;
				_curBlocksLeft = blocksLeft;
				_curCurrentWinner = currentWinner;
				_curBlockEnded = blockEnded;

				// update DOM, currentWinner, and prize
				_$e.removeClass("winner");
				if (amWinner) _$e.addClass("winner");
				const $curWinner = util.$getShortAddrLink(currentWinner);
				if (amWinner) $curWinner.text("You");
				_$currentWinner.empty().append($curWinner);
				_$prize.text(`${ethUtil.toEth(prize)}`);

				// trigger any alerts
				_triggerAlerts(blocksLeft, amNowLoser, isNewWinner);
				if (isNewEnded) _clearAlerts();
				
				// update everything else
				// button, blocksleft, flashing classes
				if (isEnded) {
					_$e.addClass("ended");
					_$btn.attr("disabled", "disabled");
					_$blocksLeft.text("Ended");
					_$currentWinnerCell.find(".label").text("Winner");
					_$alertsIcon.hide();
					_self.updateEndedStatus();
					return;
				}

				_$blocksLeft.text(blocksLeft);
				if (amNowLoser){
					_$status.empty()
						.append("You are no longer the current winner. ")
						.append($curWinner.clone())
						.append(" bid after you.");
					_$e.removeClass("now-winner");
					_$e.removeClass("new-winner");
					flashClass("now-loser");

					_$currentWinnerCell.attr("title", "You are no longer the current winner!");
					const t = tippy(_$currentWinnerCell[0], {
						placement: "top",
						trigger: "manual",
						animation: "fade",
						onHidden: function(){ t.destroy(); }
					}).tooltips[0];
					t.show();
					setTimeout(function(){ t.hide(); }, 3000);
				} else if (amNowWinner) {
					_$status.text("You are the current winner!");
					_$e.removeClass("now-loser");
					_$e.removeClass("new-winner");
					flashClass("now-winner");

					_$currentWinnerCell.attr("title", "You are the current winner!");
					const t = tippy(_$currentWinnerCell[0], {
						placement: "top",
						trigger: "manual",
						animation: "fade",
						onHidden: function(){ t.destroy(); }
					}).tooltips[0];
					t.show();
					setTimeout(function(){ t.hide(); }, 3000);
				} else if (isNewWinner) {
					_$status.empty()
						.append($curWinner.clone())
						.append(" is now the current winner.");
					_$e.removeClass("now-winner");
					_$e.removeClass("now-loser");
					flashClass("new-winner");
				} else {
					if (amWinner) {
						_$status.text("You are the current winner!");
					} else {
						_$status.empty()
							.append($curWinner.clone())
							.append(" is the current winner.");
					}
				}
				if (isNewBlock) flashClass("new-block");
				if (isNewPrize) flashClass("new-prize");
			});
		}

		this.sendPrize = function(){
			_$txStatus.show();
			_$status.hide();
			
			var p;
			const gasPrice = _GAS_PRICE_SLIDER.getValue();
			const waitTimeMs = (_GAS_PRICE_SLIDER.getWaitTimeS() || _blocktime*3) * 1000;
			try {
				p = _auction.sendPrize([0], {gas: 40000, gasPrice: gasPrice});
			} catch (e) {
				ethStatus.open();
				_$clearTxStatus.show();
				_$statusCell.addClass("error");
				_$txStatus.text(`Error: ${e.message}`);
				return;
			}
			var txId;

			_$statusCell
				.removeClass("prepending pending refunded error current-winner")
				.addClass("prepending");
			_$txStatus.text("Waiting for signature...");

			var loadingBar;
			p.getTxHash.then(function(tId){
				txId = tId;
				const $txLink = util.$getTxLink("Your prize is being sent...", txId);
				_$statusCell.removeClass("prepending").addClass("pending");
				loadingBar = util.getLoadingBar(waitTimeMs);
				_$txStatus.empty().append($txLink).append(loadingBar.$e);
			});
			p.then(function(res){
				_$clearTxStatus.show();
				loadingBar.finish(500).then(()=>res);
				if (res.events.length!=1){
					throw new Error("Did not get back expected events. Please check your balance to see if you got paid.");
				}
				const ev = res.events[0];
				if (!ev.name)
					throw new Error("We received an unknown event. You may or may not have been paid.");
				if (ev.name == "SendPrizeError")
					throw new Error(`SendPrizeError: ${ev.args.msg}`);
				if (ev.name == "SendPrizeFailure")
					throw new Error(`Sending prize failed. You may need to use more gas.`);
				if (ev.name != "SendPrizeSuccess") 
					throw new Error(`Unexpected Event (${ev.name}): You may or may not have been paid.`);
				const $link = util.$getTxLink("Your prize was successfully sent!", txId);
				_$txStatus.empty().append($link)
			}).catch((e)=>{
				_$clearTxStatus.show();
				_$statusCell.removeClass("prepending pending").addClass("error");
				if (txId) {
					const $txLink = util.$getTxLink("Your tx failed.", txId);
					_$txStatus.empty().append($txLink).append(`<br>${e.message.split("\n")[0]}`);
				} else {
					_$txStatus.text(`Error: ${e.message.split("\n")[0]}`);	
				}
			});
		}

		function _bid(obj){
			const setClass = (cls) => {
				_$statusCell.removeClass("prepending pending refunded error current-winner");
				_$statusCell.addClass(cls);
			}
			
			// create txStatus object, append it.
			setClass("prepending");
			_$txStatus.show();
			_$status.hide();
			_$btn.attr("disabled", "disabled");
			const txStatus = util.getTxStatus({
				waitTimeMs: (obj.waitTimeS || _blocktime*3) * 1000,
				onSuccess: (res, txStatus) => {
					const success = res.events.find(e => e.name=="BidOccurred");
					const refundSuccess = res.events.find(e => e.name=="BidRefundSuccess");
					const refundFailure = res.events.find(e => e.name=="BidRefundFailure");
					if (refundSuccess) {
						setClass("refunded");
						txStatus.addWarningMsg(`Your overthrow was refunded: "${refundSuccess.args.msg}"`);
					} else if (refundFailure) {
						setClass("error");
						txStatus.addFailureMsg(`Your overthrow failed, and you were not able to be refunded.`);
					} else if (success) {
						setClass("current-winner");
						txStatus.addSuccessMsg(`Your overthow succeeded! You should become the Monarch shortly...`);
						setTimeout(_self.refresh, 1000);
						setTimeout(_self.refresh, 5000);
					} else {
						setClass("error");
						txStatus.addFailureMsg(`No events found. Please refresh the page.`);
					}
				},
				onFailure: (res, txStatus) => setClass("error"),
				onTxId: (txId) => setClass("pending"),
				onClear: () => {
					setClass("");
					_$txStatus.empty().hide();
					_$status.show();
					_$btn.removeAttr("disabled");
				}
			});
			txStatus.$e.appendTo(_$txStatus);

			// create promise, or fail the TxStatus
			try {
				txStatus.setTxPromise(_auction.sendTransaction({
					gas: 59000,
					value: _bidPrice,
					gasPrice: obj.gasPrice
				}));
			} catch (e) {
				setClass("error");
				txStatus.fail(`Error: ${e.message.split("\n")[0]}`);
				ethStatus.open();
			}
		}

		this.$e = _$e;

		_initAlertsTip();
		_$e.find(".viewLink a")
			.attr("href", `/games/viewpennyauction.html#${_auction.address}`);

		// initialize this auction
		_$e.addClass("initializing");
		_$blocksLeft.text("Loading");
		_initialized = Promise.obj({
			bidPrice: _auction.bidPrice(),
			bidIncr: _auction.bidIncr(),
			bidAddBlocks: _auction.bidAddBlocks()
		}).then(obj => {
			_$e.removeClass("initializing");
			_bidPrice = obj.bidPrice;
			_bidIncr = obj.bidIncr;
			_bidAddBlocks = obj.bidAddBlocks;

			// update DOM
			_$bidPrice.text(`${ethUtil.toEth(_bidPrice)}`);

			// update tip. todo: move this to setBlocktime
			const blocksLeftTip = `The number of blocks remaining until the auction ends. \
			Time is estimated using the current average blocktime of ${_blocktime.round()} seconds.`;
			_$e.find(".blocksLeftCell .label").attr("title", blocksLeftTip);

			// initialize tips
			tippy(_$e.find(".label").toArray(), {
				dynamicTitle: true
			});

			// moreTip
			tippy(_$e.find(".infoIcon")[0], {
				trigger: "click",
				animation: "fade",
				placement: "right",
				html: _$moreTip.show()[0],
				onShow: function(){
					_self.refreshMoreTip();
				},
				onHidden: function() {
					_$moreTip.empty();
				}
			});

			// init sendPrizeTip
			(function initSendPrizeTip(){
				const $gasPrice = _$sendPrizeTip.find(".gasPrice");
				const $prize = _$sendPrizeTip.find(".prize");
				tippy(_$sendPrizeIcon[0], {
					theme: "light",
					animation: "scale",
					placement: "top",
					trigger: "mouseenter",
					html: _$sendPrizeTip.show()[0],
					onShow: function(){
						_GAS_PRICE_SLIDER.refresh();
						$gasPrice.append(_GAS_PRICE_SLIDER.$e);
						$prize.text(ethUtil.toEthStr(_curPrize));
					},
					onHidden: function(){
						// fix firefox bug where tip won't reshow
						_$sendPrizeIcon[0]._tippy.destroy();
						initSendPrizeTip();
					}
				})
			}());

			// init bidTip
			(function initBidButton(){
				const $bidTip = _$e.find(".bidTip");
				const $bidPrice = $bidTip.find(".bidPrice");
				const $prize = $bidTip.find(".prize");
				const $prizeIncr = $bidTip.find(".prizeIncr");
				const $addBlocks = $bidTip.find(".addBlocks");

				const gps = util.getGasPriceSlider(20);
				gps.refresh();
				gps.$e.appendTo($bidTip.find(".gasPrice"))

				// set priceIncr string
				const ethStr = util.toEthStrFixed(_bidIncr.abs());
				const prizeIncrStr = _bidIncr.equals(0)
					? ""
					: _bidIncr.gt(0)
						? `The prize will go up by ${ethStr}`
						: `The prize will go down by ${ethStr}`;
				$prizeIncr.text(prizeIncrStr);

				// set "addBlocks" string and tip
				const addBlocksStr = `${_bidAddBlocks} blocks`;
				const addBlocksTime = util.toTime(_blocktime.mul(_bidAddBlocks));
				$addBlocks.text(addBlocksStr).attr("title", `~${addBlocksTime}`);
				tippy($addBlocks[0]);

				(function attachTip(){
					tippy(_$btn[0], {
						// arrow: false,
						theme: "light",
						animation: "fade",
						html: $bidTip.show()[0],
						onShow: function(){
							gps.refresh();
							$bidPrice.text(util.toEthStrFixed(_bidPrice));
							$prize.text(util.toEthStrFixed(_curPrize));
						},
						onHidden: function(){
							// fix firefox bug where tip wont reshow
							_$btn[0]._tippy.destroy();
							attachTip();
						}
					});
				}());

				
				_$btn.click(function(){
					this._tippy.hide(0);
					_bid({gasPrice: gps.getValue(), waitTimeS: gps.getWaitTimeS()});
				});
			}());
		});
	}
});