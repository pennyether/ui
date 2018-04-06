Loader.require("comp", "tr", "token", "tm", "pac", "dice", "vp")
.then(function(comp, tr, token, tm, pac, dice, vp){
	// arrows ///////////////////////////////////////////////////
	util.bindToElement(tr.capitalRaised().then(util.toEthStr), $(".tr-capital-raised"));
	util.bindToElement(tr.profitsSent().then(util.toEthStr), $(".tr-dividends"));
	util.bindToElement(token.totalSupply().then(val => util.toEthStr(val, "PENNY")), $(".token-total-supply"));

	// bankrolled amounts
	tr.capitalLedger().then(ledgerAddr => {
		util.bindToElement(tr.capitalAllocatedTo([pac.address]).then(util.toEthStr), $(".pac-bankrolled"));
		util.bindToElement(tr.capitalAllocatedTo([dice.address]).then(util.toEthStr), $(".dice-bankrolled"));
		util.bindToElement(tr.capitalAllocatedTo([vp.address]).then(util.toEthStr), $(".vp-bankrolled"));
	});

	// profits of each game
	util.bindToElement(pac.profitsSent().then(util.toEthStr), $(".pac-profits"));
	util.bindToElement(dice.profitsSent().then(util.toEthStr), $(".dice-profits"));
	util.bindToElement(vp.profitsSent().then(util.toEthStr), $(".vp-profits"));

	// task manager arrows
	[
		[pac.address, $(".pac-send-profits")],
		[dice.address, $(".dice-send-profits")],
		[vp.address, $(".vp-send-profits")]
	].forEach(obj => {
		const addr = obj[0];
		const $e = obj[1];
		tm.sendProfitsReward([obj[0]]).then(arr => {
			const reward = arr[0];
			const profits = arr[1];
			if (reward.lte(0)) {
				$e.text("Not needed.")
			} else {
				$e.text(`Yes! (${util.toEthStr(reward)} reward)`);
			}
		});
	});
	tm.startPennyAuctionReward().then(arr => {
		const reward = arr[0];
		const $e = $(".pac-start-game");
		if (reward.lte(0)) {
			$e.text("Not needed.")
		} else {
			$e.text(`Yes! (${util.toEthStr(reward)} reward)`)
		}
	})
	tm.refreshPennyAuctionsReward().then(arr => {
		const reward = arr[0];
		const $e = $(".pac-end-game");
		if (reward.lte(0)) {
			$e.text("Not needed.")
		} else {
			$e.text(`Yes! (${util.toEthStr(reward)} reward)`)
		}
	});
	///////////////////////////////////////////////////////////////

	// values for each item //////////////////////////////////////
	// comptroller
	Promise.all([
		comp.dateSaleStarted(),
		comp.wasSaleStarted(),
		comp.wasSaleEnded()
	]).then(arr => {
		const dateStarted = arr[0];
		const wasStarted = arr[1];
		const wasEnded = arr[2];
		const $e = $(".crowdsale .value");
		if (dateStarted.equals(0)) {
			$e.text("No Date Set.");
			return;
		} else if (wasEnded) {
			$e.text("Ended.");
		} else if (wasStarted) {
			const dateStr = util.toDateStr(dateStarted, {second: null});
			$e.text(`Started (${dateStr})`);
		} else {
			const dateStr = util.toDateStr(dateStarted, {second: null});
			$e.text(dateStr);
		}
	})

	// Treasury
	util.bindToElement(tr.reserve().then(util.toEthStr), $(".tr-reserve"));
	util.bindToElement(tr.capital().then(util.toEthStr), $(".tr-cap-available"));
	util.bindToElement(tr.capitalNeeded().then(util.toEthStr), $(".tr-cap-needed"));

	// PENNY
	util.bindToElement(token.totalSupply().then(util.toEthStr), $(".token-total-supply"));
	util.bindToElement(token.totalDividends().then(util.toEthStr), $(".token-total-received"));
	util.bindToElement(token.collectedDividends().then(util.toEthStr), $(".token-total-collected"));

	// PAC
	util.bindToElement(pac.numActiveAuctions(), $(".pac-active-games"));
	util.bindToElement(pac.numEndedAuctions(), $(".pac-ended-games"));

	// ID
	util.bindToElement(dice.curId(), $(".dice-num-rolls"));
	util.bindToElement(dice.totalWagered(), $(".dice-total-wagered"));
	Promise.all([
		dice.curMaxBet(),
		dice.maxBet()
	]).then(arr => {
		const max = util.toEthStr(BigNumber.min(arr[0], arr[1]));
		$(".dice-cur-max-bet").text(max);
	})

	// VP
	util.bindToElement(vp.curId(), $(".vp-num-games"))
	util.bindToElement(vp.totalWagered(), $(".vp-total-wagered"));
	Promise.all([
		vp.curMaxBet(),
		vp.maxBet()
	]).then(arr => {
		const max = util.toEthStr(BigNumber.min(arr[0], arr[1]));
		$(".vp-cur-max-bet").text(max);
	})
	

	// Task Manager
	util.bindToElement(ethUtil.getBalance(tm).then(util.toEthStr), $(".tm-balance"))
	util.bindToElement(tm.totalRewarded().then(util.toEthStr), $(".tm-rewards-paid"))

	///////////////////////////////////////////////////////////////
});

