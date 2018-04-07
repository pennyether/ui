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
		_$loadBtn.click();
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
			const events = dice._getNiceWeb3().decodeKnownEvents(res.logs);
			const event = events.find((e)=>e.name=="RollWagered" || e.name=="RollRefunded");
			if (!event) {
				_$status.empty().text(`No roll was wagered or refunded in this transaction.`);
				return;
			}
			_$status.empty().text(`Found ${event.name} event for the roll.`);
			if (event.name=="RollRefunded") {
				refreshRefundedRoll(event);
			} else {
				refreshRoll(event.args.id);	
			}
		}).catch((e)=>{
			_$status.empty().text(`Error when retrieving transaction receipt: ${e.message}`);
		})
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
		$(".field.transaction .value")
			.append(util.toDateStr(event.args.time))
			.append(" - ")
			.append(util.$getTxLink(event.transactionHash))
		$(".field.block .value").text(`${event.blockNumber}`);
		$(".field.user .value").append(util.$getAddrLink(event.args.user));
		$(".field.bet .value").append(ethUtil.toEthStr(event.args.bet));
		$(".field.number .value").append(`${number} or below.`);
		$(".field.payout .value").append(ethUtil.toEthStr(computePayout(bet, number)));
	}

	function refreshRoll(rollId) {
		$(".contractData .field .value").text("Loading...");
		_$historySection.show();
		_$resultSection.show();
		_$refunded.hide();

		DiceUtil.getRoll(dice, rollId).then(roll => {
			$(".field .value").text("");

			if (roll.id.equals(0)) {
				_$status.empty().append(`Roll Id "${rollId}" not found in contract.`);
				return;
			}

			$(".field.id .value").text(`${rollId}`);
			$(".field.block .value").text(`${roll.block}`);
			$(".field.user .value").append(util.$getAddrLink(roll.user));
			$(".field.bet .value").append(util.toEthStrFixed(roll.bet));
			$(".field.number .value").append(`${roll.number} or below.`);
			$(".field.payout .value").append(util.toEthStrFixed(roll.payout));

			// subtract 5000 from block... there's some bug with infura where it
			// sometimes doesn't return events.
			Promise.all([
				dice.getEvents("RollWagered", {id: rollId}, roll.block-5000),
				dice.getEvents("RollFinalized", {id: rollId}, roll.block-5000),
				dice.getEvents("PayoutSuccess", {id: rollId}, roll.block-5000),
				dice.getEvents("PayoutFailure", {id: rollId}, roll.block-5000)
			]).then(arr=>{
				const wagered = arr[0].length ? arr[0][0] : null;
				const resolved = arr[1].length ? arr[1][0] : null;
				const payoutSuccess = arr[2].length ? arr[2][0] : null;
				const payoutFailures = arr[3];

				if (!wagered) {
					throw new Error(`Unable to find the RollWagered event of roll: ${rollId}`);
				}
				const computedResult = computeResult(wagered.blockHash, rollId);
				const isWinner = !computedResult.gt(roll.number);
				// update initial transaction and result.
				$(".field.transaction .value")
					.append(util.toDateStr(wagered.args.time))
					.append(" - ")
					.append(util.$getTxLink(wagered.transactionHash));
				$(".field.result .value")
					.text(computedResult);
				$(".field.isWinner .value")
					.text(isWinner ? "Yes." : "No.");

				// now update the history
				$(".field.rollWagered .value")
					.append(`Block ${wagered.blockNumber} - `)
					.append(util.toDateStr(wagered.args.time))
					.append(" - ")
					.append(util.$getTxLink(wagered.transactionHash));

				if (resolved) {
					$(".field.rollResolved .value")
						.append(`Block ${resolved.blockNumber} - `)
						.append(util.toDateStr(resolved.args.time))
						.append(" - ")
						.append(util.$getTxLink(resolved.transactionHash));
					$(".field.resolvedResult .value")
						.text(resolved.args.result);
				}else{
					$(".field.rollResolved .value")
						.text("This roll has not been resolved yet.");
					$(".field.resolvedResult .value")
						.text("This roll has not been resolved yet.")
				}

				if (payoutSuccess) {
					$(".field.payoutSuccess .value")
						.append(`Block ${payoutSuccess.blockNumber} - `)
						.append(util.toDateStr(payoutSuccess.args.time))
						.append(" - ")
						.append(util.$getTxLink(payoutSuccess.transactionHash));
				} else {
					$(".field.payoutSuccess .value")
						.text("This roll has not been paid.");
				}

				if (payoutFailures.length > 0) {
					$(".payoutFailures").show();
				} else {
					$(".payoutFailures").hide();
				}
			});
			// todo find creating/resolved/paid transactions
			
			// $(".field.result .value").append(computeResult(id)) // need blockhash
			// $(".field.resolvedResult .value").append(`${result}`); // or not yet resolved
			// $(".field.paid .value").append(`${isPaid}`); // or won/lost
		})
	}

	function computeResult(blockHash, id) {
        const hash = web3.sha3(blockHash + ethUtil.toBytesStr(id, 4), {encoding: "hex"});
        const bn = new BigNumber(hash);
        return bn.mod(100).plus(1);
    }
    function computePayout(bet, number) {
		return bet.mul(100).div(number).mul(.99)
    }

});