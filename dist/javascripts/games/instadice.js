Loader.require("dice")
.then(function(dice){
    const computeResult = DiceUtil.computeResult;
    const computePayout = DiceUtil.computePayout;
    const _$currentRolls = $(".current-rolls .body");
    const _$pastRolls = $(".past-rolls .body");

    ethUtil.onStateChanged(state => {
        if (!state.isConnected) return;
        refreshBetUiSettings();
        refreshAllRolls();
        // refreshStats();
        // refreshLiveRolls();
    });

    const _betUi = new BetUi();
    _betUi.$e.appendTo($(".bet-ui-ctnr"));
    _betUi.setOnRoll(doRoll);

    const _controller = new DiceUtil.DiceController(dice, ethUtil);
    const _rolls = {};

    function refreshAllRolls() {
        Promise.all([
            dice.feeBips(),
            dice.finalizeId(),
        ]).then(arr => {
            const feeBips = arr[0];
            const finalizeId = arr[1];
            const user = ethUtil.getCurrentStateSync().account;
            _controller.setSettings(user, 256, feeBips, finalizeId);
            return _controller.refreshRolls();
        }).then(states => {
            states.reverse().forEach(createOrUpdateRoll);
        });
    }

    function createOrUpdateRoll(state) {
        var roll = _rolls[state.txId];
        if (!roll) {
            roll = new Roll();
            roll.setOnEvent(ev => updateRollFromEvent(ev, roll));
            roll.$e.appendTo(_$pastRolls);
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
                maxNumber: arr[4].plus(1),
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
            rollPromise = dice.roll({_number: number}, {value: bet, gas: 147000, gasPrice: gasPrice});
        } catch(e) {
            console.error(e);
            ethStatus.open();
            return;
        }

        // Create roll
        const roll = new Roll();
        roll.setOnEvent(ev => updateRollFromEvent(ev, roll));
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
        });
        // Display it, and scroll to it.
        roll.$e.prependTo(_$currentRolls);
        //doScrolling("#BetterCtnr", 400);
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
                                You'll automatically get paid after <div class="finalize-rolls-left"></div> more rolls occur.
                            </div>
                            <div class="or">or</div>
                            <div class="manual">
                                <button class="btn-claim">Claim Winnings Now</button>
                                <div class="claim-status"></div>
                                <div class="time-warning tipLeft" title="Results are based off of the blockhash,
                                and the contract cannot look back further than 256 blocks. This is a limitation of Ethereum.">
                                    Note: If not enough rolls occur, you must claim within <div class="finalize-blocks-left"></div> blocks.
                                </div>
                            </div>
                        </div>
                        <div class="payout-success"></div>
                        <div class="payout-failure">
                            <div class="warning">
                                InstaDice was unable to pay your win!<br>
                                Please <span class="link">click here</span> for more information.
                            </div>
                        </div>
                    </div>
                </div>
                <div class="view-link"></div>
            </div>
        `);
        const _$betValue = _$e.find(".bet-value");
        const _$numberValue = _$e.find(".number-value");
        const _$payoutValue = _$e.find(".payout-value");
        const _$created = _$e.find(".created");
        const _$viewLink = _$e.find(".view-link").hide();
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
        const _$payoutFailure = _$rolled.find(".payout-failure");
        // _$rolled elements
        const _$number = _$rolled.find(".number");
        const _$resultStatus = _$rolled.find(".result-status");
        // If lost
        const _$inspiration = _$rolled.find(".inspiration");
        // If waiting
        const _$finalizeRollsLeft = _$rolled.find(".finalize-rolls-left");
        const _$finalizeBlocksLeft = _$rolled.find(".finalize-blocks-left");
        const _$btnClaim = _$rolled.find(".btn-claim");
        const _$claimStatus = _$rolled.find(".claim-status").hide();

        var _onEvent = (ev) => {};
        var _state;

        this.setState = _setState;
        this.setOnEvent = (fn) => _onEvent=fn;
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
                const $txLink = util.$getTxLink(linkStr, txId);
                const dateStr = util.toDateStr(_state.createdEvent.args.time);
                _$created.empty().append($txLink).append(` ${dateStr}`);
                _$viewLink.empty().append(_$getViewLink("🔍")).show();
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
                    onClear: () => _$e.remove()
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

            // show substate (waiting, payoutsuccess, payoutfailure)
            _$lost.hide();
            _$waiting.hide();
            _$payoutSuccess.hide();
            _$payoutFailure.hide();
            if (_state.isWinner) {
                if (_state.state == "wagered") {
                    _initClaimStuff();
                    _$waiting.show();
                    _$finalizeBlocksLeft.text(_state.finalizeBlocksLeft);
                    _$finalizeRollsLeft.text(_state.finalizeRollsLeft);
                    _$claimStatus.hide();
                } else if (_state.state == "finalized") {
                    if (_state.didPayoutSucceed) {
                        const amt = _state.paymentEvent.args.payout;
                        _$payoutSuccess.empty()
                            .append(`✓ Your winnings of ${util.toEthStrFixed(amt)} `)
                            .append(util.$getTxLink(`have been paid.`, _state.paymentEvent.transactionHash))
                            .show();
                    } else {
                        _$payoutFailure.show();
                        _$payoutFailure.find(".link").empty().append(_$getViewLink("click here"));
                    }
                }
            } else {
                _$lost.show();
                _$inspiration.text(_getInspired(_state.txId));
            }
        }

        function _initClaimStuff() {
            if (_initClaimStuff.done) return;
            _initClaimStuff.done = true;

            const gps = util.getGasPriceSlider(5);
            const $claimTip = $("<div></div>").append(gps.$e);
            (function attachTip(){
                tippy(_$btnClaim[0], {
                    // arrow: false,
                    theme: "light",
                    animation: "fade",
                    placement: "top",
                    html: $claimTip.show()[0],
                    trigger: "mouseenter",
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

                const promise = dice.payoutRoll([_state.id], {gasPrice: gps.getGasPrice()});
                const $txStatus = util.$getTxStatus(promise, {
                    waitTimeMs: (gps.getWaitTimeS() || 45) * 1000,
                    miningMsg: "Your payout is being claimed...",
                    onSuccess: res => {
                        const txStatus = $txStatus.data("TxStatus");
                        const finalized = res.events.find(ev => ev.name=="RollFinalized");
                        if (finalized) _onEvent(finalized);

                        const payoutSuccess = res.events.find(ev => ev.name=="PayoutSuccess");
                        const payoutFailure = res.events.find(ev => ev.name=="PayoutFailure");
                        if (payoutSuccess) {
                            txStatus.$status.append(`<br>You've been paid. Please wait a moment.`);
                            _onEvent(payoutSuccess);
                            return;
                        }

                        const $link = _$getViewLink("Click here");
                        if (payoutFailure) {
                            txStatus.$status.append("<br>Payout failed. ")
                                .append($link)
                                .append(" for more details.");
                            return;
                        } else {
                            txStatus.$status.append("<br>No events occurred. ")
                                .append($link)
                                .append(" for more details.");
                        }
                    },
                    onClear: () => _$claimStatus.empty().hide()
                }).appendTo(_$claimStatus.empty().show());
                _$claimStatus.show().append();
            });
        }

        function _$getViewLink(txt) {
            return $("<a></a>").text(txt).attr("href", `/games/viewroll.html#${_state.txId}`);
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
            <div class="BetUi" style="display: flex;">
                <div style="flex-grow: 1;">
                    <div class="bet-slider"></div>
                    <div class="num-slider"></div>
                </div>
                <div style="flex-shrink: 0; width: 230px;">
                    <div class="summary" style="height: 100%; width: 100%; display: flex; flex-direction: column; justify-content: center;">
                        <div class="valid">
                            <div class="label">Payout</div>
                            <div class="payout">--</div>
                            <div class="multiple">--</div>
                            <button class="btn-roll">Roll!</button>
                            <div class="roll-tip"></div>
                        </div>
                        <div class="invalid" style="display: none; align-self: center;">
                            <div class="msg">Bet is not a number.</div>
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
        _betSlider.setValue(0.1);
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
                    placement: "top",
                    html: $rollTip.show()[0],
                    trigger: "mouseenter",
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
                    const betStr = util.toEthStr(e.args.bet);
                    const number = e.args.number.toNumber();
                    const $userLink = e.args.user == ethUtil.getCurrentAccount()
                        ? util.$getAddrLink("You!", e.args.user)
                        : util.$getShortAddrLink(e.args.user);
                    const payoutStr = util.toEthStr(e.args.payout);
                    const result = computeResult(e.blockHash, rollId);
                    const isWinner = !result.gt(number);

                    const $rollLink = util.$getTxLink(`Roll #${rollId}`, txId);
                    const $viewLink = $("<a target='_blank'>🔎</a>").attr("href", `/games/viewroll.html#${rollId}`);
                    const $e = $(".mini-roll.template")
                        .clone()
                        .removeClass("template")
                        .show()
                        .prependTo($(".liveRolls .rolls"));
                    $e.find(".head .right")
                        .append($rollLink)
                        .append(" ")
                        .append($viewLink);
                    $e.find(".date").text(dateStr);
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
        const $rolls = $("#Summary .rolls .value");
        const $wagered = $("#Summary .wagered .value");
        const $won = $("#Summary .won .value");
        Promise.all([
            dice.curId(),
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
    refreshStats();

});