Loader.require("monarchy", "dice", "vp")
.then(function(monarchy, dice, vp){
    var _curAccount;
    const _resetCallbacks = [];

    // initialize the button and address input
    const $button = $(".top button").click(_resetAll);
    const $addressInput = util.$getAddressInput(val => {
        if (!val) $button.attr("disabled", "disabled");
        else $button.removeAttr("disabled");
    });
    $addressInput.appendTo($(".top .address-ctnr"));

    // do this just once
    ethUtil.getCurrentState().then(() => {
        // load current account
        const account = ethUtil.getCurrentAccount();
        if (account) $addressInput.setValue(account);
        _resetAll();

        // get start blocks for controllers, init event viewers, and reset them.
        Promise.obj({
            monarchyStart: monarchy.getEvents("Created").then(evs => evs[0].blockNumber),
            diceStart: dice.getEvents("Created").then(evs => evs[0].blockNumber),
            vpStart: vp.getEvents("Created").then(evs => evs[0].blockNumber)
        }).then(obj => {
            _initMonarchy(obj.monarchyStart);
            _initDice(obj.diceStart);
            _initVp(obj.vpStart);
        });
    });

    function _resetAll() {
        // disable all things if no account
        _curAccount = $addressInput.getValue();

        const $fieldsets = $("fieldset.account-chosen");
        const $whichAccounts = $(".bubble.which-account").hide();
        const $noAccounts = $(".bubble.no-account").hide();
        if (_curAccount) {
            $fieldsets.removeAttr("disabled");
            $whichAccounts.show().find(".player").text(_curAccount);
        } else {
            $fieldsets.attr("disabled", "disabled");
            $noAccounts.show();
        }

        // reset all of the event logs
        _resetCallbacks.forEach(callback => {
            callback(_curAccount);
        });
    }

    function _initMonarchy(startBlock) {
        const $e = $(".cell.monarchy")
        const $ctnr = $e.find(".log-viewer-ctnr");

        const events = buildEvents();   // event filters reference "account"
        var lv = util.getLogViewer({
            events: events,
            order: "newest",
            minBlock: startBlock,
            valueFn: (event) => {
                return MonarchyUtil.$getEventSummary(event);
            }
        });
        lv.$e.appendTo($ctnr);

        _resetCallbacks.push(() => lv.reset(false));

        // get all overthrow, refund, and sendprize events for _curAccount
        function buildEvents() {
            // This hack relies on LogViewer calling .toString() on all filters.
            const account = {
                toString: function(){ return _curAccount; }
            };

            return [{
                name: "OverthrowOccurred",
                filter: {newMonarch: account},
                label: "Overthrow",
                selected: true
            },{
                name: "OverthrowRefundFailure",
                filter: {recipient: account},
                label: "Overthrow Refunded",
                selected: true
            },{
                name: "OverthrowRefundFailure",
                filter: {recipient: account},
                label: "Overthrow Refunded",
                selected: true
            },{
                name: "SendPrizeSuccess",
                filter: {recipient: account},
                label: "Sent Prize",
                selected: true
            },{
                name: "SendPrizeFailure",
                filter: {recipient: account},
                label: "Sent Prize",
                selected: true
            }].map(obj => {
                obj.instance = MonarchyGame;
                return obj;
            });
        }
    }

    function _initDice() {

    }

    function _initVp() {

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