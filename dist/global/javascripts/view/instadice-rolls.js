Loader.require("dice")
.then(function(dice){
	const _$roll = $("#Roll");
	const _$loadBtn = $("#LoadButton").click(changeRoll);
	const _$status = $(".cell.select .status").hide();
	const _$error = $(".cell.select .error").hide();
	const _$refunded = $(".refunded");
	var _rollId;
	var _rollTx;

	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshRoll();
	});

	if (window.location.hash) {
		const roll = window.location.hash.substring(1)
		_$roll.val(roll);
		changeRoll();
	}

	(function initRecentRolls(){
		const $e = $(".cell.rolls");
		if (!DiceUtil) throw new Error(`DiceUtil is required.`);
		const $ctnr = $e.find(".log-viewer");

		dice.getEvents("Created").then(arr => {
            return arr[0].blockNumber;
        }).then(startBlock => {
	        const events = [{
	            instance: dice,
	            name: "RollWagered",
	            label: "Roll",
	            selected: true
	        },{
	            instance: dice,
	            name: "RollRefunded",
	            label: "Roll Refunded",
	            selected: false 
	        },{
	            instance: dice,
	            name: "RollFinalized",
	            label: "Roll Finalized",
	            selected: false 
	        },{
	            instance: dice,
	            name: "PayoutError",
	            label: "Payout Error",
	            selected: false
	        }];
	        var lv = util.getLogViewer({
	            events: events,
	            order: "newest",
	            minBlock: startBlock,
	            blocksPerSearch: Math.round(60*60*3 / 15),
	            valueFn: (event) => {
	                const $e = DiceUtil.$getEventSummary(event, true);
	                $e.on("click", ".roll-link", e => {
	                	e.preventDefault();
	                	const id = $(e.currentTarget).text().match(/\d+/)[0];
	                	_$roll.val(id);
	                	_$loadBtn.click();
	                });
	                return $e;
	            }
	        });
	        lv.$e.appendTo($ctnr);
	    }).catch(e => {
	    	$ctnr.text(`Unable to find recent rolls: ${e.message}`)
	    })
	}());

	function error(msg) {
		if (!msg) _$error.hide();
		else _$error.show().text(msg);
	}

	function changeRoll(){
		doScrolling($(".cell.select"), 500);
		_gameId = null;
		refreshRoll();
		_$status.empty();
		const input = _$roll.val();
		window.location.hash = `#${input}`;

		var rollTx, rollId;
		if (!input || Number.isNaN(Number(input))){
			return error(`Please enter a txId (starting with "0x"), or a RollId integer.`);
		} else if (input.toLowerCase().startsWith("0x")) {
			if (!(input.length==66))
				return error("A transaction hash should be 66 characters long.");
			txId = input;
		} else {
			rollId = Number(input);
			if (!Number.isInteger(rollId)){
				return error("RollId must be an integer.");
			} else if (rollId <= 0){
				return error("RollId must be greater than 0.");
			} else if (rollId >= 2**32) {
				return error("RollId is too large.");
			}
		}

		error("");
		if (rollId){
			_rollId = rollId;
			refreshRoll();
			return;
		}

		_$status.empty().text("Finding roll from transaction...");
		ethUtil.getTxReceipt(rollTx, false).then(res=>{
			const events = dice._getNiceWeb3().decodeEvents(res.logs, dice.abi);
			const event = events.find((e)=>e.name=="RollWagered" || e.name=="RollRefunded");
			if (!event) {
				_$error.empty().text(`No "InstaDice" events found in transaction receipt: `).append(util.$getTxLink(txId)).show();
				return;
			}
			if (event.name=="RollRefunded") {
				_$status.empty().text(`Roll was refunded in this transaction.`);
				setRefundedRoll(event);
			} else {
				_rollId = event.args.id;
				_$status.empty().text(`Roll #${_rollId} was created in this transaction.`);
				refreshRoll();
			}
		}).catch((e)=>{
			console.error(e);
			_$status.empty().text(`Unable to load a receipt for txId: `).append(util.$getTxLink(txId));
		})
	}

	function $getTxLink(event) {
		return $("<div></div>")
			.append(util.toDateStr(event.args.time))
			.append(` (Block #${event.blockNumber.toLocaleString()})`)
			.append(` - `)
			.append(util.$getTxLink(event.transactionHash));
	}

	function setRefundedRoll(event) {
		$(".roll-data .field .value").text("");
		const bet = event.args.bet;
		const number = event.args.number

		_$refunded.show();
		$(".refundReason").show().text(event.args.msg);
		$(".field.id .value").text(`Roll was not created.`);
		$(".field.transaction .value").append($getTxLink(event));
		$(".field.user .value").append(util.$getAddrLink(event.args.user));
		$(".field.bet .value").append(util.toEthStrFixed(event.args.bet));
		$(".field.number .value").append(`${number} or below.`);
		$(".field.payout .value").append(`n/a`);
	}

	function refreshRoll() {
		if (!_rollId) {
			$(".cell.roll-data .field .value").text("--");
			return;
		}
		_$refunded.hide();

		// load all events, display roll.
		$(".cell.roll-data .field .value").text("Loading...");
		Promise.all([
			dice.getEvents("RollWagered", {id: _rollId}),
			dice.getEvents("RollFinalized", {id: _rollId})
		]).then(arr=>{
			const wagered = arr[0].length ? arr[0][0] : null;
			const finalized = arr[1].length ? arr[1][0] : null;

			if (!wagered) {
				error(`Unable to find the "RollWagered" event of roll: ${_rollId}`);
				$(".field .value").text("--");
				return;
			} else {
				$(".field .value").empty();
			}
			$(".field.id .value").text(`${wagered.args.id}`);
			$(".field.user .value").append(nav.$getPlayerLink(wagered.args.user));
			$(".field.bet .value").append(util.toEthStrFixed(wagered.args.bet));
			$(".field.number .value").append(`${wagered.args.number} or below.`);
			$(".field.payout .value").append(util.toEthStrFixed(wagered.args.payout));

			const computedResult = DiceUtil.computeResult(wagered.blockHash, _rollId);
			const isWinner = !computedResult.gt(wagered.args.number);
			// update initial transaction and result.
			$(".field.transaction .value").append($getTxLink(wagered));
			$(".field.result .value").text(computedResult);
			$(".field.isWinner .value").text(isWinner ? "Yes." : "No.");

			// now update the history
			$(".field.rollWagered .value").append($getTxLink(wagered));
			if (finalized) {
				if (finalized.args.payout.gt(0)) {
					const ethStr = util.toEthStrFixed(finalized.args.payout);
					$(".field.rollResolved .value").append($getTxLink(finalized).prepend(`Paid ${ethStr}: `));
				} else {
					$(".field.rollResolved .value").append($getTxLink(finalized));
				}
				$(".field.resolvedResult .value").text(finalized.args.result);
			} else {
				$(".field.rollResolved .value").text("This roll has not been finalized yet.");
				$(".field.resolvedResult .value").text("This roll has not been finalized yet.")
			}
		});
	}
});