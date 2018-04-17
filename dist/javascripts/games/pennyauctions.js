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
		var avgBlocktime;
		Promise.obj({
			activeGames: getActiveGames(),
			avgBlocktime: ethUtil.getAverageBlockTime()
		}).then(obj => {
			// create and refresh active games
			avgBlocktime = obj.avgBlocktime;
			const activeGameObjs = getOrCreateGameObjs(_activeGameObjs, obj.activeGames, _$activeAuctions);
			return Promise.all(activeGameObjs.map(gameObj => gameObj.refresh(avgBlocktime)));
		}).then(() => {
			// load, create, refresh ended games
			return getEndedGames().then(endedGames => {
				const endedGameObjs = getOrCreateGameObjs(_endedGameObjs, endedGames, _$endedAuctions);
				return Promise.all(endedGameObjs.map(gameObj => gameObj.refresh(avgBlocktime)));
			});
		}).then(endedGames => {
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

		var _blocktime;
		var _fee;
		var _prizeIncr;
		var _reignBlocks;
		var _estTimeLeft;
		var _estTimeLeftAt;
		var _curBlocksLeft = null;
		var _curAmWinner = null;
		var _curPrize = null;
		var _curMonarch = null;
		var _curDecree = "";
		var _curBlockEnded = null;
		var _alerts = {};

		// initialize dom elements
		const _$status = _$e.find(".status");
		const _$txStatus = _$e.find(".txStatus");
		const _$statusCell = _$e.find(".statusCell");
		const _$currentMonarchCell = _$e.find("td.current-monarch");
		const _$monarch = _$currentMonarchCell.find(".value");
		const _$decree = _$e.find("td.current-monarch .decree");
		const _$prize = _$e.find(".prize .value");
		const _$blocksLeft = _$e.find("td.blocks-left .value");
		const _$timeLeft = _$e.find("td.blocks-left .time-left");
		const _$bidPrice = _$e.find("td.fee .value");
		const _$btn = _$e.find("td.overthrow button");
		const _$alertsIcon = _$e.find(".alertsIcon");
		const _$sendPrizeIcon = _$e.find(".send-prize-icon").detach();


		this.$e = _$e;

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

			_$e.removeClass("half-minute one-minute two-minutes five-minutes ten-minutes");
			if (_curBlocksLeft <= 0) return;

			if (newTimeLeft <= 30){
				_$e.addClass("half-minute");
			} else if (newTimeLeft <= 60){
				_$e.addClass("one-minute");
			} else if (newTimeLeft <= 120){
				_$e.addClass("two-minutes");
			} else if (newTimeLeft <= 300){
				_$e.addClass("five-minutes");
			} else if (newTimeLeft <= 600){
				_$e.addClass("ten-minutes");
			}
		};

		// Called if the game is completed.
		// This updates the status cell to show the payout progress.
		this.updateEndedStatus = function(){
			_$status.empty();
			_$e.find(".reign-blocks").hide();
			// display who won.
			const $winnerLink = util.$getShortAddrLink(_curMonarch);
			if (_curAmWinner) $winnerLink.text("You");
			const $winnerInfo = $("<div></div>").append($winnerLink).append(_curAmWinner ? " won!" : " won.");
			_$status.append($winnerInfo);


			Promise.resolve().then(()=>{
				// maybe load isPaid
				if (_isPaid) return;
				return _game.isPaid().then(isPaid=>{ _isPaid = isPaid });
			}).then(()=>{
				// maybe load paymentEvent
				if (!_isPaid || _paymentEvent) return;
				return _game.getEvents("SendPrizeSuccess").then(evs => {
					if (evs.length!==1) return;
					_paymentEvent = evs[0];
				});
			}).then(()=>{
				// clear status again, since .updateEndedStatus() may be backlogged.
				_$status.empty().append($winnerInfo);
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
		//	- update static DOM things (timeleft, prize, monarch)
		//  - trigger alerts
		//  - trigger delta things (flash dom elements, etc)
		this.refresh = function(avgBlocktime) {
			if (avgBlocktime) _blocktime = avgBlocktime;

			function flashClass(className) {
				_$e.removeClass(className);
				setTimeout(()=>_$e.addClass(className), 30);
			}

			const account = ethUtil.getCurrentAccount();
			const block = ethUtil.getCurrentBlockHeight();
			return Promise.obj({
				initialized: _initialized,
				isPaid: _isEnded && !_isPaid ? _game.isPaid() : null,
				prize: _isEnded ? _curPrize : _game.prize(),
				monarch: _isEnded ? _curMonarch : _game.monarch(),
				blockEnded: _isEnded ? new BigNumber(_curBlockEnded) : _game.blockEnded(),
				decree: _isEnded ? _curDecree : _game.decree(),
				refundSuccess: account ? _game.getEvents("OverthrowRefundSuccess", {recipient: account}, block, block) : null,
				refundFailure: account ? _game.getEvents("OverthrowRefundFailure", {recipient: account}, block, block) : null,
			}).then(obj => {
				const isPaid = obj.isPaid;
				const prize = obj.prize;
				const monarch = obj.monarch;
				const blockEnded = obj.blockEnded;
				const blocksLeft = blockEnded - block;
				const decree = (function(){
					try { return web3.toUtf8(obj.decree); }
					catch (e) { return "<invalid decree>"; }
				}());
				const refundSuccess = obj.refundSuccess ? obj.refundSuccess[0] : null;
				const refundFailure = obj.refundFailure ? obj.refundFailure[0] : null;

				// compute useful things, store state
				const amWinner = monarch === account;
				const amNowWinner = !_curAmWinner && amWinner;
				const amNowLoser = _curAmWinner && !amWinner;
				const isNewWinner = _curMonarch && monarch != _curMonarch;
				const isEnded = blocksLeft < 1;
				const isNewEnded = isEnded && !_isEnded;
				const isNewBlock = !_curBlocksLeft && blocksLeft != _curBlocksLeft;
				const isNewPrize = _curPrize && !_curPrize.equals(prize);
				_isEnded = isEnded;
				_curPrize = prize;
				_curAmWinner = amWinner;
				_curBlocksLeft = blocksLeft;
				_curMonarch = monarch;
				_curBlockEnded = blockEnded;
				_curDecree = decree;

				// update DOM: monarch, decree, prize
				_$e.removeClass("winner");
				if (amWinner) _$e.addClass("winner");
				const $monarchLink = util.$getShortAddrLink(monarch);
				if (amWinner) $monarchLink.text("You");
				_$monarch.empty().append($monarchLink);
				if (decree.length) _$decree.text(decree).show();
				else _$decree.hide();
				_$prize.text(`${ethUtil.toEth(prize)}`);

				// update stuff that uses _blocktime
				if (isNewBlock) {
					const blocksLeftTip = `The number of blocks remaining until the current Monarch wins the prize.<br>
					(Current average blocktime: ${_blocktime.round()} seconds)`;
					_$e.find("td.blocks-left .label").attr("title", blocksLeftTip);
					_estTimeLeft = _blocktime.mul(blocksLeft).toNumber();
					_estTimeLeftAt = (+new Date()/1000);
					_self.updateTimeLeft();
				}

				// trigger any alerts
				_triggerAlerts(blocksLeft, amNowLoser, isNewWinner);
				if (isNewEnded) _clearAlerts();
				
				// update everything else
				// button, blocksleft, flashing classes
				if (isEnded) {
					_$e.addClass("ended");
					_$btn.attr("disabled", "disabled");
					_$blocksLeft.text("Ended");
					_$currentMonarchCell.find(".label").text("Winner");
					_$alertsIcon.hide();
					_self.updateEndedStatus();
					return;
				}

				// Show status update if there was a refundsucces/failure on this block.
				if (refundSuccess || refundFailure) {
					const cls = refundSuccess ? "refunded" : "failure";
					const $link = refundSuccess
						? util.$getTxLink("Your last overthrow was refunded.", refundSuccess.transactionHash)
						: util.$getTxLink("Your last overthrow could not be refunded.", refundFailure.transactionHash);
					const msg = refundSuccess
						? `You were refunded because: "${refundSuccess.args.msg}"`
						: `You were unable to be refunded because: "${refundFailure.args.msg}"`;

					// show status cell with proper class.
					_$statusCell.removeClass("prepending pending refunded success failure").addClass(cls);
					_$txStatus.show();
					_$status.hide();

					// append a txStatus into it, and on clear reset it back to normal.
					const txStatus = util.getTxStatus({
						onClear: () => {
							setClass("");
							_$txStatus.empty().hide();
							_$status.show();
						}
					});
					txStatus.$e.appendTo(_$txStatus);
					txStatus.complete($link);
					if (refundSuccess) txStatus.addWarningMsg(msg);
					else txStatus.addFailureMsg(msg);
				}

				// trigger things based on deltas
				_$blocksLeft.text(blocksLeft);
				if (amNowLoser){
					_$status.empty()
						.append("You've been overthrown by ")
						.append(_$monarch.find("a").clone());
					_$e.removeClass("now-winner");
					_$e.removeClass("new-winner");
					flashClass("now-loser");

					_$currentMonarchCell.attr("title", "You've been overthrown!");
					const t = tippy(_$currentMonarchCell[0], {
						placement: "top",
						trigger: "manual",
						animation: "fade",
						onHidden: function(){ t.destroy(); }
					}).tooltips[0];
					t.show();
					setTimeout(function(){ t.hide(); }, 3000);
				} else if (amNowWinner) {
					_$status.empty().append(`You are the now current Monarch!<br>
						You'll win in ${blocksLeft} blocks unless you are overthrown.`);
					_$e.removeClass("now-loser");
					_$e.removeClass("new-winner");
					flashClass("now-winner");

					_$currentMonarchCell.attr("title", "You are the current Monarch!");
					const t = tippy(_$currentMonarchCell[0], {
						placement: "top",
						trigger: "manual",
						animation: "fade",
						onHidden: function(){ t.destroy(); }
					}).tooltips[0];
					t.show();
					setTimeout(function(){ t.hide(); }, 3000);
				} else if (isNewWinner) {
					_$status.empty()
						.append(_$monarch.find("a").clone())
						.append(" is now the Monarch.");
					_$e.removeClass("now-winner");
					_$e.removeClass("now-loser");
					flashClass("new-winner");
				} else {
					if (amWinner) {
						_$status.empty().append(`You are the current Monarch!<br>
						You'll win in ${blocksLeft} blocks unless you are overthrown.`);
					} else {
						_$status.empty()
							.append(_$monarch.find("a").clone())
							.append(` is the Monarch, and will win in ${blocksLeft} blocks unless they are overthrown.`);
					}
				}
				if (isNewBlock) flashClass("new-block");
				if (isNewPrize) flashClass("new-prize");
			});
		};

		function _triggerAlerts(blocksLeft, amNowLoser, newWinner){
			if (Object.keys(_alerts).length==0) return;
			const timeStr = util.getLocalTime();
			const newWinnerStr = _curMonarch == ethUtil.getCurrentAccount()
				? "You"
				: _curMonarch.slice(0, 10) + "...";
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

		function _overthrow(obj){
			const gasPrice = obj.gasPrice;
			const waitTimeMs = (obj.waitTimeS || _blocktime*3) * 1000;
			const decree = obj.decree;
			const setClass = (cls) => {
				_$statusCell.removeClass("prepending pending refunded success failure");
				_$statusCell.addClass(cls);
			}
			
			// create txStatus object, append it.
			setClass("prepending");
			_$txStatus.show();
			_$status.hide();
			_$btn.attr("disabled", "disabled");
			const txStatus = util.getTxStatus({
				waitTimeMs: waitTimeMs,
				onSuccess: (res, txStatus) => {
					const success = res.events.find(e => e.name=="OverthrowOccurred");
					const refundSuccess = res.events.find(e => e.name=="OverthrowRefundSuccess");
					if (refundSuccess) {
						setClass("refunded");
						txStatus.addWarningMsg(`Your overthrow was refunded: "${refundSuccess.args.msg}"`);
					} else if (success) {
						setClass("success");
						txStatus.addSuccessMsg(`Your overthow succeeded! Waiting for provider to sync...`);
						setTimeout(_self.refresh, 1000);
						setTimeout(_self.refresh, 5000);
					} else {
						setClass("failure");
						txStatus.addFailureMsg(`No events found. Please refresh the page.`);
					}
				},
				onFailure: (res, txStatus) => setClass("failure"),
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
				txStatus.setTxPromise(
					_game.overthrow({
						_decree: web3.fromUtf8(decree)
					},{
						gas: 50000,
						value: _fee,
						gasPrice: gasPrice
					})
				);
			} catch (e) {
				setClass("error");
				txStatus.fail(`Error: ${e.message.split("\n")[0]}`);
				ethStatus.open();
			}
		}

		function _sendPrize(obj) {
			const waitTimeS = obj.waitTimeS;
			const gasPrice = obj.gasPrice;
			const setClass = (cls) => {
				_$statusCell.removeClass("prepending pending refunded success failure");
				_$statusCell.addClass(cls);
			}
			
			// create txStatus object, append it.
			setClass("prepending");
			_$txStatus.show();
			_$status.hide();
			const txStatus = util.getTxStatus({
				waitTimeMs: (obj.waitTimeS || _blocktime*3) * 1000,
				onSuccess: (res, txStatus) => {
					// event SendPrizeError(uint time, string msg);
    				// event SendPrizeSuccess(uint time, address indexed redeemer, address indexed recipient, uint amount, uint gasLimit);
    				// event SendPrizeFailure(uint time, address indexed redeemer, address indexed recipient, uint amount, uint gasLimit);
					const success = res.events.find(e => e.name=="SendPrizeSuccess");
					const error = res.events.find(e => e.name=="SendPrizeError")
					const failure = res.events.find(e => e.name=="SendPrizeFailure");
					if (success) {
						setClass("success");
						const ethStr = util.toEthStrFixed(success.args.amount);
						txStatus.addSuccessMsg(`You were successfully sent ${ethStr}.`);
					} else if (failure) {
						setClass("failure");
						txStatus.addFailureMsg(`Address's fallback function throw an error.`);
					} else if (error) {
						setClass("refunded");
						const msg = error.args.msg;
						txStatus.addWarningMsg(`Did not send prize: ${msg}.`);
					}
				},
				onFailure: (res, txStatus) => setClass("failure"),
				onTxId: (txId) => setClass("pending"),
				onClear: () => {
					setClass("");
					_$txStatus.empty().hide();
					_$status.show();
				}
			});
			txStatus.$e.appendTo(_$txStatus);

			// create promise, or fail the TxStatus
			try {
				txStatus.setTxPromise(_game.sendPrize({_gasLimit: 0}, {gas: 100000, gasPrice: gasPrice}));
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
				_initOverthrowTip();
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
			const $tip = _$e.find(".send-prize-tip");
			const $prize = $tip.find(".prize");
			const $btn = $tip.find("button");

			const gps = util.getGasPriceSlider(20);
			gps.refresh();
			gps.$head.hide();
			gps.$e.appendTo($tip.find(".gas-price-ctnr"));

			(function attachTip(){
				tippy(_$sendPrizeIcon[0], {
					theme: "light",
					animation: "scale",
					placement: "top",
					trigger: "mouseenter",
					html: $tip.show()[0],
					onShow: function(){
						gps.refresh();
						$prize.text(ethUtil.toEthStr(_curPrize));
					},
					onHidden: function(){
						// fix firefox bug where tip won't reshow
						_$sendPrizeIcon[0]._tippy.destroy();
						attachTip();
					}
				});
			}());

			$btn.click(function(){
				_$sendPrizeIcon[0]._tippy.hide(0);
				_sendPrize({gasPrice: gps.getValue(), waitTimeS: gps.getWaitTimeS()});
			});
		};

		// init overthrow tip
		function _initOverthrowTip(){
			const $tip = _$e.find(".overthrow-tip");
			const $bidPrice = $tip.find(".bid-price");
			const $prize = $tip.find(".prize");
			const $prizeIncr = $tip.find(".prize-incr");
			const $reignBlocks = $tip.find(".reign-blocks");
			const $txtDecree = $tip.find(".txt-decree");

			const gps = util.getGasPriceSlider(20);
			gps.refresh();
			gps.$head.hide();
			gps.$e.appendTo($tip.find(".gas-price-ctnr"));

			// set priceIncr string
			const ethStr = util.toEthStrFixed(_prizeIncr.abs());
			const prizeIncrStr = _prizeIncr.equals(0)
				? ""
				: _prizeIncr.gt(0)
					? `The prize will go up by ${ethStr}`
					: `The prize will go down by ${ethStr}`;
			$prizeIncr.text(prizeIncrStr);
			$reignBlocks.text(`${_reignBlocks} blocks`);

			// set up decree
			var decree = "";
			$txtDecree.val("").on("input", updateDecree);
			updateDecree();
			function updateDecree() {
				const $err = $tip.find(".error").hide();
				const $display = $tip.find(".decree-display");

				const input = $txtDecree.val();
				const bytes23 = web3.fromUtf8(input).slice(0,48);
				decree = (function(){
					try { return web3.toUtf8(bytes23); }
					catch(e) { return "<invalid decree>"; }
				}());

				if (decree !== input) {
					$err.show();
					$display.text(decree);
				}
			}

			(function attachTip(){
				tippy(_$btn[0], {
					// arrow: false,
					theme: "light",
					animation: "fade",
					html: $tip.show()[0],
					onShow: function(){
						gps.refresh();
						$bidPrice.text(util.toEthStrFixed(_fee));
						$prize.text(util.toEthStrFixed(_curPrize));
						setTimeout(()=>$txtDecree.focus(), 500);
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
				_overthrow({decree: decree, gasPrice: gps.getValue(), waitTimeS: gps.getWaitTimeS()});
			});
		};

		_init();
	}
});