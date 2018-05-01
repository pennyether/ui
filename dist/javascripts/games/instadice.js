Loader.require("dice")
.then(function(dice){
    const computeResult = DiceUtil.computeResult;
    const computePayout = DiceUtil.computePayout;
    const _$curRolls = $(".current-rolls .rolls");
    const _$curRollsEmpty = $(".current-rolls .empty");
    const _$curRollsClear = $(".current-rolls .head .clear").click(clearCurRolls);
    const _$pastRolls = $(".past-rolls .rolls");
    const _$pastRollsEmpty = $(".past-rolls .empty");

    ethUtil.onStateChanged(state => {
        if (!state.isConnected) return;
        refreshBetUiSettings();
        refreshAllRolls();
        refreshLiveRolls();
    });

    const _betUi = new BetUi();
    _betUi.$e.appendTo($(".bet-ui-ctnr"));
    _betUi.setOnRoll(doRoll);

    const _controller = new DiceUtil.DiceController(dice, ethUtil);
    const _rolls = {};
    const _curRolls = [];

    function refreshAllRolls() {
        const user = ethUtil.getCurrentStateSync().account;
        if (!user) return;

        Promise.all([
            dice.feeBips(),
        ]).then(arr => {
            const feeBips = arr[0];
            _controller.setSettings(user, 256, feeBips);
            return _controller.refreshRolls();
        }).then(states => {
            states.sort((a, b) => {
                return a.createdTimestamp - b.createdTimestamp;
            })
            states.reverse().forEach(createOrUpdateRoll);
            refreshRollContainers();
        });
    }

    function createOrUpdateRoll(state) {
        var roll = _rolls[state.txId];
        if (!roll) {
            roll = new Roll();
            roll.setOnEvent(ev => updateRollFromEvent(ev, roll));
            roll.$e.appendTo(_$pastRolls);
            _rolls[state.txId] = roll;
        }
        roll.setState(state);
        return roll;
    }

    function updateRollFromEvent(ev, roll) {
        const state = _controller.updateRollFromEvent(ev);
        if (!state) {
            console.warn("Could not update roll.", ev);
            return;
        }
        roll.setState(state);
        refreshRollContainers();
    }
    
    function refreshBetUiSettings() {
        Promise.all([
            dice.minBet(),
            dice.maxBet(),
            dice.curMaxBet(),
            dice.minNumber(),
            dice.maxNumber(),
            dice.feeBips()
        ]).then(arr=>{
            const maxBet = BigNumber.min(arr[1], arr[2]);
            _betUi.setSettings({
                minBet: arr[0].div(1e18),
                maxBet: maxBet.div(1e18),
                minNumber: arr[3],
                maxNumber: arr[4],
                feeBips: arr[5]
            });
        });
    }

    function doRoll(obj) {
        const number = obj.number;
        const bet = obj.bet;
        const payout = obj.payout;
        const gasPrice = obj.gasPrice;
        const waitTimeMs = obj.waitTimeMs;
        var rollPromise;

        try {
            rollPromise = dice.roll({_number: number}, {value: bet, gas: 60000, gasPrice: gasPrice});
        } catch(e) {
            console.error(e);
            ethStatus.open();
            return;
        }

        // Create roll
        const roll = new Roll();
        roll.setOnEvent(ev => updateRollFromEvent(ev, roll));
        roll.setOnRemove(() => {
            roll.$e.addClass("tiny");
            setTimeout(() => {
                roll.$e.remove();
                refreshRollContainers(); 
            }, 500);
        });
        roll.setState({
            state: "new",
            bet: bet,
            number: number,
            payout: payout,
            rollPromise: rollPromise,
            waitTimeMs: waitTimeMs
        });
        // When it gets txHash, add it to _rolls array so we can
        //  refresh it when controller sees new events.
        rollPromise.getTxHash.then(txId => {
            _rolls[txId] = roll;
            _curRolls.push(roll);
        });
        // Display it, scroll to it, and refresh containers
        roll.$e.prependTo(_$curRolls);
        roll.$e.addClass("tiny");
        setTimeout(()=>{ roll.$e.removeClass("tiny"); }, 0);
        doScrolling(".bet-ui-ctnr", 400);
        refreshRollContainers();
    }

    function refreshRollContainers() {
        // Allow clearing if theres at least one current roll that is not new.
        const hasClearable = _curRolls.some(roll => roll.getState().state != "new");
        if (hasClearable) { _$curRollsClear.show(); }
        else _$curRollsClear.hide();
        // Show / Hide cur rolls "empty"
        if (_$curRolls.children().length == 0) _$curRollsEmpty.show();
        else _$curRollsEmpty.hide();
        // Show / Hide past rolls "empty"
        if (_$pastRolls.children().length == 0) _$pastRollsEmpty.show()
        else _$pastRollsEmpty.hide();
    }
    function clearCurRolls() {
        // remove clearable rolls from _curRolls
        const rollsToClear = _curRolls.filter(roll => roll.getState().state != "new");
        rollsToClear.forEach(r => {
            _curRolls.splice(_curRolls.indexOf(r), 1);
            r.$e.prependTo(_$pastRolls);
        });
        refreshRollContainers();
    }

    function Roll() {
        const _$e = $(`
            <div class="Roll">
                <div class="header" style="display: flex;">
                    <div class="info" style="flex-grow: 1;">
                        <span class="bet-value"></span> on <span class="number-value"></span>
                         for <span class="payout-value"></span>
                    </div>
                    <div class="created"></div>
                    <div class="view-link"></div>
                </div>
                <div class="new">
                    <div style="display: flex; align-items: center;">
                        <div class="loader" style="flex-shrink: 0; padding: 10px;">
                            <div class="roll-icon">
                                <div class="number"></div>
                                <div class="label">roll</div>
                            </div>
                        </div>
                        <div class="status-ctnr" style="flex-grow: 1;">
                            <div class="status"></div>
                        </div>
                    </div>
                </div>
                <div class="refunded">
                    <div class="refund-link"></div>
                    <div class="refund-msg"></div>
                </div>
                <div class="rolled" style="display: flex; align-items: center;">
                    <div class="left" style="flex-shrink: 0;">
                        <div class="roll-icon">
                            <div class="number"></div>
                            <div class="label">roll</div>
                        </div>
                    </div>
                    <div class="middle" style="flex-shrink: 0;">
                        <div class="result-status"></div>
                    </div>
                    <div class="right" style="flex-grow: 1; text-align: center;">
                        <div class="lost">
                            <div class="inspiration"></div>
                        </div>
                        <div class="waiting">
                            <div class="auto">
                                Winnings will be sent if you roll again within <div class="finalize-blocks-left"></div> blocks.
                            </div>
                            <div class="or">or</div>
                            <div class="manual">
                                <button class="btn-claim">Claim Winnings Now</button>
                                <div class="claim-status"></div>
                                <div style="text-align: center;">
                                    <div class="time-warning tip" title="Results are based off of the blockhash,
                                    and InstaDice cannot look back farther than 256 blocks. This is a limitation of Ethereum."
                                    data-tippy-placement="left">
                                        Note: You must roll again or claim within <div class="finalize-blocks-left"></div> blocks.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="payout-success"></div>
                    </div>
                </div>
            </div>
        `);
        const _$betValue = _$e.find(".bet-value");
        const _$numberValue = _$e.find(".number-value");
        const _$payoutValue = _$e.find(".payout-value");
        const _$created = _$e.find(".created");
        // the three states it can be
        const _$new = _$e.find(".new");
        const _$rolled = _$e.find(".rolled");
        const _$refunded = _$e.find(".refunded");
        // _$new stuff
        const _$loader = _$new.find(".loader").hide();
        const _$status = _$new.find(".status");
        // _$refunded stuff
        const _$refundMsg = _$refunded.find(".refund-msg");
        const _$refundLink = _$refunded.find(".refund-link");
        // _$rolled substates
        const _$lost = _$rolled.find(".lost");
        const _$waiting = _$rolled.find(".waiting");
        const _$payoutSuccess = _$rolled.find(".payout-success");

        // _$rolled elements
        const _$number = _$rolled.find(".number");
        const _$resultStatus = _$rolled.find(".result-status");
        // If lost
        const _$inspiration = _$rolled.find(".inspiration");
        // If waiting
        const _$finalizeBlocksLeft = _$rolled.find(".finalize-blocks-left");
        const _$btnClaim = _$rolled.find(".btn-claim");
        const _$claimStatus = _$rolled.find(".claim-status").hide();

        var _onEvent = (ev) => {};
        var _onRemove = () => {};
        var _state;

        this.setState = _setState;
        this.setOnEvent = (fn) => _onEvent = fn;
        this.setOnRemove = (fn) => _onRemove = fn;
        this.getState = () => _state;
        this.$e = _$e;

        /*
            id, txId
            state: "refunded", "wagered", "finalized", "payout-failed", "payout-success"
            bet, number, payout
            createdEvent, result, isWinner, finalizedEvent, paymentEvent
        */
        function _setState(state) {
            _state = state;
            _stopLoader();
            _refreshInfo();
            _refreshBody();
        }

        function _refreshInfo() {
            _$betValue.text(util.toEthStrFixed(_state.bet));
            _$numberValue.text(`${_state.number}`);
            _$payoutValue.text(util.toEthStrFixed(_state.payout));
            if (_state.createdEvent) {
                const txId = _state.createdEvent.transactionHash;
                const linkStr = _state.state=="refunded" ? `Roll Refunded` : `Roll #${_state.id}`;
                const $rollLink = _$getViewLink(linkStr);
                const dateStr = util.toDateStr(_state.createdEvent.args.time);
                const $txLink = util.$getTxLink(dateStr, txId);
                _$created.empty().append($txLink).append($rollLink).append(" - ").append($txLink);
            }
        }

        function _refreshBody() {
            _$e.removeClass("new refunded failed winner loser");
            _refreshInfo();

            _$new.hide();
            _$rolled.hide();
            _$refunded.hide();
            if (_state.state == "new") {
                _$e.addClass("new");
                const rollPromise = _state.rollPromise;
                const waitTimeMs = _state.waitTimeMs;
                _$new.show();
                util.$getTxStatus(_state.rollPromise, {
                    waitTimeMs: waitTimeMs,
                    onFailure: e => _$e.removeClass("new").addClass("failed"),
                    onSuccess: res => {
                        const wagered = res.events.find(ev => ev.name=="RollWagered");
                        const refunded = res.events.find(ev => ev.name=="RollRefunded");
                        _onEvent(wagered || refunded);
                    },
                    onClear: () => _onRemove()
                }).appendTo(_$status);
                rollPromise.getTxHash.then(_startLoader);
                return;
            }
            if (_state.state == "refunded") {
                _$e.addClass("refunded");
                _$refunded.show();
                const $link = util.$getTxLink(`Your wager was refunded:`, _state.createdEvent.transactionHash);
                _$refundLink.empty().append($link);
                _$refundMsg.text(_state.refundMsg);
                return;
            }

            _$e.addClass(_state.isWinner ? "winner" : "loser");
            _$rolled.show();
            _$number.text(_state.result);
            if (_state.isWinner) {
                _$resultStatus.text(`≤ ${_state.number}. You won!`);
            } else {
                _$resultStatus.text(`> ${_state.number}. You lost.`);
            }

            // show substate (wagered, finalized)
            _$lost.hide();
            _$waiting.hide();
            _$payoutSuccess.hide();
            if (_state.isWinner) {
                if (_state.state == "wagered") {
                    _initClaimStuff();
                    _$waiting.show();
                    _$finalizeBlocksLeft.text(_state.finalizeBlocksLeft);
                    _$claimStatus.hide();
                } else if (_state.state == "finalized") {
                    const amt = _state.payout
                    _$payoutSuccess.empty()
                        .append(`✓ Your winnings of ${util.toEthStrFixed(amt)} `)
                        .append(util.$getTxLink(`have been paid.`, _state.finalizedEvent.transactionHash))
                        .show();
                }
            } else {
                _$lost.show();
                _$inspiration.text(_getInspired(_state.txId));
            }
        }

        function _initClaimStuff() {
            if (_initClaimStuff.done) return;
            _initClaimStuff.done = true;

            tippy(_$e.find(".tip").toArray());

            const gps = util.getGasPriceSlider(5);
            const $claimTip = $("<div></div>").append(gps.$e);
            (function attachTip(){
                tippy(_$btnClaim[0], {
                    // arrow: false,
                    theme: "light",
                    animation: "fade",
                    html: $claimTip.show()[0],
                    onShow: function(){ gps.refresh(); },
                    onHidden: function(){
                        // fixes a firefox bug where the tip won't be displayed again.
                        _$btnClaim[0]._tippy.destroy();
                        attachTip();
                    }
                });
            }());

            _$btnClaim.click(function(){
                this._tippy.hide(0);
                $(this).blur();

                var promise;
                try {
                    promise = dice.payoutPreviousRoll([], {gasPrice: gps.getValue()});
                } catch (e) {
                    console.error(e);
                    ethStatus.open();
                    return;
                }

                const $txStatus = util.$getTxStatus(promise, {
                    waitTimeMs: (gps.getWaitTimeS() || 45) * 1000,
                    miningMsg: "Your payout is being claimed...",
                    onSuccess: (res, txStatus) => {
                        const finalized = res.events.find(ev => ev.name=="RollFinalized");
                        if (finalized) {
                            const ethStr = util.toEthStrFixed(finalized.args.payout);
                            txStatus.addSuccessMsg(`Your roll was finalized, and you were paid ${ethStr}`);
                            _onEvent(finalized);
                        } else {
                            const $link = _$getViewLink("Click here");
                            const $e = $("<div></div>").append("<br>No events occurred. ")
                                .append($link)
                                .append(" for more details.");
                            txStatus.addWarningMsg($e);
                        }
                    },
                    onClear: () => _$claimStatus.empty().hide()
                }).appendTo(_$claimStatus.empty().show());
                _$claimStatus.show().append();
            });
        }

        function _$getViewLink(txt) {
            return nav.$getRollLink(_state.txId).text(txt);
        }

        var _loaderTimeout;
        function _startLoader() {
            const $n = _$loader.show().find(".number");

            (function tick() {
                $n.text(Math.round(1 + Math.random()*98));
                _loaderTimeout = setTimeout(tick, 100);
            }());
        }
        function _stopLoader() {
            clearTimeout(_loaderTimeout);
        }

        const _getInspired = (function(){
            const msgs = [
                "Don't give up so easily...",
                "Don't give up so easily...",
                "Don't give up so easily...",
                "Don't give up so easily...",
                "Don't give up so easily...",
                "Better luck next time",
                "Better luck next time",
                "Better luck next time",
                "Better luck next time",
                "Better luck next time",
                "You can shake it off",
                "Stay strong",
                "Believe in yourself",
                "Follow your dreams",
                "You'll win next time... maybe.",
                "You're just a tiny bit unlucky",
                "Let's pretend like this never happened.",
                "By tomorrow, you'll forget all about this.",
                "You miss 100% of the shots you don't take",
                "Why not try again?",
                "At least you still have your health.",
                "Some things just weren't meant to be.",
                "It's not the end of the world",
                "Just do it!!!",
                "Are you gonna do something about it?",
                "It's not such a big deal.",
            ];
            return function(txId) {
                const rand = (new BigNumber(txId)).mod(msgs.length).toNumber();
                return msgs[rand];
            };
        }());
    }
            
    /*
        Bet placing UI.
    */
    function BetUi() {
        const _$e = $(`
            <div class="BetUi">
                <div class="not-available" style="display: flex; align-items: center; justify-content: center;">
                    <div class="msg">
                        InstaDice is currently not accepting wagers.
                    </div>
                </div>
                <div style="display: flex;">
                    <div style="flex-grow: 1;">
                        <div class="bet-slider"></div>
                        <div class="num-slider"></div>
                    </div>
                    <div style="flex-shrink: 0; width: 230px;">
                        <div class="summary" style="height: 100%; width: 100%; display: flex; flex-direction: column; justify-content: center;">
                            <div class="valid">
                                <div class="payout-ctnr">
                                    <div class="label">Payout</div>
                                    <div class="payout">--</div>
                                    <div class="multiple">--</div>
                                </div>
                                <button class="btn-roll">Roll!</button>
                                <div class="roll-tip"></div>
                            </div>
                            <div class="invalid" style="display: none; align-self: center;">
                                <div class="msg">Bet is not a number.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
        const _$summary = _$e.find(".summary");
        const _$valid = _$summary.find(".valid");
        const _$invalid = _$summary.find(".invalid");
        const _$msg = _$invalid.find(".msg");
        const _$payout = _$summary.find(".payout");
        const _$multiple = _$summary.find(".multiple");

        var _betSlider = util.getSlider("Bet");
        _betSlider.$e.appendTo(_$e.find(".bet-slider"));
        _betSlider.setValue(0.01);
        _betSlider.setOnChange(_refreshPayout);
        var _numSlider = util.getSlider("Number");
        _numSlider.$e.appendTo(_$e.find(".num-slider"));
        _numSlider.setValue(50);
        _numSlider.setOnChange(_refreshPayout);

        // set via settings
        var _feeBips;
        var _onRoll = (obj) => { };

        // roll tip
        (function _initRollButton(){
            const gps = util.getGasPriceSlider(5);
            const $rollBtn = _$e.find(".btn-roll");
            const $rollTip = $("<div></div>").append(gps.$e);
            (function attachTip(){
                tippy($rollBtn[0], {
                    // arrow: false,
                    theme: "light",
                    animation: "fade",
                    html: $rollTip.show()[0],
                    onShow: function(){ gps.refresh(); },
                    onHidden: function(){
                        // fixes a firefox bug where the tip won't be displayed again.
                        $rollBtn[0]._tippy.destroy();
                        attachTip();
                    }
                });
            }());

            $rollBtn.click(function(){
                this._tippy.hide(0);
                
                var bet = _betSlider.getValue();
                var number = _numSlider.getValue();
                if (bet == null || number == null) {
                    alert("Invalid bet or number.");
                    return;
                }

                $(this).blur();
                const betWei = bet.mul(1e18);
                _onRoll({
                    bet: betWei,
                    number: number,
                    payout: computePayout(betWei, number, _feeBips),
                    gasPrice: gps.getValue(),
                    waitTimeMs: (gps.getWaitTimeS() || 45) * 1000,
                });
            });
        }());

        this.setSettings = function(settings) {
            if (settings.maxBet.equals(0) || settings.maxBet.lt(settings.minBet)) {
                _$e.find("> .not-available").show();
                return;
            } else {
                _$e.find("> .not-available").hide();
            }

            _$e.find("> .not-available").hide();
            _feeBips = settings.feeBips;
            _betSlider.setUnits([{
                name: "eth",
                min: settings.minBet,
                max: settings.maxBet,
                $label: "ETH"
            }]);
            _numSlider.setUnits([{
                name: "num",
                min: settings.minNumber,
                max: settings.maxNumber,
                $label: ""
            }]);
            _refreshPayout();
        };
        this.$e = _$e;
        this.setOnRoll = (fn) => _onRoll = fn;

        function _refreshPayout() {
            _$valid.hide();
            _$invalid.hide();
            const bet = _betSlider.getValue();
            const number = _numSlider.getValue();
            if (bet === null) {
                _$invalid.show();
                _$msg.text("Please provide a valid bet.");
                return;
            }
            if (number === null) {
                _$invalid.show();
                _$msg.text("Please provide a valid number.");
                return;
            }

            _$valid.show();
            const betWei = bet.mul(1e18);
            const payout = computePayout(betWei, number, _feeBips);
            const multiple = payout.div(betWei).toFixed(2);
            _$payout.text(`${payout.div(1e18).toFixed(4)} ETH`);
            _$multiple.text(`${multiple}x return, ${number}% win odds`);
        }
    }

    /******************************************************/
    /*** LIVE FEED ****************************************/
    /******************************************************/
    var _lastCheckedBlock = null;
    var _promiseInView = promiseInView($(".liveRolls")[0]);
    function refreshLiveRolls() {
        const MAX_ELEMENTS = 6;
        const toBlock = ethUtil.getCurrentBlockHeight().toNumber();
        const fromBlock = _lastCheckedBlock ? _lastCheckedBlock + 1 : (toBlock - 250);
        _lastCheckedBlock = toBlock;
        dice.getEvents("RollWagered", {}, fromBlock, toBlock)
            .then((events)=>_promiseInView.then(()=>events))
            .then((events)=>{
                if (events.length > MAX_ELEMENTS) events = events.slice(-MAX_ELEMENTS);
                events.forEach((e, i)=>{
                    const txId = e.transactionHash;
                    const rollId = e.args.id.toNumber();
                    const dateStr = util.toDateStr(e.args.time);
                    const betStr = util.toEthStrFixed(e.args.bet);
                    const number = e.args.number.toNumber();
                    const $userLink = nav.$getPlayerLink(e.args.user);
                    const payoutStr = util.toEthStrFixed(e.args.payout);
                    const result = computeResult(e.blockHash, rollId);
                    const isWinner = !result.gt(number);

                    const $txLink = util.$getTxLink(dateStr, txId);
                    const $rollLink = $("<a target='_blank'></a>")
                        .attr("href", `/games/view-instadice-roll.html#${rollId}`)
                        .text(`Roll #${rollId}`);
                    const $e = $(".mini-roll.template")
                        .clone()
                        .removeClass("template")
                        .show()
                        .prependTo($(".liveRolls .rolls"));
                    $e.find(".head .right").append($rollLink);
                    $e.find(".date").empty().append($txLink);
                    $e.find(".bettor").append($userLink);
                    $e.find(".bet").text(betStr);
                    $e.find(".number").text(number);
                    $e.find(".payout").text(payoutStr);
                    $e.find(".rollnumber").text(result);
                    $e.find(".win-result").text(isWinner ? "and won" : "did not win");
                    if (isWinner) $e.addClass("won");
                    setTimeout(()=>$e.addClass("new"), (events.length-i)*200);
                });
                // trim excess elements (but not the template!)
                $(".mini-roll:not(.template)").toArray()
                    .slice(MAX_ELEMENTS).forEach(e=>$(e).remove());
            });


    }

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
            const $rolls = $("#Leader .rolls .value");
            const $wagered = $("#Leader .wagered .value");
            const $won = $("#Leader .won .value");
            Promise.all([
                dice.numRolls(),
                dice.totalWagered(),
                dice.totalWon()
            ]).then(arr=>{
                const curRolls = Number($rolls.text());
                const curWagered = Number($wagered.text());
                const curWon = Number($won.text());
                const newRolls = arr[0].toNumber();
                const newWagered = arr[1].div(1e18).toNumber();
                const newWon = arr[2].div(1e18).toNumber();
                _prevEases.forEach(cancel => cancel());
                _prevEases[0] = easeNumber(curRolls, newRolls, 3000, (n)=>{
                    $rolls.text(Math.round(n));
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