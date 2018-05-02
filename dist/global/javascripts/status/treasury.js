Loader.require("reg", "comp", "tr", "token")
.then(function(reg, comp, tr, token){
    _initGovernance();
    _initProfits();

    ethUtil.getCurrentState().then(() => {
        _refreshAll();  
    });

    function _refreshAll() {
        return Promise.all([
            _refreshCapitalAllocation(),
            _refreshFundingStatus(),
            _refreshGovernance(),
            _refreshProfits(),
            _refreshTotalProfits(),
        ]).then(()=>{
            tr.getEvents("Created").then(arr => {
                return arr[0].blockNumber;
            }).then(creationBlockNum => {
                _initEventLog(creationBlockNum);
                Promise.all([
                    ethUtil.getBlock(creationBlockNum),
                    _niceWeb3.ethUtil.getAverageBlockTime(),
                ]).then(arr => {
                    _initTotalProfits(arr[0], arr[1]);
                });
            });
        });
    }

    function _refreshCapitalAllocation() {
        const $e = $(".allocation");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        // returns array of all items in ledger as {addr, allocated, recallable}
        function getAllocations() {
            return tr.capitalLedger().then(l => {
                return Ledger.at(l).balances();
            }).then(data => {
                const addresses = data[0];
                const balances = data[1];
                const allocationPromises = addresses.map((addr,i) => {
                    return Bankrollable.at(addr).bankrollAvailable().then(avail => {
                        return {
                            addr: addr,
                            allocated: balances[i],
                            recallable: avail
                        };
                    });
                });
                return Promise.all(allocationPromises);
            });
        }

        return Promise.obj({
            capital: tr.capital(),
            allocations: getAllocations()
        }).then(doRefresh).then(() => {
            $loading.hide();
            $doneLoading.show();
        }, e => {
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
            throw e;
        });

        function doRefresh(obj) {
            const $capAvailable = $e.find(".cap-available");
            const $capAllocated = $e.find(".cap-allocated");
            const $capRecallable = $e.find(".cap-recallable");
            const $capTotal = $e.find(".cap-total");
            const $tbody = $e.find(".table tbody");

            const capAllocated = obj.allocations.reduce((cur, alloc) => {
                return cur.plus(alloc.allocated);
            }, new BigNumber(0));
            const capRecallable = obj.allocations.reduce((cur, alloc) => {
                return cur.plus(alloc.recallable);
            }, new BigNumber(0));
            function format(v){ return util.toEthStr(v, ""); }

            $capAvailable.text(format(obj.capital));
            $capAllocated.text(format(capAllocated));
            $capRecallable.text(format(capRecallable));
            $capTotal.text(format(obj.capital.plus(capRecallable)));

            obj.allocations.forEach(alloc => {
                const $link = Loader.linkOf(alloc.addr);
                const allocated = util.toEthStr(alloc.allocated);
                const recallable = util.toEthStr(alloc.recallable);
                $(`<tr><td></td><td>${allocated}</td><td>${recallable}</td></tr>`)
                    .appendTo($tbody)
                    .find("td").eq(0).append($link);
            });
        }
    }

    function _refreshFundingStatus() {
        const $e = $(".funding-status");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            capitalRaised: tr.capitalRaised(),
            capitalTarget: tr.capitalRaisedTarget(),
            capitalNeeded: tr.capitalNeeded()
        }).then(doRefresh).then(() => {
            $loading.hide();
            $doneLoading.show();
        }, e => {
            console.warn(e);
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            const $met = $e.find(".met").hide();
            const $notmet = $e.find(".not-met").hide();
            const bars = [{
                $e: $e.find(".target"),
                val: obj.capitalTarget
            }, {
                $e: $e.find(".raised"),
                val: obj.capitalRaised
            }, {
                $e: $e.find(".needed"),
                val: obj.capitalNeeded
            }];

            // show values
            bars.forEach(bar => bar.$e.find(".txt").text(util.toEthStr(bar.val)));

            // show bars
            const max = bars.reduce((cur, bar) => {
                return BigNumber.max(cur, bar.val);
            }, new BigNumber(0));
            if (max.equals(0)) {
                bars.forEach(bar => bar.$e.find(".amt").width(0));
            } else {
                const pct = (val) => val.div(max).mul(100).toFixed(2);
                bars.forEach(bar => bar.$e.find(".amt").width(`${pct(bar.val)}%`));
            }

            // show bubble
            if (obj.capitalTarget.gt(obj.capitalRaised)) {
                $notmet.show();
            } else {
                $met.show();
            }
        }
    }

    function _initGovernance() {
        $(".cell.governance select").change(_refreshGovernance);
    }
    function _refreshGovernance() {
        const $e = $(".governance");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        const state = $e.find("select").val().toLowerCase();
        const getNumFn = () => {
            if (state=="all") return tr.curRequestId();
            if (state=="pending") return tr.numPendingRequests();
            if (state=="executed") return tr.numCompletedRequests();
            if (state=="cancelled") return tr.numCancelledRequests();
            throw new Error(`Unknown request state: ${state}`);
        };
        const getRequestFn = (index) => {
            if (state=="all") return tr.getRequest([index+1]);
            if (state=="pending") return tr.pendingRequestIds([index]).then((id)=>tr.getRequest([id]))
            if (state=="executed") return tr.completedRequestIds([index]).then((id)=>tr.getRequest([id]))
            if (state=="cancelled") return tr.cancelledRequestIds([index]).then((id)=>tr.getRequest([id]))
            throw new Error(`Unknown request state: ${state}`);
        };

        var requests = [];
        return getNumFn().then(num => {
            const end = num - 1;
            const start = Math.max(end - 5, 0);
            const pArr = [];
            for (var i=end; i>=start; i--) {
                pArr.push(getRequestFn(i));
            }
            return Promise.all(pArr);
        }).then(pArr => {
            requests = pArr.map(arr => {
                return {
                    id: arr[0], typeId: arr[1], target: arr[2], value: arr[3],
                    executedSuccessfully: arr[4],
                    dateCreated: arr[5], dateCancelled: arr[6], dateExecuted: arr[7],
                    createdMsg: arr[8], cancelledMsg: arr[9], executedMsg: arr[10]
                };
            });
            doRefresh();
        }).then(()=>{
            $loading.hide();
            $doneLoading.show();
        }).catch(e => {
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh() {
            const $template = $e.find(".request.template");
            const $ctnr = $e.find(".requests").empty();

            if (requests.length == 0) {
                $ctnr.text(`There are no ${state} Requests.`);
                return;
            }
            requests.forEach(r => {
                const $e = $template.clone().removeClass("template").show().appendTo($ctnr);
                const type = ({0: "SendCapital", 1: "RecallCapital", 2: "RaiseCapitalTarget"})[r.typeId];
                const status = r.dateExecuted.gt(0)
                    ? "Executed"
                    : r.dateCancelled.gt(0) ? "Cancelled" : "Pending";
                const $target = Loader.linkOf(r.target);
                
                $e.find(".type").text(type);
                if (type == "SendCapital"){
                    $e.find(".to-from").text("to");
                    $e.find(".eth").text(util.toEthStr(r.value));
                } else if (type == "RecallCapital") {
                    $e.find(".to-from").text("from");
                    $e.find(".eth").text(util.toEthStr(r.value));
                } else {
                    $e.find(".to-from").hide();
                    $e.find(".target").hide();
                    $e.find(".eth").text(util.toEthStr(r.value));
                }
                $e.find(".target").empty().append($target);
                $e.find(".description").text(r.createdMsg);
                $e.find(".status").text(status);
                $e.find(".id").text(r.id);
                $e.find(".date-created").text(util.toDateStr(r.dateCreated));
                $e.find(".executed").hide();
                $e.find(".cancelled").hide();
                if (status == "Executed") {
                    $e.find(".executed").show();
                    $e.find(".date-executed").text(util.toDateStr(r.dateExecuted));
                    $e.find(".result").text(r.executedSuccessfully ? "(successfully)" : "(with failure)");
                } else if (status == "Cancelled") {
                    $e.find(".cancelled").show();
                    $e.find(".date-cancelled").text(util.toDateStr(r.dateCancelled));
                    $e.find(".result").text(`Reason: ${r.cancelledMsg}`);
                }
            });
        }
    }

    function _initProfits() {
        $(".cell.profits select").change(_refreshProfits);
    }
    function _refreshProfits() {
        function getTargetBlock(numDays) {
            numDays = Number(numDays);
            const DAY_TO_S = 60*60*24;
            const curTime = ethUtil.getCurrentBlockTime();
            return ethUtil.getBlockNumberAtTimestamp(curTime - numDays*DAY_TO_S, DAY_TO_S);
        }

        const $e = $(".profits");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        const lookbackDays = $e.find("select").val();
        const curBlock = ethUtil.getCurrentBlockHeight().toNumber();
        const targetBlock = lookbackDays == "all"
            ? Promise.resolve(curBlock)
            : getTargetBlock(lookbackDays)

        const bankrollables = Loader.getBankrollables();
        const profits = []; // array of {addr, profits}
        return targetBlock.then((targetBlock)=>{
            return Promise.all(
                // Get current and previous value of `uint profitsSent`.
                // This should be slot #1 for all Bankrollable contracts.
                bankrollables.map(addr => {
                    const cur = Bankrollable.at(addr).profitsSent();
                    const prev = targetBlock==curBlock
                        ? 0
                        : _niceWeb3.ethUtil.getStorageAt(addr, 1, targetBlock);
                    return Promise.all([cur, prev]);
                })
            );
        }).then(arr => {
            arr.forEach((data, i) => {
                const profitsSent = data[0].minus(data[1]);
                profits.push({address: bankrollables[i], profitsSent: profitsSent});
            });
            doRefresh();
        }).then(()=>{
            $loading.hide();
            $doneLoading.show();
        }, e=>{
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh() {
            const $tbody = $e.find(".table tbody").empty();
            profits.forEach(obj => {
                const $link = Loader.linkOf(obj.address);
                const val = util.toEthStr(obj.profitsSent);
                $(`<tr><td></td><td>${val}</td></tr>`)
                    .appendTo($tbody)
                    .find("td").eq(0).append($link);
            });
        }
    }

    
    function _initTotalProfits(creationBlock, avgBlocktime) {
        const minBlock = creationBlock;
        const maxBlock = ethUtil.getCurrentStateSync().latestBlock;

        const $e = $(".total-profits");
        const graph = new EthGraph(_niceWeb3);
        $e.find(".graph-ctnr").append(graph.$e);

        const getProfits = (block) => {
            return tr.profitsTotal([], {defaultBlock: Math.round(block)})
        };
        const getDividends = (block) => {
            return tr.profitsSent([], {defaultBlock: Math.round(block)})
        };

        graph.init({
            sequences: [{
                name: "profits",
                valFn: getProfits,
                showInPreview: true,
                maxPoints: 20,
                color: "blue",
                yScaleHeader: "Profits",
                yTickCount: 3,
                yFormatFn: util.toEthStr,
            },{
                name: "dividends",
                valFn: getDividends,
                showInPreview: true,
                maxPoints: 20,
                color: "navy",
                yScaleHeader: "Dividends",
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
    function _refreshTotalProfits() {
        const $e = $(".total-profits");
        const $loading = $e.find(".loading").show();
        const $error = $e.find(".error").hide();
        const $doneLoading = $e.find(".done-loading").hide();

        return Promise.obj({
            profits: tr.profitsTotal(),
            dividends: tr.profitsSent()
        }).then(doRefresh).then(()=>{
            $loading.hide();
            $doneLoading.show();
        }, e=>{
            $loading.hide();
            $error.show();
            $error.find(".error-msg").text(e.message);
        });

        function doRefresh(obj) {
            $e.find(".profits").text(util.toEthStrFixed(obj.profits, 4, ""));
            $e.find(".dividends").text(util.toEthStrFixed(obj.dividends, 4, ""));
        }
    }

    function _initEventLog(creationBlockNum) {
        const formatters = {
            // ExecuteCapitalAdded / Removed
            bankrollable: (val) => Loader.linkOf(val),
            // CapitalAdded/Removed, ProfitsReceived, 
            sender: (val) => Loader.linkOf(val),
            recipient: (val) => Loader.linkOf(val),
            // DividendSuccess/Failure
            token: (val) => Loader.linkOf(val),
            // All
            amount: (val) => util.toEthStr(val)
        };

        // Create "events" array
        const events = [{
            instance: tr,
            name: "Created"
        }];
        // append to events using labels
        const labels = {
            "Capital": [true, ["CapitalAdded", "CapitalRemoved", "CapitalRaised"]],
            "Profits": [true, ["ProfitsReceived"]],
            "Dividends": [true, ["DividendSuccess", "DividendFailure"]],
            "Governance": [false, ["ExecutedSendCapital", "ExecutedRecallCapital", "ExecutedRaiseCapital"]]
        }
        Object.keys(labels).forEach(groupName => {
            const selected = labels[groupName][0];
            const eventNames = labels[groupName][1];
            eventNames.forEach(eventName => {
                events.push({
                    instance: tr,
                    name: eventName,
                    formatters: formatters,
                    label: groupName,
                    selected: selected
                })
            })
        });

        // create log viewer
        var $lv = util.$getLogViewer({
            events: events,
            order: "newest",
            minBlock: creationBlockNum
        });
        $(".events .events-ctnr").empty().append($lv);
    }
});

