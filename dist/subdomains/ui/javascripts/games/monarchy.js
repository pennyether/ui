Loader.require("monarchy")
.then(function(monarchy){
    if (!MonarchyUtil) throw new Error(`This requires MonarchyUtil to be loaded.`);

    $("#Title").addClass("loaded");
    ethUtil.onStateChanged((state)=>{
        if (!state.isConnected) return;
        refreshAllGames();
    });

    const _activeGameObjs = {};
    const _endedGameObjs = {};
    const _$activeGames = $(".active-games .games").empty();
    const _$endedGames = $(".ended-games .games").empty();

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
            for (var i=1; i<=num; i++){
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
    // this only when numEndedGames has changed.
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
            const activeGameObjs = getOrCreateGameObjs(_activeGameObjs, obj.activeGames, _$activeGames);
            return Promise.all(activeGameObjs.map(gameObj => gameObj.refresh(avgBlocktime)));
        }).then(() => {
            // load, create, refresh ended games
            return getEndedGames().then(endedGames => {
                const endedGameObjs = getOrCreateGameObjs(_endedGameObjs, endedGames, _$endedGames);
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
        const _$e = $(".game.template")
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
        var _curBlockEnded = null;
        var _curAmWinner = null;
        var _curPrize = null;
        var _curMonarch = null;
        var _curDecree = "";
        var _alerts = {};

        // initialize dom elements
        const _$statusCell = _$e.find("td.status");
        const _$status = _$statusCell.find(".status");
        const _$txStatus = _$statusCell.find(".tx-status");
        const _$currentMonarchCell = _$e.find("td.current-monarch");
        const _$monarch = _$currentMonarchCell.find(".value");
        const _$decree = _$e.find("td.current-monarch .decree");
        const _$prize = _$e.find(".prize .value");
        const _$blocksLeft = _$e.find("td.blocks-left .value");
        const _$reignBlocks = _$e.find("td.blocks-left .reign-blocks");
        const _$timeLeft = _$e.find("td.blocks-left .time-left");
        const _$bidPrice = _$e.find("td.fee .value");
        const _$btn = _$e.find("td.overthrow button");
        const _$alertsIcon = _$e.find(".alerts-icon");
        const _$sendPrizeIcon = _$e.find(".send-prize-icon").detach();
        _$e.find("td.settings .refresh").click(() => _self.refresh());


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
            _$reignBlocks.hide();
            // display who won.
            const $monarch = nav.$getPlayerLink(_curMonarch);
            const $winnerInfo = $("<div></div>").append($monarch).append(_curAmWinner ? " won!" : " won.");
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
        //  - update static DOM things (timeleft, prize, monarch)
        //  - trigger alerts
        //  - trigger delta things (flash dom elements, etc)
        this.refresh = function(avgBlocktime) {
            if (avgBlocktime) _blocktime = avgBlocktime;

            function flashClass(className) {
                _$e.removeClass(className);
                setTimeout(()=>_$e.addClass(className), 30);
            }

            _$status.text("Refreshing...");
            const account = ethUtil.getCurrentAccount();
            const block = ethUtil.getCurrentBlockHeight();
            return Promise.obj({
                initialized: _initialized,
                prize: _isEnded ? _curPrize : _game.prize(),
                monarch: _isEnded ? _curMonarch : _game.monarch(),
                blockEnded: _isEnded ? _curBlockEnded : _game.blockEnded().then(n => n.toNumber()),
                decree: _isEnded ? _curDecree : _game.decree().then(_getDecreeStr),
                otSuccesses: account ? _game.getEvents("OverthrowOccurred", {newMonarch: account}, block, block) : [],
                otRefundSuccess: account ? _game.getEvents("OverthrowRefundSuccess", {recipient: account}, block, block) : [],
                otRefundFailures: account ? _game.getEvents("OverthrowRefundFailure", {recipient: account}, block, block) : [],
            }).then(obj => {
                const prize = obj.prize;
                const monarch = obj.monarch;
                const decree = obj.decree;
                const blocksLeft = obj.blockEnded > block
                    ? obj.blockEnded - block
                    : 0;
                const blockEnded = obj.blockEnded > block
                    ? null
                    : obj.blockEnded;
                const blocksReigned = _reignBlocks - blocksLeft;

                // compute useful things, store state
                const amWinner = monarch === account;
                const amNowWinner = !_curAmWinner && amWinner;
                const amNowLoser = _curAmWinner && !amWinner;
                const isNewWinner = _curMonarch && monarch != _curMonarch;
                const isEnded = blocksLeft <= 0;
                const isNewEnded = isEnded && !_isEnded;
                const isNewBlock = blocksLeft != _curBlocksLeft;
                const isNewPrize = _curPrize && !_curPrize.equals(prize);
                _isEnded = isEnded;
                _curPrize = prize;
                _curAmWinner = amWinner;
                _curBlocksLeft = blocksLeft;
                _curBlockEnded = blockEnded;
                _curMonarch = monarch;
                _curDecree = decree;

                // update DOM: monarch, decree, prize
                if (amWinner) _$e.addClass("winner");
                else _$e.removeClass("winner");
                // decree
                if (decree.length) _$decree.text(`"${decree}"`).show();
                else _$decree.empty().hide();
                // edge case for initial monarch where reignBlocks is large
                if (blocksReigned < 0) _$reignBlocks.hide();
                else _$reignBlocks.show();
                // update monarch and price
                _$monarch.empty().append(_$getMonarch(monarch));
                _$prize.text(`${util.toEthStrFixed(prize, null, "")}`);

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
                
                // if it's done, update everything.
                if (isEnded) {
                    _$e.addClass("ended");
                    _$btn.attr("disabled", "disabled");
                    _$blocksLeft.text("Ended");
                    _$currentMonarchCell.find(".label").text(" Winner");
                    _$alertsIcon.hide();
                    _self.updateEndedStatus();
                    return;
                }

                // Show confirmation if user did overthrow/refundsuccess/failure on this block.
                const events = obj.otSuccesses.concat(obj.otRefundSuccess).concat(obj.otRefundFailures)
                    .sort((a, b) => a.logIndex - b.logIndex);
                if (events.length) {
                    // show status cell
                    _$txStatus.empty().show();
                    _$status.hide();

                    const setClass = (cls) => {
                        _$statusCell.removeClass("prepending pending refunded success failure");
                        _$statusCell.addClass(cls);
                    }
                    setClass("");

                    // each time they clear a TxStatus, check to see if its now empty.
                    const onClear = ()=>{
                        if (_$txStatus.find(".TxStatus").length != 0) return;
                        setClass("");
                        _$txStatus.empty().hide();
                        _$status.show();
                    }

                    //event OverthrowOccurred(uint time, address indexed newMonarch, bytes23 decree, address indexed prevMonarch, uint fee);
                    //event OverthrowRefundSuccess(uint time, string msg, address indexed recipient, uint amount);
                    //event OverthrowRefundFailure(uint time, string msg, address indexed recipient, uint amount);
                    events.forEach(ev => {
                        const txStatus = util.getTxStatus({onClear: onClear});
                        const $link = util.$getTxLink("", ev.transactionHash)
                        txStatus.$e.appendTo(_$txStatus);
                        txStatus.complete($link);
                        if (ev.name == "OverthrowRefundSuccess" && ev.args.recipient == account) {
                            $link.text("Your overthrow attempt was refunded.");
                            txStatus.addWarningMsg(`You were refunded because:<br>"${ev.args.msg}"`);
                            if (events.length==1) setClass("refunded");
                        } else if (ev.name == "OverthrowRefundFailure" && ev.args.recipient == account) {
                            $link.text("Your overthrow could not be refunded.");
                            txStatus.addFailureMsg(`You were unable to be refunded because:<br>"${ev.args.msg}"`);
                            if (events.length==1) setClass("failure");
                        } else if (ev.name == "OverthrowOccurred" && ev.args.newMonarch == account) {
                            $link.text("Your overthrow succeeded!");
                            const $msg = $("<div></div>")
                                .append("You overthrew ")
                                .append(nav.$getPlayerLink(ev.args.prevMonarch))
                                .append(" and are now the Monarch.");
                            txStatus.addSuccessMsg($msg);
                            if (events.length==1) setClass("success");
                        }
                    });
                }

                // trigger things based on deltas
                _$blocksLeft.text(blocksLeft);
                if (amNowLoser){
                    _$status.empty()
                        .append("You've been overthrown by ")
                        .append(nav.$getPlayerLink(_curMonarch));
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
                    _$status.empty().append(`You are the current Monarch!<br>
                        You've reigned for <b>${blocksReigned} blocks</b> and will win
                        in <b>${blocksLeft} blocks</b> unless you are overthrown.`);
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
                        .append(nav.$getPlayerLink(_curMonarch))
                        .append(" is now the Monarch.");
                    _$e.removeClass("now-winner");
                    _$e.removeClass("now-loser");
                    flashClass("new-winner");
                } else {
                    if (amWinner) {
                        _$status.empty().append(`You are the current Monarch!<br>
                        You've reigned for <b>${blocksReigned} blocks</b> and will win
                        in <b>${blocksLeft} blocks</b> unless you are overthrown.`);
                    } else {
                        if (blocksReigned < 0) {
                            _$status.empty()
                                .append(nav.$getPlayerLink(_curMonarch))
                                .append(` will win in <b>${blocksLeft} blocks</b> unless they are overthrown.`);
                        } else {
                            _$status.empty()
                                .append(nav.$getPlayerLink(_curMonarch))
                                .append(` has reigned for <b>${blocksReigned} blocks</b> and
                                will win in <b>${blocksLeft} blocks</b> unless they are overthrown.`);
                        }

                    }
                }
                if (isNewBlock) flashClass("new-block");
                if (isNewPrize) flashClass("new-prize");
            }).catch(e => {
                _$status.empty().append(`Error refreshing:<br>`)
                    .append($("<span></span>").text(e.message));
            });
        };

        function _$getMonarch(monarch){
            return nav.$getPlayerLink(monarch);
        }
        function _getDecreeStr(bytes23){
            return MonarchyUtil.getDecreeStr(bytes23);
        }

        function _triggerAlerts(blocksLeft, amNowLoser, newWinner){
            if (Object.keys(_alerts).length==0) return;
            const timeStr = util.getLocalTime();
            const newWinnerStr = _curMonarch == ethUtil.getCurrentAccount()
                ? "You"
                : _curMonarch.slice(0, 10) + "...";
            const title = `Game @ ${_game.address.slice(0,10)}...`;

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
                    body: `${timeStr} - Game ended.`,
                    requireInteraction: true
                });
            } else {
                if (_alerts["whenBlocksLeft"]){
                    if (blocksLeft < _alerts["whenBlocksLeft"]) {
                        const body = blocksLeft <= 0
                            ? `${timeStr} - Game ended.`
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
            const txStatus = util.getTxStatus({
                waitTimeMs: waitTimeMs,
                onSuccess: (res, txStatus) => {
                    const success = res.events.find(e => e.name=="OverthrowOccurred");
                    const refundSuccess = res.events.find(e => e.name=="OverthrowRefundSuccess");
                    if (refundSuccess) {
                        setClass("refunded");
                        txStatus.addWarningMsg(`Your overthrow was refunded.<br>Please wait for provider to sync...`);
                    } else if (success) {
                        setClass("success");
                        txStatus.addSuccessMsg(`Your overthow succeeded.<br>Please wait for provider to sync...`);
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
                }
            });
            txStatus.$e.appendTo(_$txStatus);

            // create promise, or fail the TxStatus
            try {
                txStatus.setTxPromise(
                    _game.overthrow({
                        _decree: web3.fromUtf8(decree)
                    },{
                        gas: 51000,
                        value: _fee,
                        gasPrice: gasPrice
                    })
                );
            } catch (e) {
                setClass("failure");
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
                waitTimeMs: (waitTimeS || _blocktime*3) * 1000,
                onSuccess: (res, txStatus) => {
                    // event SendPrizeError(uint time, string msg);
                    // event SendPrizeSuccess(uint time, address indexed redeemer, address indexed recipient, uint amount, uint gasLimit);
                    // event SendPrizeFailure(uint time, address indexed redeemer, address indexed recipient, uint amount, uint gasLimit);
                    const success = res.events.find(e => e.name=="SendPrizeSuccess");
                    const error = res.events.find(e => e.name=="SendPrizeError");
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
                setClass("failure");
                txStatus.fail(`Error: ${e.message.split("\n")[0]}`);
                ethStatus.open();
            }
        }

        function _init() {
            // init tippies
            tippy(_$e.find(".tip-manually").toArray(), {
                dynamicTitle: true
            });

            // update other more involved tips
            _initAlerts();
            _initSendPrizeTip();
            _initHistoryTip();

            _$e.addClass("initializing");
            _$blocksLeft.text("Loading");
            _initialized = Promise.obj({
                fee: _game.fee(),
                prizeIncr: _game.prizeIncr(),
                reignBlocks: _game.reignBlocks(),
                initialPrize: _game.initialPrize(),
                startEvent: _game.getEvents("Started").then(evs => evs[0]).catch(e => null)
            }).then(obj => {
                _$e.removeClass("initializing");
                _fee = obj.fee;
                _prizeIncr = obj.prizeIncr;
                _reignBlocks = obj.reignBlocks.toNumber();

                // update static DOM elements (bid price, reign blocks, prizeIncr)
                _$bidPrice.text(`${util.toEthStrFixed(_fee, null, "")}`);
                _$reignBlocks
                    .text(`of ${_reignBlocks}`)
                    .attr("title", `The Monarch will win if they reign for ${_reignBlocks} blocks without getting overthrown.
                        <br>This value does not change.`);
                if (_prizeIncr.gt(0)){
                    _$e.find("td.prize .incr").text(`+${util.toEthStrFixed(_prizeIncr, 5, "")} per overthrow`);
                } else if (_prizeIncr.lt(0)) {
                    _$e.find("td.prize .incr").text(`${util.toEthStrFixed(_prizeIncr, 5, "")} per overthrow`);
                } else {
                    _$e.find("td.prize .incr").hide();
                }

                // initialize the settings container
                const $settings = _$e.find("td.settings");
                if (obj.startEvent) {
                    const timeStr = util.toDateStr(obj.startEvent.args.time);
                    const $link = util.$getTxLink(obj.startEvent.address).text(timeStr);
                    $settings.find(".setting.started .tx").append($link);
                } else {
                    $settings.find(".setting.started .tx").text("<unknown>");
                }
                $settings.find(".setting.started .start-prize").text(util.toEthStrFixed(obj.initialPrize));
                $settings.find(".setting.game-id .value").append(nav.$getMonarchyGameLink(_game.address));

                _initOverthrowTip(obj.prizeIncr);
            });
        }

        function _initAlerts(){
            const $alertsTip = _$e.find(".alerts-tip");
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
            const $tip = _$e.find(".history-tip");
            const $icon = _$e.find(".history-icon");
            var logViewer = null;
            var logViewerPromise = null;

            tippy($icon[0], {
                trigger: "click",
                animation: "fade",
                placement: "right",
                html: $tip.show()[0],
                onShow: function(){
                    refreshHistory();
                }
            });

            function refreshHistory(){
                if (logViewerPromise) return;
                if (logViewer == null) {
                    $tip.text("Loading...");
                    logViewerPromise = _game.getEvents("Started").then(evs => {
                        if (evs.length == 0) throw new Error(`Could not find start event.`);
                        return evs[0].blockNumber;
                    }).then(startBlock => {
                        logViewer = createLogViewer(startBlock)
                        $tip.empty().append(logViewer.$e);
                    }).catch(e => {
                        $tip.text(`Failed to load: ${e.message}`);
                    }).finally(()=>{
                        logViewerPromise = null;
                    });
                } else {
                    logViewer.reset(true);
                }
            }

            function createLogViewer(startBlock){
                return util.getLogViewer({
                    $head: "Monarch History",
                    events: [{
                        instance: _game,
                        name: "OverthrowOccurred",
                    },{
                        instance: _game,
                        name: "Started"
                    }],
                    order: "newest",
                    minBlock: startBlock,
                    maxBlock: _curBlockEnded ? _curBlockEnded : null,
                    blocksPerSearch: _reignBlocks * 10,
                    dateFn: (event, prevEvent, nextEvent) => {
                        if (!prevEvent || event.name=="GameStart"){
                            const dateStr = util.toDateStr(event.args.time, {second: false});
                            return $("<span></span>").text(dateStr).css("font-size", "80%");
                        } else {
                            const blockDiff = event.blockNumber - prevEvent.blockNumber;
                            const blockStr = blockDiff == 1 ? "block" : "blocks";
                            const timeDiff = event.args.time.minus(prevEvent.args.time);
                            return $("<div></div>")
                                .append(`${blockDiff} ${blockStr} later`)
                                .attr("title", `${util.toTime(timeDiff)}`)
                        }
                    },
                    valueFn: (event) => {
                        if (event.name=="OverthrowOccurred"){
                            return MonarchyUtil.$getOverthrowSummary(event, false);
                        } else if (event.name=="Started"){
                            return "<b>Game Started</b>";
                        }
                    }
                });
            }
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
                        $prize.text(util.toEthStrFixed(_curPrize));
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
        }

        // init overthrow tip
        function _initOverthrowTip(prizeIncr){
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
            const ethStr = util.toEthStrFixed(prizeIncr.abs());
            const prizeIncrStr =  prizeIncr.gt(0)
                ? `The prize will go up by ${ethStr}`
                : `The prize will go down by ${ethStr}`;
            $prizeIncr.text(prizeIncrStr);
            if (prizeIncr.equals(0)) $prizeIncr.hide();
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
        }

        _init();
    }
});