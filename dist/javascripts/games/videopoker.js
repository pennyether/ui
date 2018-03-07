Loader.require("vp")
.then(function(vp){
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
	});
	
	const g = new Game(vp);
	$(".CurrentGame").empty().append(g.$e);
	g.setParams({
		betPayTable: [800,50,25,9,6,4,3,2,1],
		minBet: (new BigNumber(.01)).mul(1e18),
		maxBet: (new BigNumber(.20)).mul(1e18),
	});
});

function Game(vp) {
	const _$e = $(".Game.template").clone().show();
	const _$payTable = _$e.find(".payTable");
	const _$bet = _$e.find(".bet");
	const _$betSlider = _$bet.find(".betSlider");
	const _$betTxt = _$bet.find(".betTxt");
	const _$betErr = _$bet.find(".betErr").hide();
	// const _$draw = _$e.find(".draw").hide();
	// const _$finalize = _$e.find(".finalize").hide();
	// const _$logs = _$e.find(".logs").hide();

	const _vp = vp;
	var _betPayTable;

	var _canBet;
	var _curPayTable;

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
	this.setParams = function(params) {
		// update betPayTable multipliers
		_betPayTable = params.betPayTable;
		const $rows = _$payTable.find("tr");
		_betPayTable.forEach((v,i)=>{
			$rows.eq(i+1).find("td").eq(1).text(`${v} x`);
		});

		// update betscale
		_minBet = params.minBet;
		_maxBet = params.maxBet;
		_updateBetScale();
	}

	function _updateBetScale() {
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

	function _refreshBet() {
		_$betErr.hide();

		const bet = _getBet();
		if (bet === null) {
			_$betErr.text("Bet must be a number").show();
			_refreshPayOuts();
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
		_refreshPayOuts();
	}

	function _refreshPayOuts() {
		var bet = _getBet();
		const $rows = _$payTable.find("tr");
		if (bet!==null) {
			bet = bet.div(1e18);
			const betStr = bet.toFixed(3);
			$rows.eq(0).find("td").eq(2).text(`Payout (for ${betStr} ETH bet)`);
			_betPayTable.forEach((v,i)=>{
				const payout = (bet * v).toFixed(3);
				$rows.eq(i+1).find("td").eq(2).text(`${payout} ETH`);
			});
		} else {
			_betPayTable.forEach((v,i)=>{
				$rows.eq(i+1).find("td").eq(2).text(`--`);
			});
		}
	}

	function _getBet() {
		var bet = _$betTxt.val();
		try { bet = (new BigNumber(bet)).mul(1e18); }
		catch (e) { bet = null; }
		return bet;
	}

	function _initDealButton() {
    	const gps = util.getGasPriceSlider(5);
    	const $dealBtn = _$e.find(".btnDeal");
    	const $dealTip = $("<div></div>").show().append(gps.$e);
    	(function attachTip(){
    		tippy($dealBtn[0], {
				// arrow: false,
				theme: "light",
				animation: "fade",
				placement: "top",
				html: $dealTip[0],
				trigger: "mouseenter",
				onShow: function(){ gps.refresh(); },
				onHidden: function(){
					// fixes a firefox bug where the tip won't be displayed again.
					$dealBtn[0]._tippy.destroy();
					attachTip();
				}
			});
    	}());

		$dealBtn.click(function(){
			this._tippy.hide(0);
			$(this).blur();
			if ($(this).is(".disabled")) return;
			
			const bet = _getBet();
			if (bet===null) { return; }
			
			try {
				const dealPromise = vp.bet([], {value: bet, gas: 130000, gasPrice: gps.getValue()});
				const $txStatus = util.$getTxStatus(dealPromise, {
					waitTimeMs: (gps.getWaitTimeS() || 30) * 1000,
					successMsg: "Bet received! Please wait a moment to see your cards.",
					onSuccess: (res)=>{
						$txStatus.find(".clear").hide();
						console.log("result:", res);
					},
					onClear: function(){
						_$bet.find(".statusArea").empty().hide();
					}
				});
				_$bet.find(".statusArea").empty().show().append($txStatus);

				$dealBtn.attr("disabled","disabled").addClass("disabled").text("Dealing...");
				dealPromise.then(()=>{
					$dealBtn.text("Dealt!");
				}).catch(()=>{
					$dealBtn.removeAttr("disabled").removeClass("disabled").text("Deal");
				});
			} catch(e) {
				ethStatus.open();
			}
			// try {
			// 	var rollPromise = dice.roll({_number: number}, {value: bet, gas: 147000, gasPrice: gps.getValue()});
			// 	rollPromise.waitTimeMs = (gps.getWaitTimeS() || 45) * 1000;
			// } catch(e) {
			// 	console.error(e);
			// 	ethStatus.open();
			// 	return;
			// }
	    })
    }

	(function _init() {
		_initDealButton();
	}());
}

function PokerUtil(web3) {
    const BigNumber = web3.toBigNumber(0).constructor;

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
                    isAce: cardNum % 13 == 0
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
            const str = _cards.map(c => {
                const valStr = (function(val){
                    if (val == 0) return 'A';
                    if (val <= 9) return `${val+1}`;
                    if (val == 10) return "J";
                    if (val == 11) return "Q";
                    if (val == 12) return "K";
                }(c.val));
                const suitStr = (function(suit){
                    if (suit == 0) return 's';
                    if (suit == 1) return 'h';
                    if (suit == 2) return 'd';
                    if (suit == 3) return 'c';
                }(c.suit));
                return `${valStr}${suitStr}`;
            }).join(", ") + ` (${this.toNumber()}) ${this.getRankString()}`;
            return `[${str}]`;
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
    // - iHand: should be a Hand object of the original hand.
    // - drawsNum: from 0 to 63.
    function getDHand(blockhash, gameId, iHand, drawsNum) {
        // get 5 new cards
        const idHex = _toPaddedHex(gameId, 32);
        const hexHash = web3.sha3(blockhash + idHex, {encoding: "hex"});
        return _drawCardsFromHash(hexHash, iHand, drawsNum);
    }

    function _drawCardsFromHash(hexHash, iHand, drawsNum) {
        // get 5 cards
        iHand = new Hand(iHand);
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