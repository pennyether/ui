Loader.require("dice")
.then(function(dice){
	const _$roll = $("#Roll");
	const _$loadBtn = $("#LoadButton").click(findRoll);
	const _$status = $(".roll .status");
	const _$refunded = $(".refunded");
	const _$resultSection = $(".rollResult");
	const _$historySection = $(".rollHistory");

	if (window.location.hash) {
		const roll = window.location.hash.substring(1)
		_$roll.val(roll);
		findRoll();
	}

	function findRoll(){
		_$status.empty();
		const val = _$roll.val();
		window.location.hash = `#${val}`;

		var rollId, txHash;
		if (!val)
			return alert("Please enter a Roll Id or a transaction hash.");
		if (Number.isNaN(val) || Number(val)>1e18){
			if (!(val.toLowerCase().startsWith("0x")))
				return alert("If providing a transaction hash, it must start with 0x");
			if (!(val.length==66))
				return alert("A transaction hash should be 66 characters long.");
			txHash = val;
		} else {
			rollId = Number(val);
			if (!Number.isInteger(rollId))
				return alert("Roll Id must be an integer.");
			if (rollId <= 0)
				return alert("Roll Id must be greater than 0.");
		}

		if (rollId){
			refreshRoll(rollId);
			return;
		}
		_$status.empty().text("Finding roll from transaction...");
		ethUtil.getTxReceipt(txHash, false).then(res=>{
			const events = dice._getNiceWeb3().decodeEvents(res.logs, dice.abi);
			const event = events.find((e)=>e.name=="RollWagered" || e.name=="RollRefunded");
			if (!event) {
				_$status.empty().text(`No InstaDice event was found in the transaction receipt.`);
				return;
			}
			_$status.empty().text(`Found an InstaDice event in the transaction receipt.`);
			if (event.name=="RollRefunded") {
				refreshRefundedRoll(event);
			} else {
				refreshRoll(event.args.id);	
			}
		}).catch((e)=>{
			console.error(e);
			_$status.empty().text(`Unable to load a receipt for this Transaction Id.`);
		})
	}

	function $getTxLink(event) {
		return $("<div></div>")
			.append(util.toDateStr(event.args.time))
			.append(` (Block #${event.blockNumber.toLocaleString()})`)
			.append(` - `)
			.append(util.$getTxLink(event.transactionHash));
	}

	function refreshRefundedRoll(event) {
		$(".contractData .field .value").text("");
		const bet = event.args.bet;
		const number = event.args.number

		_$historySection.hide();
		_$resultSection.hide();
		_$refunded.show();
		$(".refundReason").show().text(event.args.msg);
		$(".field.id .value").text(`Roll was not created.`);
		$(".field.transaction .value").append($getTxLink(event));
		$(".field.user .value").append(util.$getAddrLink(event.args.user));
		$(".field.bet .value").append(util.toEthStrFixed(event.args.bet));
		$(".field.number .value").append(`${number} or below.`);
		$(".field.payout .value").append(`n/a`);
	}

	function refreshRoll(rollId) {
		$(".contractData .field .value").text("Loading...");
		_$historySection.show();
		_$resultSection.show();
		_$refunded.hide();

		// load all events, display roll.
		$(".field .value").text("");
		Promise.all([
			dice.getEvents("RollWagered", {id: rollId}),
			dice.getEvents("RollFinalized", {id: rollId})
		]).then(arr=>{
			const wagered = arr[0].length ? arr[0][0] : null;
			const finalized = arr[1].length ? arr[1][0] : null;

			if (!wagered) {
				_$status.empty().text(`Unable to find the "RollWagered" event of roll: ${rollId}`);
				return;
			}
			$(".field.id .value").text(`${wagered.args.id}`);
			$(".field.user .value").append(nav.$getPlayerLink(wagered.args.user));
			$(".field.bet .value").append(util.toEthStrFixed(wagered.args.bet));
			$(".field.number .value").append(`${wagered.args.number} or below.`);
			$(".field.payout .value").append(util.toEthStrFixed(wagered.args.payout));

			const computedResult = DiceUtil.computeResult(wagered.blockHash, rollId);
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