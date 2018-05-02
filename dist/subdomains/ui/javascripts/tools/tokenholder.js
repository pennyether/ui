Loader.require("token")
.then(function(token){
    _initBalance();
    _initTransfer();
    _initApprove();
    _initView();
    ethUtil.onStateChanged(()=>{
        _refreshAll();
    });

    // do this just once
    ethUtil.getCurrentState().then(() => {
        token.getEvents("Created").then(arr => {
            return arr[0].blockNumber;
        }).then(creationBlockNum => {
            _initEventLog(creationBlockNum);
        });
    });

    function _refreshAll(){
        _refreshBalance();
        _refreshTransfer();
        _refreshApprove();
        _refreshEventLog();
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
        const $account = $e.find(".account");
        const $balance = $e.find(".balance");
        const $divs = $e.find(".dividends")

        const account = ethUtil.getCurrentAccount();
        if (!account) {
            $notAvailable.show();
            $noAccountFieldset.attr("disabled", "disabled");
            [$account, $balance, $divs].forEach(_ => _.text("--"));
            return;
        } else {
            $noAccountFieldset.removeAttr("disabled", "disabled");
        }

        const $fieldset = $e.find("fieldset.has-dividends");
        [$account, $balance, $divs].forEach(_ => _.text("Loading..."));
        Promise.obj({
            balance: token.balanceOf([account]),
            divs: token.getOwedDividends([account])
        }).then(obj => {
            $account.empty().append(util.$getShortAddrLink(account));
            $balance.text(util.toEthStr(obj.balance, "PENNY"));
            $divs.text(util.toEthStr(obj.divs, "PENNY"));
            if (obj.divs.gt(0)) {
                $fieldset.removeAttr("disabled");
            } else {
                $fieldset.attr("disabled", "disabled");
            }
        }).catch(e => {
            console.error(`Error loading Balance details`, e);
            [$account, $balance, $divs].forEach(_ => _.text(`Error Loading`));
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
                const promise = token.approve({_spender: address, _value: value}, {gasPrice: obj.gasPrice});

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
            const $fieldset = $viewCtnr.find("fieldset.is-ready");
            const $value = $viewCtnr.find(".approval-value");

            function _refresh() {
                const account = ethUtil.getCurrentAccount();
                const addr = $addrInput.getValue();
                if (addr == null || account == null) {
                    $value.text("--");
                    return;
                }

                $fieldset.attr("disabled","disabled");
                $value.text("Loading...");
                Promise.obj({
                    amt: token.allowance([account, addr])
                }).then(obj => {
                    $value.text(util.toEthStr(obj.amt, "PENNY"))
                }).finally(() => $fieldset.removeAttr("disabled"));
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

    function _initView() {
        const $e = $(".cell.view");
        const $addrInput = util.$getAddressInput(_refresh);
        $addrInput.appendTo($e.find(".address-ctnr"));
        const $fieldset = $e.find("fieldset.is-ready");
        const $balance = $e.find(".balance");
        const $divs = $e.find(".dividends");

        function _refresh() {
            const account = ethUtil.getCurrentAccount();
            const addr = $addrInput.getValue();
            if (addr == null || account == null) {
                $balance.text("--");
                $divs.text("--");
                return;
            }

            $fieldset.attr("disabled", "disabled");
            $balance.text("Loading...")
            $divs.text("Loading...");
            Promise.obj({
                balance: token.balanceOf([account]),
                divs: token.getOwedDividends([account])
            }).then(obj => {
                $balance.text(util.toEthStr(obj.balance, "PENNY"));
                $divs.text(util.toEthStr(obj.divs, "PENNY"));
            }).finally(() => $fieldset.removeAttr("disabled"));
        }
    }
    
    // sets it up so clicking the radio button toggles between an account and yourself
    function _initEventLog(creationBlockNum) {
        // <div style="text-align: center;">
        //     <label>
        //         <input class="mine" type="radio" name="which-account" selected> My account
        //     </label>
        //     <label>
        //         <input class="other" type="radio" name="which-account">
        //         <div class="other-value" style="display: inline-block;">
        //     </label>
        // </div>
        // <div class="event-ctnr"></div>
        const $e = $(".cell.events");
        const $mine = $e.find(".mine").change(onChange); 
        const $other = $e.find(".other").change(onChange);
        const $addrInput = util.$getAddressInput(onChange);
        $addrInput
            .appendTo($e.find(".address-ctnr"))
            .find("input").focus(() => {
                // for some reason clicking input causes label to not select radio.
                // ok, whatever.
                $other.prop("checked",true)
                onChange();
            });
        const $logViewer = $e.find(".log-viewer");

        var account;
        function onChange() {
            account = $mine.is(":checked")
                ? ethUtil.getCurrentAccount()
                : $addrInput.getValue();
            lv.reset(false);
            lv.enable(!!account);
        }

        const events = buildEvents();   // event filters reference "account"
        var lv = util.getLogViewer({
            events: events,
            order: "newest",
            minBlock: creationBlockNum
        });
        lv.$e.appendTo($logViewer);


        // This builds events, setting the filter to "account" variable.
        //  Since logViewer doesnt do a deep copy, this will update things.
        function buildEvents() {
            // event Created(uint time);
            // event Transfer(address indexed from, address indexed to, uint amount);
            // event Approval(address indexed owner, address indexed spender, uint amount);
            // event AllowanceUsed(address indexed owner, address indexed spender, uint amount);
            // event TokensMinted(uint time, address indexed account, uint amount, uint newTotalSupply);
            // event CollectedDividends(uint time, address indexed account, uint amount);
            const formatters = {
                from: (val) => Loader.linkOf(val),
                to: (val) => Loader.linkOf(val),
                owner: (val) => Loader.linkOf(val),
                spender: (val) => Loader.linkOf(val),
                account: (val) => Loader.linkOf(val),
                amount: (val) => util.toEthStr(val, "PENNY"),
                newTotalSupply: (val) => util.toEthStr(val, "PENNY"),
            };

            // This hack relies on LogViewer calling .toString() on all filters.
            const _account = {
                toString: function(){ return account; }
            };
            const labels = {
                "Transfer Out": [true, [ ["Transfer", {from: _account}] ]],
                "Transfer In": [true, [ ["Transfer", {to: _account}] ]],
                "Minted Tokens": [true, [ ["TokensMinted", {account: _account}] ]],
                "Gave Approval": [true, [ ["Approval", {owner: _account}], ["AllowanceUsed", {owner: _account}] ]],
                "Received Approval": [true, [ ["Approval", {spender: _account}], ["AllowanceUsed", {spender: _account}] ]],
                "Collected Dividends": [true, [ ["CollectedDividends", {account: _account}] ]]
            };

            const events = [];
            Object.keys(labels).forEach(groupName => {
                const selected = labels[groupName][0];
                const eventDefs = labels[groupName][1];
                eventDefs.forEach(eventDef => {
                    const name = eventDef[0];
                    const filter = eventDef[1];
                    events.push({
                        instance: token,
                        name: name,
                        filter: filter,
                        formatters: formatters,
                        label: groupName,
                        selected: selected
                    });
                })
            });
            return events;
        }
    }

    function _refreshEventLog() {
        const $e = $(".cell.events");
        const $mine = $e.find(".mine"); 
        const $other = $e.find(".other");
        const account = ethUtil.getCurrentAccount();
        if (!account) {
            $mine.attr("disabled", "disabled");
            $other.click();
        } else {
            $mine.removeAttr("disabled");
        }
    }
    
});