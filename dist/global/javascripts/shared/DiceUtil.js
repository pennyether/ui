(function(){
    (function(){
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .dice-roll-event .top > span {
                display: inline-block;
                margin-right: 5px;
            }
            .dice-roll-wagered.won .result,
            .dice-roll-wagered.won .sign, 
            .dice-roll-wagered.won .number {
                color: green;
            }
            .dice-roll-wagered.lost .result,
            .dice-roll-wagered.lost .sign, 
            .dice-roll-wagered.lost .number {
                color: red;
            }
            .dice-roll-payout.success .success-str {
                color: green;
            }
            .dice-roll-payout.failure .success-str {
                color: red;
            }
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
    }());

    /*
        Manages events by loading a bunch from events, parses them all,
          and only updates them if the blockUpdated is newer.

        ethUtil: uses this for access to current block
        user: which user to grab events for
        numBlocks: how many blocks to look back
        getEventsFn: must return an array of events, ordered by parse order
        parseEventFn: given an object, must amend the state.
                      it should return nothing if to discard state.
    */
    function StateController() {
        const _self = this;

        var _user;
        var _numBlocks;
        var _ethUtil;
        var _getEventsFn = (user, fromBlock) => {};
        var _parseEventFn = (ev, state) => { };

        var _states = {};

        this.setSettings = function(settings) {
            ["ethUtil", "user","numBlocks","getEventsFn","parseEventFn"].forEach(name => {
                if (settings[name] === undefined) throw new Error(`StateController requires ${name} setting.`);
            });
            const didChange = (_ethUtil!==settings.ethUtil || _user!==settings.user
                || _numBlocks!==settings.numBlocks || _getEventsFn!==settings.getEventsFn
                || _parseEventFn!==settings.parseEventFn);

            if (didChange) _states = {};
            _ethUtil = settings.ethUtil;
            _user = settings.user;
            _numBlocks = settings.numBlocks;
            _getEventsFn = settings.getEventsFn;
            _parseEventFn = settings.parseEventFn;
        };

        this.getStates = ()=>Object.values(_states);
        this.refreshStates = _refreshStates;
        this.updateStateFromEvent = _updateStateFromEvent;

        function _refreshStates() {
            if (!_user || !_numBlocks) return _states;

            const curBlockNum = _ethUtil.getCurrentStateSync().latestBlock.number;
            const fromBlock = curBlockNum - _numBlocks;
            return Promise.resolve(_getEventsFn(_user, fromBlock)).then(events => {
                // Delete states older than a block. They will be repopulated.
                // This prevents states from being deleted that were just added
                //  via an event not loaded in .refreshStates().
                Object.keys(_states).forEach(id => {
                    const state = _states[id];
                    if (curBlockNum > state.blockUpdated) {
                        delete _states[id];
                    }
                });

                // Update states of all the games we've gotten, in order of event.
                events.forEach(_updateStateFromEvent);
                return _self.getStates();
            });
        }

        function _updateStateFromEvent(ev) {
            const curBlockNum = _ethUtil.getCurrentStateSync().latestBlock.number;
            const id = ev.args.id;
            const state = _states[id] || {};
            // Do not update this item, we already have a state.
            if (state.blockUpdated && ev.blockNumber < state.blockUpdated) return;

            // If parseEventFn returns nothing, it means it refused to update the roll.
            // It probably got an event that requires the state to exist but it doesnt.
            if (!_parseEventFn(ev, state)) return;

            if (!state.id) {
                throw new Error(`State object must have an ID after being parsed.`);
            }
            state.blockUpdated = ev.blockNumber;
            _states[state.id] = state;
            return state;
        }
    }

    function DiceController(dice, ethUtil) {
        const _controller = new StateController();
        const _dice = dice;
        const _ethUtil = ethUtil;

        var _feeBips;

        this.setSettings = (user, numBlocks, feeBips) => {
            _controller.setSettings({
                ethUtil: _ethUtil,
                user: user,
                numBlocks: numBlocks,
                getEventsFn: _getEvents,
                parseEventFn: _parseEvent
            });
            _feeBips = feeBips;
        }
        this.getRolls = _controller.getStates;
        this.refreshRolls = _controller.refreshStates;
        this.updateRollFromEvent = _controller.updateStateFromEvent;

        function _getEvents(user, fromBlock) {
            return Promise.all([
                _dice.getEvents("RollRefunded", {user: user}, fromBlock),
                _dice.getEvents("RollWagered", {user: user}, fromBlock),
                _dice.getEvents("RollFinalized", {user: user}, fromBlock)
            ]).then(arr => {
                const events = [];
                arr.forEach(evs => evs.forEach(ev => events.push(ev)));
                return events;
            });
        }

        function _parseEvent(event, roll) {
            const curBlockNum = _ethUtil.getCurrentBlockHeight().toNumber();
            if (event.name == "RollRefunded") {
                roll.id = event.transactionHash;
                roll.txId = event.transactionHash;
                roll.state = "refunded";
                roll.bet = event.args.bet;
                roll.number = event.args.number;
                roll.payout = computePayout(roll.bet, roll.number, _feeBips);
                roll.refundMsg = event.args.msg;
                roll.createdEvent = event;
                roll.createdTimestamp = event.args.time.toNumber();
            }
            if (event.name == "RollWagered") {
                roll.id = event.args.id;
                roll.txId = event.transactionHash;
                roll.state = "wagered"
                roll.bet = event.args.bet;
                roll.number = event.args.number;
                roll.payout = event.args.payout;
                roll.result = computeResult(event.blockHash, roll.id);
                roll.isWinner = roll.result.lte(roll.number);
                roll.finalizeBlocksLeft = Math.max((event.blockNumber+255) - curBlockNum, 0)
                roll.createdEvent = event;
                roll.createdTimestamp = event.args.time.toNumber();
            }
            if (event.name == "RollFinalized") {
                if (roll.id === undefined) return;
                roll.state = "finalized";
                roll.result = event.args.result;
                roll.isWinner = roll.result.lte(roll.number);
                roll.finalizedEvent = event;
            }
            return roll;
        }
    }

    function computeResult(blockHash, id) {
        const hash = web3.sha3(blockHash + ethUtil.toBytesStr(id, 4), {encoding: "hex"});
        const bn = new BigNumber(hash);
        return bn.mod(100).plus(1);
    }
    function computePayout(bet, number, feeBips) {
        const feePct = feeBips.div(10000);
        const ret = (new BigNumber(1)).minus(feePct);
        return bet.mul(100).div(number).mul(ret);
    }

    function getRoll(dice, rollId) {
        return dice.rolls([rollId]).then(arr => {
            const userId = arr[1];
            return dice.userAddresses([userId]).then(userAddr => {
                return {
                    id: arr[0],
                    userId: userId,
                    user: userAddr,
                    bet: arr[2],
                    number: arr[3],
                    payout: arr[4],
                    block: arr[5],
                    result: arr[6],
                    isPaid: arr[7]
                };
            });
        });
    }

    function $getEventSummary(event, showUser) {
        if (event.name == "RollWagered") {
            // event RollWagered(uint time, uint32 indexed id, address indexed user, uint bet, uint8 number, uint payout);
            const $e = $(`
                <div class='dice-roll-event dice-roll-wagered'>
                    <div class='top'>
                        <span class='roll'>
                            <span class='label'>Roll:</span>
                            <span class='value'></span>
                        </span>
                        <span class='user'>
                            <span class='label'>User:</span>
                            <span class='value'></span>
                        </span>
                        <span class='bet'>
                            <span class='label'>Bet:</span>
                            <span class='value'></span>
                        </span>
                    </div>
                    <div class='bottom'>
                        <span class='result'></span>
                        <span class='sign'></span>
                        <span class='number'></span>
                        <span class='outcome'></span>
                        <span class='payout'></span>
                    </div>
                </div>
            `);
            const result = computeResult(event.blockHash, event.args.id);
            const payoutEth = util.toEthStrFixed(event.args.payout);
            const payoutMult = event.args.payout.div(event.args.bet).toFixed(2);
            const payout = `${payoutEth} (${payoutMult}x)`
            $e.find(".roll .value").append(nav.$getRollLink(event.args.id));
            $e.find(".user .value").append(nav.$getPlayerLink(event.args.user));
            $e.find(".bet .value").text(util.toEthStrFixed(event.args.bet));
            $e.find(".number").text(event.args.number);
            $e.find(".result").text(result);
            $e.find(".payout").text(payout);
            if (result.lte(event.args.number)) {
                $e.find(".sign").text("≤");
                $e.find(".outcome").text(" Won: ");
                $e.addClass("won");
            } else {
                $e.find(".sign").text(">");
                $e.find(".outcome").text(" Did not win: ");
                $e.addClass("lost");
            }
            if (!showUser) $e.find(".user").hide();
            return $e;
        } else if (event.name == "RollRefunded") {
            // event RollRefunded(uint time, address indexed user, string msg, uint bet, uint8 number);
            const $e = $(`
                <div class="dice-roll-event dice-roll-refunded">
                    <div class='top'>
                        <span class="roll">
                            <span class="label">Roll:</span>
                            <span class="value"></span>
                        </span>
                        <span class="user">
                            <span class="label">User:</span>
                            <span class="value"></span>
                        </span>
                        <span class="bet">
                            <span class="label">Bet:</span>
                            <span class="value"></span>
                        </span>
                        <span class="number">
                            <span class="label">On:</span>
                            <span class="value"></span>
                            <span class="label">or under.</span>
                        </span>
                    </div>
                    Bet was refunded: "<span class='msg'></span>"
                </div>
            `);
            $e.find(".roll .value").append($getRollLink(event.transactionHash));
            $e.find(".user .value").append($getUserLink(event.args.user));
            $e.find(".bet .value").text(util.toEthStrFixed(event.args.bet));
            $e.find(".number .value").text(event.args.number);
            $e.find(".msg").text(event.args.msg);
            return $e;
        } else if (event.name == "RollFinalized") {
            // event RollFinalized(uint time, uint32 indexed id, address indexed user, uint8 result, uint payout);
            const $e = $(`
                <div class="dice-roll-event dice-roll-finalized">
                    <div class='top'>
                        <span class="roll">
                            <span class="label">Roll:</span>
                            <span class="value"></span>
                        </span>
                        <span class="user">
                            <span class="label">User:</span>
                            <span class="value"></span>
                        </span>
                    </div>
                    Finalized result to <span class="result"></span>. 
                    <span class="result-str"></span><span class="payout"></span>
                </div>
            `);
            const isWinner = event.args.payout.gt(0);
            const resultStr = isWinner ? "Won: " : "Lost.";
            $e.addClass(isWinner ? "won" : "lost");
            $e.find(".roll .value").append(nav.$getRollLink(event.args.id));
            $e.find(".user .value").append(nav.$getPlayerLink(event.args.user));
            $e.find(".result").text(event.args.result);
            $e.find(".result-str").text(resultStr);
            $e.find(".payout").text(util.toEthStrFixed(event.args.payout));
            if (!isWinner) $e.find(".payout").hide();
            return $e;
        } else if (event.name == "PayoutSuccess" || event.name == "PayoutFailure") {
            // event PayoutSuccess(uint time, uint32 indexed id, address indexed user, uint payout);
            // event PayoutFailure(uint time, uint32 indexed id, address indexed user, uint payout);
            const $e = $(`
                <div class="dice-roll-event dice-roll-payout">
                    <div class='top'>
                        <span class="roll">
                            <span class="label">Roll:</span>
                            <span class="value"></span>
                        </span>
                        <span class="user">
                            <span class="label">User:</span>
                            <span class="value"></span>
                        </span>
                    </div>
                    <span class="success-str"></span>
                    <span class="payout"></span>
                </div>
            `);
            const successStr = event.name == "PayoutSuccess"
                ? "Successful paid user "
                : "Failed to pay user ";
            const cls = event.name == "PayoutSuccess" ? "success" : "failure"
            $e.addClass(cls);
            $e.find(".roll .value").append(nav.$getRollLink(event.args.id));
            $e.find(".user .value").append(nav.$getPlayerLink(event.args.user));
            $e.find(".success-str").text(successStr);
            $e.find(".payout").text(util.toEthStrFixed(event.args.payout));
            return $e;
        } else {
            return `Unsupported: ${event.name}`;
        }
    }

    window.DiceUtil = {
        DiceController: DiceController,
        computeResult: computeResult,
        computePayout: computePayout,
        getRoll: getRoll,
        $getEventSummary: $getEventSummary
    };
}())