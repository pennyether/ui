Loader.require("token")
.then(function(token){
    _initBalance();
    _initTransfer();
    _initApprove();
    ethUtil.onStateChanged(()=>{
        _refreshAll();
    });

    function _refreshAll(){
        _refreshBalance();
        _refreshTransfer();
        _refreshApprove();
    }

    function _initBalance() {
        const $e = $(".cell.balance");
        const $btn = $e.find(".btn-collect");
        util.gasifyButton($btn, obj => {
            $btn.attr("disabled", "disabled");
            util.$getTxStatus(token.collectOwedDividends([], {gasPrice: obj.gasPrice}), {
                onSuccess: (res, txStatus) => {
                    const collected = res.events.find(ev => ev.name == "CollectedDividends");
                    if (collected) {
                        const ethStr = util.toEthStr(collected.args.amount);
                        const $link = Loader.linkOf(collected.args.account);
                        const $temp = $("<div></div>").append(`Sent ${ethStr} to `).append($link);
                        txStatus.addSuccessMsg($temp);
                    } else {
                        txStatus.addFailureMsg(`No dividends were collected.`);
                    }
                },
                onClear: () => { $btn.removeAttr("disabled"); }
            }).appendTo($e.find(".status-ctnr"));
        });
    }
    function _refreshBalance() {
        const $e = $(".cell.balance");
        const $notAvailable = $e.find(".body > .not-available").hide();
        const $noAccountFieldset = $e.find("fieldset.has-account");
        const account = ethUtil.getCurrentAccount();
        if (!account) {
            $notAvailable.show();
            $noAccountFieldset.attr("disabled", "disabled");
            return;
        } else {
            $noAccountFieldset.removeAttr("disabled", "disabled");
        }

        const $fieldset = $e.find("fieldset.has-dividends");
        const $balance = $e.find(".balance").text("Loading...");
        const $divs = $e.find(".dividends").text("Loading...");
        Promise.obj({
            balance: token.balanceOf([account]),
            divs: token.getOwedDividends([account])
        }).then(obj => {
            $balance.text(util.toEthStr(obj.balance, "PENNY"));
            $divs.text(util.toEthStr(obj.divs, "PENNY"));
            if (obj.divs.gt(0)) {
                $fieldset.removeAttr("disabled");
            } else {
                $fieldset.attr("disabled", "disabled");
            }
        }).catch(e => {
            $balance.text(`Error: ${e.message}`);
            $divs.text(`Error: ${e.message}`);
        });
    }

    function _initTransfer() {
        const $e = $(".cell.transfer");
        const $btn = $e.find(".btn-transfer");
        const $addrInput = util.$getAddressInput(_validateInputs);
        $addrInput.appendTo($e.find(".address-ctnr"));
        const $value = $e.find(".input-value").on("input", _validateInputs);

        function _validateInputs() {
            const validAddr = $addrInput.isValid();
            var validValue;
            try {
                new BigNumber($value.val());
                validValue = true;
            } catch (e) {
                validValue = false;
            }
            if (!validAddr || !validValue) $btn.attr("disabled", "disabled");
            else $btn.removeAttr("disabled");
        }

        const $fieldset = $e.find("fieldset.is-ready");
        util.gasifyButton($btn, obj => {
            const address = $addrInput.getValue();
            const value = (new BigNumber($value.val())).mul(1e18);
            const promise = token.transfer({_to: address, _value: value}, {gasPrice: obj.gasPrice})

            $fieldset.attr("disabled", "disabled");
            util.$getTxStatus(promise, {
                onSuccess: (res, txStatus) => {
                    const transfer = res.events.find(ev => ev.name == "Transfer");
                    if (transfer) {
                        const amountStr = util.toEthStr(transfer.args.amount, "PENNY");
                        const $to = Loader.linkOf(transfer.args.to);
                        const $temp = $("<div></div>").append(`Sent ${amountStr} to `).append($to);
                        txStatus.addSuccessMsg($temp);
                    } else {
                        txStatus.addFailureMsg(`No "Transfer" event was emitted.`);
                    }
                },
                onClear: () => { $fieldset.removeAttr("disabled"); }
            }).appendTo($e.find(".status-ctnr"));
        });
    }
    function _refreshTransfer() {
        const $e = $(".cell.transfer");
        const $notAvailable = $e.find(".body > .not-available").hide();
        const $noAccountFieldset = $e.find("fieldset.has-account");
        const account = ethUtil.getCurrentAccount();
        if (!account) {
            $notAvailable.show();
            $noAccountFieldset.attr("disabled", "disabled");
            return;
        } else {
            $noAccountFieldset.removeAttr("disabled", "disabled");
        }
    }

    function _initApprove() {
        const $e = $(".cell.approve");

        (function initApprove(){
            const $approveCtnr = $e.find(".approve-ctnr");
            const $btn = $approveCtnr.find(".btn-approve");
            const $addrInput = util.$getAddressInput(_validateInputs);
            $addrInput.appendTo($approveCtnr.find(".address-ctnr"));
            const $value = $approveCtnr.find(".input-value").on("input", _validateInputs);

            function _validateInputs() {
                const validAddr = $addrInput.isValid();
                var validValue;
                try {
                    new BigNumber($value.val());
                    validValue = true;
                } catch (e) {
                    validValue = false;
                }
                if (!validAddr || !validValue) $btn.attr("disabled", "disabled");
                else $btn.removeAttr("disabled");
            }

            const $fieldset = $e.find("fieldset.is-ready");
            util.gasifyButton($btn, obj => {
                const address = $addrInput.getValue();
                const value = (new BigNumber($value.val())).mul(1e18);
                const promise = token.approve({_spender: address, _value: value}, {gasPrice: obj.gasPrice})

                $fieldset.attr("disabled", "disabled");
                util.$getTxStatus(promise, {
                    onSuccess: (res, txStatus) => {
                        const approval = res.events.find(ev => ev.name == "Approval");
                        if (approval) {
                            const amountStr = util.toEthStr(approval.args.amount, "PENNY");
                            const $spender = Loader.linkOf(approval.args.spender);
                            const $temp = $("<div></div>")
                                .append(`Allowing `).append($spender).append(` to spend ${amountStr}`);
                            txStatus.addSuccessMsg($temp);
                        } else {
                            txStatus.addFailureMsg(`No "Approval" event was emitted.`);
                        }
                    },
                    onClear: () => { $fieldset.removeAttr("disabled"); }
                }).appendTo($e.find(".status-ctnr"));
            });
        }());
        
        (function initView(){
            const $viewCtnr = $e.find(".view-ctnr");
            const $addrInput = util.$getAddressInput(_refresh);
            $addrInput.appendTo($viewCtnr.find(".address-ctnr"));
            const $value = $viewCtnr.find(".approval-value");

            function _refresh() {
                const account = ethUtil.getCurrentAccount();
                const addr = $addrInput.getValue();
                if (addr == null || account == null) {
                    $value.text("--");
                    return;
                }

                $value.text("Loading...")
                token.allowance([account, addr]).then(amt => $value.text(util.toEthStr(amt, "PENNY")));
            }
        }());
    }
    function _refreshApprove() {
        const $e = $(".cell.approve");
        const $notAvailable = $e.find(".body > .not-available").hide();
        const $noAccountFieldset = $e.find("fieldset.has-account");
        const account = ethUtil.getCurrentAccount();
        if (!account) {
            $notAvailable.show();
            $noAccountFieldset.attr("disabled", "disabled");
            return;
        } else {
            $noAccountFieldset.removeAttr("disabled", "disabled");
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
            "Tasks": [true, ["IssueDividendSuccess", "SendProfitsSuccess", "PennyAuctionStarted", "PennyAuctionsRefreshed"]],
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