(function(){

	/*
		Stores a mapping of {gameId => gameState}. Each gameState has a 
		"blockUpdated" property. The controller will only update the gameState
		if the currentBlock is > "blockUpdated". GameStates can be updated
		manually via "updateGameStateFromEvent".
	*/
	function DiceController(dice, ethUtil) {
		const _self = this;
		const _dice = dice;
		const _ethUtil = ethUtil;
		const _rolls = {};
		var _user = null;
		var _numBlocks = null;

		this.setSettings = (user, numBlocks) => {
			// delete existing _gameStates if new user.
			if (_user != user) {
				Object.keys(_rolls).forEach(k => delete _gameStates[k]);
			}
			// set _user and _numBlocks
			_user = user;
			_numBlocks = numBlocks;
		}
		this.getGameStates = ()=>Object.values(_gameStates);
		this.getLatestGameStates = _getLatestGameStates;
		this.updateGameStateFromEvent = _updateGameStateFromEvent;

		// Updates _gameStates to contain gameStates of a user in the last numBlocks.
		// Will remove any gameStates that were updated over a block ago.
		function _getLatestGameStates() {
			if (!_user || !_numBlocks) return _gameStates;

			const curBlockNum = _ethUtil.getCurrentStateSync().latestBlock.number;
			const blockCutoff = curBlockNum - _numBlocks;
			return Promise.all([
				vp.getEvents("BetSuccess", {user: _user}, blockCutoff),
	    		vp.getEvents("DrawSuccess", {user: _user}, blockCutoff),
	    		vp.getEvents("FinalizeSuccess", {user: _user}, blockCutoff),
	    		_loadPayTables()
			]).then(arr=>{
				// Delete games older than a block. They will be repopulated.
	            // This assumes the provider has an event lag of at most 1 block.
				Object.keys(_gameStates).forEach(id=>{
	                const gs = _gameStates[id];
	                if (curBlockNum > gs.blockUpdated) {
	                    delete _gameStates[id];
	                }
	            });

				// Update states of all the games we've gotten, in order.
				arr[0].forEach(_updateGameStateFromEvent);
				arr[1].forEach(_updateGameStateFromEvent);
				arr[2].forEach(_updateGameStateFromEvent);

				return _self.getGameStates();
			});
		}

		// Updates a gameState from an event received.
		function _updateGameStateFromEvent(ev) {
			const curBlock = _ethUtil.getCurrentStateSync().latestBlock.number;
	        const blockUpdated = Math.max(curBlock, ev.blockNumber);
	        const id = ev.args.id.toNumber();
			var gs = _gameStates[id];

			// Clobber gameState with data from event.
			if (ev.name == "BetSuccess") {
				gs = {
					state: "dealt",
					id: id,
					uiid: ev.args.uiid.toNumber(),
					bet: ev.args.bet,
					payTableId: ev.args.payTableId,
					payTable: _getPayTable(ev.args.payTableId.toNumber()),
					iBlock: ev.blockNumber,
					iBlockHash: ev.blockHash,
					iBlocksLeft: null,
					iHandRaw: PUtil.getIHand(ev.blockHash, id),
	                iHand: null,
					draws: new BigNumber(0),
					dBlock: null,
					dBlockHash: null,
					dBlocksLeft: null,
					dHandOriginal: null,
	                dHand: null,
					handRank: null,
					payout: null,
	                betEvent: ev,
	                drawEvent: null,
	                finalizeEvent: null,
	                latestEvent: ev,
	                isWinner: false,
	                isInvalid: false,
	                isActive: null,
	                blockUpdated: null
				};
				// compute iHand, dHand
				gs.iBlocksLeft = Math.max((gs.iBlock + 255) - curBlock, 0);
				gs.iHand = gs.iBlocksLeft > 0 ? gs.iHandRaw : new PUtil.Hand(0);
	            gs.isActive = true;
	            gs.blockUpdated = blockUpdated;
				_gameStates[id] = gs;
				return gs;
			}

			// Tack on draw data, if we've seen the game bet.
			if (ev.name == "DrawSuccess") {
				if (!gs) return;

				gs.state = "drawn";
	            gs.drawEvent = ev;
	            gs.latestEvent = ev;
				gs.draws = ev.args.draws;
				gs.dBlock = ev.blockNumber;
				gs.dBlockHash = ev.blockHash;
				gs.iHand = new PUtil.Hand(ev.args.iHand);

				// compute blocksLeft, iHand, dHand, handRank, payout
				gs.dBlocksLeft = Math.max((gs.dBlock + 255) - curBlock, 0);
				gs.dHandRaw = PUtil.getDHand(gs.dBlockHash, id, gs.iHand.toNumber(), gs.draws);
				gs.dHand = gs.dBlocksLeft > 0 ? gs.dHandRaw : gs.iHand;
				gs.handRank = gs.dHand.getRank();
				gs.payout = gs.bet.mul(gs.payTable[gs.handRank]);
	            gs.isWinner = gs.payout.gt(0);
				gs.isActive = gs.isWinner ? true : false;
	            gs.blockUpdated = blockUpdated;
				return gs;
			}

			// Tack on finalization data, if we've seen the game bet.
			if (ev.name == "FinalizeSuccess") {
				if (!gs) return;

				gs.state = "finalized";
	            gs.finalizeEvent = ev;
	            gs.latestEvent = ev;
				gs.dHand = new PUtil.Hand(ev.args.dHand);
	            // They skipped drawing. We set iHand and dHandRaw to final hand.
	            if (!gs.dHandRaw) {
	                gs.iHand = gs.dHand;
	                gs.dHandRaw = gs.iHand;
	            }
				gs.handRank = ev.args.handRank.toNumber();
				gs.payout = ev.args.payout;
	            gs.isWinner = gs.payout.gt(0);
				gs.isActive = false;
	            gs.blockUpdated = blockUpdated;
				return gs;
			}

			throw new Error(`Unexpected event: ${ev.name}`);
		}

		// LoadPayTables: will load all un-loaded paytables to memory.
	    // getPayTable: returns payTable synchronously.
		const _payTables = [];
		function _loadPayTables() {
			return vp.numPayTables().then((n)=>{
				n = n.toNumber();
				
				const promises = [];
				for (var i=_payTables.length; i<n; i++) {
					let index = i;
					promises.push(_vp.getPayTable([index]).then(pt => {
						_payTables[index] = pt;
					}));
				}
				return Promise.all(promises);
			});
		}

		function _getPayTable(i) {
			if (!_payTables[i]) throw new Error(`Paytable #${i} not yet loaded.`);
			return _payTables[i];
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

	window.DiceUtil = {
		DiceController: DiceController,
		computeResult: computeResult,
		computePayout: computePayout
	};
}())