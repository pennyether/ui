Loader.require("tm", "dice", "vp")
.then(function(tm, dice, vp){
    _initTaskManager();
    _initInstaDice();
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

    function makeTxButton($button, getTxStatusFn) {
        util.gasifyButton($button, (obj) => {
            getTxStatusFn(obj).insertAfter($button).css("margin","5px");
        });
    }

    function _initTaskManager(){
        const $e = $(".cell.task-manager");
        const $issueBips = $e.find(".issue-bips");
        const $sendProfitsBips = $e.find(".send-profits-bips");
        const $startMonarchyGame = $e.find(".start-monarchy-game");
        const $endMonarchyGame = $e.find(".end-monarchy-game");

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
            const promise = tm.setPaRewards([startReward, endReward], {gasPrice: obj.gasPrice});
            return util.$getTxStatus(promise, {
                waitTimeMs: obj.waitTimeS * 1000,
                onSuccess: (res, txStatus) => {
                    const ev = res.events.find(ev => ev.name=="PennyAuctionRewardsChanged");
                    if (ev) {
                        const startStr = util.toEthStrFixed(ev.args.paStartReward);
                        const endStr = util.toEthStrFixed(ev.args.paEndReward);
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
        util.bindToInput(tm.paStartReward().then(val => val.div(1e18)), $e.find(".start-monarchy-game"));
        util.bindToInput(tm.paEndReward().then(val => val.div(1e18)), $e.find(".end-monarchy-game"));
    }


    function _initInstaDice(){
        const $e = $(".cell.insta-dice");
        const $houseFee = $e.find(".house-fee");
        const $minBet = $e.find(".min-bet");
        const $maxBet = $e.find(".max-bet");
        const $minNum = $e.find(".min-num");
        const $maxNum = $e.find(".max-num");
        
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

        refreshPayTables().then(_refreshVideoPoker);

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
                        const $cell = $("<td></td>")
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

        _refreshVideoPoker();
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