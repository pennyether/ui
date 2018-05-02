Loader.require("vp")
.then(function(vp){
	const _$txtGame = $(".top .txt-game");
	const _$btnLoad = $(".top .btn-load").click(findGame);
	const _$status = $(".top .status");
	const _$refunded = $(".refunded").hide();
	const _$notRefunded = $(".not-refunded").hide();

	if (window.location.hash) {
		const hash = window.location.hash.substring(1)
		_$txtGame.val(hash);
		findGame();
	}

	function findGame(){
		_$status.empty().removeClass("error");
		_$refunded.hide();
		_$notRefunded.hide();

		const input = _$txtGame.val();
		window.location.hash = `#${input}`;

		var gameId, txId;
		if (!input)
			return _$status.text("Please enter a Game Id or a transaction hash.").addClass("error");
		if (Number.isNaN(input) || Number(input)>1e18){
			if (!(input.toLowerCase().startsWith("0x")))
				return _$status.text("If providing a transaction hash, it must start with 0x").addClass("error");
			if (!(input.length==66))
				return _$status.text("A transaction hash should be 66 characters long.").addClass("error");
			txId = input;
		} else {
			gameId = Number(input);
			if (!Number.isInteger(gameId))
				return _$status.text("Game Id must be an integer.").addClass("error");
			if (gameId <= 0)
				return _$status.text("Game Id must be greater than 0.").addClass("error");
		}

		// if we think input was an ID, load it.
		if (gameId){
			refreshGame(gameId);
			return;
		}

		// if we think input was a txId, load receipt, look for BetSuccess or BetFailure
		_$status.empty().text("Finding game from transactionId...");
		ethUtil.getTxReceipt(txId, false).then(res=>{
			const events = niceWeb3.decodeEvents(res.logs, vp.abi);
			const event = events.find(ev => ev.name=="BetSuccess" || ev.name=="BetFailure");
			if (!event) {
				_$status.empty().text(`No VideoPoker event was found in the transaction receipt.`).addClass("error");
				return;
			}
			if (event.name=="BetSuccess") {
				_$status.text(`Bet was refunded in this transaction.`);
				refreshRefundedGame(event);
			} else {
				const gameId = event.args.id;
				_$status.text(`Game #${gameId} was created in this transaction.`);
				refreshGame(event.args.id);	
			}
		}).catch((e)=>{
			_$status.text(`Unable to load a receipt for txId: ${txId}`).addClass("error");
		});
	}

	function $getTxLink(event) {
		return $("<div></div>")
			.append(util.toDateStr(event.args.time))
			.append(` (Block #${event.blockNumber.toLocaleString()})`)
			.append(` - `)
			.append(util.$getTxLink(event.transactionHash));
	}

	function refreshRefundedGame(event) {
		_$refunded.show();
		_$refunded.find(".value").empty();
		_$refunded.find(".refund-event .value").append($getTxLink(event));
		_$refunded.find(".bet .value").text(util.toEthStrFixed(event.args.bet));
		_$refunded.find(".reason .value").text(event.args.msg);
	}

	function refreshGame(gameId) {
		PokerUtil.getGame(vp, gameId).then(game => {
			if (game.iBlock.equals(0)) {
				_$status.text(`VideoPoker has no details for game #${gameId}.`).addClass("error");
				return;
			} else {
				_$status.text(`Loaded VideoPoker game #${gameId}.`);
			}
			_$notRefunded.find(".value").text("Loading...");
			_$notRefunded.show();

			$(".summary .id .value").text(game.id);
			$(".summary .user .value").empty().append(nav.$getPlayerLink(game.user));
			$(".summary .bet .value").text(util.toEthStrFixed(game.bet));
			$(".summary .paytable-id .value").text(`PayTable #${game.payTableId}`);

			Promise.all([
				vp.getEvents("CreditsUsed", {id: gameId}, game.idHand - 1),
				vp.getEvents("BetSuccess", {id: gameId}, game.idHand - 1),
				vp.getEvents("DrawSuccess", {id: gameId}, game.idHand - 1),
				vp.getEvents("FinalizeSuccess", {id: gameId}, game.idHand - 1),
				vp.getEvents("CreditsAdded", {id: gameId}, game.idHand - 1),
				vp.getEvents("DrawFailure", {id: gameId}, game.idHand - 1),
				vp.getEvents("FinalizeFailure", {id: gameId}, game.idHand - 1)
			]).then(arr=>{
				const creditsUsed = arr[0].length ? arr[0][0] : null;
				const betSuccess = arr[1].length ? arr[1][0] : null;
				const drawSuccess = arr[2].length ? arr[2][0] : null;
				const finalizeSuccess = arr[3].length ? arr[3][0] : null;
				const creditsAdded = arr[4].length ? arr[4][0] : null;

				$(".history .value").empty();
				if (!betSuccess) {
					_$status.text(`Did not find the BetSuccess event for Game #${game.id}! Perhaps the provider is lying...`);
					return;
				}

				if (creditsUsed){
					$(".history .credits-used > .value").append($getTxLink(creditsUsed));
					$(".history .credits-used .amount .value").text(util.toEthStrFixed(creditsUsed.args.amount));	
				} else {
					$(".history .credits-used > .value").append("No 'CreditsUsed' event found. The user bet with Ether.");	
					$(".history .credits-used .value").text("--");
				}
				
				if (betSuccess) {
					const localHand = PokerUtil.getIHand(betSuccess.blockHash, betSuccess.args.id);
					$(".history .bet-success > .value").append($getTxLink(betSuccess));
					$(".history .bet-success .bet .value").text(util.toEthStrFixed(betSuccess.args.bet));
					$(".history .bet-success .bet .value").text(util.toEthStrFixed(betSuccess.args.bet));
					$(".history .bet-success .paytable-id .value").text(betSuccess.args.payTableId);
					$(".history .bet-success .local-hand .value").text(localHand.toString());
				} else {
					// this is checked above. there should always be a BetSuccess event.
				}

				if (drawSuccess){
					const iHand = new PokerUtil.Hand(drawSuccess.args.iHand);
					const localHand = PokerUtil.getDHand(drawSuccess.blockHash, game.id, iHand, drawSuccess.args.draws);
					const warnCodeStr = drawSuccess.args.warnCode.equals(0) ? "no warnings" : drawSuccess.args.warnCode;
					$(".history .draw-success > .value").append($getTxLink(drawSuccess));
					$(".history .draw-success .i-hand .value").text(iHand.toString());
					$(".history .draw-success .draws .value").text(PokerUtil.getDrawsArray(drawSuccess.args.draws).join(","));
					$(".history .draw-success .warn-code .value").text(warnCodeStr);
					$(".history .draw-success .local-hand .value").text(localHand.toString());
				} else {
					$(".history .draw-success .value").text("--");
					$(".history .draw-success > .value").text("No 'DrawSuccess' occurred.");
				}

				if (finalizeSuccess) {
					//event FinalizeSuccess(uint time, address indexed user, uint32 indexed id, uint32 dHand, uint8 handRank, uint payout, uint8 warnCode);
					const fHand = new PokerUtil.Hand(finalizeSuccess.args.dHand);
					const handRankStr = fHand.getRankString();
					const warnCodeStr = finalizeSuccess.args.warnCode.equals(0) ? "no warnings" : finalizeSuccess.args.warnCode;
					$(".history .finalize-success > .value").append($getTxLink(finalizeSuccess));
					$(".history .finalize-success .final-hand .value").text(fHand.toString());
					$(".history .finalize-success .hand-rank .value").text(handRankStr);
					$(".history .finalize-success .payout .value").text(util.toEthStrFixed(finalizeSuccess.args.payout));
					$(".history .finalize-success .warn-code .value").text(warnCodeStr);
				} else {
					$(".history .finalize-success .value").text("--");
					$(".history .finalize-success > .value").text("No 'FinalizeSuccess' occurred.");
				}
				
				if (creditsAdded) {
					$(".history .credits-added > .value").append($getTxLink(creditsAdded));
					$(".history .credits-added .amount .value").text(util.toEthStrFixed(creditsAdded.args.amount));
				} else {
					$(".history .credits-added .value").text("--");
					$(".history .credits-added > .value").text("No 'CreditsAdded' event occurred.");
				}
			}).catch(e => {
				_$status.text(e.message).addClass("error");
			});
		});
	}
});