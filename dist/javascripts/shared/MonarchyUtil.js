(function(){
    (function(){
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .monarch-overthrow-occurred a.player-link {
                color: blue;
            }
            .monarch-overthrow-occurred .decree .value {
                color: gray;
                font-style: italic;
            }
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
    }());

    function getDecreeStr(bytes23) {
        try { return web3.toUtf8(bytes23); }
        catch (e) { return "<invalid decree>"; }
    }

    function $getEventSummary(event, showGame, showUser) {
        if (event.name == "OverthrowOccurred") {
            return $getOverthrowSummary(event, showGame);
        } else if (event.name == "OverthrowRefundSuccess" || event.name == "OverthrowRefundFailure") {
            return $getRefundSummary(event, showUser);
        } else if (event.name == "SendPrizeSuccess" || event.name == "SendPrizeFailure") {
            return $getSendPrizeSummary(event, showUser);
        } else {
            throw new Error(`MonarchyUtil cannot display event: ${event.name}`);
        }
    }

    function $getOverthrowSummary(event, showGame) {
        if (showGame === undefined) showGame = true;
        if (event.name !== "OverthrowOccurred") throw new Error(`Must be passed OverthrowOccurred event.`);
        const $newMonarch = nav.$getPlayerLink(event.args.newMonarch);
        const $oldMonarch = nav.$getPlayerLink(event.args.prevMonarch);
        const decree = getDecreeStr(event.args.decree);
        const $el = $(`
            <div class='monarch-overthrow-occurred'>
                <div class='game-details'">
                    <span class='game'>
                        <span class='label'>Game: </span>
                        <span class='value'></span>
                    </span>
                    <span class='fee'>
                        <span class='label'>Fee: </span>
                        <span class='value'></span>
                    </span>
                </div>
                <div class='overthrow'></div>
                <div class='decree'>
                    <span class='label'>Decree: </span>
                    <span class='value'></span>
                </div>
            </div>
        `);
        $el.find(".game .value").append(nav.$getMonarchyGameLink(event.address));
        $el.find(".fee .value").text(util.toEthStrFixed(event.args.fee));
        $el.find(".overthrow").append($newMonarch).append(" overthrew ").append($oldMonarch);
        $el.find(".decree .value").text(`"${decree}"`);
        if (!showGame) $el.find(".game-details").hide();
        if (decree.length == 0) $el.find(".decree").hide();
        return $el;
    }

    function $getRefundSummary(event, showUser) {
        if (showUser === undefined) showUser = true;
        const success = event.name == "OverthrowRefundFailure";
        const failure = event.name == "OverthrowRefundSuccess";
        if (!success && !failure) throw new Error(`Must be passed a success or failure event.`);
        
        const successStr = success ? "Successfully refunded" : "Unsuccessfully refunded";
        const $el = $(`
            <div class='monarch-overthrow-occurred'>
                <div class='game-details'">
                    <span class='game'>
                        <span class='label'>Game: </span>
                        <span class='value'></span>
                    </span>
                </div>
                <div class='summary'>
                    <span class='result'></span>
                    <span class='user'></span>
                    <span class='value'></span>
                </div>
            </div>
        `);
        $el.find(".game .value").append(nav.$getMonarchyGameLink(event.address));
        $el.find(".user").append(nav.$getPlayerLink(event.args.recipient));
        if (!showUser) $el.find(".user").hide();
        $el.find(".summary .result").text(successStr);
        $el.find(".summary .value").text(util.toEthStrFixed(event.args.amount));
        return $el;
    }

    function $getSendPrizeSummary(event, showUser) {
        if (showUser === undefined) showUser = true;
        const success = event.name == "SendPrizeSuccess";
        const failure = event.name == "SendPrizeFailure";
        if (!success && !failure) throw new Error(`Must be passed a success or failure event.`);
        
        const successStr = success ? "Successfully sent" : "Failed to send";
        const $el = $(`
            <div class='monarch-overthrow-occurred'>
                <div class='game-details'">
                    <span class='game'>
                        <span class='label'>Game: </span>
                        <span class='value'></span>
                    </span>
                </div>
                <div class='summary'>
                    <span class='result'></span>
                    <span class='user'></span>
                    <span class='value'></span>
                </div>
            </div>
        `);
        $el.find(".game .value").append(nav.$getMonarchyGameLink(event.address));
        $el.find(".user").append(nav.$getPlayerLink(event.args.recipient));
        if (!showUser) $el.find(".user").hide();
        $el.find(".summary .result").text(successStr);
        $el.find(".summary .value").text(util.toEthStrFixed(event.args.amount));
        return $el;
    }

    window.MonarchyUtil = {
        getDecreeStr: getDecreeStr,
        $getOverthrowSummary: $getOverthrowSummary,
        $getEventSummary: $getEventSummary
    };
}())