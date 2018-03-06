var loadedHash = window.location.hash;

Loader.require("reg", "tr", "mc", "pac", "dice", "vp")
.then(function(reg, tr, mc, pac, dice, vp){

	setTimeout(function goToLoadedHash(){
		if (!loadedHash) return;
		const $hash = $(loadedHash);
		if ($hash.length==0) return;
		doScrolling($hash.position().top-80, 500);
	}, 500);

	// puts a div in place of button
	// txFn(gasPrice) should return a tx promise
	function makeTxDiv($button, txFn) {
		const $e = $(`
			<div>
				<div class='gps'></div>
				<div class='btn'></div>
				<div class='status'></div>
			</div>
		`);
		const $status = $e.find(".status");

		// init gps
		const gps = util.getGasPriceSlider(20);
		gps.$head.remove();
		gps.$refresh.show();
		gps.refresh();
		$e.find(".gps").append(gps.$e)

		// replace button with div
		$button.replaceWith($e);
		
		// add button, set click event
		$e.find(".btn").append($button);
		$button.click(()=>{
			$button.blur();
			const p = txFn(gps.getValue());
			$status.empty().append(util.$getTxStatus(p, {
				waitTimeMs: gps.getWaitTimeS()*1000
			}));
		})
	}

	// init all tx divs
	// treasury actions
	makeTxDiv($("#TrChangeDailyFundLimit"), trChangeDailyFundLimit);
	makeTxDiv($("#TrFund"), trFund);
	// main controller actions
	makeTxDiv($("#McChangePaRewards"), mcChangePaRewards);
	// dice actions
	makeTxDiv($("#btnDiceChangeSettings"), diceChangeSettings);
	makeTxDiv($("#btnDiceSendProfits"), diceSendProfits);
	makeTxDiv($("#btnDiceRemoveFunding"), diceRemoveFunding);
	makeTxDiv($("#btnDiceAddFunding"), diceAddFunding);
	makeTxDiv($("#btnDiceFinalizeMany"), diceFinalizeMany);
	makeTxDiv($("#btnDiceFinalizeLatest"), diceFinalizeLatest);
	// video poker actions
	makeTxDiv($("#btnVpChangeSettings"), vpChangeSettings);
	makeTxDiv($("#btnVpSendProfits"), vpSendProfits);
	makeTxDiv($("#btnVpRemoveFunding"), vpRemoveFunding);
	makeTxDiv($("#btnVpAddFunding"), vpAddFunding);


	$(".tr.refresh").click(updateTr);
	$(".mc.refresh").click(updateMc);
	$(".pac.refresh").click(updatePac);
	$(".dice.refresh").click(updateDice);
	$(".vp.refresh").click(updateVp);

	updateAll();

	function updateAll(){
		updateTr();
		updateMc();
		updatePac();
		updateDice();
		updateVp();
	}

	/********* TREASURY ACTIONS *******************************/
	function updateTr() {
		if (!tr) return alert("tr not loaded.");
		$("#TrToday").text( ((+new Date())/(1000*60*60*24)).toFixed(2) );
		util.bindToElement(tr.dayDailyFundLimitChanged(), $("#TrDailyFundLimitLastChanged"));
		util.bindToInput(tr.dailyFundLimit().then(ethUtil.toEth), $("#TrDailyFundLimit"));
		util.bindToElement(tr.getAdmin(), $("#TrAdmin"));
	}

	function trChangeDailyFundLimit(gasPrice){
		if (!tr) return alert("tr not loaded.");
		const newLimit = ethUtil.toWei($("#TrDailyFundLimit").val());
		return tr.setDailyFundLimit({_newValue: newLimit}, {gasPrice: gasPrice});
	};

	function trFund(gasPrice){
		if (!tr) return alert("tr not loaded.");
		const amt = ethUtil.toWei($("#TrFundAmt").val());
		return tr.sendTransaction({gasPrice: gasPrice, value: amt});
	}
	/********* TREASURY ACTIONS *******************************/


	/********* MAINCONTROLLER ACTIONS *******************************/
	function updateMc() {
		if (!mc) return alert("mc not loaded.");
		util.bindToInput(mc.paStartReward().then(ethUtil.toEth), $("#McPaStartReward"));
		util.bindToInput(mc.paEndReward().then(ethUtil.toEth), $("#McPaEndReward"));
		util.bindToInput(mc.paFeeCollectRewardDenom(), $("#McPaRewardDenom"));
	}
	function mcChangePaRewards(gasPrice){
		if (!mc) return alert("mc not loaded.");
		const paStartReward = ethUtil.toWei($("#McPaStartReward").val());
		const paEndReward = ethUtil.toWei($("#McPaEndReward").val());
		const paRewardDenom = $("#McPaRewardDenom").val();
		return mc.setPennyAuctionRewards({
			_paStartReward: paStartReward,
			_paEndReward: paEndReward,
			_paFeeCollectRewardDenom: paRewardDenom
		}, {gasPrice: gasPrice});
	}
	/********* MAINCONTROLLER ACTIONS *******************************/


	/********* PAC ACTIONS *******************************/
	function updatePac() {
		if (!pac) return alert("pac not loaded.");
		pac.numDefinedAuctions().then(function(num){
			const $ctnr = $("#PacDefinedAuctions").empty();
			const $template = $(".pacDefinedAuction.template");
			for (var i=0; i<=num; i++){
				let index = i;
				let $defined = $template
					.clone()
					.removeClass("template")
					.appendTo($ctnr)
					.data("index", index)
					.show();

				if (index == num) {
					$defined.find(".index").text(index + " (unsaved)");
					$defined.find(".change").text("Add");
					$defined.find(".enable").parent().remove();
					$defined.find(".disable").parent().remove();
					$defined.find(".auction").parent().remove();
					$defined.find(".enabled").parent().remove();
				} else {
					$defined.find(".index").text(index);
					$defined.find(".change").text("Save Changes");
					pac.definedAuctions([index]).then((res)=>{
						$defined.find(".auction").text(res[0]);
						$defined.find(".enabled").text(res[1] ? "ENABLED" : "DISABLED");
						$defined.find(".summary").val(res[2]);
						$defined.find(".initialPrize").val(ethUtil.toEth(res[3]));
						$defined.find(".bidPrice").val(ethUtil.toEth(res[4]));
						$defined.find(".bidIncr").val(ethUtil.toEth(res[5]));
						$defined.find(".bidAddBlocks").val(res[6]);
						$defined.find(".initialBlocks").val(res[7]);
						
						makeTxDiv($defined.find(".change"), (gasPrice)=>{
							return editDefinedAuction(index, gasPrice);
						});

						if (res[1]){
							$defined.find(".enable").parent().remove();
							makeTxDiv($defined.find(".disable"), (gasPrice)=>{
								if (!pac) return alert("Pac not loaded");
								return pac.disableDefinedAuction({_index: index}, {gasPrice: gasPrice});
							});
						} else {
							$defined.find(".disable").parent().remove();
							makeTxDiv($defined.find(".enable"), (gasPrice)=>{
								if (!pac) return alert("Pac not loaded");
								return pac.enableDefinedAuction({_index: index}, {gasPrice: gasPrice});
							});	
						}
					});
				}
			};
		});
	}
	function editDefinedAuction(index, gasPrice){
		if (!pac) return alert("Pac not loaded.");

		const $e = $("#PacDefinedAuctions").find(".pacDefinedAuction").eq(index);
		if ($e.data("index")!=index) throw new Error("Got the wrong one!");
		var obj = {
			_index: index,
			_summary: $e.find(".summary").val(),
			_initialPrize: ethUtil.toWei($e.find(".initialPrize").val()),
			_bidPrice: ethUtil.toWei($e.find(".bidPrice").val()),
			_bidIncr: ethUtil.toWei($e.find(".bidIncr").val()),
			_bidAddBlocks: $e.find(".bidAddBlocks").val(),
			_initialBlocks: $e.find(".initialBlocks").val()
		};
		return pac.editDefinedAuction(obj, {gasPrice: gasPrice});
	}
	/********* PAC ACTIONS *******************************/



	/********* DICE ACTIONS *******************************/
	function updateDice() {
		if (!dice) return alert("dice not loaded.");
		util.bindToElement(ethUtil.getBalance(dice.address).then(ethUtil.toEthStr), $("#DiceBalance"));
		util.bindToElement(dice.curId(), $("#DiceNumRolls"));
		util.bindToElement(dice.getNumUnfinalized(), $("#DiceNumUnfinalized"));
		util.bindToElement(dice.getProfits().then(ethUtil.toEthStr), $("#DiceSendProfits"));
		util.bindToElement(dice.funding().then(ethUtil.toEthStr), $("#DiceFunding"));
		util.bindToInput(dice.feeBips(), $("#DiceFeeBips"));
		util.bindToInput(dice.minBet().then(ethUtil.toEth), $("#DiceMinBet"));
		util.bindToInput(dice.maxBet().then(ethUtil.toEth), $("#DiceMaxBet"));
		util.bindToInput(dice.minNumber(), $("#DiceMinNumber"));
		util.bindToInput(dice.maxNumber(), $("#DiceMaxNumber"));
		
		dice.curId().then((id)=>{
			return dice.rolls([id])
		}).then(roll=>{
			const result = roll[5];
			const isFinalized = !result.equals(0);
			isFinalized
				? $("#btnDiceFinalizeLatest").attr("disabled","disabled")
				: $("#btnDiceFinalizeLatest").removeAttr("disabled");
		});
	}
	function diceChangeSettings(gasPrice){
		if (!dice) return alert("dice not loaded.");
		const feeBips = $("#DiceFeeBips").val();
		const minBet = ethUtil.toWei($("#DiceMinBet").val());
		const maxBet = ethUtil.toWei($("#DiceMaxBet").val());
		const minNumber = $("#DiceMinNumber").val();
		const maxNumber = $("#DiceMaxNumber").val();
		return dice.changeSettings({
			_minBet: minBet,
			_maxBet: maxBet,
			_minNumber: minNumber,
			_maxNumber: maxNumber,
			_feeBips: feeBips
		}, {gasPrice: gasPrice});
	};
	function diceSendProfits(gasPrice){
		if (!dice) return alert("dice not loaded.");
		return dice.sendProfits([], {gasPrice: gasPrice});
	}
	function diceRemoveFunding(gasPrice){
		if (!dice) return alert("dice not loaded.");
		const num = ethUtil.toWei($("#DiceRemoveFunding").val());
		return dice.removeFunding([num], {gasPrice: gasPrice});
	}
	function diceAddFunding(gasPrice){
		if (!dice) return alert("dice not loaded.");
		const num = ethUtil.toWei($("#DiceAddFunding").val());
		return dice.addFunding([], {value: num, gasPrice: gasPrice});
	}
	function diceFinalizeMany(gasPrice){
		if (!dice) return alert("dice not loaded.");
		const num = new BigNumber($("#DiceFinalizeRolls").val());
		return dice.finalizeRolls([num], {gasPrice: gasPrice});
	}
	function diceFinalizeLatest(gasPrice){
		if (!dice) return alert("dice not loaded.");
		return dice.payoutRoll([0], {gasPrice: gasPrice});
	}
	/********* DICE ACTIONS *******************************/


	/********* VIDEO POKER ACTIONS *******************************/
	function updateVp() {
		if (!vp) return alert("vp not loaded.");
		util.bindToElement(ethUtil.getBalance(vp.address).then(ethUtil.toEthStr), $("#VpBalance"));
		util.bindToElement(vp.curId(), $("#VpNumGames"));
		util.bindToElement(vp.getProfits().then(ethUtil.toEthStr), $("#VpSendProfits"));
		util.bindToElement(vp.funding().then(ethUtil.toEthStr), $("#VpFunding"));
		util.bindToInput(vp.minBet().then(ethUtil.toEth), $("#VpMinBet"));
		util.bindToInput(vp.maxBet().then(ethUtil.toEth), $("#VpMaxBet"));
		util.bindToInput(vp.curPayTableId(), $("#VpCurPayTableId"));
		
		Promise.all([
			vp.curPayTableId(),
			vp.numPayTables()
		]).then(function(arr){
			const curPayTableId = arr[0];
			const num = arr[1];
			const $ctnr = $("#VpPayTables").empty();
			const $template = $(".vpPayTable.template");
			for (var i=0; i<=num; i++){
				let index = i;
				let $defined = $template
					.clone()
					.removeClass("template")
					.appendTo($ctnr)
					.data("index", index)
					.show();

				if (index == curPayTableId) {
					$defined.find(".index").text(index + " (current)");
					$defined.addClass("current");
				} else if (index == num) {
					$defined.find(".index").text(index + " (unsaved)");
				} else {
					$defined.find(".index").text(index);
				}

				if (index == num) {
					makeTxDiv($defined.find(".save"), (gasPrice)=>{
						return vpAddPayTable(gasPrice, index);
					});
				} else {
					$defined.find(".save").parent().hide();
					vp.getPayTable([index]).then((res)=>{
						$defined.find(".rf").val(res[1]);
						$defined.find(".sf").val(res[2]);
						$defined.find(".foak").val(res[3]);
						$defined.find(".fh").val(res[4]);
						$defined.find(".fl").val(res[5]);
						$defined.find(".st").val(res[6]);
						$defined.find(".toak").val(res[7]);
						$defined.find(".tp").val(res[8]);
						$defined.find(".jb").val(res[9]);
					});
				}
			};
		})
	}
	function vpAddPayTable(gasPrice, index) {
		if (!vp) return alert("vp not loaded.");

		const $e = $("#VpPayTables").find(".vpPayTable").eq(index);
		if ($e.data("index")!=index) throw new Error("Got the wrong one!");
		var obj = {};
		["rf","sf","foak","fh","fl","st","toak","tp","jb"].forEach((name)=>{
			obj[`_${name}`] = $e.find(`.${name}`).val();
		});
		return vp.addPayTable(obj, {gasPrice: gasPrice});
	}
	function vpChangeSettings(gasPrice) {
		if (!vp) return alert("vp not loaded.");

		const minBet = ethUtil.toWei($("#VpMinBet").val());
		const maxBet = ethUtil.toWei($("#VpMaxBet").val());
		const payTableId = $("#VpCurPayTableId").val();
		return vp.changeSettings({
			_minBet: minBet,
			_maxBet: maxBet,
			_payTableId: payTableId
		}, {gasPrice: gasPrice});
	}
	function vpSendProfits(gasPrice) {
		if (!vp) return alert("vp not loaded.");
		return vp.sendProfits([], {gasPrice: gasPrice});
	}
	function vpRemoveFunding(gasPrice) {
		if (!vp) return alert("vp not loaded.");
		const num = ethUtil.toWei($("#VpRemoveFunding").val());
		return vp.removeFunding([num], {gasPrice: gasPrice});
	}
	function vpAddFunding(gasPrice) {
		if (!vp) return alert("vp not loaded.");
		const num = ethUtil.toWei($("#VpAddFunding").val());
		return vp.addFunding([], {value: num, gasPrice: gasPrice});
	}
	/********* DICE ACTIONS *******************************/
});