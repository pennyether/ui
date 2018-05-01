Loader.require("vp")
.then(function(vp){
    if (!PokerUtil) throw new Error("This requires PokerUtil to be loaded.");

    ethUtil.onStateChanged((state)=>{
        if (!state.isConnected) return;
        const curUser = ethUtil.getCurrentStateSync().account;
        if (curUser) {
            ghv.setUser(curUser);
            ghv.enable();
        } else {
            ghv.disable(`No account available.`);
        }
        syncGames(curUser);
        syncCredits(curUser);
    });

    // do this just once.
    ethUtil.getCurrentState().then(()=>{
        vp.getEvents("Created").then(evs => {
            if (!evs) throw new Error(`Did not find VideoPoker creation event.`);
            ghv.setMinBlock(evs[0].blockNumber);
        }).catch(e => {
            ghv.disable("VideoPoker contract could not be found.");
        })
    });

    // init stuff
    const controller = new PokerUtil.VpController(vp);
    const ghv = new PokerUtil.GameHistoryViewer(vp, 5760);
    const tabber = new Tabber();
    tabber.$e.appendTo($("#Machine .tabber-ctnr"));
    ghv.$e.appendTo("#History .history-ctnr");
    
    // Tabber events.
    tabber.onNewGame(()=>{
        const game = createGame(null, getVpSettings(false));
        tabber.selectGame(game);
    });
    tabber.onSelected((game) => {
        const $gameCtnr = $("#Machine .game-ctnr");
        $gameCtnr.children().detach();
        $gameCtnr.append(game.$e);
        game.$e.removeClass("flash");
        setTimeout(()=>{ game.$e.addClass("flash"); }, 10);
    });

    (function initClearGhv(){
        $("#History .clear").click(()=>{
            ghv.reset();
        });
    }());

    (function initCredits() {
        const $e = $("#Credits");
        const $status = $e.find(".status-ctnr");
        const $inProgress = $e.find("fieldset.in-progress");
        util.gasifyButton($e.find(".btn-cash-out"), cashOut);

        // event CreditsCashedout(uint time, address indexed user, uint amount);
        function cashOut(obj) {
            $inProgress.attr("disabled", "disabled");
            $status.show().empty();
            const txStatus = util.getTxStatus({
                waitTimeMs: (obj.waitTimeS || 45) * 1000,
                onSuccess: (res, txStatus) => {
                    const cashedout = res.events.find(e => e.name=="CreditsCashedout");
                    if (cashedout) {
                        const $msg = $("<div></div>")
                            .append(`Sent ${util.toEthStrFixed(cashedout.args.amount, 7)} to `)
                            .append(nav.$getPlayerLink(cashedout.args.user));
                        txStatus.addSuccessMsg($msg);
                    } else {
                        txStatus.addWarningMsg(`No credits cashed out.<br>Are you sure you have credits?`);
                    }
                },
                onClear: () => {
                    $inProgress.removeAttr("disabled");
                    $status.empty().hide();
                }
            });
            txStatus.$e.appendTo($status);

            // create promise, or fail the TxStatus
            try {
                const promise = vp.cashOut([100000e18], {gas: 100000, gasPrice: obj.gasPrice})
                txStatus.setTxPromise(promise);
            } catch (e) {
                txStatus.fail(`Error: ${e.message.split("\n")[0]}`);
                ethStatus.open();
            }
        }
    }());


    // Get all fresh gameStates, and update our games.
    function syncGames(curUser) {
        controller.setUser(curUser);
        const toBlock = ethUtil.getCurrentBlockHeight();
        const fromBlock = toBlock - 11520;
        return Promise.all([
            curUser ? controller.refreshGameStates(fromBlock, toBlock) : [],
            getVpSettings(true)
        ]).then(arr => {
            createAndUpdateGames(arr[0], arr[1]);
        });
    }

    // creates a new game object and adds a tab for it.
    // is called:
    //    - via "new machine"
    //    - if game is in blockchain, but not being displayed
    //    - if the tabber has no machines open
    function createGame(gameState, settings) {
        if (!gameState) gameState = {state: "betting"};
        
        const game = new Game(vp);
        game.onEvent(forceUpdateGameFromEvent);
        game.setSettings(settings);
        game.setGameState(gameState);
        tabber.addTab(game);
        return game;
    }

    // Does three things:
    //   - Creates all bet or drawn+won Games, or updates their state.
    //   - Notifies falsely-existant game's of their perile.
    //   - If there are no tabs, creates one.
    function createAndUpdateGames(gameStates, settings) {
        // Update games (create if necessary)
        gameStates.forEach(gs => updateGame(gs, settings, gs.isActive));

        // Go through tabber's games. Any untouched games are invalid.
        const touchedIds = Object.values(gameStates).map(gs => gs.id);
        tabber.getGames().forEach(g => {
            const gs = g.getGameState();
            const id = gs.id;
            // No id -- it's betting. Just update settings.
            if (!id) { g.setSettings(settings); return; }
            // It's already been updated. Do nothing.
            if (touchedIds.indexOf(id) >= 0) return;
            // Game exists in tabber, but not in controller! Set as invalid.
            // updateGame() will update if it's blockUpdated < currentBlock.
            gs.isInvalid = true;
            gs.isActive = false;
            gs.blockUpdated = settings.latestBlock.number;
            updateGame(gs);
        });

        if (!tabber.hasTabs()) createGame(null, settings);
    }


    // Updates a Game's settings and state, and optionally creates it.
    // 
    function updateGame(gameState, settings, createIfNotFound, forceUpdate) {
        var game = tabber.getGames().find(g => {
            // If game is dealt, look for matching txId
            return g.txId() == gameState.txId || g.getGameState().id == gameState.id;
        });

        if (game) {
            // Update settings, if passed.
            if (settings) game.setSettings(settings);
            // Update gameState if we have a newer version of it
            if (forceUpdate || gameState.blockUpdated > (game.getGameState().blockUpdated || 0)) {
                game.setGameState(gameState);
                tabber.refreshDeletable(game);
            }
        } else {
            if (createIfNotFound) createGame(gameState, settings);
        }
    }

    // Forces controller to update a gameState, then forcibly updates the game.
    // This is called when a game emits an event.
    function forceUpdateGameFromEvent(ev) {
        const gameState = controller.updateGameStateFromEvent(ev);
        if (!gameState) {
            console.warn(`GameState updated from event, but controller doesnt see it.`, ev);
        }
        updateGame(gameState, null, false, true);
    }

    var prevCredits = null;
    function syncCredits(curUser){
        const $e = $("#Credits");
        const $user = $e.find(".cur-user .value");
        const $credits = $e.find(".credits .value");
        const $hasAccount = $e.find("fieldset.has-account").attr("disabled","disabled");
        if (!curUser) {
            prevCredits = null;
            $user.text("No account.")
            $credits.text("--");
            return;
        } else {
            $user.empty().append(nav.$getPlayerLink(curUser, true));
            $credits.text("Loading...");
            vp.credits([curUser]).then(eth=>{
                if (eth.gt(0)) $hasAccount.removeAttr("disabled");
                $credits.text(util.toEthStrFixed(eth, 7));
                if (prevCredits !== null && !eth.equals(prevCredits)) {
                    const delta = eth.minus(prevCredits);
                    const deltaStr = delta.gt(0)
                        ? `<div style="color: green;">+${util.toEthStrFixed(delta, 7)}</div>`
                        : `<div style="color: red;">${util.toEthStrFixed(delta, 7)}</div>`
                    // flash a tip indicating credits delta
                    $credits.attr("title", deltaStr);
                    const t = tippy($credits[0], {
                        placement: "top",
                        trigger: "manual",
                        animation: "fade",
                        hideOnClick: false,
                        onHidden: function(){ t.destroy(); }
                    }).tooltips[0];
                    t.show(500);
                    setTimeout(function(){ t.hide(5000); }, 1500);
                }
                prevCredits = eth;
            });
        }
    }


    //////////////////////////////////////////////////////////////
    /// HELPER FUNCTIONS /////////////////////////////////////////
    //////////////////////////////////////////////////////////////

    // Returns settings that all games need to know about.
    // If passed "false" will return current setting synchronously
    const getVpSettings = (function(){
        var curSettings;

        return function getVpSettings(fresh) {
            if (!fresh) return curSettings;

            const state = ethUtil.getCurrentStateSync();
            const curUser = state.account;
            return Promise.all([
                vp.minBet(),
                vp.maxBet(),
                vp.curMaxBet(),
                vp.getCurPayTable(),
                curUser ? vp.credits([curUser]) : new BigNumber(0)
            ]).then(arr => {
                curSettings = {
                    minBet: arr[0],
                    maxBet: BigNumber.min(arr[1], arr[2]),
                    curPayTable: arr[3],
                    credits: arr[4],
                    latestBlock: state.latestBlock,
                };
                return curSettings;
            });
        };
    }());

    /******************************************************/
    /*** LIVE STATS ***************************************/
    /******************************************************/
    (function initStats(){
        ethUtil.onStateChanged((state)=>{
            if (!state.isConnected) return;
            refreshStats();
        });

        // t: 0 to 1, returns 0 to 1
        function easeInOut(t) {
            return t<0.5 ? 2*t*t : -1+(4-2*t)*t;
        }
        function easeNumber(from, to, duration, cb) {
            var cancel = false;
            const diff = to - from;
            const steps = 50;
            for (var i=1; i<=steps; i++){
                let n = i/steps;
                setTimeout(function(){
                    if (cancel) return;
                    cb(from + easeInOut(n) * diff);
                }, duration * n);
            }
            return ()=>{ cancel = true; };
        }

        const _prevEases = [];
        function refreshStats() {
            const $games = $("#Leader .games .value");
            const $wagered = $("#Leader .wagered .value");
            const $won = $("#Leader .won .value");
            Promise.all([
                vp.curId(),
                vp.totalWagered(),
                vp.totalWon()
            ]).then(arr=>{
                const curGames = Number($games.text());
                const curWagered = Number($wagered.text());
                const curWon = Number($won.text());
                const newGames = arr[0].toNumber();
                const newWagered = arr[1].div(1e18).toNumber();
                const newWon = arr[2].div(1e18).toNumber();
                _prevEases.forEach(cancel => cancel());
                _prevEases[0] = easeNumber(curGames, newGames, 3000, (n)=>{
                    $games.text(Math.round(n));
                });
                _prevEases[1] = easeNumber(curWagered, newWagered, 3000, (n)=>{
                    $wagered.text(n.toFixed(2));
                });
                _prevEases[2] = easeNumber(curWon, newWon, 3000, (n)=>{
                    $won.text(n.toFixed(2));
                });
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
    };
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
    };
    this.selectTab = function(tab){
        if (!tab || tab.isSelected) return;
        _tabs.forEach(t => {
            t.isSelected = t == tab;
            if (t.isSelected) t.$e.addClass("selected");
            else t.$e.removeClass("selected");
        });
        _onSelected(tab.game);
    };
    this.selectGame = function(game) {
        _self.selectTab(_tabs.find(t => t.game == game));
    };
    this.hasTabs = function(){
        return _tabs.length > 0;
    };
    this.getGames = function(){
        return _tabs.map(t=>t.game);
    };
    this.refreshDeletable = function(){
        if (_tabs.length == 1) { _tabs[0].$remove.hide(); return; }
        _tabs.forEach(t=>{
            if (t.game.getGameState().isActive) t.$remove.hide();
            else t.$remove.show();  
        });
    };
    this.$e = _$e;
}

// Game Object that gets it state set externally.
function Game(vp) {
    const _$e = $(".Game.template").clone().removeClass("template").show();
    const _$payTable = _$e.find(".payTable");
    // better, hand, miniHand
    const _slider = util.getSlider("Bet");
    const _hd = new HandDisplay();
    const _miniHd = new HandDisplay();
    // status
    const _$status = _$e.find(".gameStatus");
    const _$details = _$status.find(".details");
    const _$gameBet = _$details.find(".gameBet");
    const _$gameId = _$details.find(".gameId");
    const _$msg = _$status.find(".msg");
    const _$required = _$status.find(".required");
    const _$invalid = _$e.find(".invalid");
    // mini-status
    const _$ms = _$e.find(".mini-status").detach();
    const _$msState = _$ms.find(".state");
    const _$msHand = _$ms.find(".hand");
    const _$msLoading = _$ms.find(".loading");
    // this holds all children actions
    const _$isInvalid = _$e.find(".is-invalid");
        // state = betting
        const _$bet = _$isInvalid.find(".actionArea.bet");
        // state = dealt
        const _$draw = _$isInvalid.find(".actionArea.draw").hide();
        // state = drawn (win)
        const _$finalizeWin = _$isInvalid.find(".actionArea.finalizeWin").hide();
            const _$chkBetAgain = _$finalizeWin.find(".chk-bet-again");
            const _$willBetFull = _$finalizeWin.find(".will-bet-full");
            const _$willCreditFull = _$finalizeWin.find(".will-credit-full");
            const _$willBetSome = _$finalizeWin.find(".will-bet-some");
            const _$willCreditSome = _$finalizeWin.find(".will-credit-some");
        // state = drawn (loss)
        const _$finalizeLoss = _$isInvalid.find(".actionArea.finalizeLoss").hide();
        // state = finalized
        const _$finalized = _$isInvalid.find(".actionArea.finalized").hide();
    // buttons, misc
    const _$btnPlayAgain = _$e.find(".btnPlayAgain");
    const _$canDeal = _$e.find(".canDeal");

    // Insert hand objects to correct spots
    _hd.$e.appendTo(_$e.find(".hd-ctnr"));
    _hd.onDrawsChanged(_refreshDrawBtn);
    _miniHd.$e.appendTo(_$msHand);
    _miniHd.freeze(true);
    _slider.$e.prependTo(_$bet);

    // Events
    _$btnPlayAgain.click(()=>{
        _txId = null;
        _self.setGameState({state: "betting"});
    });
    _$chkBetAgain.click(_refreshBetAgain);
    _slider.setOnChange(() => {
        if (_slider.getValue() === null) _$canDeal.attr("disabled","disabled");
        else _$canDeal.removeAttr("disabled");
        _refreshPayTable();   
    });

    // const _$logs = _$e.find(".logs").hide();
    const _self = this;

    // global params, set externally
    const _vp = vp;
    var _curPayTable;

    // state of the currentGame
    var _txId = null;
    var _gameState = {};
    var _isSkippingDrawing = false;
    var _isTransacting = false;
    var _isError = false;

    var _onEvent = ()=>{};

    this.$e = _$e;
    this.$ms = _$ms;
    this.txId = () => _txId;
    this.onEvent = (fn) => _onEvent = fn;

    this.getGameState = () => Object.assign({}, _gameState);

    // Sets global settings, so better and blocktimes are accurate.
    this.setSettings = function(settings) {
        if (!settings) return;
        _curPayTable = settings.curPayTable;

        if (settings.maxBet.equals(0) || settings.maxBet.lt(settings.minBet) && _gameState.state=="betting") {
            _$e.find("> .not-available").show();
            _slider.setUnits([{
                name: "eth",
                $label: "ETH",
                min: 0,
                max: .3,
            }]);
            _slider.setValue(.01);
            return;
        } else {
            _$e.find("> .not-available").hide();
        }

        const units = [{
            name: "eth",
            $label: "ETH",
            min: settings.minBet.div(1e18),
            max: settings.maxBet.div(1e18),
        }];
        if (settings.credits.gte(settings.minBet)) {
            units.push({
                name: "credits",
                $label: "credits",
                min: settings.minBet.div(1e18),
                max: BigNumber.min(settings.maxBet.div(1e18), settings.credits.div(1e18))
            });
        }
        _slider.setUnits(units);
        if (Object.keys(_gameState).length === 0) { _slider.setValue(.01); }
        _refreshDebounce();
    };

    // Sets the gameState of the game. Causes a refresh.
    this.setGameState = function(gameState) {
        // Skip re-updating state to "dealt" if we're skipping drawing.
        // Unless there's a new hand -- then we should show it.
        if (_isSkippingDrawing && gameState.state=="dealt") {
            const curHand = _gameState.iHand.toNumber();
            const dealtHand = gameState.iHand.toNumber();
            if (curHand==dealtHand) return;
        }
        // These are resets that should only happen once per game.
        if (gameState.id !== _gameState.id) {
            _isSkippingDrawing = false; // no longer skipping (case needed: dealt -> fake-drawn)
            _refreshHand(null, 31);     // reset cards to empty (case needed: finalize -> dealt)
        }
        // These are resets that should happen once per state.
        if (gameState.state != _gameState.state) _resetTx();
        _gameState = Object.assign({}, gameState);
        _refreshDebounce();
    };

    // Resets everything that is state-specific.
    function _resetTx() {
        // Revert tx-specific variables.
        _isTransacting = false;
        _isError = false;

        // Revert all TX related DOM changes.
        _$msLoading.hide();
        _$e.find(".statusArea").empty().hide();
        _$e.find(".actionBtn").removeAttr("disabled")
            .each((i,e)=>{ $(e).text($(e).data("txt-default")); });
    }

    // Draws miniStatus, payTable, hand, and shows correct actionArea
    function _refresh() {
        _refreshMiniStatus();
        _refreshPayTable();

        // reset all things that may change within the same state.
        _$isInvalid.removeAttr("disabled");
        _$e.removeClass("is-winner is-invalid");
        _$e.find(".actionArea").hide();
        _$invalid.hide();
        _$payTable.find("tr").removeClass("won");
        _$details.hide();
        _$required.hide();

        // If game is invalid, show invalid message and disable all form elements.
        if (_gameState.isInvalid) {
            _$e.addClass("is-invalid");
            _$invalid.show();
            _$isInvalid.attr("disabled", "disabled");
        } 

        // Betting. simply show the bet actionArea and an empty hand.
        // We can return here.
        if (_gameState.state=="betting") {
            _$bet.show();
            _$msg.text(`Select a bet amount, and press "Deal"`);
            if (!_isTransacting) _slider.freeze(false);
            _refreshHand(null, 31);

            return;
        }

        // Show the bet, id, and update better to be bet amount.
        _$details.show();
        _$gameBet.text(`Bet: ${_eth(_gameState.bet)}`);
        _$gameId.empty().append(nav.$getVpGameLink(_gameState.id));
        _slider.setValue(_gameState.bet.div(1e18));

        // It's a winner, add class and hilite paytable entry.
        if (_gameState.isWinner) {
            _$e.addClass("is-winner");
            _$payTable.find("tr").eq(_gameState.handRank).addClass("won");
        }

        // It's dealt, show draw actionArea, relevant status, and hand.
        if (_gameState.state == "dealt") {
            _$draw.show();
            // If iHand is valid: Show it and allow holding if not transacting.
            // If iHand is not valid: Show it and force zero holds.
            if (_gameState.iBlocksLeft > 0) {
                _$msg.html(`Your cards have been dealt.<br>Select cards to hold, and click "Draw"`);
                _$required.show().text(`You must draw within ${_gameState.iBlocksLeft} blocks.`);
                _refreshHand(_gameState.iHand, null, _isTransacting ? null : false);
            } else {
                _$msg.html(`Your dealt cards are no longer availabe.<br>Please click "Draw" for a new hand.`);
                _refreshHand(null, 31, true);
            }
            return;
        }

        // It's drawn. Show final hand, and win/loss actionArea and relevant details.
        if (_gameState.state == "drawn") {
            _refreshHand(_gameState.dHand, _gameState.draws, true, true);
            if (_gameState.isWinner){
                _$finalizeWin.show();
                _$msg.empty().append(`You won ${_eth(_gameState.payout)} with ${_gameState.dHand.getRankString()}!`);
                _refreshBetAgain();

                // Show required message if there are dBlocksLeft.
                if (_gameState.dBlocksLeft > 0) {
                    _$required.show().text(`You must claim your winnings within ${_gameState.dBlocksLeft} blocks.`);
                }
            } else {
                _$finalizeLoss.show();
                _$msg.empty().append(`You lost. Try again?`);
            }
            return;
        }

        // They finalized. Show the final hand and message.
        if (_gameState.state == "finalized") {
            _$finalized.show();
            _refreshHand(_gameState.dHand, _gameState.draws, true, true);
            _$msg.empty().append(`You've been credited ${_eth(_gameState.payout)} for ${_gameState.dHand.getRankString()}.`);
            return;
        }

        const msg = `Unexpected game state: ${_gameState.state}`;
        _$msg.empty().append(msg);
        throw new Error(msg);
    }

    const _refreshDebounce = util.debounce(0, _refresh);

    // Update the HandDisplays. For draws and freeze, null means "dont change".
    function _refreshHand(hand, draws, freeze, showHandRank) {
        if (freeze === undefined) freeze = true;
        _$e.addClass("flipping");
        _hd.setHand(hand, draws, freeze, showHandRank).then(()=>_$e.removeClass("flipping"));
        _miniHd.setHand(hand, draws, true, showHandRank);
    }

    // Refresh the mini-status display.
    function _refreshMiniStatus() {
        // Add class for state, transacting, and error.
        _$ms.removeClass().addClass("mini-status").addClass(_gameState.state);
        if (_isTransacting) _$ms.addClass("is-transacting");
        if (_isError) _$ms.addClass("is-error");

        // Update the isWinner class.
        if (_gameState.isWinner){
            _$ms.addClass("is-winner");
        }

        // update the state
        if (!_isTransacting) {
            const s = _gameState.state;
            if (s=="invalid") _$msState.text("Invalid");
            else if (s=="betting") _$msState.text("New Game");
            else if (s=="dealt") _$msState.text("Dealt");
            else if (s=="drawn") _$msState.text(_gameState.isWinner ? "Winner!" : "Complete");
            else if (s=="finalized") _$msState.text(_gameState.isWinner ? "Credited" : "Complete");
            else {
                _$msState.text(_gameState.state);
                throw new Error(`Unexpected game state: ${_gameState.state}`);
            }
        }

        // if it's invalid, show it as such.
        if (_gameState.isInvalid) {
            _$ms.addClass("is-error");
            _$msState.text(`${_$msState.text()} [Invalid]`);
        }
    }

    // Draws proper multipliers in the paytable, using proper payTable.
    function _refreshPayTable() {
        var payTable = _gameState.state == "betting"
            ? _curPayTable
            : _gameState.payTable;

        if (!payTable) {
            const $rows = _$payTable.find("tr").not(":first-child");
            $rows.find("td").not(":first-child").text("--");
            return;
        }
            
        // draw multipliers
        payTable = payTable.slice(1,-1);
        const $rows = _$payTable.find("tr");
        payTable.forEach((v,i)=>{
            $rows.eq(i+1).find("td").eq(1).text(`${v} x`);
        });

        // draw payouts depending on bet
        var bet = _gameState.bet
            || (_slider.getValue() ? _slider.getValue().mul(1e18) : null)
            || new BigNumber(0);
        const format = (v)=> v.equals(0) ? "--" : `${v.div(1e18).toFixed(4)} ETH`;
        $rows.eq(0).find("td").eq(2).text(`Payout (for ${format(bet)} bet)`);
        payTable.forEach((v,i)=>{
            const payout = bet.mul(v);
            $rows.eq(i+1).find("td").eq(2).text(`${format(payout)}`);
        });
    }

    // Displays the proper text on the draw button
    function _refreshDrawBtn() {
        _miniHd.setDraws(_hd.getDraws());
        const numDraws = _hd.getNumDraws();
        const cardsStr = numDraws == 1 ? "Card" : "Cards";
        _$e.find(".btnDraw").text(`Draw ${numDraws} ${cardsStr}`);
    }

    // Refresh the payout bullet points inside $finalizeWin
    function _refreshBetAgain() {
        if (!_isTransacting) _$chkBetAgain.removeAttr("disabled");

        _$willBetFull.hide();
        _$willCreditFull.hide();
        _$willBetSome.hide();
        _$willCreditSome.hide();

        _$chkBetAgain.siblings(".eth").text(_eth(_gameState.bet));
        if (_$chkBetAgain.is(":checked")) {
            const creditAmt = _gameState.payout.minus(_gameState.bet);
            if (creditAmt.equals(0)) {
                _$willBetFull.show().find(".eth").text(_eth(_gameState.bet));
            } else {
                _$willBetSome.show().find(".eth").text(_eth(_gameState.bet));
                _$willCreditSome.show().find(".eth").text(_eth(creditAmt));
            }
        } else {
            _$willCreditFull.show().find(".eth").text(_eth(_gameState.payout));
        }
    }


    // Abstracts out having a button fire a transaction.
    //   getPromiseFn: must return a promise, or null
    //   callbackFn(obj): called with tx results. should call obj.resolve/reject
    //   errFn: called if TX errors, when user clears the error
    function _initActionButton($btn, getPromiseFn, callbackFn, errFn) {
        const gps = util.getGasPriceSlider(5);
        const $statusArea = $btn.closest(".actionArea").find(".statusArea");
        const $tip = $("<div></div>").show().append(gps.$e);

        // Attach tip to button that lets user pick gas price
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
            
            // get promise, or return.
            var promise;
            try {
                promise = getPromiseFn(gps.getValue());
            } catch(e) {
                console.error(e);
                ethStatus.open();
                errFn();
            }
            if (!promise) return;

            // Get various button states, and waitTime
            const defaultTxt = $(this).data("txt-default");
            const pendingTxt = $(this).data("txt-pending");
            const successTxt = $(this).data("txt-success");
            const waitTimeMs = (gps.getWaitTimeS() || 30) * 1000;

            // On TX success, call callbackFn and update status according to result.
            const onSuccess = (res) => {
                const obj = {
                    resolve: function(msg){
                        $btn.text(successTxt);
                        $txStatus.find(".status").append($("<div></div>").append(msg));
                        $txStatus.find(".clear").hide();
                    },
                    reject: function(msg){
                        $txStatus.find(".status").append($("<div></div>").append(msg));
                        onFailure();
                    }
                };
                callbackFn(res, obj);
            };

            // Called immediately if TX fails or callbackFn rejects
            const onFailure = () => {
                _isError = true;
                _$ms.addClass("is-error");
                _$msState.text(`Error ${pendingTxt}`);
                $txStatus.addClass("error");
            };

            // Mark as transacting. This means keep hand frozen, and don't change _$ms.state
            _isTransacting = true;
            _isError = false;
            // Update DOM elements. Reset them upon clearing an error (or never).
            _refreshMiniStatus();
            _$msState.text(pendingTxt);
            _$msLoading.show().html(util.$getLoadingBar(waitTimeMs, promise, true));
            $statusArea.empty().show();
            $btn.attr("disabled", "disabled").text(pendingTxt);

            // Should reset everything back, then call errFn.
            const onClearError = () => {
                _isTransacting = false;
                _isError = false;
                _refreshMiniStatus();
                _$msLoading.hide();
                $statusArea.hide();
                $btn.removeAttr("disabled").text(defaultTxt);
                if (errFn) errFn();
            };

            // create $txStatus object, with proper callbacks
            const $txStatus = util.$getTxStatus(promise, {
                waitTimeMs: waitTimeMs,
                onClear: onClearError,
                onSuccess: onSuccess,
                onFailure: onFailure
            }).appendTo($statusArea);
        });
    }

    function _initDealButton() {
        const $btn = _$bet.find(".btnDeal");

        const getPromiseFn = (gasPrice) => {
            const bet = _slider.getValue();
            if (bet===null) { return; }

            const betWei = bet.mul(1e18);
            _slider.freeze(true);
            const promise = _slider.getUnitName() == "eth"
                ? _vp.bet([], {value: betWei, gas: 130000, gasPrice: gasPrice})
                : _vp.betWithCredits([betWei], {gas: 130000, gasPrice: gasPrice});
            promise.getTxHash.then((txId) => _txId = txId);
            return promise;
        };
        const callbackFn = (res, obj) => {
            const betSuccess = res.events.find(e=>e.name=="BetSuccess");
            const betFailure = res.events.find(e=>e.name=="BetFailure");
            if (betSuccess) {
                obj.resolve("Your cards will be shown shortly...");
                _onEvent(betSuccess);
            } else if (betFailure) {
                obj.reject(`Your bet was refunded: ${betFailure.args.msg}`);
            } else {
                obj.reject("Did not receive an expected event!");
            }
        };
        const errFn = () => {
            _slider.freeze(false);
        };

        _initActionButton($btn, getPromiseFn, callbackFn, errFn);
    }

    
    function _initDrawButton() {
        const $btn = _$draw.find(".btnDraw");
        const getPromiseFn = (gasPrice) => {
            const draws = _hd.getDraws();
            if (draws == 0) {
                _isSkippingDrawing = true;
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
            } else {
                _hd.freeze(true);
                const params = [_gameState.id, draws, _gameState.iBlockHash];
                return _vp.draw(params, {gas: 130000, gasPrice: gasPrice});
            }
        };
        const callbackFn = (res, obj) => {
            const drawSuccess = res.events.find(e=>e.name=="DrawSuccess");
            const drawFailure = res.events.find(e=>e.name=="DrawFailure");
            if (drawSuccess) {
                obj.resolve(`Your drawn cards will be shown shortly...`);
                _onEvent(drawSuccess);
            } else if (drawFailure) {
                obj.reject(`Drawing failed: ${drawFailure.args.msg}`);
            } else {
                obj.reject(`Did not receive an expected event!`);
            }
        };
        const errFn = () => {
            _hd.freeze(false);
            _refreshDrawBtn();
        };
        _initActionButton($btn, getPromiseFn, callbackFn, errFn);
    }

    function _initFinalizeButton() {
        const $btn = _$finalizeWin.find(".btnFinalize");
        const getPromiseFn = (gasPrice) => {
            _$chkBetAgain.attr("disabled", "disabled");
            const params = [_gameState.id, _gameState.dBlockHash];
            const promise = _$chkBetAgain.is(":checked")
                ? _vp.betFromGame(params, {gas: 130000, gasPrice: gasPrice})
                : _vp.finalize(params, {gas: 130000, gasPrice: gasPrice});
            promise.getTxHash.then(txId => _txId = txId);
            return promise;
        };
        const callbackFn = (res, obj) => {
            const success = res.events.find(e=>e.name=="FinalizeSuccess");
            const failure = res.events.find(e=>e.name=="FinalizeFailure");
            const betSuccess = res.events.find(e=>e.name=="BetSuccess");
            const betFailure = res.events.find(e=>e.name=="BetFailure");
            if (success) {
                var msg = `You've been credited: ${_eth(success.args.payout)}`;
                if (betSuccess) {
                    msg += `<br>You've also bet ${_eth(betSuccess.args.bet)}. Your cards will be displayed shortly.`;
                    obj.resolve(msg);
                    _onEvent(betSuccess);
                } else if (betFailure) {
                    msg += `<br>Your bet failed: ${betFailure.args.msg}`;
                    obj.resolve(msg);
                    _onEvent(success);
                } else {
                    obj.resolve(msg);
                    _onEvent(success);
                }
            } else if (failure) {
                obj.reject(`Finalizing failed: ${failure.args.msg}`);
            } else {
                obj.reject(`Did not receive an expected event!`);
            }
        };
        const errFn = () => {
            _$chkBetAgain.removeAttr("disabled");
        };
        _initActionButton($btn, getPromiseFn, callbackFn, errFn);
    }

    function _eth(v) {
        return util.toEthStrFixed(v, 5);
    }

    (function _init() {
        _initDealButton();
        _initDrawButton();
        _initFinalizeButton();
    }());
}

function HandDisplay() {
    const _self = this;
    const _$e = $(`
        <div class='HandDisplay'>
            <div class="hand-rank">Hand Rank</div>
        </div>
    `);
    (function(){
        const html = `
            <div class="card-ctnr">
                <div class="card">
                    <div class="back"></div>
                    <div class="face">
                        <div class="cardIcon">
                            <div class="corner"></div>
                            <div class="suit"></div>
                        </div>
                        <div class="heldIcon">HELD</div>
                    </div>
                </div>
            </div>
        `;
        for (var i=0; i<5; i++) _$e.append($(html));
    }());
    const _$cards = _$e.find(".card").data("card", {cardNum: -1});
    const _$handRank = _$e.find(".hand-rank");

    var _curHandNumber = 0;
    var _isFrozen = false;
    var _onDrawsChanged = ()=>{};
    const _EMPTY_CARD = {cardNum: -1};

    // Events
    _$cards.click(_toggleHeld);

    this.$e = _$e;

    // do not allow clicking to hold a card
    this.freeze = function(bool) {
        if (bool === null) return;
        _isFrozen = bool;
        if (_isFrozen) _$e.addClass("frozen");
        else _$e.removeClass("frozen");
    };

    this.setDraws = function(draws) {
        if (draws === null) return;
        if (draws.toNumber) draws = draws.toNumber();

        const isChanged = _self.getDraws() == draws;
        _$cards.map((i,c)=>{
            const $card = $(c);
            const isDrawn = draws & Math.pow(2, i);
            if (isDrawn) $card.removeClass("held");
            else $card.addClass("held");
        });
        if (isChanged) _onDrawsChanged();
    };

    // animate in/out any changed cards, and set cards as held
    this.setHand = function(hand, draws, freeze, showHandRank) {
        const isEmpty = !hand || !hand.isValid();
        if (isEmpty) draws = 31;

        _self.setDraws(draws);
        _self.freeze(freeze);

        // Check to see if hand is the same as we currently have.
        const handNumber = hand ? hand.toNumber() : 0;
        const isNewHand = _curHandNumber != handNumber;
        _curHandNumber = handNumber;

        // update cards, keep track of those that changed
        const changedCards = [];
        if (isNewHand) {
            _$cards.map((i,c) => {
                const $card = $(c);
                if (isEmpty) {
                    const isChanged = !!$card.data("card");
                    $card.data("card", _EMPTY_CARD);
                    if (isChanged) changedCards.push($card);
                } else {
                    const card = hand.cards[i];
                    const isChanged = $card.data("card").cardNum != card.cardNum;
                    $card.data("card", card);
                    if (isChanged) changedCards.push($card);
                }
            });
        }
        
        // animate any changed cards
        var pauseTime = 0;
        if (changedCards.length) {
            const flipInterval = 100;

            // hide shown cards, from left to right, pausing flipInterval between each
            changedCards.forEach($card => {
                if ($card.hasClass("show")) {
                    setTimeout(() => $card.removeClass("show"), pauseTime);
                    pauseTime += flipInterval;
                }
            });

            // show cards, from left to right, pausing flipInterval between each.
            if (pauseTime) pauseTime += 200;
            changedCards.forEach($card => {
                const card = $card.data("card");
                if (card.cardNum == -1) return;
                setTimeout(() => {
                    const $cardIcon = $card.find(".cardIcon");
                    $cardIcon.removeClass().addClass("cardIcon").addClass(card.toClass());
                    $cardIcon.find(".corner").html(card.toValString() + card.toSuitString());
                    $cardIcon.find(".suit").html(card.toSuitString());
                    $card.addClass("show");
                }, pauseTime);
                pauseTime += flipInterval;
            });
        }

        // show handRank
        if (showHandRank) {
            if (!hand) return;
            setTimeout(()=>{ 
                _$handRank.addClass("show");
                if (hand.isWinner()) {
                    _$handRank.addClass("is-winner");
                    _$handRank.text(hand.getRankString() + "!");    
                } else {
                    _$handRank.removeClass("is-winner");
                    _$handRank.text(hand.getRankString());
                }
                _$cards.removeClass("hilited");
                hand.getWinningCards().forEach(i => _$cards.eq(i).addClass("hilited"));
            }, pauseTime);
        } else {
            _$cards.removeClass("hilited");
            _$handRank.removeClass("show");
        }

        return new Promise((res,rej)=>{
            setTimeout(res, pauseTime);
        });
    };

    this.getDraws = function() {
        var drawsNum = 0;
        _$cards.each(function(i,c){
            drawsNum += $(c).is(".held") ? 0 : Math.pow(2,i);
        });
        return drawsNum;
    };

    this.getNumDraws = function(){
        return 5 - _$cards.filter(".held").length;
    };

    this.onDrawsChanged = function(fn) {
        _onDrawsChanged = fn;
    };

    function _toggleHeld(e) {
        if (_isFrozen) return;
        _$cards.each((i,c) => {
            if (c !== e.currentTarget) return;
            _$cards.eq(i).toggleClass("held");
            _onDrawsChanged();
        });
    }
}