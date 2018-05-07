Loader.waitFor(() => {
    return AJAX("/global/snippets/topology.html").then(html => {
        $(".topology-ctnr").html(html);
    });
});

Loader.require("comp", "tr", "token", "tm", "monarchy", "dice", "vp")
.then(function(comp, tr, token, tm, monarchy, dice, vp){
    ethUtil.onStateChanged(state => {
        refreshAll();
    });

    function refreshAll() {
        // arrows ///////////////////////////////////////////////////
        const eth = {type: "eth", showDelta: true, flashOnDelta: true};
        const penny = {type: "eth", unit: "PENNY", showDelta: true, flashOnDelta: true};
        const num = {type: "number", showDelta: true, flashOnDelta: true};
        const str = {flashOnDelta: true};
        topology.trCapitalRaised(tr.capitalRaised(), eth);
        topology.trDividends(tr.profitsSent(), eth);
        topology.trCapitalRaised(tr.capitalRaised(), eth);
        topology.tokenTotalSupply(token.totalSupply(), penny);
        topology.tokenTotalCollected(token.dividendsCollected(), eth);
        topology.tmRewardsPaid(tm.totalRewarded(), eth);

        // balances
        topology.compBalance(ethUtil.getBalance(comp), eth);
        topology.trBalance(ethUtil.getBalance(tr), eth);
        topology.tokenBalance(ethUtil.getBalance(token), eth);
        topology.monarchyBalance(ethUtil.getBalance(token), eth);
        topology.diceBalance(ethUtil.getBalance(dice), eth);
        topology.vpBalance(ethUtil.getBalance(vp), eth);
        topology.tmBalance(ethUtil.getBalance(tm), eth);

        // bankrolled amounts
        tr.capitalLedger().then(ledgerAddr => {
            topology.monarchyBankrolled(tr.capitalAllocatedTo([monarchy.address]), eth);
            topology.diceBankrolled(tr.capitalAllocatedTo([dice.address]), eth);
            topology.vpBankrolled(tr.capitalAllocatedTo([vp.address]), eth);
            topology.tmBankrolled(tr.capitalAllocatedTo([tm.address]), eth);
        });

        // profits of each game
        topology.monarchyProfits(monarchy.profitsSent(), eth);
        topology.diceProfits(dice.profitsSent(), eth);
        topology.vpProfits(vp.profitsSent(), eth);
        
        // task manager arrows
        [
            [monarchy.address, topology.monarchySendProfits],
            [dice.address, topology.diceSendProfits],
            [vp.address, topology.vpSendProfits]
        ].forEach(obj => {
            const addr = obj[0];
            const fn = obj[1];
            tm.sendProfitsReward([addr]).then(arr => {
                const reward = arr[0];
                const profits = arr[1];
                const rewardStr = profits.lte(0)
                    ? "Not needed."
                    : `${util.toEthStrFixed(reward, 3)} reward`
                fn(rewardStr, str);
            });
        });

        [
            ["startMonarchyGameReward", topology.monarchyStartGame],
            ["refreshMonarchyGamesReward", topology.monarchyEndGame],
            ["issueDividendReward", topology.trIssueDividend]
        ].forEach(arr => {
            tm[arr[0]]().then(res => {
                const reward = res[0];
                const rewardStr = reward.lte(0)
                    ? "Not needed."
                    : `${util.toEthStrFixed(reward, 3)} reward`;
                arr[1](rewardStr, str);
            })
        });
        ///////////////////////////////////////////////////////////////

        // values for each item //////////////////////////////////////
        // comptroller
        Promise.all([
            comp.dateSaleStarted(),
            comp.wasSaleStarted(),
            comp.wasSaleEnded()
        ]).then(arr => {
            const dateStarted = arr[0];
            const wasStarted = arr[1];
            const wasEnded = arr[2];
            const $e = $(".crowdsale .value");
            if (dateStarted.equals(0)) {
                $e.text("No Date Set.");
                return;
            } else if (wasEnded) {
                $e.text("Ended.");
            } else if (wasStarted) {
                const dateStr = util.toDateStr(dateStarted, {second: null});
                $e.text(`Started (${dateStr})`);
            } else {
                const dateStr = util.toDateStr(dateStarted, {second: null});
                $e.text(dateStr);
            }
        })

        // Treasury
        topology.trCapAvailable(tr.capital(), eth);
        topology.trCapNeeded(tr.capitalNeeded(), eth);
        topology.trProfits(tr.profits(), eth);
        topology.trNumRequests(tr.numPendingRequests(), eth);

        // PENNY
        topology.tokenIsFrozen(token.isFrozen(), str)
        topology.tokenDivsReceived(token.dividendsTotal(), eth);
        topology.tokenDivsCollected(token.dividendsCollected(), eth);

        // MONARCHY
        topology.monarchyActiveGames(monarchy.numActiveGames(), num);
        topology.monarchyEndedGames(monarchy.numEndedGames(), num);
        topology.monarchyDefinedGames(monarchy.numDefinedGames(), num);
        topology.monarchyCurProfits(monarchy.profits(), eth);

        // ID
        topology.diceNumRolls(dice.numRolls(), num);
        topology.diceTotalWagered(dice.totalWagered(), eth);
        topology.diceCurProfits(dice.profits(), eth);
        Promise.all([
            dice.curMaxBet(),
            dice.maxBet()
        ]).then(arr => {
            const max = BigNumber.min(arr[0], arr[1]);
            topology.diceCurMaxBet(max, eth);
        });

        // VP
        topology.vpNumGames(vp.curId(), num);
        topology.vpTotalWagered(vp.totalWagered(), eth);
        topology.vpCurProfits(vp.profits(), eth);
        Promise.all([
            vp.curMaxBet(),
            vp.maxBet()
        ]).then(arr => {
            const max = BigNumber.min(arr[0], arr[1]);
            topology.vpCurMaxBet(max, eth);
        });

        // Task Manager
        topology.tmIssueDividendReward(tm.issueDividendRewardBips().then(val=>{
            return `${val.div(100).toFixed(2)}%`
        }), str);
        topology.tmSendProfitsReward(tm.sendProfitsRewardBips().then(val => {
            return `${val.div(100).toFixed(2)}%`;
        }), str);
        topology.tmPaStartReward(tm.monarchyStartReward(), eth);
        topology.tmPaEndReward(tm.monarchyEndReward(), eth);
        ///////////////////////////////////////////////////////////////
    }
});

