Loader.require("pac")
.then(function(pac){
    if (!BankrollableUtil) throw new Error("This requires BankrollableUtil to be loaded.");

    ethUtil.getCurrentState().then(() => {
        _refreshAll();
    });

    function eth(val) {
        return util.toEthStrFixed(val);
    }

    function _refreshAll(){
        Promise.all([
            _refreshHealth(),
            _refreshGames(),
            _refreshActivity(),
        ]).then(()=>{
            _initProfits();
            pac.getEvents("Created").then(arr => {
                return arr[0].blockNumber;
            }).then(creationBlockNum => {
                _initEventLog(creationBlockNum);
                Promise.all([
                    ethUtil.getBlock(creationBlockNum),
                    _niceWeb3.ethUtil.getAverageBlockTime(),
                ]).then(arr => {
                    _initActivity(arr[0], arr[1]);
                });
            });
        });
    }

    function _refreshHealth() {
        const $e = $(".cell.health");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            $health: BankrollableUtil.$getHealth(pac)
        }).then(doRefresh).then(()=>{
            $loading.hide();
            $doneLoading.show();
        },e => {
            console.warn(e);
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            $e.find(".health-ctnr").append(obj.$health);
        }
    }

    function _refreshGames() {
        const $e = $(".cell.games");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        function getDefinedGames(){
            return pac.numDefinedAuctions().then(num => {
                const promises = [];
                for (var i=1; i<=num; i++) {
                    let id = i;
                    promises.push(pac.definedAuctions([id]).then(arr => {
                        const instance = new BigNumber(arr[0])==0 ? null : PennyAuction.at(arr[0]);
                        return Promise.obj({
                            isStartable: pac.getIsStartable([id]),
                            currentWinner: instance ? instance.currentWinner() : Promise.resolve(null),
                            prize: instance ? instance.prize() : Promise.resolve(null),
                            numBids: instance ? instance.numBids() : Promise.resolve(null),
                            blocksLeft: instance ? instance.getBlocksRemaining() : Promise.resolve(null)
                        }).then(obj => {
                            return {
                                id: id,
                                instance: instance,
                                isEnabled: arr[1],
                                summary: arr[2],
                                initialPrize: arr[3],
                                bidPrice: arr[4],
                                bidIncr: arr[5],
                                bidAddBlocks: arr[6],
                                initialBlocks: arr[7],
                                isStartable: obj.isStartable,
                                isEnded: obj.isEnded,
                                currentWinner: obj.currentWinner,
                                prize: obj.prize,
                                numBids: obj.numBids,
                                blocksLeft: obj.blocksLeft
                            };
                        });
                    }));
                }
                return Promise.all(promises);
            });
        }
        function getEndedGames(){
            return pac.recentlyEndedAuctions([5]).then(arr => {
                return arr.map(addr => {
                    const instance = PennyAuction.at(addr);
                    return Promise.obj({
                        id: "n/a",
                        currentWinner: instance.currentWinner(),
                        prize: instance.prize(),
                        numBids: instance.numBids(),
                        blocksLeft: instance.getBlocksRemaining()
                    });
                });
            });
        }

        return Promise.obj({
            numActive: pac.numActiveAuctions(),
            numEnded: pac.numEndedAuctions(),
            definedGames: getDefinedGames(),
            endedGames: getEndedGames(),
            limit: pac.getDailyLimit(),
            limitRemaining: pac.getDailyLimitRemaining(),
        }).then(doRefresh).then(()=>{
            $loading.hide();
            $doneLoading.show();
        },e => {
            console.warn(e);
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            $e.find(".num-active").text(obj.numActive);
            $e.find(".num-ended").text(obj.numEnded);
            $e.find(".num-defined").text(obj.definedGames.length);
            $e.find(".daily-limit").text(`Daily Limit: ${eth(obj.limit)} (Remaining: ${eth(obj.limitRemaining)})`);

            // Display defined games.
            (function(){
                const $tbody = $e.find(".defined-games tbody");
                if (obj.definedGames.length == 0) {
                    $tbody.append("<tr><td colspan=9>There are no defined games</td></tr>");
                } else {
                    obj.definedGames.forEach(game => {
                        const status = game.instance == null
                            ? game.isStartable ? "startable" : "not-startable"
                            : game.blocksLeft.equals(0) ? "endable" : "active";
                        const $link = game.instance == null ? "None" : Loader.linkOf(game.instance.address);
                        const $row = $("<tr></tr>").addClass(status);
                        $row.append($("<td></td>").text(game.id));
                        $row.append($("<td></td>").append($link));
                        $row.append($("<td></td>").text(game.summary));
                        $row.append($("<td></td>").text(game.isEnabled));
                        $row.append($("<td></td>").text(eth(game.initialPrize)));
                        $row.append($("<td></td>").text(eth(game.bidPrice)));
                        $row.append($("<td></td>").text(eth(game.bidIncr)));
                        $row.append($("<td></td>").text(game.bidAddBlocks));
                        $row.append($("<td></td>").text(game.initialBlocks));
                        $row.appendTo($tbody);
                    });
                }
            }());
            
            // Display active games
            (function(){
                const $tbody = $e.find(".games tbody");
                if (obj.definedGames.length == 0) {
                    $tbody.append("<tr><td colspan=5>There are no active or completed games</td></tr>");
                } else {
                    obj.definedGames.concat(obj.endedGames).forEach(game => {
                        if (game.instance == null) return;
                        const $row = $("<tr></tr>");
                        $row.append($("<td></td>").text(game.id));
                        $row.append($("<td></td>").text(eth(game.prize)));
                        $row.append($("<td></td>").append(Loader.linkOf(game.currentWinner)));
                        $row.append($("<td></td>").text(game.numBids));
                        $row.append($("<td></td>").text(game.blocksLeft));
                        $row.appendTo($tbody);
                    });
                }
            }());
        }
    }

    function _initActivity(creationBlock, avgBlocktime) {
        const minBlock = creationBlock;
        const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

        const $e = $(".cell.activity");
        const graph = new EthGraph();
        $e.find(".graph-ctnr").append(graph.$e);

        const getNumEnded = (block) => {
            return pac.numEndedAuctions([], {defaultBlock: Math.round(block)});
        };
        const getTotalPrizes = (block) => {
            return pac.totalPrizes([], {defaultBlock: Math.round(block)});
        };
        const getTotalOverthrows = (block) => {
            return pac.totalBids([], {defaultBlock: Math.round(block)});
        };
        graph.init({
            sequences: [{
                name: "totalPrizes",
                valFn: getTotalPrizes,
                showInPreview: true,
                maxPoints: 20,
                color: "green",
                yScaleHeader: "Total Prizes",
                yTickCount: 3,
                yFormatFn: (y) => util.toEthStr(y),
            },{
                name: "numEnded",
                valFn: getNumEnded,
                showInPreview: true,
                maxPoints: 20,
                color: "blue",
                yScaleHeader: "Games Ended",
                yTickCount: 3,
                yFormatFn: (y) => `${y}`,
            },{
                name: "totalOverthrows",
                valFn: getTotalOverthrows,
                showInPreview: true,
                maxPoints: 20,
                color: "purple",
                yScaleHeader: "Total Overthrows",
                yTickCount: 3,
                yFormatFn: (y) => `${y}`,
            }],
            min: minBlock.number,
            max: maxBlock.number,
            previewXTicks: graph.createPreviewXTicks(minBlock, maxBlock, util),
            previewNumPoints: 20,
            previewFormatFn: graph.createPreviewFormatFn(util, avgBlocktime),
            titleFormatFn: graph.createTitleFormatter(_niceWeb3.ethUtil, util),
        });

        const dayInBlocks = 60*60*24 / avgBlocktime;
        graph.setView(maxBlock.number - 7*dayInBlocks, maxBlock.number);
    }
    function _refreshActivity() {
        const $e = $(".cell.activity");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            ended: pac.numEndedAuctions(),
            prizes: pac.totalPrizes(),
            overthrows: pac.totalBids()
        }).then(doRefresh).then(()=>{
            $loading.hide();
            $doneLoading.show();
        },e => {
            console.warn(e);
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            $e.find(".blob .total-games").text(obj.ended);
            $e.find(".blob .total-prizes").text(util.toEthStrFixed(obj.prizes, 3, ""));
            $e.find(".blob .total-overthrows").text(obj.overthrows);
        }
    }

    function _initProfits() {
        const $e = $(".cell.profits");
        $e.find(".profits-ctnr").append(BankrollableUtil.$getProfitsInfo(pac));
    }

    function _initEventLog(creationBlockNum) {
        // event Created(uint time);
        // event Error(uint time, string msg);
        // event DefinedAuctionEdited(uint time, uint index);
        // event DefinedAuctionInvalid(uint time, uint index);
        // event AuctionStarted(uint time, uint indexed index, address indexed addr, uint initialPrize);
        // event AuctionEnded(uint time, uint indexed index, address indexed winner, address indexed addr);
        // event FeesCollected(uint time, uint amount);

        // event ProfitsSent(uint time, address indexed treasury, uint amount);
        // event BankrollAdded(uint time, address indexed bankroller, uint amount, uint bankroll);
        // event BankrollRemoved(uint time, address indexed bankroller, uint amount, uint bankroll);
        const formatters = {
            addr: (val) => {
                return $(`<a target="_blank"></a>`)
                    .text(`Game`)
                    .attr("href", `/games/viewmonarchy.html#${val}`);
            },
            initialPrize: (val) => util.toEthStr(val),
            winner: (val) => Loader.linkOf(val),
            treasury: (val) => Loader.linkOf(val),
            bankroller: (val) => Loader.linkOf(val),
            amount: (val) => util.toEthStr(val),
            bankroll: (val) => util.toEthStr(val),
        };
        
        // Create "events" array
        const events = [{
            instance: pac,
            name: "Created"
        }];
        // define legends, build events from this.
        const labels = {
            "Games": [true, ["AuctionStarted", "AuctionEnded"]],
            "Settings": [false, ["DefinedAuctionEdited"]],
            "Errors": [false, ["DefinedAuctionInvalid", "Error"]],
            "Finances": [false, ["BankrollAdded", "BankrollRemoved", "ProfitsSent", "FeesCollected"]]
        }
        Object.keys(labels).forEach(groupName => {
            const selected = labels[groupName][0];
            const eventNames = labels[groupName][1];
            eventNames.forEach(eventName => {
                events.push({
                    instance: pac,
                    name: eventName,
                    formatters: formatters,
                    label: groupName,
                    selected: selected
                });
            })
        });

        // create log viewer
        var $lv = util.$getLogViewer({
            events: events,
            order: "newest",
            minBlock: creationBlockNum
        });
        $(".cell.events .log-viewer").empty().append($lv);
    }
});