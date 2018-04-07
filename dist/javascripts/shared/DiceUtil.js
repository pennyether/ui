(function(){

	// Manages events by loading a bunch from events, parses them all,
	//  and only updates them if the blockUpdated is newer
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
			_ethUtil = settings.ethUtil;
			_user = settings.user;
			_numBlocks = settings.numBlocks;
			_getEventsFn = settings.getEventsFn;
			_parseEventFn = settings.parseEventFn;

			_states = {};
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
	            // This assumes the provider has an event lag of at most 1 block.
				Object.keys(_states).forEach(id => {
	                const state = _states[id];
	                if (curBlockNum > state.blockUpdated) {
	                    delete _state[id];
	                }
	            });

				// Update states of all the games we've gotten, in order.
				events.forEach(_updateStateFromEvent);
				return _self.getStates();
			});
		}

		function _updateStateFromEvent(ev) {
			const curBlockNum = _ethUtil.getCurrentStateSync().latestBlock.number;
	        const blockUpdated = Math.max(curBlockNum, ev.blockNumber);
	        const id = ev.args.id;
	        const state = _states[id] || {};
	        if (!_parseEventFn(ev, state)) return;

	        state.blockUpdated = blockUpdated;
	        _states[id] = state;
	        return state;
		}
	}

	function DiceController(dice, ethUtil) {
		const _controller = new StateController();
		const _dice = dice;
		const _ethUtil = ethUtil;

		var _curId;
		var _feeBips;
		var _finalizeId;

		this.setSettings = (user, numBlocks, feeBips, curId, finalizeId) => {
			_controller.setSettings({
				ethUtil: _ethUtil,
				user: user,
				numBlocks: numBlocks,
				getEventsFn: _getEvents,
				parseEventFn: _parseEvent
			});
			_curId = curId;
			_feeBips = feeBips;
			_finalizeId = finalizeId;
		}
		this.getRolls = _controller.getStates;
		this.refreshRolls = _controller.refreshStates;
		this.updateRollFromEvent = _controller.updateStateFromEvent;

		function _getEvents(user, fromBlock) {
			return Promise.all([
				_dice.getEvents("RollRefunded", {user: user}, fromBlock),
				_dice.getEvents("RollWagered", {user: user}, fromBlock),
	    		_dice.getEvents("RollFinalized", {user: user}, fromBlock),
	    		_dice.getEvents("PayoutFailure", {user: user}, fromBlock),
	    		_dice.getEvents("PayoutSuccess", {user: user}, fromBlock)
			]).then(arr => {
				const events = [];
				arr.forEach(evs => evs.forEach(ev => events.push(ev)));
				return events;
			});
		}

		function _parseEvent(event, roll) {
			const curBlockNum = _ethUtil.getCurrentBlockHeight().toNumber();
			if (event.name == "RollRefunded") {
				roll.txId = event.transactionHash;
				roll.state = "refunded";
				roll.bet = event.args.bet;
				roll.number = event.args.number;
				roll.payout = computePayout(roll.bet, roll.number, _feeBips);
				roll.refundMsg = event.args.msg;
				roll.createdEvent = event;
			}
			if (event.name == "RollWagered") {
				roll.id = event.args.id;
				roll.txId = event.transactionHash;
				roll.state = "wagered"
				roll.bet = event.args.bet;
				roll.number = event.args.number;
				roll.payout = event.args.payout;
				roll.result = computeResult(event.blockHash, roll.id);
				roll.isWinner = !roll.result.gt(roll.number);
				roll.finalizeRollsLeft = Math.max((roll.id - _finalizeId) + 1, 0);
				roll.finalizeBlocksLeft = Math.max((event.blockNumber+255) - curBlockNum, 0)
				roll.createdEvent = event;
			}
			if (event.name == "RollFinalized") {
				if (roll.id === undefined) return;
				roll.result = event.args.result;
				roll.isWinner = !roll.result.gt(roll.number);
				roll.state = "finalized";
				roll.finalizedEvent = event;
			}
			if (event.name == "PayoutFailure") {
				if (roll.id === undefined) return;
				roll.didPayoutSucceed = false;
				roll.paymentFailureEvents = roll.paymentFailureEvents || [];
				roll.paymentFailureEvents.push(event);
			}
			if (event.name == "PayoutSuccess") {
				if (roll.id === undefined) return;
				roll.didPayoutSucceed = true;
				roll.paymentEvent = event;
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

	window.DiceUtil = {
		DiceController: DiceController,
		computeResult: computeResult,
		computePayout: computePayout,
		getRoll: getRoll
	};
}())