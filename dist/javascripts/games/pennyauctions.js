Loader.require("monarchy")
.then(function(monarchy){
	$("#Title").addClass("loaded");
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshAllGames();
	});

	const _GAS_PRICE_SLIDER = util.getGasPriceSlider(20);
	const _activeGameObjs = {};
	const _endedGameObjs = {};
	const _$activeAuctions = $(".activeAuctions .auctions").empty();
	const _$endedAuctions = $(".endedAuctions .auctions").empty();

	// returns all games
	function getAllGameObjs() {
		return Object
			.values(_activeGameObjs)
			.concat(Object.values(_endedGameObjs));
	}

	// get active game contracts.
	function getActiveGames() {
		return monarchy.numDefinedGames().then(num=>{
			const games = [];
			for (var i=0; i<num; i++){
				games.push(monarchy.getGame([i]));
			}
			return Promise.all(games);
		}).then(addrs=>{
			return addrs
				.filter(addr => addr != ethUtil.NO_ADDRESS)
				.map(addr => MonarchyGame.at(addr));
		});
	}

	// get up to 10 last ended game contracts
	// todo: if optimization is needed, we can update 
	// this only when numEndedAuctions has changed.
	function getEndedGames() {
		return monarchy.numEndedGames().then(len=>{
			const max = Math.min(len, 10);
			const games = [];
			for (var i=1; i<=max; i++){
				games.push(monarchy.endedGames([len-i]));
			}
			return Promise.all(games);
		}).then(addrs=>{
			return addrs
				.filter(addr => addr != ethUtil.NO_ADDRESS)
				.map(addr => MonarchyGame.at(addr));
		});	
	}

	// - remove any objsMap items not in games
	// - for each game:
	//    - create and add to objsMap if not created.
	function getOrCreateGameObjs(objsMap, games, $e) {
		// remove any objs that arent in games array
		Object.keys(objsMap).forEach(addr => {
			if (!games.some(game => game.address)){
				objsMap[addr].$e.remove();
				delete objsMap[addr];
			}
		});
		if (games.length == 0) {
			$e.parent().find(".none").show();
		} else {
			$e.parent().find(".none").hide();
		}

		// for each game, get or create it.
		return games.map(game => {
			if (objsMap[game.address]) return objsMap[game.address];
			const gameObj = new Game(game);
			gameObj.$e.appendTo($e);
			objsMap[game.address] = gameObj;
			return gameObj;
		});
	}

	function refreshAllGames(){
		$("body").addClass("refreshing");
		var blocktime;
		Promise.resolve().then(()=>{
			// first refresh all active games.
			return getActiveGames().then(activeGames => {
				return getOrCreateGameObjs(_activeGameObjs, activeGames, _$activeAuctions)
					.map(a=> a.refresh());
			});
		}).then(()=>{
			// next update the blocktime on active games
			return ethUtil.getAverageBlockTime().then(b=>{
				blocktime = b;
				Object.values(_activeGameObjs)
					.forEach(gameObj => gameObj.setBlocktime(blocktime));
			});
		}).then(()=>{
			// lastly, refresh all ended games.
			return getEndedGames().then(endedGames => {
				return getOrCreateGameObjs(_endedGameObjs, endedGames, _$endedAuctions)
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
		getAllGameObjs().forEach(gameObj => gameObj.updateTimeLeft());
		setTimeout(refreshTimes, 1000);
	}());


	function Game(game) {
		const _self = this;
		const _$e = $(".auction.template")
			.clone()
			.show()
			.removeClass("template")
			.attr("id", game.address)
		const _game = game;
		const _lsKey = `${_game.address}-alerts`;
		var _initialized;
		var _isEnded;
		var _isPaid;
		var _paymentEvent;

		var _blocktime = new BigNumber(15);
		var _fee;
		var _prizeIncr;
		var _reignBlocks;
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
		const _$currentWinnerCell = _$e.find("td.current-winner");
		const _$currentWinner = _$currentWinnerCell.find(".value");
		const _$prize = _$e.find(".prize .value");
		const _$blocksLeft = _$e.find("td.blocks-left .value");
		const _$timeLeft = _$e.find(".timeLeft");
		const _$bidPrice = _$e.find("td.fee .value");
		const _$btn = _$e.find(".bid button");
		const _$sendPrizeTip = _$e.find(".sendPrizeTip");
		const _$sendPrizeIcon = _$sendPrizeTip.find(".sendPrizeIcon");
		const _$sendPrizeBtn = _$sendPrizeTip.find(".sendPrizeBtn")
			.click(function(){
				_$sendPrizeIcon[0]._tippy.hide(0);
				_self.sendPrize();
			});
		const _$alertsIcon = _$e.find(".alertsIcon");


		this.$e = _$e;

		this.setBlocktime = function(blocktime) {
			_blocktime = blocktime;
		};

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
		};

		// Called if the game is completed.
		// This updates the status cell to show the payout progress.
		this.updateEndedStatus = function(){
			_$status.empty();
			_$e.find(".reign-blocks").hide();
			// display who won.
			const $winnerLink = util.$getShortAddrLink(_curCurrentWinner);
			if (_curAmWinner) $winnerLink.text("You");
			const $curWinner = $("<div></div>").append($winnerLink).append(_curAmWinner ? " won!" : " won.");
			_$status.append($curWinner);


			Promise.resolve().then(()=>{
				// maybe load isPaid
				if (_isPaid) return;
				return _game.isPaid().then(isPaid=>{ _isPaid = isPaid });
			}).then(()=>{
				// maybe load paymentEvent
				if (!_isPaid || _paymentEvent) return;
				return _game.getEvents("SendPrizeSuccess").then(evs=>{
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
		};

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
				isPaid: _isEnded && !_isPaid ? _game.isPaid() : null,
				prize: _isEnded ? _curPrize : _game.prize(),
				currentWinner: _isEnded ? _curCurrentWinner : _game.monarch(),
				blockEnded: _isEnded ? new BigNumber(_curBlockEnded) : _game.blockEnded()
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
						.append("You've been overthrown by ")
						.append($curWinner.clone());
					_$e.removeClass("now-winner");
					_$e.removeClass("new-winner");
					flashClass("now-loser");

					_$currentWinnerCell.attr("title", "You've been overthrown!");
					const t = tippy(_$currentWinnerCell[0], {
						placement: "top",
						trigger: "manual",
						animation: "fade",
						onHidden: function(){ t.destroy(); }
					}).tooltips[0];
					t.show();
					setTimeout(function(){ t.hide(); }, 3000);
				} else if (amNowWinner) {
					_$status.text("You are the current Monarch. You'll win unless you get overthrown.");
					_$e.removeClass("now-loser");
					_$e.removeClass("new-winner");
					flashClass("now-winner");

					_$currentWinnerCell.attr("title", "You are the current Monarch!");
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
		};

		this.sendPrize = function(){
			alert("Not yet implemented");
			return;
			_$txStatus.show();
			_$status.hide();
			
			var p;
			const gasPrice = _GAS_PRICE_SLIDER.getValue();
			const waitTimeMs = (_GAS_PRICE_SLIDER.getWaitTimeS() || _blocktime*3) * 1000;
			try {
				p = _game.sendPrize([0], {gas: 40000, gasPrice: gasPrice});
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
		};

		function _triggerAlerts(blocksLeft, amNowLoser, newWinner){
			if (Object.keys(_alerts).length==0) return;
			const timeStr = util.getLocalTime();
			const newWinnerStr = _curCurrentWinner == ethUtil.getCurrentAccount()
				? "You"
				: _curCurrentWinner.slice(0, 10) + "...";
			const title = `Auction @ ${_game.address.slice(0,10)}...`;

			// alert one or none of: Not Winner, New Winner
			if (_alerts["whenNowLoser"] && amNowLoser) {
				new Notification(title, {
					tag: `${_game.address}-bidAfter`,
					renotify: true,
					body: `${timeStr} - You were bid after by ${newWinnerStr}`,
					requireInteraction: true
				});
			} else {
				if (_alerts["whenNewWinner"] && newWinner) {
					new Notification(title, {
						tag: `${_game.address}-newWinner`,
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
					tag: `${_game.address}-blocksLeft`,
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
							tag: `${_game.address}-blocksLeft`,
							renotify: true,
							body: body,
							requireInteraction: true
						});	
					}
				}
			}
		}
		// remove alerts, remove icon
		function _clearAlerts() {
			localStorage.removeItem(_lsKey);
			_alerts = {};
			_$alertsIcon.remove();
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
					const success = res.events.find(e => e.name=="OverthrowOccurred");
					const refundSuccess = res.events.find(e => e.name=="OverthrowRefundSuccess");
					if (refundSuccess) {
						setClass("refunded");
						txStatus.addWarningMsg(`Your overthrow was refunded: "${refundSuccess.args.msg}"`);
					} else if (success) {
						setClass("current-winner");
						txStatus.addSuccessMsg(`Your overthow succeeded! You should become the Monarch shortly, or you'll be refunded.`);
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
				txStatus.setTxPromise(_game.sendTransaction({
					gas: 59000,
					value: _fee,
					gasPrice: obj.gasPrice
				}));
			} catch (e) {
				setClass("error");
				txStatus.fail(`Error: ${e.message.split("\n")[0]}`);
				ethStatus.open();
			}
		}

		function _init() {
			// initialize this auction
			_$e.find(".viewLink a")
				.attr("href", `/games/viewpennyauction.html#${_game.address}`);
			
			// init tippies
			tippy(_$e.find(".tip-manually").toArray(), {
				dynamicTitle: true
			});

			// update tip. todo: move this to setBlocktime
			const blocksLeftTip = `The number of blocks remaining until the current Monarch wins. \
			Time is estimated using the current average blocktime of ${_blocktime.round()} seconds.`;
			_$e.find("td.blocks-left .label").attr("title", blocksLeftTip);

			// update other more involved tips
			_initAlerts();
			_initHistoryTip();
			_initSendPrizeTip();

			_$e.addClass("initializing");
			_$blocksLeft.text("Loading");
			_initialized = Promise.obj({
				fee: _game.fee(),
				prizeIncr: _game.prizeIncr(),
				reignBlocks: _game.reignBlocks()
			}).then(obj => {
				_$e.removeClass("initializing");
				_fee = obj.fee;
				_prizeIncr = obj.prizeIncr;
				_reignBlocks = obj.reignBlocks;

				// update static DOM elements
				_$bidPrice.text(`${ethUtil.toEth(_fee)}`);
				_$e.find("td.blocks-left .reign-blocks").text(`of ${_reignBlocks}`);
				if (_prizeIncr.gt(0)){
					_$e.find("td.prize .incr").text(`+${util.toEthStrFixed(_prizeIncr, 5, "")} per overthrow`);
				} else if (_prizeIncr.lt(0)) {
					_$e.find("td.prize .incr").text(`${util.toEthStrFixed(_prizeIncr, 5, "")} per overthrow`);
				} else {
					_$e.find("td.prize .incr").hide();
				}
				_initBidTip();
			});
		};

		function _initAlerts(){
			const $alertsTip = _$e.find(".alertsTip");
			loadAlerts();

			// attach tippy
			tippy(_$alertsIcon[0], {
				theme: "light",
				animation: "fade",
				placement: "right",
				html: $alertsTip.show()[0],
				onShow: function(){
					refreshAlertsTip();
				}
			});

			// hook up "Enabled Notification" button
			$alertsTip.find("button").click(function(){
				Notification.requestPermission(() => refreshAlertsTip(true));
			});
			// hook up all the checkboxes and dropdowns
			$alertsTip.find("input").change(function(){
				const $sel = $(this).parent().find("select");
				const name = $(this).data("alert-name");
				if (this.checked){
					_alerts[name] = $sel.length ? $sel.val() : true;
				} else {
					delete _alerts[name];
				}
				storeAlerts();
			});
			$alertsTip.find("select").change(function(){
				$(this).parent().find("input").change();
			});

			// shows alertsTip in state depending on window.Notification.permission
			function refreshAlertsTip(fromUserClick){
				$alertsTip.removeClass("disabled");
				if (!window.Notification) {
					$alertsTip.addClass("disabled");
					$alertsTip.find(".request").text("Your browser does not support notifications.");
					return;
				}
				if (Notification.permission !== "granted") {
					$alertsTip.addClass("disabled");
					if (fromUserClick) {
						$alertsTip.find(".request").text("Notification permission was denied.");
					}
					return;
				}
			}

			// load _alerts from localStorage, set state of checkboxes and icon
			function loadAlerts() {
				try {
					_alerts = JSON.parse(localStorage.getItem(_lsKey)) || {};
				} catch (e) {}

				$alertsTip.find("input").toArray().forEach(e=>{
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
			function storeAlerts() {
				try {
					localStorage.setItem(_lsKey, JSON.stringify(_alerts));
				} catch (e) {}
				Object.keys(_alerts).length > 0
					? _$alertsIcon.addClass("on")
					: _$alertsIcon.removeClass("on");
			}
		}

		function _initHistoryTip() {
			const $moreTip = _$e.find(".moreTip");
			const $icon = _$e.find(".infoIcon");

			tippy($icon[0], {
				trigger: "click",
				animation: "fade",
				placement: "right",
				html: $moreTip.show()[0],
				onShow: function(){
					refreshMoreTip();
				},
				onHidden: function() {
					$moreTip.empty();
				}
			});

			function refreshMoreTip(){
				const $lv = util.$getLogViewer({
					$head: "Monarch History",
					events: [{
						instance: _game,
						name: "OverthrowOccurred",
					},{
						instance: _game,
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
				$moreTip.empty().append($lv);
			};
		}

		function _initSendPrizeTip(){
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
		};

		// init bidTip
		function _initBidTip(){
			const $bidTip = _$e.find(".bidTip");
			const $bidPrice = $bidTip.find(".bidPrice");
			const $prize = $bidTip.find(".prize");
			const $prizeIncr = $bidTip.find(".prizeIncr");
			const $addBlocks = $bidTip.find(".addBlocks");

			const gps = util.getGasPriceSlider(20);
			gps.refresh();
			gps.$e.appendTo($bidTip.find(".gasPrice"))

			// set priceIncr string
			const ethStr = util.toEthStrFixed(_prizeIncr.abs());
			const prizeIncrStr = _prizeIncr.equals(0)
				? ""
				: _prizeIncr.gt(0)
					? `The prize will go up by ${ethStr}`
					: `The prize will go down by ${ethStr}`;
			$prizeIncr.text(prizeIncrStr);

			// set "addBlocks" string and tip
			const addBlocksStr = `${_reignBlocks} blocks`;
			const addBlocksTime = util.toTime(_blocktime.mul(_reignBlocks));
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
						$bidPrice.text(util.toEthStrFixed(_fee));
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
		};

		_init();
	}
});