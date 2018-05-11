Loader.require("tm", "dice", "vp", "monarchy", "tr")
.then(function(tm, dice, vp, monarchy, tr){
    _initGovernance();
    _initTaskManager();
    _initInstaDice();
    _initMonarchy();
    _initVideoPoker();

    ethUtil.onStateChanged(()=>{
        setIsAdmin();
    });

    function setIsAdmin(){
        const $notAdmin = $(".bubble.not-admin").hide();
        const $fieldset = $("fieldset.is-admin");
        const account = ethUtil.getCurrentAccount();
        const isAdmin = account && Loader.nameOf(account)=="ADMIN";
        if (!isAdmin) {
            $notAdmin.show();
            $fieldset.attr("disabled", "disabled");
        } else {
            $fieldset.removeAttr("disabled", "disabled");
        }
    }

    function makeFinances(instance) {
        const $e = $(`
            <div class="finances">
                <div class="header">
                    Whitelist
                </div>
                <fieldset class="is-admin">
                    <div class="whitelist">
                        <center>
                            <table class="table">
                                <tr>
                                    <td><input type="text" class="txt-new-addr address"></td>
                                    <td><button class="btn-add-whitelist">Add</td></td>
                                </tr>
                            </table>
                        </center>
                    </div>
                </div>
                <div class="header">
                    Bankroll
                </div>
                <div style="text-align: center;">
                    <input type="text" class="txt-bankroll">ETH <button class="btn-add-bankroll">Add</button>
                    <br>
                    <input type="text" class="txt-bankroll-rm">ETH <button class="btn-remove-bankroll">Remove</button>
                </div>
            </div>
        `);
        const $btnAddWhitelist = $e.find(".btn-add-whitelist");
        const $txtNewAddr = $e.find(".txt-new-addr");
        const $btnAddBankroll = $e.find(".btn-add-bankroll");
        const $txtBankroll = $e.find(".txt-bankroll");
        const $btnRemoveBankroll = $e.find(".btn-remove-bankroll");
        const $txtBankrollRm = $e.find(".txt-bankroll-rm");

        const account = ethUtil.getCurrentAccount();
        if (account) {
            instance.bankrolledBy([account]).then(amt => {
                $txtBankrollRm.val(amt.div(1e18));
            });
        }

        instance.whitelist().then(addr => {
            const wl = AddressSet.at(addr);
            wl.addresses().then(arr => {
                const $table = $e.find(".whitelist table");
                if (arr.length == 0) {
                    $table.prepend($("<tr><td colspan=2>No Entries (all addresses whitelisted)</td></tr>"));
                    return;
                }
                arr.forEach(addr => {
                    const $tr = $(`
                        <tr>
                            <td class="address"></td>
                            <td><button>Remove</button></td>
                        </tr>`
                    ).prependTo($table);
                    $tr.find(".address").append(Loader.linkOf(addr));
                    const $button = $tr.find("button");
                    makeTxButton($button, (obj)=>{
                        return removeFromWhitelist(obj, addr, $button);
                    });
                });
            });
        })

        function removeFromWhitelist(obj, addr, $btn) {
            try {
                const promise = instance.removeFromWhitelist({_addr: addr}, {gasPrice: obj.gasPrice, gas: 50000});
                $btn.attr("disabled", "disabled");
                return util.$getTxStatus(promise, {
                    waitTimeMs: obj.waitTimeS * 1000,
                    onSuccess: (res, txStatus) => {
                        const ev = res.events.find(ev => ev.name=="RemovedFromWhitelist");
                        if (ev) {
                            const addr = ev.args.addr;
                            txStatus.addSuccessMsg(`Removed ${addr} from whitelist.`);
                        } else {
                            txStatus.addFailureMsg(`Did not add anything (already added?)`);
                        }
                    },
                    onClear: () => {
                        $btn.removeAttr("disabled");
                    }
                });
            } catch (e) {
                return $("<div></div>").text(`Error: ${e.message}`);
            }
        }

        makeTxButton($btnAddWhitelist, (obj)=>{
            try {
                const addr = $txtNewAddr.val();
                const promise = instance.addToWhitelist({_addr: addr}, {gasPrice: obj.gasPrice});
                $btnAddWhitelist.attr("disabled", "disabled");
                return util.$getTxStatus(promise, {
                    waitTimeMs: obj.waitTimeS * 1000,
                    onSuccess: (res, txStatus) => {
                        const ev = res.events.find(ev => ev.name=="AddedToWhitelist");
                        if (ev) {
                            const addr = ev.args.addr;
                            txStatus.addSuccessMsg(`Added ${addr} to whitelist.`);
                        } else {
                            txStatus.addFailureMsg(`Did not add anything (already added?)`);
                        }
                    },
                    onClear: () => {
                        $btnAddWhitelist.removeAttr("disabled");
                    }
                });
            } catch (e) {
                return $("<div></div>").text(`Error: ${e.message}`);
            }
        });

        makeTxButton($btnAddBankroll, (obj)=>{
            try {
                const val = (new BigNumber($txtBankroll.val())).mul(1e18);
                const promise = instance.addBankroll([], {value: val, gasPrice: obj.gasPrice});
                $btnAddBankroll.attr("disabled", "disabled");
                return util.$getTxStatus(promise, {
                    waitTimeMs: obj.waitTimeS * 1000,
                    onSuccess: (res, txStatus) => {
                        // event BankrollAdded(uint time, address indexed bankroller, uint amount, uint bankroll);
                        const ev = res.events.find(ev => ev.name=="BankrollAdded");
                        if (ev) {
                            const ethStr = util.toEthStrFixed(ev.args.amount);
                            txStatus.addSuccessMsg(`Added ${ethStr} to bankroll.`);
                        } else {
                            txStatus.addFailureMsg(`Did not add anything.`);
                        }
                    },
                    onClear: () => {
                        $btnAddBankroll.removeAttr("disabled");
                    }
                });
            } catch (e) {
                return $("<div></div>").text(`Error: ${e.message}`);
            }
        });

        makeTxButton($btnRemoveBankroll, obj => {
            try {
                const val = (new BigNumber($txtBankrollRm.val())).mul(1e18);
                const promise = instance.removeBankroll([val, ""], {gasPrice: obj.gasPrice});
                $btnAddBankroll.attr("disabled", "disabled");
                return util.$getTxStatus(promise, {
                    waitTimeMs: obj.waitTimeS * 1000,
                    onSuccess: (res, txStatus) => {
                        const ev = res.events.find(ev => ev.name=="BankrollRemoved");
                        if (ev) {
                            const ethStr = util.toEthStrFixed(ev.args.amount);
                            txStatus.addSuccessMsg(`Removed ${ethStr} from bankroll.`);
                        } else {
                            txStatus.addFailureMsg(`Did not add anything.`);
                        }
                    },
                    onClear: () => {
                        $btnAddBankroll.removeAttr("disabled");
                    }
                });
            } catch (e) {
                return $("<div></div>").text(`Error: ${e.message}`);
            }
        })

        return $e;
    }

    // gasify's button, and puts TxStatus after it (if provided)
    // invokes getTxStatusFn with obj: {gasPrice, waitTimeS}
    function makeTxButton($button, getTxStatusFn) {
        util.gasifyButton($button, (obj) => {
            const $e = getTxStatusFn(obj);
            if ($e) $e.css("margin","5px").insertAfter($button);
        });
    }

    function _initGovernance(){
        const $e = $(".cell.governance");

        makeTxButton($e.find(".btn-create"), create);
        makeTxButton($e.find(".btn-add-capital"), addCapital);

        function getPendingRequests() {
            return tr.numPendingRequests().then(num => {
                const promises = [];
                for (var i=0; i<num; i++) {
                    promises.push(tr.pendingRequestIds([i]));
                }
                return Promise.all(promises);
            }).then(reqIds => {
                return Promise.all(reqIds.map(rId => tr.getRequest([rId])));
            }).then(reqs => {
                return reqs.map(arr => {
                    return {
                        id: arr[0], typeId: arr[1], target: arr[2], value: arr[3],
                        executedSuccessfully: arr[4],
                        dateCreated: arr[5], dateCancelled: arr[6], dateExecuted: arr[7],
                        createdMsg: arr[8], cancelledMsg: arr[9], executedMsg: arr[10]
                    }
                });
            });
        }

        const $template = $e.find(".request.template").detach();
        const $ctnr = $e.find(".requests-ctnr");
        Promise.obj({
            blocktime: ethUtil.getCurrentBlockTime(),
            requests: getPendingRequests()
        }).then(obj => {
            const types = {0: "Send Capital", 1: "Recall Capital", 2: "Raise Capital"};
            obj.requests.forEach(request => {
                const $req = $template.clone().removeClass("template hide").appendTo($ctnr);
                $req.data("request-id", request.id);
                $req.find(".summary").text(request.createdMsg);
                $req.find(".type").text(types[request.typeId]);
                $req.find(".target").append(Loader.linkOf(request.target));
                $req.find(".value").text(util.toEthStrFixed(request.value));
                const timeExecutable = request.dateCreated.plus(24*60*60*7);
                const timeleft = BigNumber.max(obj.blocktime.minus(timeExecutable), 0);
                if (timeleft.gt(0)) {
                    $req.find(".time-left").text(util.toTime(timeleft));
                    // $req.find(".btn-execute").attr("disabled", "disabled");
                } else {
                    $req.find(".time-left").text("Executable now.");
                }
            });
            $ctnr.find(".btn-execute").toArray().forEach(btn => {
                makeTxButton($(btn), obj => execute(btn, obj));
            });
            $ctnr.find(".btn-cancel").toArray().forEach(btn => {
                const $btn = $(btn);
                makeTxButton($btn, obj => cancel(btn, obj))
            });
            if (obj.requests.length == 0) {
                $ctnr.append("<div style='text-align:center'>There are no pending requests.</div>");
            }
        });

        function execute(btn, obj) {
            const $button = $(btn);
            const $request = $button.closest(".request");
            const params = {
                _id: $request.data("request-id")
            };

            // append statusRow to this row.
            const promise = tr.executeRequest(params, {gasPrice: obj.gasPrice});
            $button.closest("td").find("button").attr("disabled", "disabled");
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="RequestExecuted");
                    if (ev) {
                        const id = ev.args.id;
                        const successStr = ev.args.success ? "successfully" : "with failure";
                        const msg = ev.args.msg;
                        txStatus.addSuccessMsg(`Request #${id} executed ${successStr}: "${msg}"`);
                    } else {
                        txStatus.addFailureMsg(`No event found.`);
                    }
                },
                onClear: () => {
                    $button.closest("td").find("button").removeAttr("disabled");
                }
            });
        }
        function cancel(btn, obj) {
            const $button = $(btn);
            const $request = $button.closest(".request");
            const params = {
                _id: $request.data("request-id"),
                _msg: $button.closest("td").find(".cancel-msg").val()
            };

            // append statusRow to this row.
            const promise = tr.cancelRequest(params, {gasPrice: obj.gasPrice, gas: 100000});
            $button.closest("td").find("button").attr("disabled", "disabled");
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="RequestCancelled");
                    if (ev) {
                        const id = ev.args.id;
                        txStatus.addSuccessMsg(`Request #${id} cancelled.`);
                    } else {
                        txStatus.addFailureMsg(`No event found.`);
                    }
                },
                onClear: () => {
                    $button.closest("td").find("button").removeAttr("disabled");
                }
            });
        }
        function create(obj) {
            const inputs = $e.find(".create-request").find("input,select").toArray();
            const params = {};
            inputs.forEach(el => {
                params[$(el).data("param")] = $(el).val();
            });
            params._value = (new BigNumber(params._value)).mul(1e18);

            const promise = tr.createRequest(params, {gasPrice: obj.gasPrice});
            $e.find(".btn-create").attr("disabled", "disabled");
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="RequestCreated");
                    if (ev) {
                        const id = ev.args.id;
                        txStatus.addSuccessMsg(`Request #${id} created.`);
                    } else {
                        txStatus.addFailureMsg(`No event found.`);
                    }
                },
                onClear: () => {
                    $e.find(".btn-create").removeAttr("disabled");
                }
            });
        }
        function addCapital(obj) {
            try {
                const $btn = $e.find(".btn-add-capital");
                const val = (new BigNumber($e.find(".txt-capital").val())).mul(1e18);
                const promise = tr.addCapital([], {value: val, gasPrice: obj.gasPrice});
                $btn.attr("disabled", "disabled");
                return util.$getTxStatus(promise, {
                    waitTimeMs: obj.waitTimeS * 1000,
                    onSuccess: (res, txStatus) => {
                        //event CapitalAdded(uint time, address indexed sender, uint amount);
                        const ev = res.events.find(ev => ev.name=="CapitalAdded");
                        if (ev) {
                            const ethStr = util.toEthStrFixed(ev.args.amount);
                            txStatus.addSuccessMsg(`Added ${ethStr} to Treasury Capital.`);
                        } else {
                            txStatus.addFailureMsg(`Did not add anything.`);
                        }
                    },
                    onClear: () => {
                        $btn.removeAttr("disabled");
                    }
                });
            } catch (e) {
                return $("<div></div>").text(`Error: ${e.message}`);
            }
        }
    }

    function _initTaskManager(){
        const $e = $(".cell.task-manager");
        const $issueBips = $e.find(".issue-bips");
        const $sendProfitsBips = $e.find(".send-profits-bips");
        const $startMonarchyGame = $e.find(".start-monarchy-game");
        const $endMonarchyGame = $e.find(".end-monarchy-game");

        makeFinances(tm).appendTo($e.find(".finances-ctnr"));

        makeTxButton($e.find(".btn-div-reward"), (obj) => {
            const val = new BigNumber($issueBips.val());
            const promise = tm.setIssueDividendReward([val], {gasPrice: obj.gasPrice});
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="IssueDividendRewardChanged");
                    if (ev) txStatus.addSuccessMsg(`Value changed to: ${ev.args.newValue}`);
                    else txStatus.addFailureMsg(`No event found.`);
                    _refreshTaskManager();
                }
            });
        });

        makeTxButton($e.find(".btn-send-profits-reward"), (obj) => {
            const val = new BigNumber($sendProfitsBips.val());
            const promise = tm.setSendProfitsReward([val], {gasPrice: obj.gasPrice});
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="SendProfitsRewardChanged");
                    if (ev) txStatus.addSuccessMsg(`Value changed to: ${ev.args.newValue}`);
                    else txStatus.addFailureMsg(`No event found.`);
                    _refreshTaskManager();
                }
            });
        });

        makeTxButton($e.find(".btn-pa-rewards"), (obj) => {
            const startReward = (new BigNumber($startMonarchyGame.val())).mul(1e18);
            const endReward = (new BigNumber($endMonarchyGame.val())).mul(1e18);
            const promise = tm.setMonarchyRewards([startReward, endReward], {gasPrice: obj.gasPrice});
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="MonarchyRewardsChanged");
                    if (ev) {
                        const startStr = util.toEthStrFixed(ev.args.startReward);
                        const endStr = util.toEthStrFixed(ev.args.endReward);
                        txStatus.addSuccessMsg(`Values changed. Start reward: ${startStr}, End Reward: ${endStr}`);
                    } else {
                        txStatus.addFailureMsg(`No event found.`);
                    }
                    _refreshTaskManager();
                }
            });
        });
        _refreshTaskManager();
    }
    function _refreshTaskManager(){
        const $e = $(".cell.task-manager");
        util.bindToInput(tm.issueDividendRewardBips(), $e.find(".issue-bips"));
        util.bindToInput(tm.sendProfitsRewardBips(), $e.find(".send-profits-bips"));
        util.bindToInput(tm.monarchyStartReward().then(val => val.div(1e18)), $e.find(".start-monarchy-game"));
        util.bindToInput(tm.monarchyEndReward().then(val => val.div(1e18)), $e.find(".end-monarchy-game"));
    }


    function _initMonarchy() {
        const $e = $(".cell.monarchy");
        refreshMonarchy();

        makeFinances(monarchy).appendTo($e.find(".finances-ctnr"));

        // draw all items in the table as text inputs
        function refreshMonarchy() {
            const $tbody = $e.find(".table tbody").empty();
            getDefinedGames().then(arr => {
                arr.push({
                    index: arr.length+1,
                    isNew: true,
                    summary: "",
                    initialPrize: new BigNumber(0),
                    fee: new BigNumber(0),
                    prizeIncr: new BigNumber(0),
                    reignBlocks: new BigNumber(0),
                    initialBlocks: new BigNumber(0),
                })
                arr.forEach(game => {
                    function getCell(paramName, val, units) {
                        return $("<td></td>").append(
                            $("<input type=text>")
                                .val(val)
                                .data("param-name", paramName)
                        ).append(units).addClass(paramName);
                    }

                    const $row = $("<tr></tr>").data("index", game.index).appendTo($tbody);
                    $row.append($("<td></td>").text(game.index));
                    $row.append($("<td></td>").text(game.isNew ? "--" : game.isEnabled));
                    $row.append(getCell("_summary", game.summary));
                    $row.append(getCell("_initialPrize", game.initialPrize.div(1e18), "ETH"));
                    $row.append(getCell("_fee", game.fee.div(1e18), "ETH"));
                    $row.append(getCell("_prizeIncr", game.prizeIncr.div(1e18), "ETH"));
                    $row.append(getCell("_reignBlocks", game.reignBlocks, "Blocks"));
                    $row.append(getCell("_initialBlocks", game.initialBlocks, "Blocks"));
                    if (!game.isNew) {
                        $row.append(
                            $("<td style='text-align:center;'></td>")
                                .append("<button class='btn-save'>Save</button>")
                        );
                        $row.append(
                            $("<td style='text-align:center;'></td>")
                                .append(
                                    $("<button></button>").text(game.isEnabled ? "disable" : "enable")
                                        .addClass("btn-enable")
                                        .data("enable-bool", !game.isEnabled)
                                )
                            );
                    } else {
                        $row.append(
                            $("<td colspan=2 style='text-align:center;'></td>")
                                .append("<button class='btn-save'>Create</button>")
                        );
                    }
                });


                // todo: set up save buttons
                $tbody.find(".btn-save").toArray().forEach(btn => {
                    makeTxButton($(btn), (obj) => save(btn, obj));
                });
                $tbody.find(".btn-enable").toArray().forEach(btn => {
                    makeTxButton($(btn), (obj) => enable(btn, obj));
                })

                function save(btn, obj) {
                    const $button = $(btn);
                    const $row = $button.closest("tr");
                    const $inputs = $row.find("input")

                    // construct params
                    const params = {_index: $row.data("index")};
                    $inputs.toArray().forEach(el => {
                        params[$(el).data("param-name")] = $(el).val();
                    });
                    params._initialPrize = (new BigNumber(params._initialPrize)).mul(1e18);
                    params._fee = (new BigNumber(params._fee)).mul(1e18);
                    params._prizeIncr = (new BigNumber(params._prizeIncr)).mul(1e18);

                    // append statusRow to this row.
                    const $statusRow = $("<tr><td colspan=10></td></tr>").insertAfter($row);
                    const promise = monarchy.editDefinedGame(params, {gasPrice: obj.gasPrice});
                    $inputs.attr("disabled", "disabled");
                    $button.attr("disabled", "disabled");
                    util.$getTxStatus(promise, {
                        waitTimeMs: obj.waitTimeS * 1000,
                        onSuccess: (res, txStatus) => {
                            const ev = res.events.find(ev => ev.name=="DefinedGameEdited");
                            if (ev) {
                                txStatus.addSuccessMsg(`Defined game #${ev.args.index} was edited.`);
                            } else {
                                txStatus.addFailureMsg(`No event found.`);
                            }
                        },
                        onClear: () => {
                            $statusRow.remove();
                            $inputs.removeAttr("disabled");
                            $button.removeAttr("disabled");
                        }
                    }).appendTo($statusRow.find("td"));
                }

                function enable(btn, obj) {
                    const $button = $(btn);
                    const $row = $button.closest("tr");

                    // construct params
                    const params = {
                        _index: $row.data("index"),
                        _bool: $button.data("enable-bool")
                    };

                    // append statusRow to this row.
                    const $statusRow = $("<tr><td colspan=10></td></tr>").insertAfter($row);
                    const promise = monarchy.enableDefinedGame(params, {gasPrice: obj.gasPrice, gas: 50000});
                    $button.attr("disabled", "disabled");
                    util.$getTxStatus(promise, {
                        waitTimeMs: obj.waitTimeS * 1000,
                        onSuccess: (res, txStatus) => {
                            const ev = res.events.find(ev => ev.name=="DefinedGameEnabled");
                            if (ev) {
                                const enabledStr = ev.args.isEnabled ? "enabled" : "disabled";
                                txStatus.addSuccessMsg(`Defined game #${ev.args.index} has been ${enabledStr}.`);
                            } else {
                                txStatus.addFailureMsg(`No event found.`);
                            }
                        },
                        onClear: () => {
                            $statusRow.remove();
                            $button.removeAttr("disabled");
                        }
                    }).appendTo($statusRow.find("td"));
                }
            });
        }

        function getDefinedGames(){
            return monarchy.numDefinedGames().then(num => {
                const promises = [];
                for (var i=1; i<=num; i++) {
                    let index = i;
                    promises.push(monarchy.definedGames([index]).then(arr => {
                        return {
                            index: index,
                            isEnabled: arr[1],
                            summary: arr[2],
                            initialPrize: arr[3],
                            fee: arr[4],
                            prizeIncr: arr[5],
                            reignBlocks: arr[6],
                            initialBlocks: arr[7],
                        };
                    }));
                }
                return Promise.all(promises);
            });
        }
    }


    function _initInstaDice(){
        const $e = $(".cell.insta-dice");
        const $houseFee = $e.find(".house-fee");
        const $minBet = $e.find(".min-bet");
        const $maxBet = $e.find(".max-bet");
        const $minNum = $e.find(".min-num");
        const $maxNum = $e.find(".max-num");

        makeFinances(dice).appendTo($e.find(".finances-ctnr"));
        
        makeTxButton($e.find(".btn-update"), (obj) => {
            const promise = dice.changeSettings({
                _feeBips: new BigNumber($houseFee.val()),
                _minBet: (new BigNumber($minBet.val())).mul(1e18),
                _maxBet: (new BigNumber($maxBet.val())).mul(1e18),
                _minNumber: new BigNumber($minNum.val()),
                _maxNumber: new BigNumber($maxNum.val())
            }, {gasPrice: obj.gasPrice});
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="SettingsChanged");
                    if (ev) txStatus.addSuccessMsg(`Settings changed.`);
                    else txStatus.addFailureMsg(`No event found.`);
                    _refreshInstaDice();
                }
            });
        });
        _refreshInstaDice();
    }
    function _refreshInstaDice(){
        const $e = $(".cell.insta-dice");
        util.bindToInput(dice.feeBips(), $e.find(".house-fee"));
        util.bindToInput(dice.minBet().then(v=>v.div(1e18)), $e.find(".min-bet"));
        util.bindToInput(dice.maxBet().then(v=>v.div(1e18)), $e.find(".max-bet"));
        util.bindToInput(dice.minNumber(), $e.find(".min-num"));
        util.bindToInput(dice.maxNumber(), $e.find(".max-num"));
    }


    function _initVideoPoker(){
        const $e = $(".cell.video-poker");
        const $minBet = $e.find(".min-bet");
        const $maxBet = $e.find(".max-bet");
        const $ptId = $e.find(".pt-id");

        makeFinances(vp).appendTo($e.find(".finances-ctnr"));

        makeTxButton($e.find(".btn-update"), (obj) => {
            const promise = vp.changeSettings({
                _minBet: (new BigNumber($minBet.val())).mul(1e18),
                _maxBet: (new BigNumber($maxBet.val())).mul(1e18),
                _payTableId: $ptId.val()
            }, {gasPrice: obj.gasPrice});
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="SettingsChanged");
                    if (ev) txStatus.addSuccessMsg(`Settings changed.`);
                    else txStatus.addFailureMsg(`No event found.`);
                    _refreshInstaDice();
                }
            });
        });

        // makes a new pay-table from the input fields.
        // this assumes the DOM order is the same as params order.
        makeTxButton($e.find(".btn-new"), (obj) => {
            const vals = $e.find(".pay-tables tbody input.payout")
                .toArray().map(el => new BigNumber($(el).val()));
            const promise = vp.addPayTable({
                _rf: vals[0], _sf: vals[1], _foak: vals[2], _fh: vals[3],
                _fl: vals[4], _st: vals[5], _toak: vals[6], _tp: vals[7], _jb: vals[8]
            }, {gasPrice: obj.gasPrice});
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="PayTableAdded");
                    if (ev) {
                        txStatus.addSuccessMsg(`Added paytable #${ev.args.payTableId}`);
                    } else {
                        txStatus.addFailureMsg("No event found.");
                    }
                    refreshPayTables();
                }
            });
        });

        function refreshPayTables() {
            function getPayTables() {
                return vp.numPayTables().then(count => {
                    const promises = [];
                    for (var i=0; i<count; i++) {
                        promises.push(vp.getPayTable([i]));
                    }
                    return Promise.all(promises);
                });
            }

            return getPayTables().then(payTables => {
                // update head row
                const $headRow = $(`<tr><td>Id:</td></tr>`)
                    .appendTo($(".pay-tables thead").empty());
                payTables.forEach((pt, i) => $headRow.append(`<td>${i}</td>`));

                // update body
                const $tbody = $e.find(".pay-tables tbody").empty();
                const transpose = payTables[0].map((_, i) => payTables.map(row => row[i]));
                transpose.forEach((row, rank) => {
                    if (rank < 1 || rank > 9) return;
                    const $row = $("<tr></tr>").appendTo($tbody).addClass(`rank-${rank}`);
                    const name = PokerUtil.Hand.getRankString(rank);
                    $row.append($("<td></td>").text(name));

                    row.forEach((val, ptId) => {
                        $("<td></td>")
                            .text(`${val} x`)
                            .addClass(`paytable-${ptId}`)
                            .appendTo($row);
                    });
                });

                // add "new" column
                (function(){
                    $headRow.append("<td>New</td>");
                    payTables[0].forEach((val, rank) => {
                        if (rank < 1 || rank > 9) return;
                        const $input = $(`<input type=text class='payout'/>`)
                            .val(val)
                            .data("rank", rank);
                        $tbody.find(`tr.rank-${rank}`)
                            .append($("<td></td>").append($input).append("x"));
                    });
                }());
            });
        }

        refreshPayTables().then(_refreshVideoPoker);
    }
    function _refreshVideoPoker(){
        const $e = $(".cell.video-poker");
        util.bindToInput(vp.minBet().then(v=>v.div(1e18)), $e.find(".min-bet"));
        util.bindToInput(vp.maxBet().then(v=>v.div(1e18)), $e.find(".max-bet"));
        util.bindToInput(vp.curPayTableId(), $e.find(".pt-id"));
        vp.curPayTableId().then(id => {
            $e.find(".pay-tables td").removeClass("selected");
            $e.find(`.pay-tables .paytable-${id}`).addClass("selected");
        })
    }
});