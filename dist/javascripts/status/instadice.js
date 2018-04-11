Loader.require("dice")
.then(function(dice){
    if (!BankrollableUtil) throw new Error("This requires BankrollableUtil to be loaded.");

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
            dice.getEvents("Created").then(arr => {
                return arr[0].blockNumber;
            }).then(creationBlockNum => {
                _initEventLog(creationBlockNum);
                Promise.all([
                    ethUtil.getBlock(creationBlockNum),
                    _niceWeb3.ethUtil.getAverageBlockTime(),
                ]).then(arr => {
                    _initQueue(arr[0], arr[1]);
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
            $health: BankrollableUtil.$getHealth(dice)
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

        return Promise.obj({
            feeBips: dice.feeBips(),
            minBet: dice.minBet(),
            maxBet: dice.effectiveMaxBet(),
            minNumber: dice.minNumber(),
            maxNumber: dice.maxNumber(),
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
            $e.find(".blob .fee-pct").text(`${obj.feeBips.div(100).toFixed(3)}%`);
            $e.find(".blob .min-bet").text(util.toEthStrFixed(obj.minBet, 3, ""));
            $e.find(".blob .max-bet").text(util.toEthStrFixed(obj.maxBet, 3, ""));
            $e.find(".blob .min-number").text(obj.minNumber);
            $e.find(".blob .min-number").siblings(".eth").text(`${(100/obj.minNumber).toFixed(2)}x payout`);
            $e.find(".blob .max-number").text(obj.maxNumber);
            $e.find(".blob .max-number").siblings(".eth").text(`${(100/obj.maxNumber).toFixed(2)}x payout`);
        }
    }

    function _initQueue(creationBlock, avgBlocktime) {
        const minBlock = creationBlock;
        const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

        const $e = $(".cell.status");
        const graph = new EthGraph();
        $e.find(".graph-ctnr").append(graph.$e);

        const getQueueSize = (block) => {
            return dice.getNumUnfinalized([], {defaultBlock: Math.round(block)});
        };
        graph.init({
            sequences: [{
                name: "queueSize",
                valFn: getQueueSize,
                showInPreview: true,
                maxPoints: 20,
                color: "black",
                yScaleHeader: "Queue Size",
                yTickCount: 3,
                yFormatFn: (y) => `${y} Rolls`,
            }],
            min: minBlock.number,
            max: maxBlock.number,
            previewXTicks: graph.createPreviewXTicks(minBlock, maxBlock, util),
            previewNumPoints: 20,
            previewFormatFn: graph.createPreviewFormatFn(util, avgBlocktime),
            titleFormatFn: graph.createTitleFormatter(_niceWeb3.ethUtil, util),
        });

        const dayInBlocks = 60*60*24 / avgBlocktime;
        graph.setView(maxBlock.number - dayInBlocks, maxBlock.number);
    }

    function _initProfits() {
        const $e = $(".cell.profits");
        $e.find(".profits-ctnr").append(BankrollableUtil.$getProfitsInfo(dice));
    }

    function _initActivity(creationBlock, avgBlocktime) {
        const minBlock = creationBlock;
        const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

        const $e = $(".cell.activity");
        const graph = new EthGraph();
        $e.find(".graph-ctnr").append(graph.$e);

        const getNumRolls = (block) => {
            return dice.curId([], {defaultBlock: Math.round(block)});
        };
        const getTotalWagered = (block) => {
            return dice.totalWagered([], {defaultBlock: Math.round(block)});
        };
        const getNumUsers = (block) => {
            return dice.curUserId([], {defaultBlock: Math.round(block)});
        };
        graph.init({
            sequences: [{
                name: "numRolls",
                valFn: getNumRolls,
                showInPreview: true,
                maxPoints: 20,
                color: "green",
                yScaleHeader: "Total Rolls",
                yTickCount: 3,
                yFormatFn: (y) => `${y} Rolls`,
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
                yFormatFn: (y) => `${y} users`,
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
            numRolls: dice.curId(),
            totalWagered: dice.totalWagered(),
            numUsers: dice.curUserId()
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
            $e.find(".blob .num-rolls").text(obj.numRolls);
            $e.find(".blob .total-wagered").text(util.toEthStrFixed(obj.totalWagered, 3, ""));
            $e.find(".blob .num-users").text(obj.numUsers);
        }
    }

    function _initEventLog(creationBlockNum) {
        // event Created(uint time);
        // event SettingsChanged(uint time, address indexed sender);

        // event RollWagered(uint time, uint32 indexed id, address indexed user, uint bet, uint8 number, uint payout);
        // event RollRefunded(uint time, address indexed user, string msg, uint bet, uint8 number);
        // event RollFinalized(uint time, uint32 indexed id, address indexed user, uint8 result, uint payout);
        // event PayoutSuccess(uint time, uint32 indexed id, address indexed user, uint payout);
        // event PayoutFailure(uint time, uint32 indexed id, address indexed user, uint payout);

        // event ProfitsSent(uint time, address indexed treasury, uint amount);
        // event BankrollAdded(uint time, address indexed bankroller, uint amount, uint bankroll);
        // event BankrollRemoved(uint time, address indexed bankroller, uint amount, uint bankroll);
        const formatters = {
            user: (val) => Loader.linkOf(val),
            id: (val) => {
                return $("<a target='_blank'></a>").text(`Roll #${val}`)
                    .attr("href", `/games/viewroll.html#${val}`);
            },
            bet: (val) => util.toEthStrFixed(val, 3),
            payout: (val) => util.toEthStrFixed(val, 3),
            // Bankrollable
            treasury: (val) => Loader.linkOf(val),
            bankroller: (val) => Loader.linkOf(val),
            amount: (val) => util.toEthStr(val),
            bankroll: (val) => util.toEthStr(val),
        };
        
        // Create "events" array
        const events = [{
            instance: dice,
            name: "Created"
        }];
        // define legends, build events from this.
        const labels = {
            "Settings": [true, ["SettingsChanged"]],
            "Roll Wagered": [false, ["RollWagered"]],
            "Roll Refunded": [false, ["RollRefunded"]],
            "Roll Finalized": [false, ["RollFinalized"]],
            "Payouts": [false, ["PayoutSuccess", "PayoutFailure"]],
            "Finances": [false, ["BankrollAdded", "BankrollRemoved", "ProfitsSent"]]
        }
        Object.keys(labels).forEach(groupName => {
            const selected = labels[groupName][0];
            const eventNames = labels[groupName][1];
            eventNames.forEach(eventName => {
                events.push({
                    instance: dice,
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