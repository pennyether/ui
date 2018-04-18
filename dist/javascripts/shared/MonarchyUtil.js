(function(){
    (function(){
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
            .monarch-value {
                display: inline-block;
            }
            .monarch-value img {
                height: 1em;
                margin-right: .5em;
                vertical-align: text-bottom;
            }
                .monarch-value a {
                    color: blue;
                }

            .overthrow-summary .monarch-value a {
                color: blue;
            }
            .overthrow-summary .decree .value {
                color: gray;
                font-style: italic;
            }
        `;
        document.getElementsByTagName('head')[0].appendChild(style);
    }());


    function $getGameLink(txId) {
        return $("<a></a>")
            .text(txId.slice(0, 4) + "..." + txId.slice(-4))
            .attr("href", `/games/view-monarchy-game.html#${txId}`);
    }
    function $getMonarch(monarch) {
        const $el = $("<div class='monarch-value'></div>");
        // get monarch link
        const $monarchLink = util.$getShortAddrLink(monarch);
        if (ethUtil.getCurrentAccount() === monarch) $monarchLink.text("You");
        // get gravatar
        const gravatarId = monarch.slice(2, 34);
        const $monarchImg = $("<img></img>").attr(`src`, `https://www.gravatar.com/avatar/${gravatarId}?d=retro`)
        return $el.append($monarchImg).append($monarchLink);
    }
    function getDecreeStr(bytes23) {
        try { return web3.toUtf8(bytes23); }
        catch (e) { return "<invalid decree>"; }
    }

    function $getEventSummary(event) {
        if (event.name == "OverthrowOccurred") {
            return $getOverthrowSummary(event, true, true);
        } else if (event.name == "OverthrowRefundSuccess" || event.name == "OverthrowRefundFailure") {
            return $getRefundSummary(event);
        } else if (event.name == "SendPrizeSuccess" || event.name == "SendPrizeFailure") {
            return $getSendPrizeSummary(event);
        } else {
            throw new Error(`MonarchyUtil cannot display event: ${event.name}`);
        }
    }
    function $getOverthrowSummary(event, fromUser) {
        if (event.name !== "OverthrowOccurred") throw new Error(`Must be passed OverthrowOccurred event.`);
        const $newMonarch = fromUser ? "User" : $getMonarch(event.args.newMonarch);
        const $oldMonarch = $getMonarch(event.args.prevMonarch);
        const decree = getDecreeStr(event.args.decree);
        const $el = $(`
            <div class='overthrow-summary'>
                <div class='top' style="display: none;">
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
        $el.find(".game .value").append($getGameLink(event.address));
        $el.find(".fee .value").text(util.toEthStrFixed(event.args.fee));
        $el.find(".overthrow").append($newMonarch).append(" overthrew ").append($oldMonarch);
        $el.find(".decree .value").text(`"${decree}"`);
        if (fromUser) $el.find(".top").show();
        if (decree.length == 0) $el.find(".decree").hide();
        return $el;
    }
    function $getRefundSummary(event) {
        const success = event.name == "OverthrowRefundFailure";
        const failure = event.name == "OverthrowRefundSuccess";
        if (!success && !failure) throw new Error(`Must be passed a success or failure event.`);
        const feeStr = util.toEthStrFixed(event.args.fee);
        const successStr = success ? "Successfully refunded" : "Unsuccessfully refunded";
        return $("<div class='refund-summary'></div>")
            .append($("<div></div>").append("Game: ").append($getGameLink(event.address)))
            .append(`${successStr} ${feeStr} for reason ${event.args.msg}.`);
    }
    function $getSendPrizeSummary(event) {
        const success = event.name == "SendPrizeSuccess";
        const failure = event.name == "SendPrizeFailure";
        if (!success && !failure) throw new Error(`Must be passed a success or failure event.`);
        const amountStr = util.toEthStrFixed(event.args.amount);
        const successStr = success ? "Successfully sent prize" : "Unsuccessfully sent prize";
        return $("<div class='refund-summary'></div>")
            .append($("<div></div>").append("Game: ").append($getGameLink(event.address)))
            .append(`${successStr} of ${amountStr}.`);
    }

    window.MonarchyUtil = {
        $getMonarch: $getMonarch,
        getDecreeStr: getDecreeStr,
        $getOverthrowSummary: $getOverthrowSummary,
        $getEventSummary: $getEventSummary
    };
}())