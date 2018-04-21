Loader.waitFor(() => {
    return AJAX("/snippets/topology.html").then(html => {
        $(".topology-ctnr").html(html);
    });
});

Loader.require("comp", "tr", "token", "tm", "monarchy", "dice", "vp")
.then(function(comp, tr, token, tm, monarchy, dice, vp){
    // arrows ///////////////////////////////////////////////////
    util.bindToElement(tr.capitalRaised().then(util.toEthStr), $(".tr-capital-raised"));
    util.bindToElement(tr.profitsSent().then(util.toEthStr), $(".tr-dividends"));
    util.bindToElement(token.totalSupply().then(val => util.toEthStr(val, "PENNY")), $(".token-total-supply"));
    util.bindToElement(token.dividendsCollected().then(util.toEthStr), $(".token-total-collected"));
    util.bindToElement(tm.totalRewarded().then(util.toEthStr), $(".tm-rewards-paid"))

    // bankrolled amounts
    tr.capitalLedger().then(ledgerAddr => {
        util.bindToElement(tr.capitalAllocatedTo([monarchy.address]).then(util.toEthStr), $(".monarchy-bankrolled"));
        util.bindToElement(tr.capitalAllocatedTo([dice.address]).then(util.toEthStr), $(".dice-bankrolled"));
        util.bindToElement(tr.capitalAllocatedTo([vp.address]).then(util.toEthStr), $(".vp-bankrolled"));
        util.bindToElement(tr.capitalAllocatedTo([tm.address]).then(util.toEthStr), $(".tm-bankrolled"));
    });

    // profits of each game
    util.bindToElement(monarchy.profitsSent().then(util.toEthStr), $(".monarchy-profits"));
    util.bindToElement(dice.profitsSent().then(util.toEthStr), $(".dice-profits"));
    util.bindToElement(vp.profitsSent().then(util.toEthStr), $(".vp-profits"));

    // task manager arrows
    [
        [monarchy.address, $(".monarchy-send-profits")],
        [dice.address, $(".dice-send-profits")],
        [vp.address, $(".vp-send-profits")]
    ].forEach(obj => {
        const addr = obj[0];
        const $e = obj[1];
        tm.sendProfitsReward([addr]).then(arr => {
            const reward = arr[0];
            const profits = arr[1];
            if (profits.lte(0)) {
                $e.text("Not needed.")
            } else {
                $e.text(`${util.toEthStrFixed(reward, 3)} reward`);
            }
        });
    });

    [
        ["startMonarchyGameReward", ".monarchy-start-game"],
        ["refreshMonarchyGamesReward", ".monarchy-end-game"],
        ["issueDividendReward", ".tr-issue-dividend"]
    ].forEach(arr => {
        tm[arr[0]]().then(res => {
            const reward = res[0];
            if (reward.lte(0)) $(arr[1]).text("Not needed.");
            else $(arr[1]).text(`${util.toEthStrFixed(reward, 3)} reward`);
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
    util.bindToElement(tr.capital().then(util.toEthStr), $(".tr-cap-available"));
    util.bindToElement(tr.capitalNeeded().then(util.toEthStr), $(".tr-cap-needed"));
    util.bindToElement(tr.profits().then(util.toEthStr), $(".tr-profits"));
    util.bindToElement(tr.numPendingRequests(), $(".tr-num-requests"));

    // PENNY
    //util.bindToElement(token.totalSupply().then(util.toEthStr), $(".token-total-supply"));
    util.bindToElement(token.isFrozen(), $(".token-is-frozen"));
    util.bindToElement(token.dividendsTotal().then(util.toEthStr), $(".token-divs-received"));
    util.bindToElement(token.dividendsCollected().then(util.toEthStr), $(".token-divs-collected"));
    

    // MONARCHY
    util.bindToElement(monarchy.numActiveGames(), $(".monarchy-active-games"));
    util.bindToElement(monarchy.numEndedGames(), $(".monarchy-ended-games"));
    util.bindToElement(monarchy.numDefinedGames(), $(".monarchy-defined-games"));
    util.bindToElement(monarchy.profits().then(util.toEthStr), $(".monarchy-cur-profits"));

    // ID
    util.bindToElement(dice.curId(), $(".dice-num-rolls"));
    util.bindToElement(dice.totalWagered().then(util.toEthStr), $(".dice-total-wagered"));
    util.bindToElement(dice.profits().then(util.toEthStr), $(".dice-cur-profits"));
    Promise.all([
        dice.curMaxBet(),
        dice.maxBet()
    ]).then(arr => {
        const max = util.toEthStr(BigNumber.min(arr[0], arr[1]));
        $(".dice-cur-max-bet").text(max);
    })

    // VP
    util.bindToElement(vp.curId(), $(".vp-num-games"))
    util.bindToElement(vp.totalWagered().then(util.toEthStr), $(".vp-total-wagered"));
    util.bindToElement(vp.profits().then(util.toEthStr), $(".vp-cur-profits"));
    Promise.all([
        vp.curMaxBet(),
        vp.maxBet()
    ]).then(arr => {
        const max = util.toEthStr(BigNumber.min(arr[0], arr[1]));
        $(".vp-cur-max-bet").text(max);
    });

    // Task Manager
    util.bindToElement(ethUtil.getBalance(tm).then(util.toEthStr), $(".tm-balance"))
    util.bindToElement(tm.issueDividendRewardBips().then(val => {
        return `${val.div(100).toFixed(2)}%`
    }), $(".tm-issue-dividend-reward"))
    util.bindToElement(tm.sendProfitsRewardBips().then(val => {
        return `${val.div(100).toFixed(2)}%`;
    }), $(".tm-send-profits-reward"));
    util.bindToElement(tm.monarchyStartReward().then(util.toEthStr), $(".tm-pa-start-reward"));
    util.bindToElement(tm.monarchyEndReward().then(util.toEthStr), $(".tm-pa-end-reward"));
    ///////////////////////////////////////////////////////////////
});

