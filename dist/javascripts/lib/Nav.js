(function(){
    function Nav() {
        const _$e = $(`
            <div id="Nav">
                <div id="Top">
                    <div align=left class="left">
                        <div class="logo">
                            PennyEther
                        </div>
                    </div>
                    <div align=right class="middle">
                    </div>
                    <div align=right class="right">
                    </div>
                </div>
                <div id="Bottom">
                    <div class="breadcrumb"></div>
                    <div class="settings">Dark</div>
                </div>
            </div>
        `);
        const _$menu = _$e.find(".middle");
        const _$status = _$e.find(".right");
        const _$breadcrumb = _$e.find(".breadcrumb");
        const _$settings = _$e.find(".settings").click(()=>{
            $("body").toggleClass("dark");
        }).hide();

        const _siteMap = [
            {
                name: "Win Ether!",
                url: "/games/pennyauctions.html",
                children: [{
                    name: "Penny Auctions",
                    url: "/games/pennyauctions.html",
                    linkInBreadcrumb: true,
                    children: [{
                        name: "View Game",
                        url: "/games/monarchy-game.html"
                    }]
                },{
                    name: "InstaDice",
                    url: "/games/instadice.html",
                    linkInBreadcrumb: true,
                    children: [{
                        name: "View Roll",
                        url: "/games/instadice-roll.html"
                    }]
                },{
                    name: "Video Poker",
                    url: "/games/videopoker.html",
                    linkInBreadcrumb: true,
                    children: [{
                        name: "View Game",
                        url: "/games/videopoker-game.html"
                    }]
                }]
            }, {
                name: "About",
                url: "/about/mission.html",
                children: [{
                    name: "Our Mission",
                    url: "/about/mission.html"
                },{
                    name: "Overview",
                    url: "/about/pennyether.html"
                },{
                    name: "Contracts",
                    url: "/about/contracts.html",
                    linkInBreadcrumb: true,
                    children: [{
                        name: "Test Results",
                        url: "/test-results/index.html"
                    }]
                },{
                    name: "Audits",
                    url: "/about/audits.html"
                },{
                    name: "Contact",
                    url: "/about/contact.html"
                }]
            }, {
                name: "Status",
                url: "/status/system.html",
                children: [{
                    name: "Core"
                },{
                    name: "System Overview",
                    url: "/status/overview.html"
                },{
                    name: "Treasury Status",
                    url: "/status/treasury.html"
                },{
                    name: "Comptroller Status",
                    url: "/status/comptroller.html"
                },{
                    name: "Token Status",
                    url: "/status/token.html"
                },{
                    name: "TaskManager Status",
                    url: "/status/taskmanager.html"
                },{
                    name: "Games"
                },{
                    name: "Monarchy Status",
                    url: "/status/monarchy.html",
                },{
                    name: "InstaDice Status",
                    url: "/status/instadice.html",
                    linkInBreadcrumb: true,
                    children: [{
                        name: "View Roll",
                        url: "/status/instadice-roll.html"
                    }]
                },{
                    name: "VideoPoker Status",
                    url: "/status/videopoker.html",
                    linkInBreadcrumb: true,
                    children: [{
                        name: "View Game",
                        url: "/status/videopoker-game.html"
                    }]
                }]
            }, {
                name: "UIs",
                url: "/status/system.html",
                children: [{
                    name: "Player History",
                    url: "/uis/player.html"
                },{
                    name: "Token Holder UI",
                    url: "/uis/tokenholder.html"
                },{
                    name: "Admin UI",
                    url: "/uis/admin.html"
                }]
            }, {
                name: "ICO",
                url: "/ico/whitepaper.html",
                children: [{
                    name: "Whitepaper",
                    url: "/ico/whitepaper.html"
                },{
                    name: "CrowdSale",
                    class: "crowdsale",
                    url: "/ico/crowdsale.html"
                }]
            }
        ];

        _init();

        function _init() {
            var breadcrumb = [];
            const curUrl = window.location.pathname.toLowerCase();
            _$menu.empty();
            _siteMap.forEach(obj => {
                // add menu item, set as breadcrumb (if there is none)
                const $e = $(`<div class='menuItem'></div>`)
                    .append(
                        $("<a class='link'></a>").attr("href", obj.url).text(obj.name)
                    )
                    .appendTo(_$menu);
                if (obj.class) $e.addClass(obj.class);

                if (obj.url.toLowerCase() == curUrl) {
                    $e.addClass("on");
                    if (breadcrumb.length==0) breadcrumb = [obj];
                }
                const children = obj.children || [];
                if (!children.length) return;

                // there are children. add a submenu.
                // if we find a matching url, set to breadcrumb
                // unless we already have a 2-level breadcrumb.
                const $sub = $(`<div class='subMenu'></div>`);
                children.forEach(child=>{
                    if (!child.url) {
                        const $e = $("<div class='header'></div>")
                            .text(child.name)
                            .appendTo($sub);
                        return;
                    }
                    const $child = $(`<a class='subItem'></a>`)
                        .attr("href", child.url)
                        .text(child.name)
                        .appendTo($sub);
                    if (child.class) $child.addClass(child.class);

                    if (child.url == curUrl) {
                        $child.addClass("on");
                        if (breadcrumb.length!=2){
                            breadcrumb = [obj, child];
                            $e.addClass("on");
                        }
                    }

                    if (child.children) child.children.forEach(grandchild=>{
                        if (grandchild.url == curUrl){
                            breadcrumb = [obj, child, grandchild];
                            $e.addClass("on");
                            $child.addClass("on");
                        }
                    });
                });
                $sub.appendTo($e);
            });

            document.title = breadcrumb.map(x=>x.name).join(" > ");
            _$breadcrumb.empty();
            const $breadcrumb = $("<div></div>").appendTo(_$breadcrumb);
            while (breadcrumb.length) {
                const item = breadcrumb.shift();
                const $item = $("<div></div>")
                    .addClass("item")
                    .appendTo($breadcrumb);
                if (item.linkInBreadcrumb && breadcrumb.length) {
                    $item.append($("<a></a>").attr("href", item.url).text(item.name))
                } else {
                    $item.text(item.name);
                }
            }
        }

        this.$e = _$e;
        this.setEthStatusElement = function($e) {
            _$status.empty().append($e);
        };
        this.$getRollLink = function(rollId) {
            const str = rollId.length > 10
                ? "@" + rollId.slice(0,4) + "..." + rollId.slice(-4)
                : `#${rollId}`;
            return $("<a class='game-link'></a>")
                .text(str)
                .attr("href", `/games/view-roll.html#${rollId}`);
        };
        this.$getMonarchyGameLink = function(addr) {
            return $("<a></a>")
                .text(addr.slice(0, 6) + "..." + addr.slice(-4))
                .attr("href", `/games/view-monarchy-game.html#${addr}`);
        }
        this.$getPlayerLink = function(addr) {
            const $el = $("<div class='player-link'></div>");
            // get link to player history
            const $link = $("<a></a>")
                .attr("href", `/uis/player.html#${addr}`)
                .text(addr.slice(0,6) + "..." + addr.slice(-4));
            if (ethUtil.getCurrentAccount() === addr) $link.text("You");
            // get gravatar
            const gravatarId = addr.slice(2, 34);
            const $gravatar = $("<img></img>").attr(`src`, `https://www.gravatar.com/avatar/${gravatarId}?d=retro`)
            return $el.append($gravatar).append($link);
        };
    }
    window.Nav = Nav;
}())