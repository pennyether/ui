Loader.require("vp")
.then(function(vp){
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		updateGames();
	});

	$(".refreshGames").click(updateGames)

	// Get all games created in the last N blocks, and collate
	//  their state to be up-to-date. (Eg: created / drawn / finalized).
	//
	// Note: It's possible a user has created a game way in the past
	//  and not taken any action. These games are still "alive"
	//  but _this_ UI will not show them. Otherwise, calls to
	//  the provider may become prohibitively expensive.
	//
	// For created games:
	//	 - Update the corresponding gameObj, or create a gameObj.
	// For drawn games:
	//	 - Update the corresponding gameObj, or create one if the
	//       the game resulted in a win. (If it's a loss, we assume
	//       the user is no longer interested.)
	// For finalized games:
	//   - Update the corresponding gameObj, or do nothing.
	//
	// The above handles showing all active games correctly.
	// 
	// However, there may be GameObj's that are waiting for
	//  some state change to occur (eg, bet, draw, finalized)
	//  These gameObjs should be "updated" with no new state.
	//  They should handle showing an error if it's been too long
	//  since receiving a receipt and since expecting new state.
	const gameObjs = [];
	function updateGames() {
		
		function updateGameObj(gameState, settings, createIfNotFound) {
			var gameObj = gameObjs.find(g => {
				return gameState.state == "dealt"
					? g.getGameState().uiid == gameState.uiid
					: g.getGameState().id == gameState.id;
			});

			// create gameObj if not found
			if (!gameObj && createIfNotFound) {
				gameObj = new Game(vp);
				$(".CurrentGame").prepend(gameObj.$e);
				gameObjs.push(gameObj);
			}

			// update gameObj, if exists
			if (gameObj) {
				// load the payTable, so game can display properly
				getPayTable(gameState.payTableId).then(pt => {
					gameState.payTable = pt;
					gameObj.setSettings(settings);
					gameObj.setGameState(gameState);
				});
			}
		}

		console.log(`Updating all games...`);
		const state = ethUtil.getCurrentStateSync();
		const curUser = state.account;
		const curBlock = state.latestBlock.number
		const blockCutoff = curBlock - 11500; // approx 48 hrs.
		Promise.all([
			vp.getEvents("BetSuccess", {user: curUser}, blockCutoff),
    		vp.getEvents("DrawSuccess", {user: curUser}, blockCutoff),
    		vp.getEvents("FinalizeSuccess", {user: curUser}, blockCutoff),
    		getVpSettings()
		]).then(arr=>{
			const settings = arr[3];
			const gamesBet = arr[0];
			const gamesDrawn = arr[1];
			const gamesFinalized = arr[2];
			const games = {};

			gamesBet.forEach((ev) => {
				const id = ev.args.id.toNumber();
				games[id] = {
					state: "dealt",
					id: id,
					uiid: ev.args.uiid.toNumber(),
					bet: ev.args.bet,
					payTableId: ev.args.payTableId,
					iBlock: ev.blockNumber,
					iBlockHash: ev.blockHash,
					iHand: PUtil.getIHand(ev.blockHash, id),
					draws: null,
					dBlock: null,
					dBlockHash: null,
					dHand: null,
					handRank: null,
					payout: null,
				};
			});
			gamesDrawn.forEach((ev) => {
				const id = ev.args.id.toNumber();
				const game = games[id];
				if (!game) return;

				game.state = "drawn";
				game.draws = ev.args.draws;
				game.dBlock = ev.blockNumber;
				game.dBlockHash = ev.blockHash;
				game.dHand = PUtil.getDHand(game.dBlockHash, id, game.iHand.toNumber(), ev.args.draws);
			});
			gamesFinalized.forEach((ev) => {
				const id = ev.args.id.toNumber();
				const game = games[id];
				if (!game) return;

				game.state = "finalized";
				game.dHand = game.dBlock
					? PUtil.getDHand(game.dBlockHash, id, game.iHand.toNumber(), game.draws)
					: games.iHand;
				game.handRank = ev.args.handRank;
				game.payout = ev.args.payout;
			});

			Object.values(games).forEach((game) => {
				// modify hands based on block timeouts
				if (game.state == "dealt") {
					if (game.iBlock + 255 < curBlock) {
						game.iHand = null;
					}
				} else if (game.state == "drawn") {
					if (game.dBlock + 255 < curBlock) {
						game.dHand = game.iHand;
					}
				}

				// update game objects, create if necessary
				if (game.state == "dealt")
					updateGameObj(game, settings, true);
				else if (game.state == "drawn")
					updateGameObj(game, settings, (game.dHand && game.dHand.isWinner()))
				else if (game.state == "finalized")
					updateGameObj(game, settings, false);
			});
		});
	}

	(function(){
		getVpSettings().then(settings=>{
			const gameObj = new Game(vp);
			gameObj.setSettings(settings);
			$(".CurrentGame").prepend(gameObj.$e);
			gameObjs.push(gameObj);
		});
	}());


	//////////////////////////////////////////////////////////////
	/// HELPER FUNCTIONS /////////////////////////////////////////
	//////////////////////////////////////////////////////////////

	// Returns a promise for a payTable -- memoized
	//  to save requests to the provider.
	var getPayTable = (function(){
		const promises = {};

		return function(id){
			if (id.toNumber) id = id.toNumber();

			if (!promises[id]) {
				promises[id] = vp.getPayTable([id]).then(pt=>{
					return pt.slice(1, -1);
				}).catch(e => {
					delete promises[id];
					throw e;
				});
			}
			return promises[id];
		}
	}());

	var getAverageBlockTime = (function(){
		var avgBlockTime = 15000;

		function updateAvgBlockTime() {
			ethUtil.getAverageBlockTime().then(timeMs=>{
				avgBlockTime = timeMs;
			});
		}
		setInterval(updateAvgBlockTime, 60000);
		updateAvgBlockTime();
		
		return function(){
			return avgBlockTime;
		}
	}());

	// Returns settings that all games need to know about.
	function getVpSettings() {
		return Promise.all([
			vp.minBet(),
			vp.maxBet(),
			vp.curMaxBet(),
			vp.getCurPayTable(),
			ethUtil.getCurrentState(false)
		]).then(arr => {
			return {
				minBet: arr[0],
				maxBet: BigNumber.min(arr[1], arr[2]),
				curPayTable: arr[3].slice(1,-1),
				latestBlock: arr[4].latestBlock,
				avgBlockTime: getAverageBlockTime()
			};
		});
	}
});

function Game(vp) {
	const _$e = $(".Game.template").clone().removeClass("template").show();
	const _$payTable = _$e.find(".payTable");
	// status
	const _$status = _$e.find(".gameStatus");
	const _$msg = _$status.find(".msg");
	const _$details = _$status.find(".details");
	const _$gameBet = _$details.find(".gameBet");
	const _$gameId = _$details.find(".gameId");
	const _$required = _$status.find(".required");
	// cards
	const _$cards = _$e.find(".cards .card").click(_toggleHold);
	// bet action
	const _$bet = _$e.find(".bet");
	const _$betSlider = _$bet.find(".betSlider");
	const _$betTxt = _$bet.find(".betTxt");
	const _$betErr = _$bet.find(".betErr").hide();
	// draw action
	const _$draw = _$e.find(".draw").hide();

	// finalize action
	const _$finalizeWin = _$e.find(".finalizeWin").hide();
	const _$finalizeLoss = _$e.find(".finalizeLoss").hide();
	const _$btnPlayAgain = _$e.find(".btnPlayAgain").click(()=>{
		_self.setGameState({state: "betting"});
	})

	// const _$logs = _$e.find(".logs").hide();
	const _self = this;

	// global params, set externally
	const _vp = vp;
	var _minBet;
	var _maxBet;
	var _curPayTable;
	var _latestBlock;
	var _avgBlockTime;

	// state of the currentGame
	var _gameState = {
		state: "betting"
	};

	const _onBetFns = [];
	const _onDrawFns = [];
	const _onFinalizeFns = [];

	_$betTxt.on("focus", function(){
		$(this).select();
	});
	_$betTxt.on("input", function(){
		const ether = Number($(this).val());
		if (Number.isNaN(ether)) return;
		_$betSlider.val(ether);
		_refreshBet();
	});
	_$betSlider.on("input", function(){
		const ether = Number($(this).val());
		_$betTxt.val(ether);
		_refreshBet();
	});


	this.$e = _$e;
	this.setOnBet = function(fn){ _onBetFns.push(fn); }
	this.setOnDraw = function(fn){ _onDrawFns.push(fn); }
	this.setOnFinalize = function(fn){ _onFinalizeFns.push(fn); }

	this.getGameState = ()=>_gameState;

	// Sets global settings, so betUI and blocktimes are accurate.
	this.setSettings = function(settings) {
		_minBet = settings.minBet;
		_maxBet = settings.maxBet;
		_curPayTable = settings.curPayTable;
		_latestBlock = settings.latestBlock;
		_avgBlockTime = settings.avgBlockTime;
		_refreshBetScale();
		_refreshPayTable();
	}

	this.setGameState = function(gameState) {
		_gameState = gameState;
		_refreshGame();
	}

	// Redraws entire game based on the state
	// Called by "updateGameState"
	function _refreshGame() {
		_$bet.hide();
		_$draw.hide();
		_$finalizeWin.hide();
		_$finalizeLoss.hide();

		if (_gameState.state=="betting") {
			_$bet.show();
			_$msg.text(`Select a bet amount, and press "Deal"`)
			_$details.hide();
			_$required.hide();
			return;
		};

		_refreshPayTable();
		_$details.show();
		_$gameBet.text(`${_gameState.bet} ETH`);
		_$gameId.text(`Game #${_gameState.id}`);
		if (_gameState.state == "dealt") {
			_$draw.show();

			const blocksLeft = 256 - (_latestBlock.number - _gameState.iBlock);
			if (blocksLeft >= 1) {
				_$msg.text(`Dealt. iHand: ${_gameState.iHand}.`);
				_$required.text(`You should draw within ${blocksLeft} blocks.`).show();
				_refreshHand(_gameState.iHand, 31);
			} else {
				_$msg.text(`Dealt, but iHand no longer available.`);
				_$required.hide();
				_refreshHand(null);
			}
		}

		if (_gameState.state == "drawn") {
			const isWinner = _gameState.dHand.isWinner();
			_refreshHand(_gameState.dHand, _gameState.draws);

			if (isWinner){
				_$finalizeWin.show();
				const blocksLeft = 256 - (_latestBlock.number - _gameState.iBlock);
				setTimeout(()=>{
					_$e.addClass("isWinner");
					_$payTable.find("tr").eq(_gameState.dHand.getRank()).addClass("won");
				}, 100);
				_$msg.empty().append(`You won!<br>iHand: ${_gameState.iHand}<br>dHand: ${_gameState.dHand}`);
				_$required.text(`You should finalize within ${blocksLeft} blocks.`).show();
			} else {
				_$finalizeLoss.show();
				_$msg.empty().append(`You Lost.<br>iHand: ${_gameState.iHand}<br>dHand: ${_gameState.dHand}`);
			}
		}

		if (_gameState.state == "finalized") {
			const isWinner = _gameState.dHand.isWinner();
			if (isWinner) {
				setTimeout(()=>{
					_$e.addClass("isWinner");
					_$payTable.find("tr").eq(_gameState.dHand.getRank()).addClass("won");
				}, 100);
				_refreshHand(_gameState.dHand, _gameState.draws);
			}
			_$msg.empty().append(`Finalized with hand: ${_gameState.dHand}<br>Payout: ${_gameState.payout} ETH`);
		}
	}

	function _refreshHand(hand, draws) {
		if (hand == null) {
			_$cards.addClass("none");
			_$cards.removeClass("held");
			_$cards.empty();
			return;
		}

		if (draws.toNumber) draws = draws.toNumber();
		hand.cards.forEach((c,i)=>{
			const $card = _$cards.eq(i);
			const isDrawn = draws & Math.pow(2, i);
			$card.text(c.toString());
			if (isDrawn) $card.removeClass("held");
			else $card.addClass("held");
		});
	}

	function _toggleHold(){
		if (_gameState.state != "dealt") return;
		$(this).toggleClass("held");
	}

	// Sets the "bet" range and text to accomodate new min/max bets
	function _refreshBetScale() {
		// Determine a convenient _rounding step
		let minBetEther = _minBet.div(1e18);
		let maxBetEther = _maxBet.div(1e18);
		let difference = maxBetEther.minus(minBetEther);
		if (difference <= .1) _rounding = .001;
		else _rounding = .01;

		// set the wager inputs accordingly
		let minBetRounded = minBetEther.div(_rounding).ceil().mul(_rounding).toNumber();
		let maxBetRounded = maxBetEther.div(_rounding).floor().mul(_rounding).toNumber();
		_$betSlider.attr("min", minBetRounded)
			.attr("max", maxBetRounded)
			.attr("step", _rounding);
		_$betTxt.attr("min", minBetRounded)
			.attr("max", maxBetRounded)
			.attr("step", _rounding);

		// wagerRange to be positioned correctly relative to bet
		var bet = Number(_$betTxt.val());
		if (!Number.isNaN(bet)){
			bet = Math.min(maxBetRounded, bet);
			bet = Math.max(minBetRounded, bet);
			_$betTxt.val(bet);
			_$betSlider.val(bet);
		}

		_refreshBet();
	}

	// draws proper multipliers in the paytable, from gameState or curPayTable
	function _refreshPayTable() {
		const payTable = _gameState.state == "betting"
			? _curPayTable
			: _gameState.payTable;

		const bet = _getBet();

		// draw multipliers
		const $rows = _$payTable.find("tr");
		payTable.forEach((v,i)=>{
			$rows.eq(i+1).find("td").eq(1).text(`${v} x`);
		});

		// draw payouts
		if (bet!==null) {
			betEth = bet.div(1e18);
			const betStr = betEth.toFixed(3);
			$rows.eq(0).find("td").eq(2).text(`Payout (for ${betStr} ETH bet)`);
			payTable.forEach((v,i)=>{
				const payout = (betEth * v).toFixed(3);
				$rows.eq(i+1).find("td").eq(2).text(`${payout} ETH`);
			});
		} else {
			payTable.forEach((v,i)=>{
				$rows.eq(i+1).find("td").eq(2).text(`--`);
			});
		}
	}

	// updates the bet txt and range, as well as payouts
	function _refreshBet() {
		if (_gameState.state != "betting") return;

		_$betErr.hide();
		const bet = _getBet();
		if (bet === null) {
			_$betErr.text("Bet must be a number").show();
			_refreshPayTable();
			return;
		}

		const betStr = ethUtil.toEthStr(bet);
		const minBetStr = ethUtil.toEthStr(_minBet);
		const maxBetStr = ethUtil.toEthStr(_maxBet);
		if (bet.lt(_minBet)) {
			_$betErr.text(`Bet must be above ${minBetStr}`).show();
			return;
		}
		if (bet.gt(_maxBet)) {
			_$betErr.text(`Bet must be below ${maxBetStr}`).show();
			return;	
		}
		_refreshPayTable();
	}

	function _getBet() {
		if (_gameState.bet) { return _gameState.bet; }
		var bet = _$betTxt.val();
		try { bet = (new BigNumber(bet)).mul(1e18); }
		catch (e) { bet = null; }
		return bet;
	}

	function _getDraws() {
		var drawsNum = 0;
		_$cards.each(function(i,c){
			drawsNum += $(c).is(".held") ? 0 : Math.pow(2,i);
		});
		return drawsNum;
	}

	function _initDealButton() {
    	const gps = util.getGasPriceSlider(5);
    	const $btn = _$bet.find(".btnDeal");
    	const $statusArea = _$bet.find(".statusArea");
    	const $tip = $("<div></div>").show().append(gps.$e);

    	(function attachTip(){
    		tippy($btn[0], {
				// arrow: false,
				theme: "light",
				animation: "fade",
				placement: "top",
				html: $tip[0],
				trigger: "mouseenter",
				onShow: function(){ gps.refresh(); },
				onHidden: function(){
					// fixes a firefox bug where the tip won't be displayed again.
					$btn[0]._tippy.destroy();
					attachTip();
				}
			});
    	}());

		$btn.click(function(){
			this._tippy.hide(0);
			$(this).blur();
			if ($(this).is(".disabled")) return;
			
			const bet = _getBet();
			if (bet===null) { return; }
			
			try {
				// set uiid (so upon receiving event we can link it to this game)
				// change button state.
				// create reset() function.
				const uiid = Math.floor(Math.random()*1000000000000);
				_gameState.uiid = uiid;
				$btn.attr("disabled", "disabled").addClass("disabled").text("Dealing...");
				const reset = ()=>{ 
					delete _gameState.uiid;
					$btn.removeAttr("disabled").removeClass("disabled").text("Deal");
				}
				
				const promise = vp.bet([uiid], {value: bet, gas: 130000, gasPrice: gps.getValue()});
				const $txStatus = util.$getTxStatus(promise, {
					waitTimeMs: (gps.getWaitTimeS() || 30) * 1000,
					onClear: () => { $statusArea.hide(); },
					onSuccess: (res) => {
						const betSuccess = res.events.find(e=>e.name=="BetSuccess");
						const betFailure = res.events.find(e=>e.name=="BetFailure");
						if (betSuccess) {
							const id = betSuccess.args.id.toNumber();
							const msg = `<br>Your cards will be shown shortly...`;
							$txStatus.find(".status").append(msg);
							$txStatus.find(".clear").hide();
							$btn.text("Dealt!");
						} else if (betFailure) {
							const msg = `<br>Your bet was refunded: ${betFailure.args.msg}`;
							$txStatus.find(".status").append(msg);
							reset();
						} else {
							const msg = `<br>Did not receive an expected event!`
							$txStatus.find(".status").append(msg);
							reset();
						}
					},
					onFailure: () => { reset(); }
				});
				$statusArea.empty().show().append($txStatus);
			} catch(e) {
				reset();
				ethStatus.open();
			}
	    });
    }

    function _initDrawButton() {
    	const gps = util.getGasPriceSlider(5);
    	const $statusArea = _$draw.find(".statusArea");
    	const $btn = _$draw.find(".btnDraw");
    	const $tip = $("<div></div>").show().append(gps.$e);

    	(function attachTip(){
    		tippy($btn[0], {
				// arrow: false,
				theme: "light",
				animation: "fade",
				placement: "top",
				html: $tip[0],
				trigger: "mouseenter",
				onShow: function(){ gps.refresh(); },
				onHidden: function(){
					// fixes a firefox bug where the tip won't be displayed again.
					$btn[0]._tippy.destroy();
					attachTip();
				}
			});
    	}());

		$btn.click(function(){
			this._tippy.hide(0);
			$(this).blur();
			if ($(this).is(".disabled")) return;
			
			const draws = _getDraws();
			if (draws == 0) {
				_gameState.state = "drawn";
				_gameState.dHand = _gameState.iHand;
				_gameState.dBlock = _gameState.iBlock;
				_refreshGame();
				return;
			}
			
			try {
				$btn.attr("disabled", "disabled").addClass("disabled").text("Drawing...");
				const reset = ()=>{ $btn.removeAttr("disabled").removeClass("disabled").text("Draw"); }
				
				const params = [_gameState.id, draws, _gameState.iBlockHash];
				const promise = vp.draw(params, {gas: 130000, gasPrice: gps.getValue()});
				const $txStatus = util.$getTxStatus(promise, {
					waitTimeMs: (gps.getWaitTimeS() || 30) * 1000,
					onClear: () => { $statusArea.hide(); },
					onSuccess: (res) => {
						const drawSuccess = res.events.find(e=>e.name=="DrawSuccess");
						const drawFailure = res.events.find(e=>e.name=="DrawFailure");
						if (drawSuccess) {
							const msg = `<br>Your drawn cards will be shown shortly...`;
							$txStatus.find(".status").append(msg);
							$txStatus.find(".clear").hide();
							$btn.text("Drawn!");
						} else if (drawFailure) {
							const msg = `<br>Drawing failed: ${drawFailure.args.msg}`;
							$txStatus.find(".status").append(msg);
							reset();
						} else {
							const msg = `<br>Did not receive an expected event!`
							$txStatus.find(".status").append(msg);
							reset();
						}
					},
					onFailure: () => { reset(); }
				});
				$statusArea.empty().show().append($txStatus);
			} catch(e) {
				console.log(e);
				reset();
				ethStatus.open();
			}
	    });
    }

    function _initFinalizeButton() {
		const gps = util.getGasPriceSlider(5);
		const $statusArea = _$finalizeWin.find(".statusArea");
    	const $btn = _$finalizeWin.find(".btnFinalize");
    	const $tip = $("<div></div>").show().append(gps.$e);

    	(function attachTip(){
    		tippy($btn[0], {
				// arrow: false,
				theme: "light",
				animation: "fade",
				placement: "top",
				html: $tip[0],
				trigger: "mouseenter",
				onShow: function(){ gps.refresh(); },
				onHidden: function(){
					// fixes a firefox bug where the tip won't be displayed again.
					$btn[0]._tippy.destroy();
					attachTip();
				}
			});
    	}());

		$btn.click(function(){
			this._tippy.hide(0);
			$(this).blur();
			if ($(this).is(".disabled")) return;
			
			try {
				$btn.attr("disabled", "disabled").addClass("disabled").text("Drawing...");
				const reset = ()=>{ $btn.removeAttr("disabled").removeClass("disabled").text("Draw"); }
				
				const params = [_gameState.id, _gameState.dBlockHash];
				const promise = vp.finalize(params, {gas: 130000, gasPrice: gps.getValue()});
				const $txStatus = util.$getTxStatus(promise, {
					waitTimeMs: (gps.getWaitTimeS() || 30) * 1000,
					onClear: () => { $statusArea.hide(); },
					onSuccess: (res) => {
						const success = res.events.find(e=>e.name=="FinalizeSuccess");
						const failure = res.events.find(e=>e.name=="FinalizeFailure");
						if (success) {
							const msg = `<br>Finalization success. Credited: ${success.args.payout} Eth`;
							$txStatus.find(".status").append(msg);
							$txStatus.find(".clear").hide();
							$btn.text("Finalized!");
						} else if (failure) {
							const msg = `<br>Finalizing failed: ${failure.args.msg}`;
							$txStatus.find(".status").append(msg);
							reset();
						} else {
							const msg = `<br>Did not receive an expected event!`
							$txStatus.find(".status").append(msg);
							reset();
						}
					},
					onFailure: () => { reset(); }
				});
				$statusArea.empty().show().append($txStatus);
			} catch(e) {
				console.log(e);
				reset();
				ethStatus.open();
			}
	    });
    }

	(function _init() {
		_initDealButton();
		_initDrawButton();
		_initFinalizeButton();
		_refreshGame();
	}());
}

var PUtil = (function(){
	function PokerUtil() {
	    // Takes an array of ints (0 to 51), or a number/BigNumber where
	    //  each 6 bits represents a card (0 to 51).
	    // Can return the Hand as a number, can rank the hand, and can
	    //  test if the hand is valid.
	    function Hand(numOrArray) {
	        // _cards will be set to an array of cards between 0-51
	        // If any card is invalid, _cards will be an empty array.
	        // Does not check for duplicates.
	        const _cards = (function(){
	            if (!numOrArray) return [];
	            function cardFromNum(cardNum) {
	                if (typeof cardNum !== "number") return null;
	                return {
	                    cardNum: cardNum,
	                    val: cardNum % 13,
	                    suit: Math.floor(cardNum / 13),
	                    isAce: cardNum % 13 == 0,
	                    toString: ()=>cardToString(cardNum)
	                };
	            }

	            var arr;
	            if (Array.isArray(numOrArray)){
	                arr = numOrArray.map(cardFromNum);  
	            } else {
	                numOrArray = numOrArray.toNumber ? numOrArray.toNumber() : numOrArray;
	                arr = [0,1,2,3,4].map(i => {
	                    const mask = 63 * Math.pow(2, 6*i);
	                    const cardNum = (numOrArray & mask) / Math.pow(2, 6*i);
	                    return cardFromNum(cardNum);
	                });
	            }
	            arr = arr.filter(c => !!c);
	            if (arr.length != 5) arr = [];
	            return arr;
	        }());

	        this.cards = _cards;
	        
	        this.clone = function(){
	            return new Hand(_cards);
	        }

	        this.toNumber = function(){
	            var num = 0;
	            _cards.forEach((c,i) => {
	                const mask = c.cardNum * Math.pow(2, 6*i);
	                num = num + mask;
	            });
	            return num;
	        }

	        // True if all 5 cards are unique, and between 0-51
	        this.isValid = function(){
	            if (_cards.length != 5) return false;
	            if (numOrArray == 0) return false;
	            if (_cards.some(c => c.cardNum > 51)) return false;

	            // ensure there are 5 unique card values
	            const seen = {};
	            _cards.forEach(c => seen[c.cardNum] = true)
	            return Object.keys(seen).length == 5;
	        }

	        this.toString = function(){
	            if (!this.isValid()) return '[InvalidHand]';
	            const cardsStr = _cards.map(c => c.toString()).join(", ");
	            return `${cardsStr} [(${this.toNumber()}) ${this.getRankString()}]`;
	        }

	        this.isWinner = function(){
	        	return this.getRank() <= 9;
	        }

	        this.getRank = function(){
	            if (this.isValid()) {
	                if (this.isRoyalFlush()) return 1;
	                else if (this.isStraightFlush()) return 2;
	                else if (this.isFourOfAKind()) return 3;
	                else if (this.isFullHouse()) return 4;
	                else if (this.isFlush()) return 5;
	                else if (this.isStraight()) return 6;
	                else if (this.isThreeOfAKind()) return 7;
	                else if (this.isTwoPair()) return 8;
	                else if (this.isJacksOrBetter()) return 9;
	                else return 10;
	            } else {
	                return 11;
	            }
	        }

	        this.getRankString = function(){
	            return ({
	                1: "Royal Flush",
	                2: "Straight Flush",
	                3: "Four of a Kind",
	                4: "Full House",
	                5: "Flush",
	                6: "Straight",
	                7: "Three of a Kind",
	                8: "Two Pair",
	                9: "Jacks or Better",
	                10: "High Card",
	                11: "Not Computable"
	            })[this.getRank()];
	        }

	        this.isRoyalFlush = function() {
	            const hasAce = _cards.some(c => c.isAce);
	            const highVal = max(_cards.map(c => c.val));
	            return hasAce && highVal == 12 && this.isStraightFlush();
	        }
	        this.isStraightFlush = function() {
	            return this.isStraight() && this.isFlush();
	        }
	        this.isFourOfAKind = function(){
	            return hasCounts([4,1]);
	        }
	        this.isFullHouse = function(){
	            return hasCounts([3,2]);
	        }
	        this.isFlush = function(){
	            return _cards.every(c => c.suit == _cards[0].suit);
	        }
	        this.isStraight = function(){
	            if (!hasCounts([1,1,1,1,1])) return;
	            const hasAce = _cards.some(c => c.isAce);
	            const highValNonAce = max(_cards.map(c => c.isAce ? 0 : c.val));
	            const lowValNonAce = min(_cards.map(c => c.isAce ? 100 : c.val));
	            return hasAce
	                ? highValNonAce == 4 || lowValNonAce == 9
	                : highValNonAce - lowValNonAce == 4;
	        }
	        this.isThreeOfAKind = function(){
	            return hasCounts([3,1,1]);
	        }
	        this.isTwoPair = function(){
	            return hasCounts([2,2,1]);
	        }
	        this.isJacksOrBetter = function(){
	            if (!hasCounts([2,1,1,1])) return;
	            const counts = (new Array(13)).fill(0);
	            _cards.forEach(c => counts[c.val]++);
	            return [0, 10,11,12,13].some(val => counts[val]>1);
	        }

	        function min(arr){ return Math.min.apply(Math, arr); }
	        function max(arr){ return Math.max.apply(Math, arr); }
	        function hasCounts(arr) {
	            var counts = (new Array(13)).fill(0);
	            _cards.forEach(c => counts[c.val]++);
	            counts = counts.filter(c => !!c).sort();
	            return arr.sort().every((exp,i) => exp===counts[i]);
	        }
	        function cardToString(cardNum) {
				const valStr = (function(val){
                    if (val == 0) return 'A';
                    if (val <= 9) return `${val+1}`;
                    if (val == 10) return "J";
                    if (val == 11) return "Q";
                    if (val == 12) return "K";
                }(cardNum % 13));
                const suitStr = (function(suit){
                    if (suit == 0) return 's';
                    if (suit == 1) return 'h';
                    if (suit == 2) return 'd';
                    if (suit == 3) return 'c';
                }(Math.floor(cardNum / 13)));
                return `${valStr}${suitStr}`;
	        }
	    }

	    // - blockhash: a string of hexEncoded 256 bit number
	    // - gameId: a number or BigNumber
	    function getIHand(blockhash, gameId) {
	        const idHex = _toPaddedHex(gameId, 32);
	        const hexHash = web3.sha3(blockhash + idHex, {encoding: "hex"});
	        const cardNums = _getCardsFromHash(hexHash, 5);
	        return new Hand(cardNums);
	    }

	    // - blockhash: a string of hexEncoded 256 bit number
	    // - gameId: a number or BigNumber
	    // - iHand: number of the original hand.
	    // - drawsNum: from 0 to 63.
	    function getDHand(blockhash, gameId, iHandNum, drawsNum) {
	        // get 5 new cards
	        const idHex = _toPaddedHex(gameId, 32);
	        const hexHash = web3.sha3(blockhash + idHex, {encoding: "hex"});
	        return _drawCardsFromHash(hexHash, iHandNum, drawsNum);
	    }

	    function _drawCardsFromHash(hexHash, iHandNum, drawsNum) {
	        // get 5 cards
	        const iHand = new Hand(iHandNum);
	        const excludedCardNums = iHand.cards.map(c => c.cardNum);
	        const newCards = _getCardsFromHash(hexHash, 5, excludedCardNums);

	        // swap out oldCards for newCards.
	        const drawsArr = [0,0,0,0,0];
	        if (drawsNum & 1) drawsArr[0] = 1;
	        if (drawsNum & 2) drawsArr[1] = 1;
	        if (drawsNum & 4) drawsArr[2] = 1;
	        if (drawsNum & 8) drawsArr[3] = 1;
	        if (drawsNum & 16) drawsArr[4] = 1;
	        const oldCards = iHand.cards.map(c => c.cardNum);
	        const cards = drawsArr.map((useNew, i)=>{
	            return useNew ? newCards[i] : oldCards[i];
	        })

	        // return hand
	        return new Hand(cards);
	    }

	    function _getCardsFromHash(hexHash, numCards, excludedCardNums) {
	        if (!excludedCardNums) excludedCardNums = [];
	        const cardNums = [];
	        while (cardNums.length < numCards) {
	            const cardNum = (new BigNumber(hexHash)).mod(52).toNumber();
	            if (excludedCardNums.indexOf(cardNum) === -1) {
	                excludedCardNums.push(cardNum);
	                cardNums.push(cardNum);
	            }
	            hexHash = web3.sha3(hexHash, {encoding: "hex"});
	        }
	        return cardNums;
	    }

	    function _toPaddedHex(num, bits) {
	        num = new BigNumber(num);
	        const targetLen = Math.ceil(bits / 4);
	        const hexStr = num.toString(16);
	        if (hexStr.length > targetLen)
	            throw new Error(`Cannot convert ${num} to ${bits} bits... it's too large.`);
	        const zeroes = (new Array(targetLen-hexStr.length+1)).join("0");
	        return `${zeroes}${hexStr}`;
	    }

	    function _cardToUnicode(i){
	        const suit = String.fromCharCode(Math.floor(i/13) + 'A'.charCodeAt(0));
	        var val = i % 13;
	        if (val > 10) val = val+1;
	        val = Number(val+1).toString(16);
	        return String.fromCodePoint(code);
	    }

	    // Return an object with useful functions.
	    this.Hand = Hand;
	    this.getIHand = getIHand;
	    this.getDHand = getDHand;
	}
	return new PokerUtil();
}());