Loader.require("comp")
.then(function(comp){
	return comp.token();
}).then(tokenAddr=>{
	const token = DividendToken.at(tokenAddr);
	const $logViewer = util.$getLogViewer({
		events: [{
			instance: token,
			name: "DividendReceived"
		}],
		order: "newest",
		$head: "Dividend History"
	});

	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshDividends();
		refreshAccount();
	});

	// initialize dividend logs
	$(".divHistory").append($logViewer);
	// initialize account address
	$("#AccountAddr").val(ethUtil.getCurrentAccount());
	// bind events
	$("#RefreshAcct").click(refreshAccount);
	$(".btnCollect").click(doCollect);
	$(".btnTransfer").click(doTransfer);
	$(".btnBurn").click(doBurn);


	function refreshDividends() {
		// update address and total dividends
		$(".field.address .value").empty().append(util.$getAddrLink(tokenAddr));
		util.bindToElement(token.totalDividends().then(ethUtil.toEthStr), $(".field.dividends .divs"));
	}

	function refreshAccount() {
		const addr = $("#AccountAddr").val();
		const $balance = $(".field.balance .value").empty();
		const $owedDivs = $(".field.owedDivs .owedDivs").empty();
		const $collectHistory = $(".collectHistory").empty();
		const $transferHistory = $(".transferHistory").empty();
		const $mintHistory = $(".mintHistory").empty();

		if (!addr || addr.length!=42) {
			$(".field.acctAddr .value .error").show().text("Invalid address.");
			return;
		} else {
			$(".field.acctAddr .value .error").hide();
		}

		//update balance and owedDividends
		util.bindToElement(token.balanceOf([addr]).then(ethUtil.toTokenStr), $balance);
		util.bindToElement(token.getOwedDividends([addr]).then(ethUtil.toEthStr), $owedDivs);

		//event CollectedDividends(address indexed account, uint amount);
		util.$getLogViewer({
			events: [{
				instance: token,
				name: "CollectedDividends",
				filter: { account: addr },
				formatters: { account: function(){} }
			}],
			order: "newest",
			$head: "Collection History"
		}).appendTo($collectHistory);

		//event Transfer(address indexed from, address indexed to, uint amount);
		util.$getLogViewer({
			events: [{
				instance: token,
				name: "Transfer",
				filter: { from: addr },
				formatters: {
					from: function(){},
					amount: (v)=>ethUtil.toTokenStr(v)
				}
			},{
				instance: token,
				name: "Transfer",
				filter: { to: addr },
				formatters: {
					to: function(){},
					amount: (v)=>ethUtil.toTokenStr(v),
				}
			}],
			order: "newest",
			$head: "Transfer History"
		}).appendTo($transferHistory);

		//event TokensMinted(address indexed account, uint amount, uint newTotalSupply);
		//event TokensBurned(address indexed account, uint amount, uint newTotalSupply);
		util.$getLogViewer({
			events: [{
				instance: token,
				name: "TokensMinted",
				filter: { account: addr },
				formatters: {
					account: function(){},
					amount: (v)=>ethUtil.toTokenStr(v),
					newTotalSupply: function(){}
				}
			},{
				instance: token,
				name: "TokensBurned",
				filter: { account: addr },
				formatters: {
					account: function(){},
					amount: (v)=>ethUtil.toTokenStr(v),
					newTotalSupply: function(){}
				}
			}],
			order: "newest",
			$head: "Mint/Burn History"
		}).appendTo($mintHistory);
	}

	function doCollect(){
		alert("collect");
	}
	function doTransfer(){
		alert("transfer");
	}
	function doBurn(){
		alert("burn");
	}
});