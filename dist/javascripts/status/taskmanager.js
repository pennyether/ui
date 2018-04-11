Loader.require("tm", "token")
.then(function(tm, token){
    ethUtil.getCurrentState().then(() => {
        _refreshAll();
    });

    function _refreshAll(){
        Promise.all([
            _refreshSettings(),
            _refreshTasks(),
            _refreshRewards(),
        ]).then(()=>{
            tm.getEvents("Created").then(arr => {
                return arr[0].blockNumber;
            }).then(creationBlockNum => {
                _initEventLog(creationBlockNum);
                Promise.all([
                    ethUtil.getBlock(creationBlockNum),
                    _niceWeb3.ethUtil.getAverageBlockTime(),
                ]).then(arr => {
                    _initRewards(arr[0], arr[1]);
                });
            });
        });
    }

    function _refreshSettings(){
        const $e = $(".cell.settings");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            balance: ethUtil.getBalance(tm),
            admin: tm.getAdmin(),
            pac: tm.getPennyAuctionController(),
            spRewardBips: tm.sendProfitsRewardBips(),
            paStartReward: tm.paStartReward(),
            paEndReward: tm.paEndReward()
        }).then(doRefresh).then(()=>{
            $loading.hide();
            $doneLoading.show();
        },e => {
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            $e.find(".balance-info").empty().append(util.toEthStr(obj.balance));
            $e.find(".admin-info").empty().append(Loader.linkOf(obj.admin));
            $e.find(".pac-info").empty().append(Loader.linkOf(obj.pac));
            $e.find(".send-profits-reward").text(`${obj.spRewardBips.div(100).toFixed(2)}% (max: 1%)`);
            $e.find(".pa-start-reward").text(`${util.toEthStrFixed(obj.paStartReward)} (max: 1 ETH)`);
            $e.find(".pa-end-reward").text(`${util.toEthStrFixed(obj.paEndReward)} (max: 1 ETH)`);
        }
    }

    function _refreshTasks() {
        const $e = $(".cell.tasks");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            sendMonarchy: tm.sendProfitsReward([Loader.addressOf("PENNY_AUCTION_CONTROLLER")]),
            sendInstaDice: tm.sendProfitsReward([Loader.addressOf("INSTA_DICE")]),
            sendVideoPoker: tm.sendProfitsReward([Loader.addressOf("VIDEO_POKER")]),
            startGame: tm.startPennyAuctionReward(),
            endGame: tm.refreshPennyAuctionsReward(),
        }).then(doRefresh).then(()=>{
            $loading.hide();
            $doneLoading.show();
        },e => {
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            [
                [".send-monarchy-profits", obj.sendMonarchy],
                [".send-instadice-profits", obj.sendInstaDice],
                [".send-videopoker-profits", obj.sendVideoPoker],
            ].forEach(arr => {
                const reward = arr[1][0];
                const profits = arr[1][1];
                const $el = $e.find(arr[0]);
                const profitStr = profits.gt(0)
                    ? `${util.toEthStr(profits)}`
                    : "Not Needed."
                const rewardStr = profits.gt(0)
                    ? ` (${util.toEthStr(reward)} reward)`
                    : "";
                $el.text(`${profitStr}${rewardStr}`);
            });

            if (obj.startGame[0].gt(0)){
                const rewardStr = util.toEthStr(obj.startGame[0]);
                $e.find(".start-monarchy-game").text(`Game #${obj.startGame[1]} (${rewardStr} reward)`)
            } else {
                $e.find(".start-monarchy-game").text(`Not Needed.`);
            }

            if (obj.endGame[0].gt(0)) {
                const rewardStr = util.toEthStr(obj.endGame[0]);
                $e.find(".end-monarchy-game").text(`${obj.endGame[1]} games (${rewardStr} reward)`)
            } else {
                $e.find(".end-monarchy-game").text(`Not Needed.`)
            }
        }
    }

    function _initRewards(creationBlock, avgBlocktime) {
        const minBlock = creationBlock;
        const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

        const $e = $(".cell.rewards");
        const graph = new EthGraph();
        $e.find(".graph-ctnr").append(graph.$e);

        const getTotalRewarded = (block) => {
            return tm.totalRewarded([], {defaultBlock: Math.round(block)});
        };
        const getBalance = (block) => {
            return ethUtil.getBalance(tm, Math.round(block));
        };
        graph.init({
            sequences: [{
                name: "totalRewarded",
                valFn: getTotalRewarded,
                showInPreview: true,
                maxPoints: 20,
                color: "green",
                yScaleHeader: "Total Rewarded",
                yTickCount: 3,
                yFormatFn: util.toEthStr,
            },{
                name: "balance",
                valFn: getBalance,
                showInPreview: true,
                maxPoints: 20,
                color: "blue",
                yScaleHeader: "Balance",
                yTickCount: 3,
                yFormatFn: util.toEthStr,
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
    function _refreshRewards() {
        const $e = $(".cell.rewards");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            totalRewarded: tm.totalRewarded()
        }).then(doRefresh).then(()=>{
            $loading.hide();
            $doneLoading.show();
        }, e=>{
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            $e.find(".total-rewarded").text(util.toEthStrFixed(obj.totalRewarded, 3, ""));
        }
    }

    function _initEventLog(creationBlockNum) {
        // event Created(uint time);
        // event SendProfitsRewardChanged(uint time, address indexed admin, uint newValue);
        // event PennyAuctionRewardsChanged(uint time, address indexed admin, uint paStartReward, uint paEndReward);

        // event SendProfitsSuccess(uint time, address indexed bankrollable, uint profitsSent);
        // event PennyAuctionStarted(uint time, address indexed auctionAddr, uint initialPrize);
        // event PennyAuctionsRefreshed(uint time, uint numEnded, uint feesCollected);
        
        // event TaskError(uint time, address indexed caller, string msg);
        // event RewardSuccess(uint time, address indexed caller, uint reward);
        // event RewardFailure(uint time, address indexed caller, uint reward, string msg);

        // event BankrollAdded(uint time, address indexed bankroller, uint amount, uint bankroll);
        // event BankrollRemoved(uint time, address indexed bankroller, uint amount, uint bankroll);
        const formatters = {
            admin: Loader.linkOf,
            paStartReward: (val) => util.toEthStr(val),
            paEndReward: (val) => util.toEthStr(val),
            newValue: (val) => `${val.div(100).toFixed(2)}%`,
            bankrollable: (val) => Loader.linkOf(val),
            auctionAddr: (val) => $(`<a href="/games/viewmonarchy.html#${val}" target="_blank"></a>`).text(`Game`),
            initialPrize: (val) => util.toEthStr(val),
            feesCollected: (val) => util.toEthStr(val),
            caller: (val) => util.$getShortAddrLink(val),
            bankroller: (val) => Loader.linkOf(val),
            amount: (val) => util.toEthStr(val),
            bankroll: (val) => util.toEthStr(val),
        };
        
        // Create "events" array
        const events = [{
            instance: tm,
            name: "Created"
        }];
        // define legends, build events from this.
        const labels = {
            "Tasks": [true, ["SendProfitsSuccess", "PennyAuctionStarted", "PennyAuctionsRefreshed"]],
            "Settings": [true, ["SendProfitsRewardChanged", "PennyAuctionRewardsChanged"]],
            "Rewards": [false, ["RewardSuccess"]],
            "Error": [false, ["RewardFailure","TaskError"]],
            "Bankroll": [false, ["BankrollAdded", "BankrollRemoved"]]
        }
        Object.keys(labels).forEach(groupName => {
            const selected = labels[groupName][0];
            const eventNames = labels[groupName][1];
            eventNames.forEach(eventName => {
                events.push({
                    instance: tm,
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

