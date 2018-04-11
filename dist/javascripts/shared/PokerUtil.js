(function(){

	/*
		Stores a mapping of {gameId => gameState}. Each gameState has a 
		"blockUpdated" property. The controller will only update the gameState
		if the currentBlock is > "blockUpdated". GameStates can be updated
		manually via "updateGameStateFromEvent".
	*/
	function VpController(vp, ethUtil) {
		const _self = this;
		const _vp = vp;
		const _ethUtil = ethUtil;
		const _gameStates = {};
		var _user = null;
		var _numBlocks = null;

		this.setSettings = (user, numBlocks) => {
			// delete existing _gameStates if new user.
			if (_user != user) {
				Object.keys(_gameStates).forEach(k => delete _gameStates[k]);
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
			if (!_user || !_numBlocks) return _self.getGameStates();

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
					iHandRaw: PokerUtil.getIHand(ev.blockHash, id),
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
				gs.iHand = gs.iBlocksLeft > 0 ? gs.iHandRaw : new PokerUtil.Hand(0);
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
				gs.iHand = new PokerUtil.Hand(ev.args.iHand);

				// compute blocksLeft, iHand, dHand, handRank, payout
				gs.dBlocksLeft = Math.max((gs.dBlock + 255) - curBlock, 0);
				gs.dHandRaw = PokerUtil.getDHand(gs.dBlockHash, id, gs.iHand.toNumber(), gs.draws);
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
				gs.dHand = new PokerUtil.Hand(ev.args.dHand);
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

	function GameHistoryViewer(gameStates) {
		const _self = this;

		const _$e = $(`
            <table class="GameTable" cellpadding="0" cellspacing="0">
            	<thead>
	                <tr class="header">
	                    <td data-sort-prop="id">ID</td>
	                    <td data-sort-prop="bet.toNumber()">Bet</td>
	                    <td data-sort-prop="state">State</td>
	                    <td class="txs" data-sort-prop="latestEvent.args.time.toNumber()">TXs</td>
	                    <td class="hand">Hand</td>
	                    <td data-sort-prop="dHand.getRank()">Result</td>
	                    <td data-sort-prop="payout.toNumber()">Payout</td>
	                </tr>
                </thead>
                <tbody></tbody>
            </table>
        `);
        const _$tbody = _$e.find("tbody");
        const _$headers = _$e.find("thead td").click((e) => {
        	const $header = $(e.currentTarget);
        	var key = $header.data("sort-prop");
        	if (!key) return;
        	_self.setSort(key, $header.is(".sort-asc") ? "desc" : "asc");
        }).toArray();
		var _gameStates = [];
        var _sort = [];

        const _cmp = (function(){
        	function getVal(obj, key) {
        		const chunks = key.split(".");
        		while (chunks.length) {
        			const key = chunks.shift();
        			try { obj = key.endsWith("()") ? obj[key.slice(0,-2)]() : obj[key]; }
        			catch (e) { obj = null; }
        		}
        		return obj;
        	}
        	return (a, b) => {
	        	const val_a = getVal(a, _sort[0]);
	        	const val_b = getVal(b, _sort[0]);
	        	const ret = val_a == val_b
	        		? 0
	        		: val_a < val_b ? -1 : 1;
	        	return _sort[1]=="asc" ? ret : -1*ret;
	        }
        }());

        this.$e = _$e;

        this.setSort = function(key, ascOrDesc) {
        	if (ascOrDesc!=="asc" && ascOrDesc!=="desc")
        		throw new Error(`Must provide sort direction.`);
        	const $header = $(_$headers.find((e) => $(e).data("sort-prop")==key));
        	if ($header.length==0)
        		throw new Error(`Invalid sort key: ${key}`);

        	// remove sorts.
        	_$headers.forEach((e)=>$(e).removeClass("sort-asc sort-desc"));
        	$header.addClass(`sort-${ascOrDesc}`);

        	// apply sort to existing _gameStates
        	_sort = [`gs.${key}`, ascOrDesc];
        	const $rows = _$tbody.detach().children().detach();
        	_gameStates.stableSort(_cmp).forEach((obj, i) => {
        		_$tbody.append($rows.eq(obj.i));
        		obj.i = i;
        	});
        	_$e.append(_$tbody)
        };

        this.setGameStates = function(gameStates) {
        	_gameStates = gameStates.slice(0)
        		.map((gs, i) => { return {i: i, gs: gs}; })
        		.stableSort(_cmp);

        	_$tbody.detach().empty();
        	_gameStates.forEach((obj,i) => {
        		obj.i = i;
        		const gs = obj.gs;
	            const $game = $(`
	                <tr class='GameHistory'>
	                    <td class="id"></td>
	                    <td class="bet"></td>
	                    <td class="state"></td>
	                    <td class="txs"></td>
	                    <td class="hand">
	                        <div class="iHand"></div>
	                        <div class="dHand"></div>
	                        <div class="fHand"></div>
	                    </td>
	                    <td class="rank"></div>
	                    <td class="payout"></div>
	                </tr>
	            `).appendTo(_$tbody);

	            var fHand;
	            $game.find(".id").text(gs.id);
	            $game.find(".bet").text(util.toEthStr(gs.bet));
	            $game.find(".state").text(gs.state);
	            $game.find(".iHand").append(gs.iHandRaw.toHtml());
	            if (gs.state=="finalized" || gs.state=="drawn"){
	                fHand = gs.state=="drawn" ? gs.dHandRaw : gs.dHand;
	                $game.find(".dHand").append(gs.dHandRaw.toHtml());
	                $game.find(".fHand").append(fHand.toHtml());
	                $game.find(".rank").text(fHand.getRankString());
	                $game.find(".payout").text(util.toEthStr(gs.payout));
	            }
	            $game.find(".txs").append($getTx(gs.betEvent));
	            if (gs.drawEvent) $game.find(".txs").append($getTx(gs.drawEvent));
	            if (gs.finalizeEvent) $game.find(".txs").append($getTx(gs.finalizeEvent));
	            if (gs.isWinner) $game.addClass("is-winner");

	            function $getTx(ev) {
	                const $e = $(`<div class="tx"></div>`);
	                $e.append(util.$getTxLink(util.toDateStr(ev.args.time), ev.transactionHash));
	                return $e;
	            }

	            // mark initial cards as timedout, held, or neither.
	            (function(){
	                const $iCards = $game.find(".iHand .Card");
	                const timedout = gs.iHand.toNumber() !== gs.iHandRaw.toNumber();
	                const draws = gs.draws.toNumber();
	                if (timedout) $iCards.addClass("timedout");
	                if (draws > 0) {
	                    for (var i=0; i<=4; i++){
	                        const isDrawn = draws & Math.pow(2, i);
	                        if (!isDrawn) $iCards.eq(i).addClass("held");
	                    }
	                }
	            }());

	            // mark dCards as timedout. hide held cards
	            (function(){
	                if (!fHand) return;
	                const $dCards = $game.find(".dHand .Card");
	                const timedout = gs.dHand.toNumber() !== gs.dHandRaw.toNumber();
	                const draws = gs.draws.toNumber();
	                if (draws == 0) {
	                    $game.find(".dHand").text("no draws").addClass("no-draws");
	                    $game.find(".tx").eq(0).after("<div class='tx'></div>");
	                    return;
	                }
	                for (var i=0; i<=4; i++){
	                    const isDrawn = draws & Math.pow(2, i);
	                    if (!isDrawn) $dCards.eq(i).css("visibility","hidden");
	                    if (timedout) $dCards.eq(i).addClass("timedout");
	                }
	            }());

	            // mark fCards as timedout. mark winning cards.
	            (function(){
	                if (!fHand) return;
	                const $fCards = $game.find(".fHand .Card");
	                const timedout = gs.dHand.toNumber() !== gs.dHandRaw.toNumber();
	                const draws = gs.draws.toNumber();
	                const wCards = fHand.getWinningCards();
	                for (var i=0; i<=4; i++){
	                    const isDrawn = draws & Math.pow(2, i);
	                    if (isDrawn && timedout) $fCards.eq(i).addClass("timedout");
	                    if (wCards.indexOf(i)!==-1) $fCards.eq(i).addClass("winning");
	                }
	            }());
        	});
        	_$e.append(_$tbody);
        };

        (function _init(){
        	_self.setSort(`id`, `desc`);
        }());
	}


	var HandUtil = (function(){
	    function Hand(numOrArray) {
            const _self = this;

	        // _cards will be set to an array of cards between 0-51
	        // If any card is invalid, _cards will be an empty array.
	        // Does not check for duplicates.
	        const _cards = (function(){
	            if (!numOrArray) return [];
	            function cardFromNum(cardNum) {
	                if (typeof cardNum !== "number") return null;
	                return new Card(cardNum);
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
	            arr = arr.filter(c => !!c && c.cardNum <= 51);
	            if (arr.length != 5) arr = [];
	            return arr;
	        }());

	        this.cards = _cards;
	        
	        this.clone = function(){
	            return new Hand(_cards);
	        };

	        this.toNumber = function(){
	            var num = 0;
	            _cards.forEach((c,i) => {
	                const mask = c.cardNum * Math.pow(2, 6*i);
	                num = num + mask;
	            });
	            return num;
	        };

	        // True if all 5 cards are unique, and between 0-51
	        this.isValid = function(){
	            if (_cards.length != 5) return false;
	            if (numOrArray == 0) return false;
	            if (_cards.some(c => c.cardNum > 51)) return false;

	            // ensure there are 5 unique card values
	            const seen = {};
	            _cards.forEach(c => seen[c.cardNum] = true);
	            return Object.keys(seen).length == 5;
	        };

	        this.toString = function(){
	            if (!this.isValid()) return '[InvalidHand]';
	            const cardsStr = _cards.map(c => c.toString()).join(", ");
	            return `${cardsStr} [(${this.toNumber()}) ${this.getRankString()}]`;
	        };

            this.toHtml = function() {
                const $e = $(`
                    <div class="Hand">
                    </div>
                `);
                if (!this.isValid()) {
                    $e.addClass("invalid");
                    $e.text("[Invalid Hand]");
                    return $e;
                }
                return $e.html(_cards.map(c => c.toString(true)));
            };

	        this.isWinner = function(){
	        	return this.getRank() <= 9;
	        };

            // Returns an array of card indexes that contribute to winning hand.
            this.getWinningCards = function() {
                const rank = this.getRank();
                if (rank == 11 || rank == 10) return [];
                // rf, sf, fh, fl, st: return all cards
                if ([1,2,4,5,6].indexOf(rank)!==-1) return [0,1,2,3,4];
                // cards that have non-unique values
                const counts = (new Array(13)).fill(0);
                _cards.forEach(c => counts[c.val]++);
                return _cards
                    .map((c,i)=>counts[c.val] > 1 ? i : null)
                    .filter(i=>i!=null);
            };

	        this.getRank = function(){
	            if (this.isValid()) {
	                if (isRoyalFlush()) return 1;
	                else if (isStraightFlush()) return 2;
	                else if (isFourOfAKind()) return 3;
	                else if (isFullHouse()) return 4;
	                else if (isFlush()) return 5;
	                else if (isStraight()) return 6;
	                else if (isThreeOfAKind()) return 7;
	                else if (isTwoPair()) return 8;
	                else if (isJacksOrBetter()) return 9;
	                else return 10;
	            } else {
	                return 11;
	            }
	        };

	        this.getRankString = function(){
	            const str = Hand.getRankString(this.getRank());
	            if (str == "Nothing") return isLowPair() ? "Low Pair" : "High Card";
	            else return str;
	        };

	        function isRoyalFlush() {
	            const hasAce = _cards.some(c => c.isAce);
	            const highVal = max(_cards.map(c => c.val));
	            return hasAce && highVal == 12 && isStraightFlush();
	        }
	        function isStraightFlush() {
	            return isStraight() && isFlush();
	        }
	        function isFourOfAKind(){
	            return hasCounts([4,1]);
	        }
	        function isFullHouse(){
	            return hasCounts([3,2]);
	        }
	        function isFlush(){
	            return _cards.every(c => c.suit == _cards[0].suit);
	        }
	        function isStraight(){
	            if (!hasCounts([1,1,1,1,1])) return;
	            const hasAce = _cards.some(c => c.isAce);
	            const highValNonAce = max(_cards.map(c => c.isAce ? 0 : c.val));
	            const lowValNonAce = min(_cards.map(c => c.isAce ? 100 : c.val));
	            return hasAce
	                ? highValNonAce == 4 || lowValNonAce == 9
	                : highValNonAce - lowValNonAce == 4;
	        }
	        function isThreeOfAKind(){
	            return hasCounts([3,1,1]);
	        }
	        function isTwoPair(){
	            return hasCounts([2,2,1]);
	        }
	        function isJacksOrBetter(){
	            if (!hasCounts([2,1,1,1])) return;
	            const counts = (new Array(13)).fill(0);
	            _cards.forEach(c => counts[c.val]++);
	            return [0,10,11,12,13].some(val => counts[val]>1);
	        }
            function isLowPair() {
                return hasCounts([2,1,1,1]);
            }

	        function min(arr){ return Math.min.apply(Math, arr); }
	        function max(arr){ return Math.max.apply(Math, arr); }
	        function hasCounts(arr) {
	            var counts = (new Array(13)).fill(0);
	            _cards.forEach(c => counts[c.val]++);
	            counts = counts.filter(c => !!c).sort();
	            return arr.sort().every((exp,i) => exp===counts[i]);
	        }
	    }
	    Hand.getRankString = function(rank) {
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
                10: "Nothing",
                11: "Invalid Hand"
            })[rank];
	    };

        function Card(cardNum) {
            this.cardNum = cardNum;
            this.val = cardNum % 13;
            this.suit = Math.floor(cardNum / 13);
            this.isAce = cardNum % 13 == 0;
        }
        Card.prototype = {
            toValString: function() {
                return (function(val){
                    if (val == 0) return 'A';
                    if (val <= 9) return `${val+1}`;
                    if (val == 10) return "J";
                    if (val == 11) return "Q";
                    if (val == 12) return "K";
                }(this.val));
            },
            toSuitString: function() {
                return (['♠','♥','♦','♣'])[this.suit];    
            },
            toClass: function() {
                return (['spade','heart','diamond','club'])[this.suit];
            },
            toString: function(asHtml) {
                const str = this.toValString() + this.toSuitString();
                return asHtml
                    ? `<span class="Card ${this.toClass()}">${str}</span>`
                    : str;
            }
        };

	    // - blockhash: a string of hexEncoded 256 bit number
	    // - gameId: a number or BigNumber
	    function getIHand(blockhash, gameId) {
	        const idHex = toPaddedHex(gameId, 32);
	        const hexHash = web3.sha3(blockhash + idHex, {encoding: "hex"});
	        const cardNums = getCardsFromHash(hexHash, 5);
	        return new Hand(cardNums);
	    }

	    // - blockhash: a string of hexEncoded 256 bit number
	    // - gameId: a number or BigNumber
	    // - iHand: a Hand object of the original hand, or number
	    // - drawsNum: from 0 to 31.
	    function getDHand(blockhash, gameId, iHand, drawsNum) {
	        // get 5 new cards
	        const idHex = toPaddedHex(gameId, 32);
	        const hexHash = web3.sha3(blockhash + idHex, {encoding: "hex"});
	        return drawCardsFromHash(hexHash, iHand, drawsNum);
	    }

	    // - hexHash: a string of hexEncoded 256 bit number
	    // - iHand: a Hand object of the original hand, or number
	    // - drawsNum: from 0 to 31
	    function drawCardsFromHash(hexHash, iHand, drawsNum) {
	        iHand = new Hand(iHand);
	        if (drawsNum > 31) throw new Error(`Invalid drawsNum: ${drawsNum}`);
	        if (!iHand.isValid() && drawsNum<31) throw new Error(`Cannot draw ${drawsNum} to an invalid hand.`);

	        const excludedCardNums = iHand.isValid() ? iHand.cards.map(c => c.cardNum) : [];
	        const newCards = getCardsFromHash(hexHash, 5, excludedCardNums);

	        // swap out oldCards for newCards.
	        const drawsArr = getDrawsArray(drawsNum);
	        const oldCards = iHand.cards.map(c => c.cardNum);
	        const cards = drawsArr.map((useNew, i)=>{
	            return useNew ? newCards[i] : oldCards[i];
	        });

	        // return hand
	        return new Hand(cards);
	    }

	    function getDrawsArray(drawsNum) {
	    	const drawsArr = [0,0,0,0,0];
	        if (drawsNum & 1) drawsArr[0] = 1;
	        if (drawsNum & 2) drawsArr[1] = 1;
	        if (drawsNum & 4) drawsArr[2] = 1;
	        if (drawsNum & 8) drawsArr[3] = 1;
	        if (drawsNum & 16) drawsArr[4] = 1;
	        return drawsArr;
	    }

	    function getCardsFromHash(hexHash, numCards, excludedCardNums) {
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

	    function toPaddedHex(num, bits) {
	        num = new BigNumber(num);
	        const targetLen = Math.ceil(bits / 4);
	        const hexStr = num.toString(16);
	        if (hexStr.length > targetLen)
	            throw new Error(`Cannot convert ${num} to ${bits} bits... it's too large.`);
	        const zeroes = (new Array(targetLen-hexStr.length+1)).join("0");
	        return `${zeroes}${hexStr}`;
	    }

		return {
			Hand: Hand,
		    getIHand: getIHand,
		    getDHand: getDHand,
		    getDrawsArray: getDrawsArray
		};
	}());

	window.PokerUtil = {
		VpController: VpController,
		GameHistoryViewer: GameHistoryViewer,
		Hand: HandUtil.Hand,
		getIHand: HandUtil.getIHand,
		getDHand: HandUtil.getDHand,
		getDrawsArray: HandUtil.getDrawsArray
	}
}())