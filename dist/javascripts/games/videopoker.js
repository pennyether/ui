Loader.require("vp")
.then(function(vp){
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		syncAllGames().then(syncUserCredits);
	});

	const $gameCtnr = $("#Machine .game-ctnr");
	const $tabberCtnr = $("#Machine .tabber-ctnr");
	const $credits = $("#Machine .credits-ctnr");


	const tabber = new Tabber();
	tabber.onNewGame(()=>{
		const game = createGame(null, getVpSettings(false));
		tabber.selectGame(game);
	});
	tabber.onSelected((game) => {
		$gameCtnr.children().detach();
		$gameCtnr.append(game.$e);
		game.$e.removeClass("shown");
		setTimeout(()=>{ game.$e.addClass("shown"); }, 10);
	})
	$tabberCtnr.append(tabber.$e);

	// An id-mapping of gameState objects' blockchain values.
	// These are generated from collating events, and may change
	//  if there's a block re-org.
	var gameStates = {};

	function createGame(gameState, settings) {
		if (!gameState) gameState = {state: "betting"};
		
		game = new Game(vp);
		game.onEvent(updateGameFromEvent);
		game.setSettings(settings);
		game.setGameState(gameState);
		tabber.addTab(game);
		return game;
	}

	// Updates a Game's settings and state, and optionally creates it.
	function updateGame(gameState, settings, createIfNotFound) {
		var game = tabber.getGames().find(g => {
			return gameState.state == "dealt"
				? g.getGameState().uiid == gameState.uiid
				: g.getGameState().id == gameState.id;
		});

		if (game) {
			game.setSettings(settings);
			game.setGameState(gameState);
			tabber.refreshDeletable(game);
		} else {
			if (createIfNotFound) createGame(gameState, settings);
		}
	}

	// - Creates all bet or drawn+won Games.
	// - Updates all drawn game's states.
	// - Notifies falsely-existant game's of their perile.
	function updateGames(settings) {
		// Creating mapping of all game ids.
		const touchedIds = {};
		tabber.getGames().forEach(g => {
			const id = g.getGameState().id;
			if (id) touchedIds[id] = false;
		});

		// Update games (create if necessary)
		Object.values(gameStates).forEach(gs => {
			touchedIds[gs.id] = true;
			updateGame(gs, settings, gs.isActive);
		});

		// These games are in the Tabber, but not the blockchain.
		// Set them all as invalid, since they are old or not the user's.
		const unTouchedIds = Object.keys(touchedIds).filter(id=>!touchedIds[id]);
		unTouchedIds.forEach(id=>{
			const game = tabber.getGames().find(g => g.getGameState().id==id);
			const gameState = game.getGameState();
			gameState.state = "invalid";
			gameState.isActive = false;
			updateGame(gameState);
		});

		if (!tabber.hasTabs()) createGame(null, settings);
	}

	// Collates event data into gameState, and updates the Game
	// This should be called from within games when they receive an event.
	function updateGameFromEvent(ev) {
		const gameState = updateGameStateFromEvent(ev);
		updateGame(gameState);
	}

	// Updates a gameState from an event received.
	function updateGameStateFromEvent(ev) {
		const id = ev.args.id.toNumber();
		var gs = gameStates[id];
		const curBlock = ethUtil.getCurrentStateSync().latestBlock.number;

		// Clobber gameState with data from event.
		if (ev.name == "BetSuccess") {
			gs = {
				state: "dealt",
				id: id,
				uiid: ev.args.uiid.toNumber(),
				bet: ev.args.bet,
				payTableId: ev.args.payTableId,
				payTable: getPayTable(ev.args.payTableId.toNumber()),
				iBlock: ev.blockNumber,
				iBlockHash: ev.blockHash,
				iHand: PUtil.getIHand(ev.blockHash, id),
				draws: new BigNumber(0),
				dBlock: null,
				dBlockHash: null,
				dHand: null,
				handRank: null,
				payout: null,
				isActive: true,
			};
			// compute iHand, dHand
			gs.iHand = gs.iBlock + 255 >= curBlock ? gs.iHand : new PUtil.Hand(0);
			gameStates[id] = gs;
			return gs;
		}

		// Tack on draw data, if we've seen the game bet.
		if (ev.name == "DrawSuccess") {
			if (!gs) return;

			gs.state = "drawn";
			gs.draws = ev.args.draws;
			gs.dBlock = ev.blockNumber;
			gs.dBlockHash = ev.blockHash;
			gs.iHand = new PUtil.Hand(ev.args.iHand);

			// compute iHand, dHand, handRank, payout
			gs.dHand = PUtil.getDHand(gs.dBlockHash, id, gs.iHand.toNumber(), gs.draws)
			gs.dHand = gs.dBlock + 255 >= curBlock ? gs.dHand : gs.iHand;
			gs.handRank = gs.dHand.getRank();
			gs.payout = gs.bet.mul(gs.payTable[gs.handRank]);
			gs.isActive = gs.payout.gt(0) ? true : false;
			return gs;
		}

		// Tack on finalization data, if we've seen the game bet.
		if (ev.name == "FinalizeSuccess") {
			if (!gs) return;

			gs.state = "finalized";
			gs.dHand = new PUtil.Hand(ev.args.dHand);
			gs.handRank = ev.args.handRank.toNumber();
			gs.payout = ev.args.payout;
			gs.isActive = false;
			return gs;
		}

		throw new Error(`Unexpected event: ${ev.name}`);
	}

	// - Loads all pending gameStates from events, adds to tabber.
	// - Notifies any tabbed games (with no events) of error.
	//
	// Note: It's possible a user has created a game way in the past
	//  and not taken any action. These games are still "alive"
	//  but _this_ UI will not show them. Otherwise, calls to
	//  the provider may become prohibitively expensive.
	function syncAllGames() {
		const state = ethUtil.getCurrentStateSync();
		const curUser = state.account;
		if (!curUser) { return; }

		const blockCutoff = state.latestBlock.number - 11520; // approx 48 hrs.
		return Promise.all([
			vp.getEvents("BetSuccess", {user: curUser}, blockCutoff),
    		vp.getEvents("DrawSuccess", {user: curUser}, blockCutoff),
    		vp.getEvents("FinalizeSuccess", {user: curUser}, blockCutoff),
    		getVpSettings(true),
    		loadPayTables()
		]).then(arr=>{
			// Reset known gameStates to nothing.
			gameStates = {};

			// Update states of all the games we've gotten.
			// First BetSuccess, then DrawSuccess, then FinalizeSuccess.
			arr[0].forEach(updateGameStateFromEvent);
			arr[1].forEach(updateGameStateFromEvent);
			arr[2].forEach(updateGameStateFromEvent);

			// Update game objects, creating tabs if necessary
			updateGames(arr[3]);
		});
	}

	function syncUserCredits(){
		const state = ethUtil.getCurrentStateSync();
		const curUser = state.account;
		if (!curUser) {
			$credits.text("No account");
			return;
		}
		vp.credits([curUser]).then(eth=>{
			$credits.text(`${ethUtil.toEth(eth)} ETH`);
		})
	}


	//////////////////////////////////////////////////////////////
	/// HELPER FUNCTIONS /////////////////////////////////////////
	//////////////////////////////////////////////////////////////

	const payTables = [];
	function loadPayTables() {
		return vp.numPayTables().then((n)=>{
			n = n.toNumber();
			
			const promises = [];
			for (var i=payTables.length; i<n; i++) {
				let index = i;
				promises.push(vp.getPayTable([index]).then(pt => {
					payTables[index] = pt;
				}));
			}
			return Promise.all(promises);
		});
	}
	function getPayTable(i) {
		if (!payTables[i]) throw new Error(`Paytable #${i} not yet loaded.`);
		return payTables[i];
	}

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
	var getVpSettings = (function(){
		var curSettings;

		return function getVpSettings(fresh) {
			if (!fresh) return curSettings;

			return Promise.all([
				vp.minBet(),
				vp.maxBet(),
				vp.curMaxBet(),
				vp.getCurPayTable(),
				ethUtil.getCurrentState(false)
			]).then(arr => {
				curSettings = {
					minBet: arr[0],
					maxBet: BigNumber.min(arr[1], arr[2]),
					curPayTable: arr[3],
					latestBlock: arr[4].latestBlock,
					avgBlockTime: getAverageBlockTime()
				};
				return curSettings;
			});
		}
	}());
});

// Simple tabber that understands what games are.
// Listens for game events and displays summary in tab.
// Only allows closing of tab for non-active games.
function Tabber() {
	const _self = this;

	const _$e = $(`
		<div class="Tabber">
			<div class='tab new'>
				<div>New Machine...</div>
			</div>
		</div>
	`);

	var _onNewGame = ()=>{};
	var _onSelected = ()=>{};

	const _$newTab = _$e.find(".tab.new").click(function(){
		_onNewGame();
	});

	// an array of tabs to tabObjs
	const _tabs = [];

	this.onNewGame = function(fn) { _onNewGame = fn; };
	this.onSelected = function(fn) { _onSelected = fn; };
	this.addTab = function(game) {
		const tab = {};
		_tabs.push(tab);

		// create tab element, clicking selects it, animate it in.
		const $e = $(`
			<div class='tab shrunken'>
				<div class="remove">×</div>
				<div class="title">Machine 1</div>
				<div class="status"></div>
			</div>
		`).click(()=>{ _self.selectTab(tab); }).insertBefore(_$newTab);
		setTimeout(()=>{ $e.removeClass("shrunken"); }, 10);

		// initialize the elements
		const $remove = $e.find(".remove").click((e) => {
			e.stopPropagation();
			_self.deleteTab(tab);
		});
		$e.find(".title").text(`Machine ${_tabs.length}`);
		$e.find(".status").append(game.$ms);

		// set tab properties
		tab.$e = $e;
		tab.$remove = $remove;
		tab.game = game;
		tab.isSelected = false;

		// refresh delete button, select tab if its the only one
		if (_tabs.length == 1) _self.selectTab(tab);
		_self.refreshDeletable();
		return tab;
	}
	this.deleteTab = function(tab) {
		tab.$e.addClass("shrunken");
		setTimeout(()=>{ tab.$e.remove(); }, 200);
		const index = _tabs.indexOf(tab);
		_tabs.splice(index, 1);
		if (tab.isSelected) {
			// select the tab to the right, or left.
			_self.selectTab(_tabs[index] ? _tabs[index] : _tabs[index-1]);
		}
		_self.refreshDeletable();
	}
	this.selectTab = function(tab){
		if (!tab) return;
		_tabs.forEach(t => {
			t.isSelected = t == tab;
			t.isSelected ? t.$e.addClass("selected") : t.$e.removeClass("selected");
		});
		_onSelected(tab.game);
	}
	this.selectGame = function(game) {
		_self.selectTab(_tabs.find(t => t.game == game));
	}
	this.hasTabs = function(){
		return _tabs.length > 0;
	}
	this.getGames = function(){
		return _tabs.map(t=>t.game);
	}
	this.refreshDeletable = function(){
		if (_tabs.length == 1) { _tabs[0].$remove.hide(); return; }
		_tabs.forEach(t=>{
			t.game.getGameState().isActive ? t.$remove.hide() : t.$remove.show();	
		});
	}
	this.$e = _$e;
}

// Game Object that gets it state set externally.
// - Allows for pub/sub of txs, so that Tabber can display status.
// - Allows for pub/sub of successful TXs, so controller can reload.
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
	// mini-status
	const _$ms = _$e.find(".mini-status").detach();
	const _$msBet = _$ms.find(".bet");
	const _$msState = _$ms.find(".state");
	const _$msLoading = _$ms.find(".loading");
	const _$msRank = _$ms.find(".rank");
	const _$msCards = _$ms.find(".card");
	const _$msStatus = _$ms.find(".status");
	// cards
	const _$hand = _$e.find(".hand");
	const _$cards = _$hand.find(".card").click(_toggleHold);
	// invalid action
	const _$invalid = _$e.find(".actionArea.invalid");
	// bet action
	const _$bet = _$e.find(".actionArea.bet");
	const _$betSlider = _$bet.find(".betSlider");
	const _$betTxt = _$bet.find(".betTxt");
	const _$betErr = _$bet.find(".betErr").hide();
	// draw action
	const _$draw = _$e.find(".actionArea.draw").hide();
	// finalize action
	const _$finalizeWin = _$e.find(".actionArea.finalizeWin").hide();
	const _$finalizeLoss = _$e.find(".actionArea.finalizeLoss").hide();
	const _$finalized = _$e.find(".actionArea.finalized").hide();
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
	var _gameState = {state: "betting"};
	var _isNotDrawing = false;

	var _onEvent = ()=>{};

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
	this.$ms = _$ms;

	this.onEvent = (fn) => { _onEvent = fn; }

	this.getGameState = ()=>_gameState;

	// Sets global settings, so betUI and blocktimes are accurate.
	this.setSettings = function(settings) {
		if (!settings) return;
		_minBet = settings.minBet;
		_maxBet = settings.maxBet;
		_curPayTable = settings.curPayTable;
		_latestBlock = settings.latestBlock;
		_avgBlockTime = settings.avgBlockTime;
		_refresh();
	}

	this.setGameState = function(gameState) {
		if (_isNotDrawing) {
			// Skip re-updating state to "dealt" if we're skipping drawing.
			const curHand = _gameState.iHand ? _gameState.iHand.toNumber() : 0;
			const dealtHand = gameState.iHand ? gameState.iHand.toNumber() : 0;
			if (gameState.state=="dealt" && curHand==dealtHand) return;
		}
		if (gameState.state != _gameState.state) _reset();
		_gameState = Object.assign({}, gameState);
		_refresh();
	}

	// Resets everything to reflect an empty state.
	function _reset() {
		_$e.removeClass("isWinner");
		_$payTable.find("tr").removeClass("won");
		_$msLoading.hide();
		_$hand.removeClass("frozen");
		_$bet.find(".statusArea").empty().hide();
		_$bet.find(".actionBtn").removeClass("disabled").removeAttr("disabled").text("Deal");
		_$draw.find(".statusArea").empty().hide();
		_$draw.find(".actionBtn").removeClass("disabled").removeAttr("disabled").text("Draw");
		_$finalizeWin.find(".statusArea").empty().hide();
		_$finalizeWin.find(".actionBtn").removeClass("disabled").removeAttr("disabled").text("Finalize");
		_$finalizeLoss.find(".statusArea").empty();
		_$finalizeLoss.find(".actionBtn").removeClass("disabled").removeAttr("disabled").text("Finalize");
	}

	// Redraws entire game based on the state
	// Called by "updateGameState"
	const _refresh = util.debounce(10, function _refreshGame() {
		_refreshMiniStatus();

		_$invalid.hide();
		_$bet.hide();
		_$draw.hide();
		_$finalizeWin.hide();
		_$finalizeLoss.hide();
		_$finalized.hide();
		_$details.hide();
		_$required.hide();

		if (_gameState.state=="betting" || _gameState.state=="invalid") {
			if (_gameState.state=="betting"){
				_$bet.show();
				_$msg.text(`Select a bet amount, and press "Deal"`)
			} else {
				_$invalid.show();
				_$msg.text(`This game is invalid.`);
			}
			_refreshHand(null);
			_refreshBetScale();
			_refreshPayTable();
			return;
		};

		_refreshPayTable();
		_$details.show();
		_$gameBet.text(`Bet: ${ethUtil.toEth(_gameState.bet)} ETH`);
		_$gameId.text(`Game #${_gameState.id}`);
		_$betTxt.val(_gameState.bet.div(1e18).toFixed(3));
		if (_gameState.state == "dealt") {
			_$draw.show();

			const blocksLeft = 256 - (_latestBlock.number - _gameState.iBlock);
			if (blocksLeft >= 1) {
				_$msg.html(`Your cards have been dealt.<br>Select cards to hold, and click "Draw"`);
				_$required.show().text(`You must draw within ${blocksLeft} blocks.`);
				_refreshHand(_gameState.iHand, 31);
			} else {
				_$msg.html(`Your dealt cards are no longer availabe.<br>Please click "Draw" for a new hand.`);
				_$hand.addClass("frozen");
				_refreshHand(null);
			}
			return;
		}
		if (_gameState.state == "drawn") {
			_refreshHand(_gameState.dHand, _gameState.draws);

			if (_gameState.payout.gt(0)){
				_$finalizeWin.show();
				const blocksLeft = 256 - (_latestBlock.number - _gameState.dBlock);
				_$e.addClass("isWinner");
				_$payTable.find("tr").eq(_gameState.handRank).addClass("won");
				_$msg.empty().append(`You won ${ethUtil.toEth(_gameState.payout)} ETH with ${_gameState.dHand.getRankString()}!`);
				_$required.show().text(`You must finalize within ${blocksLeft} blocks.`);
			} else {
				_$finalizeLoss.show();
				_$msg.empty().append(`You lost. Try again?`);
			}
			return;
		}
		if (_gameState.state == "finalized") {
			_$finalized.show();
			if (_gameState.payout.gt(0)) {
				_$e.addClass("isWinner");
				_$payTable.find("tr").eq(_gameState.handRank).addClass("won");
				_refreshHand(_gameState.dHand, _gameState.draws);
			}
			_$msg.empty().append(`You've been credited ${ethUtil.toEth(_gameState.payout)} ETH for ${_gameState.dHand.getRankString()}.`);
			return;
		}

		const msg = `Unexpected game state: ${_gameState.state}`;
		_$msg.empty().append(msg)
		throw new Error(msg);
	});

	function _refreshMiniStatus() {
		// set mini-state class to state. set bet.
		_$ms.removeClass().addClass("mini-status").addClass(_gameState.state);
		_gameState.id 
			? _$msBet.text(`${ethUtil.toEth(_gameState.bet)} ETH`)
			: _$msBet.text(`-- ETH`);

		if (_gameState.state == "invalid") {
			_$msState.text("Invalid");
			_$msStatus.text("invalid game");
			return;
		}
		if (_gameState.state == "betting") {
			_$msState.text("New Game");
			_$msStatus.text("select bet amount");
			return;
		}
		if (_gameState.state == "dealt") {
			_$msState.text("Dealt");
			_$msStatus.text("select cards to hold");
			return;
		}
		if (_gameState.state == "drawn") {
			if (_gameState.payout.gt(0)){
				_$ms.addClass("winner");
				_$msState.text("Winner!");
				_$msStatus.text(`finalize for ${ethUtil.toEth(_gameState.payout)} ETH`);
			} else {
				_$msState.text("Complete");
				_$msStatus.text("game complete");
			}
			_$msRank.text(_gameState.dHand.getRankString());
			return;
		}
		if (_gameState.state == "finalized") {
			if (_gameState.payout.gt(0)){
				_$ms.addClass("winner");
				_$msState.text("Paid");
				_$msStatus.text(`credited: ${ethUtil.toEth(_gameState.payout)} ETH`);
			} else {
				_$msState.text("Complete");
				_$msStatus.text("play again?");
			}
			_$msRank.text(_gameState.dHand.getRankString());
			return;
		}

		_$msState.text(_gameState.state);
		throw new Error(`Unexpected game state: ${_gameState.state}`);
	}

	function _refreshHand(hand, draws) {
		if (hand == null) {
			_$cards.removeClass("held").empty();
			_$msCards.removeClass("held").empty();
			return;
		}

		if (draws.toNumber) draws = draws.toNumber();
		hand.cards.forEach((c,i)=>{
			const isDrawn = draws & Math.pow(2, i);
			const $card = _$cards.eq(i);
			const $msCard = _$msCards.eq(i);
			
			$card.empty().append(c.toString(true));
			$msCard.empty().append(c.toString(true));
			// update held status if they arent drawing right now
			if (_gameState.state != "dealt") {
				if (isDrawn) {
					$card.removeClass("held");
					$msCard.removeClass("held");
				} else {
					$card.addClass("held");
					$msCard.addClass("held");
				}
			}
		});
	}

	// Called when a card is clicked
	function _toggleHold(){
		if (_gameState.state != "dealt") return;
		if (_$hand.is(".frozen")) return;
		_$cards.map((i,c) => {
			if (c !== this) return;
			_$cards.eq(i).toggleClass("held");
			_$msCards.eq(i).toggleClass("held");
		})
		
	}

	// draws proper multipliers in the paytable, from gameState or curPayTable
	function _refreshPayTable() {
		var payTable = _gameState.state == "betting"
			? _curPayTable
			: _gameState.payTable;

		if (!payTable) {
			const $rows = _$payTable.find("tr").not(":first-child");
			$rows.find("td").not(":first-child").text("--");
			return;
		} else {
			payTable = payTable.slice(1,-1);
		}

		const bet = _getBet();

		// draw multipliers
		const $rows = _$payTable.find("tr");
		payTable.forEach((v,i)=>{
			$rows.eq(i+1).find("td").eq(1).text(`${v} x`);
		});

		// draw null payouts
		if (bet==null) {
			payTable.forEach((v,i)=>{
				$rows.eq(i+1).find("td").eq(2).text(`--`);
			});
			return
		}

		// draw ETH payouts
		betEth = bet.div(1e18);
		const betStr = betEth.toFixed(3);
		$rows.eq(0).find("td").eq(2).text(`Payout (for ${betStr} ETH bet)`);
		payTable.forEach((v,i)=>{
			const payout = (betEth * v).toFixed(3);
			$rows.eq(i+1).find("td").eq(2).text(`${payout} ETH`);
		});
	}

	// Sets the "bet" range and text to accomodate new min/max bets
	function _refreshBetScale() {
		// Determine a convenient _rounding step
		if (_minBet == null) _minBet = new BigNumber(0);
		if (_maxBet == null) _maxBet = new BigNumber(0);
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
			
			// set uiid (so upon receiving event we can link it to this game)
			// change button state.
			// create reset() function.
			const uiid = Math.floor(Math.random()*1000000000000);
			_gameState.uiid = uiid;
			$btn.attr("disabled", "disabled").addClass("disabled").text("Dealing...");
			const reset = ()=>{ 
				delete _gameState.uiid;
				$btn.removeAttr("disabled").removeClass("disabled").text("Deal");
				_$msLoading.addClass("error");
			}

			try {
				const promise = vp.bet([uiid], {value: bet, gas: 130000, gasPrice: gps.getValue()});
				const waitTimeMs = (gps.getWaitTimeS() || 30) * 1000;
				_$msLoading.show().removeClass("error").html(util.$getLoadingBar(waitTimeMs, promise));

				const $txStatus = util.$getTxStatus(promise, {
					waitTimeMs: waitTimeMs,
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
							_onEvent(betSuccess);
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
				_isNotDrawing = true;
				_onEvent({
					name: "DrawSuccess",
					blockHash: _gameState.iBlockHash,
					blockNumber: _gameState.iBlock,
					args: {
						id: new BigNumber(_gameState.id),
						iHand: _gameState.iHand,
						draws: new BigNumber(0)
					}
				});
				return;
			}
			
			_$hand.addClass("frozen");
			$btn.attr("disabled", "disabled").addClass("disabled").text("Drawing...");
			const reset = ()=>{
				_$hand.removeClass("frozen");
				$btn.removeAttr("disabled").removeClass("disabled").text("Draw");
				_$msLoading.addClass("error");
			}
			try {
				const params = [_gameState.id, draws, _gameState.iBlockHash];
				const promise = vp.draw(params, {gas: 130000, gasPrice: gps.getValue()});
				const waitTimeMs = (gps.getWaitTimeS() || 30) * 1000;
				_$msLoading.show().removeClass("error").html(util.$getLoadingBar(waitTimeMs, promise));

				const $txStatus = util.$getTxStatus(promise, {
					waitTimeMs: waitTimeMs,
					onClear: () => { $statusArea.hide(); },
					onSuccess: (res) => {
						const drawSuccess = res.events.find(e=>e.name=="DrawSuccess");
						const drawFailure = res.events.find(e=>e.name=="DrawFailure");
						if (drawSuccess) {
							const msg = `<br>Your drawn cards will be shown shortly...`;
							$txStatus.find(".status").append(msg);
							$txStatus.find(".clear").hide();
							$btn.text("Drawn!");
							_onEvent(drawSuccess);
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
			
			$btn.attr("disabled", "disabled").addClass("disabled").text("Finalizing...");
			const reset = ()=>{
				$btn.removeAttr("disabled").removeClass("disabled").text("Finalize");
				_$msLoading.addClass("error");
			}
			try {
				const params = [_gameState.id, _gameState.dBlockHash];
				const promise = vp.finalize(params, {gas: 130000, gasPrice: gps.getValue()});
				const waitTimeMs = (gps.getWaitTimeS() || 30) * 1000;
				_$msLoading.show().removeClass("error").html(util.$getLoadingBar(waitTimeMs, promise));

				const $txStatus = util.$getTxStatus(promise, {
					waitTimeMs: waitTimeMs,
					onClear: () => { $statusArea.hide(); },
					onSuccess: (res) => {
						const success = res.events.find(e=>e.name=="FinalizeSuccess");
						const failure = res.events.find(e=>e.name=="FinalizeFailure");
						if (success) {
							const msg = `<br>Finalization success. Credited: ${success.args.payout} Eth`;
							$txStatus.find(".status").append(msg);
							$txStatus.find(".clear").hide();
							$btn.text("Finalized!");
							_onEvent(success);
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
		_refresh();
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
	                    toString: (asHtml)=>cardToString(cardNum, asHtml)
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
	        function cardToString(cardNum, asHtml, asUnicode) {
	        	const valStr = (function(val){
                    if (val == 0) return 'A';
                    if (val <= 9) return `${val+1}`;
                    if (val == 10) return "J";
                    if (val == 11) return "Q";
                    if (val == 12) return "K";
                }(cardNum % 13));
                const suitStr = (function(suit){
                    if (suit == 0) return '♠';
                    if (suit == 1) return '♥';
                    if (suit == 2) return '♦';
                    if (suit == 3) return '♣';
                }(Math.floor(cardNum / 13)));
                const suitClass = (function(suit){
                    if (suit == 0) return 'spade';
                    if (suit == 1) return 'heart';
                    if (suit == 2) return 'diamond';
                    if (suit == 3) return 'club';
                }(Math.floor(cardNum / 13)));
                return asHtml
                	? `<span class="cardStr ${suitClass}">${valStr}${suitStr}</span>`
                	: `${valStr}${suitStr}`;
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