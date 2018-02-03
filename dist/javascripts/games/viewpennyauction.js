Loader.require("pac")
.then(function(pac){
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshAuction();
	});

	var _address;
	const _$address = $("#Address");
	const _$loadBtn = $("#LoadButton").click(changeAddress);
	const _$logs = $("#Logs");
	const _$refreshLogs = $(".logs .refresh").click(refreshLogs);

	if (window.location.hash) {
		_address = window.location.hash.substring(1)
		_$address.val(_address);
		_$loadBtn.click();
	}

	function changeAddress(){
		_address = _$address.val();
		window.location.hash = `#${_address}`;
		if (!_address)
			return alert("Please enter a valid address.");
		if (!(_address.toLowerCase().startsWith("0x")))
			return alert("Address must start with '0x'");
		if (!(_address.length=="42"))
			return alert("Address should be 42 characters long.");

		refreshAuction();
		refreshLogs();
	};

	function refreshAuction() {
		if (!_address) {
			$(".field .value").text("");
			return;
		}
		const auction = PennyAuction.at(_address);
		const pBlockEnded = auction.blockEnded();
		$(".field.address .value").empty().append(util.$getAddrLink(_address));
		util.bindToElement(auction.prize().then(ethUtil.toEthStr), $(".prize .value"));
		util.bindToElement(auction.bidPrice().then(ethUtil.toEthStr), $(".bidPrice .value"));
		util.bindToElement(auction.bidIncr().then(ethUtil.toEthStr), $(".bidIncr .value"));
		util.bindToElement(auction.bidAddBlocks(), $(".bidAddBlocks .value"));
		util.bindToElement(auction.currentWinner().then(util.$getAddrLink), $(".currentWinner .value"), true);
		util.bindToElement(pBlockEnded, $(".blockEnded .value"));
		util.bindToElement(auction.numBids(), $(".numBids .value"));
		util.bindToElement(auction.isPaid(), $(".isPaid .value"));
		util.bindToElement(auction.collector().then(util.$getAddrLink), $(".collector .value"), true);

		pBlockEnded.then(blockEnded=>{
			const curBlock = ethUtil.getCurrentBlockHeight();
			const diff = blockEnded.minus(curBlock);
			if (diff.gt(0)) {
				$(".blockEnded .value").append(` (${diff} blocks from now)`);
			} else {
				$(".blockEnded .value").append(` (${diff.abs()} blocks ago)`);
			}
		});

		// todo: find transaction it was created on, verify there was a PAF event.
	}

	function refreshLogs() {
		_$logs.empty();
		if (!_address) return;

		const auction = PennyAuction.at(_address);
		const $lv = util.$getLogViewer({
			events: [{
				instance: auction,
				name: "BidOccurred"
			},{
				instance: auction,
				name: "Started"
			},{
				instance: auction,
				name: "FeesSent"
			},{
				instance: auction,
				name: "BidRefundSuccess"
			},{
				instance: auction,
				name: "BidRefundFailure"
			},{
				instance: auction,
				name: "SendPrizeSuccess"
			},{
				instance: auction,
				name: "SendPrizeFailure"
			},{
				instance: auction,
				name: "SendPrizeError"
			}],
			stopFn: (e)=>e.name=="Started"
		});
		_$logs.append($lv);
	}

});