Loader.require("monarchy", "monarchy-factory")
.then(function(monarchy, mf){
	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshGames();
		refreshGame();
	});

	var _address;
	const _$address = $("#Address");
	const _$loadBtn = $("#LoadButton").click(changeAddress);

	if (window.location.hash) {
		_$address.val(window.location.hash.substring(1));
		_$loadBtn.click();
	}

	function changeAddress(){
		function error(msg) {
			const $e = $(".cell.select .error");
			if (!msg) $e.hide();
			else $e.show().text(msg);
		}

		doScrolling($(".cell.select"), 500);
		const addr = _$address.val();
		window.location.hash = `#${addr}`;

		_address = null;
		if (!addr) {
			error("Please enter a valid address.");
		} else if (!(addr.toLowerCase().startsWith("0x"))) {
			error("Address must start with '0x'");
		} else if (!(addr.length=="42")){
			error("Address should be 42 characters long.");
		} else {
			error("");
			_address = addr;
		}

		refreshGame();
		initLogs();
	};

	function refreshGames() {
		const $e = $(".cell.games");
		function getGames(addrs) {
			return Promise.all(addrs.map(addr => {
				const inst = MonarchyGame.at(addr);
				return Promise.obj({
					address: addr,
					initialPrize: inst.initialPrize(),
					fee: inst.fee(),
					prizeIncr: inst.prizeIncr(),
					reignBlocks: inst.reignBlocks(),
					monarch: inst.monarch(),
					numOverthrows: inst.numOverthrows(),
					blocksRemaining: inst.getBlocksRemaining()
				});
			}));
		}
		// get active games
		function getActiveGames(){
			return monarchy.numDefinedGames().then(num => {
                const promises = [];
                for (var i=1; i<=num; i++) {
                    let id = i;
                    promises.push(
                    	monarchy.definedGames([id]).then(arr => {
                        	return arr[0] == ethUtil.NO_ADDRESS
                        		? null
                        		: arr[0];
                        })
                    );
                }
                return Promise.all(promises).then(addrs => {
                	return getGames(addrs.filter(addr => !!addr));
                });
            });
		}
		// get ended games
		function getEndedGames(){
			return monarchy.recentlyEndedGames([5]).then(addrs => {
                return getGames(addrs);
            });
		}

		// <td>Game</td>
		// <td>Initial Prize</td>
		// <td>Overthrow Fee</td>
		// <td>Prize Increment</td>
		// <td>Reign Blocks</td>
		// <td>Current Monarch</td>
		// <td>Num Overthrows</td>
		// <td>Blocks Remaining</td>
		Promise.obj({
			active: getActiveGames(),
			ended: getEndedGames()
		}).then(obj => {
			const games = obj.active.concat(obj.ended);
			const $tbody = $e.find("tbody").empty();
			games.forEach(game => {
				$tr = $("<tr></tr>");
				const $link = nav.$getMonarchyGameLink(game.address).click(e => {
					e.preventDefault();
					$("#Address").val(game.address);
					$("#LoadButton").click();
				});
				$("<td></td>").append($link).appendTo($tr);
				$("<td></td>").text(util.toEthStrFixed(game.initialPrize)).appendTo($tr);
				$("<td></td>").text(util.toEthStrFixed(game.fee)).appendTo($tr);
				$("<td></td>").text(util.toEthStrFixed(game.prizeIncr)).appendTo($tr);
				$("<td></td>").text(game.reignBlocks).appendTo($tr);
				$("<td></td>").append(nav.$getPlayerLink(game.monarch)).appendTo($tr);
				$("<td></td>").text(game.numOverthrows).appendTo($tr);
				const endedStr = game.blocksRemaining.gt(0) ? game.blocksRemaining : "ENDED";
				$("<td></td>").text(endedStr).appendTo($tr);
				$tr.appendTo($tbody);
			})
		})
	}

	function refreshGame() {
		if (!_address) {
			$(".field .value").text("--");
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
		$(".field.address .value").empty().append(util.$getShortAddrLink(_address));

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
				return obj.remaining.equals(0)
					? `Reigned for <b>${obj.reigned} blocks</b>, and won.`
					: `Reigned for <b>${obj.reigned}</b> out of <b>${obj.needed}</b> blocks.
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
        if (!_address) {
			$ctnr.text("No address provided.");
			return;
		}

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
		if (!_address) {
			$ctnr.text("No address provided.");
			return;
		}

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