Loader.require("vp")
.then(function(vp){
    if (!BankrollableUtil) throw new Error("This requires BankrollableUtil to be loaded.");
    if (!PokerUtil) throw new Error(`This requires PokerUtil to be loaded.`);

    ethUtil.getCurrentState().then(() => {
        _refreshAll();
    });

    function _refreshAll(){
        Promise.all([
            _refreshHealth(),
            _refreshStatus(),
            _refreshActivity(),
        ]).then(()=>{
            _initProfits();
            vp.getEvents("Created").then(arr => {
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
            $health: BankrollableUtil.$getHealth(vp)
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

    function _refreshStatus() {
        const $e = $(".cell.status");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        function getPayTables() {
            return vp.numPayTables().then(count => {
                const promises = [];
                for (var i=0; i<count; i++) {
                    promises.push(vp.getPayTable([i]));
                }
                return Promise.all(promises);
            });
        }

        return Promise.obj({
            minBet: vp.minBet(),
            maxBet: vp.effectiveMaxBet(),
            curPayTableId: vp.curPayTableId(),
            payTables: getPayTables()
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
            $e.find(".blob .min-bet").text(util.toEthStrFixed(obj.minBet, 3, ""));
            $e.find(".blob .max-bet").text(util.toEthStrFixed(obj.maxBet, 3, ""));
            //
            const $thead = $e.find(".pay-tables thead tr");
            const $tbody = $e.find(".pay-tables tbody");
            obj.payTables.forEach((pt, i) => $thead.append(`<td>${i}</td>`));
            const transpose = obj.payTables[0].map((_, i) => obj.payTables.map(row => row[i]));
            transpose.forEach((row, i) => {
                if (i == 0 || i == 11) return;
                const $row = $("<tr></tr>").appendTo($tbody);
                const name = PokerUtil.Hand.getRankString(i);
                $row.append($("<td></td>").text(name));

                row.forEach((val, i) => {
                    const $cell = $("<td></td>").text(`${val} x`).appendTo($row);
                    if (i == obj.curPayTableId) $cell.addClass("selected");
                });
            });
        }
    }

    function _initProfits() {
        const $e = $(".cell.profits");
        $e.find(".profits-ctnr").append(BankrollableUtil.$getProfitsInfo(vp));
    }

    function _initActivity(creationBlock, avgBlocktime) {
        const minBlock = creationBlock;
        const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

        const $e = $(".cell.activity");
        const graph = new EthGraph();
        $e.find(".graph-ctnr").append(graph.$e);

        const getNumGames = (block) => {
            return vp.curId([], {defaultBlock: Math.round(block)});
        };
        const getTotalWagered = (block) => {
            return vp.totalWagered([], {defaultBlock: Math.round(block)});
        };
        const getNumUsers = (block) => {
            return vp.curUserId([], {defaultBlock: Math.round(block)});
        };
        graph.init({
            sequences: [{
                name: "numGames",
                valFn: getNumGames,
                showInPreview: true,
                maxPoints: 20,
                color: "green",
                yScaleHeader: "Total Games",
                yTickCount: 3,
                yFormatFn: (y) => `${y} Games`,
            },{
                name: "totalWagered",
                valFn: getTotalWagered,
                showInPreview: true,
                maxPoints: 20,
                color: "blue",
                yScaleHeader: "Total Wagered",
                yTickCount: 3,
                yFormatFn: (y) => util.toEthStr(y),
            },{
                name: "numUsers",
                valFn: getNumUsers,
                showInPreview: true,
                maxPoints: 20,
                color: "purple",
                yScaleHeader: "Unique Users",
                yTickCount: 3,
                yFormatFn: (y) => `${y} Users`,
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
            numGames: vp.curId(),
            totalWagered: vp.totalWagered(),
            numUsers: vp.curUserId()
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
            $e.find(".blob .num-games").text(obj.numGames);
            $e.find(".blob .total-wagered").text(util.toEthStrFixed(obj.totalWagered, 3, ""));
            $e.find(".blob .num-users").text(obj.numUsers);
        }
    }

    function _initEventLog(creationBlockNum) {
        // event Created(uint time);
        // event PayTableAdded(uint time, address admin, uint payTableId);
        // event SettingsChanged(uint time, address admin);
        // // Game Events
        // event BetSuccess(uint time, address indexed user, uint32 indexed id, uint bet, uint payTableId, uint uiid);
        // event BetFailure(uint time, address indexed user, uint bet, string msg);
        // event DrawSuccess(uint time, address indexed user, uint32 indexed id, uint32 iHand, uint8 draws, uint8 warnCode);
        // event DrawFailure(uint time, address indexed user, uint32 indexed id, uint8 draws, string msg);
        // event FinalizeSuccess(uint time, address indexed user, uint32 indexed id, uint32 dHand, uint8 handRank, uint payout, uint8 warnCode);
        // event FinalizeFailure(uint time, address indexed user, uint32 indexed id, string msg);
        // // If _payout = true on finalization
        // event PayoutSuccess(uint time, address indexed user, uint32 indexed id, uint amount);
        // event PayoutFailure(uint time, address indexed user, uint32 indexed id, uint amount);
        // // Credits
        // event CreditsAdded(uint time, address indexed user, uint32 indexed id, uint amount);
        // event CreditsUsed(uint time, address indexed user, uint32 indexed id, uint amount);
        // event CreditsCashedout(uint time, address indexed user, uint amount);

        // event ProfitsSent(uint time, address indexed treasury, uint amount);
        // event BankrollAdded(uint time, address indexed bankroller, uint amount, uint bankroll);
        // event BankrollRemoved(uint time, address indexed bankroller, uint amount, uint bankroll);
        const formatters = {
            user: (val) => Loader.linkOf(val),
            id: (val) => {
                return $("<a target='_blank'></a>").text(`Game #${val}`)
                    .attr("href", `/games/viewvideopokergame.html#${val}`);
            },
            bet: (val) => util.toEthStrFixed(val, 3),
            payout: (val) => util.toEthStrFixed(val, 3),
            iHand: (val) => (new PokerUtil.Hand(val)).toString(),
            dHand: (val) => (new PokerUtil.Hand(val)).toString(),
            draws: (val) => PokerUtil.getDrawsArray(val).join(", "),
            handRank: (val) => PokerUtil.Hand.getRankString(val),
            // Bankrollable
            treasury: (val) => Loader.linkOf(val),
            bankroller: (val) => Loader.linkOf(val),
            amount: (val) => util.toEthStr(val),
            bankroll: (val) => util.toEthStr(val),
        };
        
        // Create "events" array
        const events = [{
            instance: vp,
            name: "Created"
        }];
        // define legends, build events from this.
        const labels = {
            "Settings": [true, ["PayTableAdded", "SettingsChanged"]],
            "Hand Dealt": [false, ["BetSuccess"]],
            "Hand Drawn": [false, ["DrawSuccess"]],
            "Hand Finalized": [false, ["FinalizeSuccess"]],
            "Failures": [false, ["BetFailure", "DrawFailure", "FinalizeFailure", "PayoutFailure"]],
            "Credits": [false, ["CreditsAdded", "CreditsUsed", "CreditsCashedout"]],
            "Payouts": [false, ["PayoutSuccess", "PayoutFailure"]],
            "Finances": [false, ["BankrollAdded", "BankrollRemoved", "ProfitsSent"]]
        }
        Object.keys(labels).forEach(groupName => {
            const selected = labels[groupName][0];
            const eventNames = labels[groupName][1];
            eventNames.forEach(eventName => {
                events.push({
                    instance: vp,
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