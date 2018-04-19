Loader.require("monarchy", "monarchy-factory")
.then(function(monarchy, mf){
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshGame();
	});

	var _address;
	const _$address = $("#Address");
	const _$loadBtn = $("#LoadButton").click(changeAddress);

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

		refreshGame();
		initLogs();
	};

	function refreshGame() {
		if (!_address) {
			$(".field .value").text("No address provided.");
			return;
		}

		function bindProp(prop, type) {
			const promise = game[prop]().then(v => {
				if (type == "link") return Loader.linkOf(v);
				if (type == "eth") return util.toEthStrFixed(v);
				if (type == "number") return v.toNumber().toLocaleString();
				if (type == "player") return nav.$getPlayerLink(v);
				if (type == "string") return `${v}`;
				if (type == "html") return v;
				throw new Error(`Invalid type: ${type}`);
			});
			util.bindToElement(promise, $(`.${prop} .value`), type=="link" || type=="player" || type=="html");
		}

		// load game and show address.
		const game = MonarchyGame.at(_address);
		$(".field.address .value").empty().append(util.$getAddrLink(_address));

		// find transaction it was created on, verify there was a Factory event.
		$(".verified .value").text("Loading...");
		mf.getEvents("GameCreated", {addr: _address}).then(arr=>{
			const $msg = $("<div></div>");
			$(".verified .value").empty().append($msg);
			if (arr.length) {
				const $monarchyLink = Loader.linkOf(monarchy.address);
				const $txLink = util.$getTxLink(arr[0].transactionHash);
				$msg.addClass("good")
					.append(`✓ Created by `).append($monarchyLink)
					.append(` in tx: `).append($txLink).append(`.`);
			} else {
				$msg.addClass("bad")
					.text("Not created by current MonarchyFactory!");
			}
		});

		// attach some props that arent native
		game.currentReign = function(){
			return Promise.obj({
				needed: game.reignBlocks(),
				remaining: game.getBlocksRemaining(),
			}).then(obj => {
				obj.reigned = obj.needed.minus(obj.remaining);
				return `Reigned for <b>${obj.reigned}</b> out of <b>${obj.needed}</b> blocks.
				Will win in <b>${obj.remaining}</b> blocks, if not overthrown.`;
			});
		};
		game.collectedFees = function(){
			return Promise.obj({
				total: game.totalFees(),
				uncollected: game.fees()
			}).then(obj => {
				return obj.total.minus(obj.uncollected);
			});
		};
		game.uncollectedFees = function(){
			return game.fees();
		};
		game.isPaidStr = function(){
			return Promise.obj({
				isEnded: game.isEnded(),
				isPaid: game.isPaid()
			}).then(obj => {
				if (!obj.isEnded) return `false (Game not yet over)`;
				else return obj.isPaid;
			});
		};

		// load props
		const defs = {
			// settings
			collector: "link",
			initialPrize: "eth",
			fee: "eth",
			prizeIncr: "eth",
			reignBlocks: "number",
			// cur values
			prize: "eth",
			monarch: "player",
			numOverthrows: "number",
			currentReign: "html",
			collectedFees: "eth",
			uncollectedFees: "eth",
			isPaidStr: "string"
		}
		Object.keys(defs).forEach(prop => bindProp(prop, defs[prop]));
	}

	function initLogs() {
		initOverthrows();
		initEvents();
	}

	function initOverthrows(){
		const $ctnr = $(".overthrows .body").text("Loading...");
        if (!MonarchyUtil) throw new Error(`MonarchyUtil is required.`);

        const game = MonarchyGame.at(_address);
        game.getEvents("Started").then(evs => {
        	return evs[0].blockNumber;
        }).then(startBlock => {
        	var lv = util.getLogViewer({
	            events: [{
	            	instance: game,
	                name: "OverthrowOccurred",
	                label: "Overthrow",
	                selected: true
	            },{
	            	instance: game,
	                name: "OverthrowRefundSuccess",
	                label: "Overthrow Refunded",
	                selected: true
	            },{
	            	instance: game,
	                name: "OverthrowRefundFailure",
	                label: "Overthrow Refunded",
	                selected: true
	            }],
	            order: "newest",
	            minBlock: startBlock,
	            valueFn: (event) => {
	                return MonarchyUtil.$getEventSummary(event, true, true);
	            }
	        });
	        lv.$e.appendTo($ctnr.empty());
        }).catch(e => {
        	$ctnr.text(`Error: ${e.message}`);
        });
	}

	function initEvents(){
		const $ctnr = $(".events .body").text("Loading...");

        const game = MonarchyGame.at(_address);
        game.getEvents("Started").then(evs => {
        	return evs[0].blockNumber;
        }).then(startBlock => {
			var lv = util.getLogViewer({
	            events: [{
	            	instance: game,
	                name: "SendPrizeSuccess",
	                label: "Send Prize",
	                selected: true
	            },{
	            	instance: game,
	                name: "SendPrizeFailure",
	                label: "Send Prize",
	                selected: true
	            },{
	            	instance: game,
	                name: "FeesSent",
	                label: "Fees Sent",
	                selected: true
	            }],
	            order: "newest",
	            minBlock: startBlock
	        });
	        lv.$e.appendTo($ctnr.empty());
        }).catch(e => {
        	$ctnr.text(`Error: ${e.message}`);
        });
	}

});