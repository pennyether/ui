Loader.require("tm", "token")
.then(function(tm, token){
    $(".links .etherscan").attr("href", util.$getAddrLink(tm.address).attr("href"));
    // run this once
    _initTasks();
    ethUtil.onStateChanged(()=>{
        _refreshTasks();
    })

    // do _refreshAll() just once.
    ethUtil.getCurrentState().then(() => {
        _refreshAll();
    });
    function _refreshAll(){
        Promise.all([
            _refreshSettings(),
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

    function eth(val) {
        return util.toEthStrFixed(val);
    }

    function _refreshSettings(){
        const $e = $(".cell.settings");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            balance: ethUtil.getBalance(tm),
            admin: tm.getAdmin(),
            monarchy: tm.getMonarchyController(),
            limit: tm.getDailyLimit(),
            limitRemaining: tm.getDailyLimitRemaining(),
            idRewardBips: tm.issueDividendRewardBips(),
            spRewardBips: tm.sendProfitsRewardBips(),
            monarchyStartReward: tm.monarchyStartReward(),
            monarchyEndReward: tm.monarchyEndReward()
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
            $e.find(".monarchy-info").empty().append(Loader.linkOf(obj.monarchy));
            $e.find(".limit-info").empty().append(`${eth(obj.limit)} (Remaining: ${eth(obj.limitRemaining)})`);
            $e.find(".issue-dividend-reward").text(`${obj.idRewardBips.div(100).toFixed(2)}% (max: .1%)`);
            $e.find(".send-profits-reward").text(`${obj.spRewardBips.div(100).toFixed(2)}% (max: 1%)`);
            $e.find(".monarchy-start-reward").text(`${eth(obj.monarchyStartReward)} (max: 1 ETH)`);
            $e.find(".monarchy-end-reward").text(`${eth(obj.monarchyEndReward)} (max: 1 ETH)`);
        }
    }

    function _initTasks() {
        const $e = $(".cell.tasks");
        const $taskerRow = $e.find(".tasker-row").detach();
        const tasker = new Tasker();
        tasker.$e.appendTo($taskerRow.find(".tasker-ctnr"));

        const monarchy = Loader.addressOf("MONARCHY_CONTROLLER");
        const dice = Loader.addressOf("INSTA_DICE");
        const poker = Loader.addressOf("VIDEO_POKER");
        const tasks = [{
            $trigger: $e.find(".issue-dividend"),
            getDetails: () => {
                return Promise.obj({
                    reward: tm.issueDividendReward().then(arr => arr[0]),
                    estGas: tm.doIssueDividend.estimateGas(),
                    execute: (opts) => tm.doIssueDividend([], opts),
                    riskGas: new BigNumber(40000)
                });
            }
        },{
            $trigger: $e.find(".send-monarchy-profits"),
            getDetails: () => {
                return Promise.obj({
                    reward: tm.sendProfitsReward([monarchy]).then(arr=>arr[0]),
                    estGas: tm.doSendProfits.estimateGas([monarchy]),
                    execute: (opts) => tm.doSendProfits([monarchy], opts),
                    riskGas: new BigNumber(34000)
                });
            }
        },{
            $trigger: $e.find(".send-instadice-profits"),
            getDetails: () => {
                return Promise.obj({
                    reward: tm.sendProfitsReward([dice]).then(arr=>arr[0]),
                    estGas: tm.doSendProfits.estimateGas([dice]),
                    execute: (opts) => tm.doSendProfits([dice], opts),
                    riskGas: new BigNumber(34000)
                });
            }
        },{
            $trigger: $e.find(".send-videopoker-profits"),
            getDetails: () => {
                return Promise.obj({
                    reward: tm.sendProfitsReward([poker]).then(arr=>arr[0]),
                    estGas: tm.doSendProfits.estimateGas([poker]),
                    execute: (opts) => tm.doSendProfits([poker], opts),
                    riskGas: new BigNumber(34000)
                });
            }
        },{
            $trigger: $e.find(".start-monarchy-game"),
            getDetails: () => {
                return tm.startMonarchyGameReward().then(arr => {
                    const reward = arr[0];
                    const index = arr[1];
                    return Promise.obj({
                        reward: reward,
                        estGas: tm.startMonarchyGame.estimateGas([index]),
                        execute: (opts) => tm.startMonarchyGame([index], opts),
                        riskGas: new BigNumber(50000)
                    });
                })
            }
        },{
            $trigger: $e.find(".end-monarchy-game"),
            getDetails: () => {
                return Promise.obj({
                    reward: tm.refreshMonarchyGamesReward().then(arr=>arr[0]),
                    estGas: tm.refreshMonarchyGames.estimateGas(),
                    execute: (opts) => tm.refreshMonarchyGames([], opts),
                    riskGas: new BigNumber(50000)
                })
            }
        }];

        tasks.forEach(obj => {
            obj.$trigger.click((ev) => {
                // Don't do anything until they clear the transaction.
                if (tasker.isPending()) return;

                // Hide it.
                const $tr = obj.$trigger.closest("tr");
                if ($tr.next().find(".Tasker").length > 0) {
                    $tr.removeClass("selected");
                    $taskerRow.detach();
                    return;
                }
                // Don't show it if this trigger isnt available
                if (!obj.$trigger.is(".available")) return;

                // Show append to the next row, and refresh it
                $tr.siblings("tr").removeClass("selected");
                $tr.addClass("selected");
                $taskerRow.insertAfter($tr).show();
                tasker.setDetailsFn(obj.getDetails);
            });
        });

        function Tasker() {
            const _$e = $(`
                <div class="Tasker">
                    <table width="100%">
                        <tr>
                            <td class="label tip-left" title="The higher the Gas Price, the faster your transaction will be mined.
                            This increases the chance that you will win the reward instead of somebody else.">
                                Gas Price:
                            </td>
                            <td class="gps-ctnr" width=100%></td>
                        </tr>
                        <tr>
                            <td class="label tip-left" title="The reward you will be paid if the Task is executed.">
                                Reward:
                            </td>
                            <td class="value reward"></td>
                        </tr>
                        <tr>
                            <td class="label tip-left" title="The estimated gas cost to execute this Task.">
                                Estimated Tx Cost:
                            </td>
                            <td class="value tx-cost"></td>
                        </tr>
                        <tr>
                            <td class="label tip-left" title="Reward - Tx Cost">
                                Possible Gain:
                            </td>
                            <td class="value gain"></td>
                        </tr>
                        <tr>
                            <td class="label tip-left" title="If the Task is no longer available by the time your transaction
                            is mined, you may lose this amount.">
                                Possible Loss:
                            </td>
                            <td class="value risk"></td>
                        </tr>
                        <tr>
                            <td colspan="2" style="text-align: center;">
                                <button>Execute Task</button>
                                <div class="status-ctnr"></div>
                            </td>
                        </tr>
                    </table>
                </div>
            `);
            const _$reward = _$e.find(".reward");
            const _$txCost = _$e.find(".tx-cost");
            const _$gain = _$e.find(".gain");
            const _$risk = _$e.find(".risk");
            const _$execute = _$e.find("button");
            const _$status = _$e.find(".status-ctnr");
            const _$values = _$e.find(".value");

            var _detailsFn;
            var _isPending;
            const _refreshDebounced = util.debounce(250, _refresh);

            const _gps = util.getGasPriceSlider(5);
            _gps.$head.hide();
            _gps.$e.appendTo(_$e.find(".gps-ctnr"));
            _gps.onChange(_refreshDebounced);
            tippy(_$e.find(".tip-left").addClass("tip").toArray(), {placement: "left"});

            this.$e = _$e;
            this.setDetailsFn = (detailsFn) => {
                _loading();
                _detailsFn = detailsFn;
                _gps.refresh().then(_refreshDebounced).catch(_refreshDebounced);
            };
            this.isPending = () => _isPending;

            var _cancelPrevPromise = ()=>{};
            function _refresh() {
                _cancelPrevPromise();
                var cancelled = false;
                _cancelPrevPromise = () => cancelled = true;

                _loading();
                _detailsFn().then(obj => {
                    if (cancelled) return;
                    _enable();
                    _$execute.removeAttr("disabled");
                    // fill in values
                    const gasPrice = _gps.getValue();
                    const waitTimeMs = (_gps.getWaitTimeS() || 60) * 1000;
                    const cost = gasPrice.mul(obj.estGas);
                    const gain = obj.reward.minus(cost);
                    const risk = obj.riskGas.mul(gasPrice);
                    _$reward.text(eth(obj.reward));
                    _$txCost.text(`${eth(cost)} (${obj.estGas} gas)`);
                    _$gain.text(`${eth(gain)}`);
                    _$risk.text(`${eth(risk)}`);
                    // rebind execute button
                    _$execute.unbind("click").bind("click", ()=>{
                        try {
                            _execute(obj.execute({gasPrice: gasPrice}), waitTimeMs);
                        } catch (e) {
                            ethStatus.open();
                        }
                    })
                });
            }

            function _execute(txPromise, waitTimeMs) {
                _disable(true);
                _isPending = true;
                util.$getTxStatus(txPromise, {
                    waitTimeMs: waitTimeMs,
                    onSuccess: (res, txStatus) => {
                        const error = res.events.find(ev => ev.name=="TaskError");
                        const success = res.events.find(ev => ev.name=="RewardSuccess");
                        const failure = res.events.find(ev => ev.name=="RewardFailure");
                        if (error) {
                            txStatus.addFailureMsg(`The Task was not completed: ${error.args.msg}`);
                        } else if (failure) {
                            txStatus.addFailureMsg(`The Task was completed, but TaskManager could not reward you: ${failure.args.msg}`);
                        } else {
                            const ethStr = eth(success.args.reward);
                            txStatus.addSuccessMsg(`The Task was completed, and you were rewarded ${ethStr}.`);
                        }
                    },
                    onClear: () => { _isPending = false; _enable(); _refresh(); }
                }).appendTo(_$status);
            }

            function _loading() {
                _$values.text("Loading...");
                _disable(false);
            }
            function _disable(alsoDisableGps) {
                _$execute.attr("disabled", "disabled");
                if (alsoDisableGps) _gps.enable(false);
            }
            function _enable() {
                _$execute.removeAttr("disabled");
                _gps.enable(true);
            }
        }
    }
    function _refreshTasks() {
        const $e = $(".cell.tasks");
        const $error = $e.find("> .error").hide();

        $e.find(".fields td > .value").text("Loading...");
        return Promise.obj({
            issueDividend: tm.issueDividendReward(),
            sendMonarchy: tm.sendProfitsReward([Loader.addressOf("MONARCHY_CONTROLLER")]),
            sendInstaDice: tm.sendProfitsReward([Loader.addressOf("INSTA_DICE")]),
            sendVideoPoker: tm.sendProfitsReward([Loader.addressOf("VIDEO_POKER")]),
            startGame: tm.startMonarchyGameReward(),
            endGame: tm.refreshMonarchyGamesReward(),
        }).then(doRefresh).catch(e => {
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            [
                [".issue-dividend", obj.issueDividend],
                [".send-monarchy-profits", obj.sendMonarchy],
                [".send-instadice-profits", obj.sendInstaDice],
                [".send-videopoker-profits", obj.sendVideoPoker],
            ].forEach(arr => {
                const reward = arr[1][0];
                const profits = arr[1][1];
                const $el = $e.find(arr[0]);
                const profitStr = profits.gt(0)
                    ? `${eth(profits)}`
                    : "Not Needed."
                const rewardStr = profits.gt(0)
                    ? ` (${eth(reward)} reward)`
                    : "";
                profits.gt(0) ? $el.addClass("available") : $el.removeClass("available");
                $el.text(`${profitStr}${rewardStr}`)
            });

            if (obj.startGame[1].gt(0)){
                const rewardStr = `(${eth(obj.startGame[0])} reward)`;
                $e.find(".start-monarchy-game").text(`Game #${obj.startGame[1]} ${rewardStr}`).addClass("available");
            } else {
                $e.find(".start-monarchy-game").text(`Not Needed.`).removeClass("available");
            }

            if (obj.endGame[1].gt(0)) {
                const rewardStr = `(${eth(obj.endGame[0])} reward)`;
                $e.find(".end-monarchy-game").text(`${obj.endGame[1]} games ${rewardStr}`).addClass("available");
            } else {
                $e.find(".end-monarchy-game").text(`Not Needed.`).removeClass("available");
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
        // event MonarchyRewardsChanged(uint time, address indexed admin, uint startReward, uint endReward);

        // event SendProfitsSuccess(uint time, address indexed bankrollable, uint profitsSent);
        // event MonarchyGameStarted(uint time, address indexed addr, uint initialPrize);
        // event MonarchyGamesRefreshed(uint time, uint numEnded, uint feesCollected);
        
        // event TaskError(uint time, address indexed caller, string msg);
        // event RewardSuccess(uint time, address indexed caller, uint reward);
        // event RewardFailure(uint time, address indexed caller, uint reward, string msg);

        // event BankrollAdded(uint time, address indexed bankroller, uint amount, uint bankroll);
        // event BankrollRemoved(uint time, address indexed bankroller, uint amount, uint bankroll);
        const formatters = {
            admin: Loader.linkOf,
            startReward: (val) => util.toEthStr(val),
            endReward: (val) => util.toEthStr(val),
            newValue: (val) => `${val.div(100).toFixed(2)}%`,
            bankrollable: (val) => Loader.linkOf(val),
            addr: (val) => $(`<a href="/games/viewmonarchy.html#${val}" target="_blank"></a>`).text(`Game`),
            initialPrize: (val) => util.toEthStr(val),
            feesCollected: (val) => util.toEthStr(val),
            caller: (val) => util.$getShortAddrLink(val),
            treasury: (val) => Loader.linkOf(val),
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
            "Tasks": [true, ["IssueDividendSuccess", "SendProfitsSuccess", "MonarchyGameStarted", "MonarchyGamesRefreshed"]],
            "Settings": [true, ["SendProfitsRewardChanged", "MonarchyRewardsChanged"]],
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

