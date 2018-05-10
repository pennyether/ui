(function(){
    function Nav(sitemap, subdomain) {
        const _sitemap = sitemap;

        const _$e = $(`
            <div id="Nav">
                <div id="Top">
                    <div align=left class="left">
                        <div class="logo">
                            <a href="/">
                                PennyEther
                            </a>
                            <div class="network"></div>
                        </div>
                        <div class="subdomain">
                            <div class="txt"></div>
                        </div>
                    </div>
                    <div align=right class="middle">
                    </div>
                    <div align=right class="right">
                    </div>
                </div>
                <div id="Bottom">
                    <div class="breadcrumb"></div>
                </div>
                <div id="Footer">
                    <table width="100%" cellpadding=0 cellspacing=0><tr>
                        <td class="penny-ether" align="middle" valign="top">
                            <div class="menu-item">
                                <a class="link" href="https://www.pennyether.com">PennyEther</a>
                                <div class="sub-menu">
                                    <a class="sub-item play" href="https://www.pennyether.com">Play!</a>
                                    <a class="sub-item blog" href="https://blog.pennyether.com">Blog</a>
                                    <a class="sub-item investors" href="https://investor.pennyether.com">Investors</a>
                                </div>
                                <div class="icons">
                                    <a href="https://www.reddit.com/r/PennyEther"><img src="/global/images/reddit-icon-32.ico"></a>
                                    <a href="https://discord.gg/hrrERYZ"><img src="/global/images/discord-icon-32.ico"></a>
                                    <a href="https://twitter.com/PennyEther"><img src="/global/images/twitter-icon-32.ico"></a>
                                    <a href="https://www.github.com/PennyEther/"><img src="/global/images/github-icon-32.ico"></a>
                                </div>
                            </div>
                        </td>
                    </tr></table>
                </div>
            </div>
        `);
        const _$menu = _$e.find(".middle");
        const _$status = _$e.find(".right");
        const _$breadcrumb = _$e.find(".breadcrumb");
        const _$network = _$e.find(".left .network");
        if (subdomain) {
            _$e.find(".left .subdomain .txt").text(subdomain).addClass(subdomain);
        } else {
            _$e.find(".left .subdomain").hide();
        }
        const _$footer = _$e.find("#Footer").detach();

        function _initSitemap() {
            var breadcrumb = [];
            const curUrl = window.location.pathname.toLowerCase();
            _$menu.empty();
            _sitemap.map(obj => {
                // create menuItem, add special class. set as "on" if url matches
                const $menuItem = $(`<div class='menu-item'></div>`).append(
                    $("<a class='link'></a>")
                        .attr("href", obj.url)
                        .append($("<span class='ctnr'></span>").text(obj.name))
                );
                if (obj.class) $menuItem.addClass(obj.class);
                if (obj.url.toLowerCase() == curUrl) {
                    $menuItem.addClass("on");
                    if (breadcrumb.length==0) breadcrumb = [obj];
                }

                // add all children
                const children = obj.children || [];
                if (children.length){
                    // there are children. add a submenu.
                    // if we find a matching url, set to breadcrumb
                    // unless we already have a 2-level breadcrumb.
                    const $sub = $(`<div class='sub-menu'></div>`);
                    children.forEach(child=>{
                        if (!child.url) {
                            $("<div class='header'></div>")
                                .text(child.name)
                                .appendTo($sub);
                            return;
                        }
                        const $child = $(`<a class='sub-item'></a>`)
                            .attr("href", child.url)
                            .text(child.name)
                        if (child.class) $child.addClass(child.class);
                        if (!child.hide) $child.appendTo($sub);

                        if (child.url == curUrl) {
                            $child.addClass("on");
                            if (breadcrumb.length!=2){
                                breadcrumb = [obj, child];
                                $menuItem.addClass("on");
                            }
                        }

                        if (child.children) child.children.forEach(grandchild=>{
                            if (grandchild.url == curUrl){
                                breadcrumb = [obj, child, grandchild];
                                $menuItem.addClass("on");
                                $child.addClass("on");
                            }
                        });
                    });
                    $sub.appendTo($menuItem);
                }
                return $menuItem;
            }).forEach($menuItem => {
                $menuItem.appendTo(_$menu);
                const $footer = $menuItem.clone();
                const txt = $footer.find(".link").text().replace(/[^\x00-\x7F]/g, "");;
                $footer.find(".link").text(txt);
                $("<td align='middle' valign='top'></td>")
                    .append($footer)
                    .appendTo(_$footer.find("tr"));
            });
            _$footer.find(".penny-ether").detach().appendTo(_$footer.find("tr"));

            (function setTitle(){
                const ucFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
                const domainStr = subdomain ? ` ${ucFirst(subdomain)}` : ``;
                const home = [`PennyEther${domainStr}`];
                const bc = breadcrumb.map(x=>x.name);
                document.title = home.concat(bc).join(" » ");
            }());
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
        _initSitemap();

        this.$e = _$e;
        this.$footer = _$footer;
        this.setEthStatusElement = function($e) {
            _$status.empty().append($e);
        };
        this.$getRollLink = function(rollId) {
            const str = rollId.length > 10
                ? "@" + rollId.slice(0,4) + "..." + rollId.slice(-4)
                : `#${rollId}`;
            return $("<a class='roll-link' target='_blank'></a>")
                .text(str)
                .attr("href", `/view/instadice-rolls.html#${rollId}`);
        };
        this.$getMonarchyGameLink = function(addr) {
            return $("<a class='monarchy-game-link' target='_blank'></a>")
                .text(addr.slice(0, 6) + "..." + addr.slice(-4))
                .attr("href", `/view/monarchy-games.html#${addr}`);
        };
        this.$getVpGameLink = function(id) {
            return $("<a class='videopoker-game-link' target='_blank'></a>")
                .text(`Game #${id}`)
                .attr("href", `/view/videopoker-hands.html#${id}`);
        };
        this.$getPlayerLink = function(addr, forceAddr) {
            const $el = $("<div class='player-link'></div>");
            // get link to player history
            const $link = $("<a></a>")
                .attr("href", `/tools/player.html#${addr}`)
                .text(addr.slice(0,6) + "..." + addr.slice(-4));
            if (!forceAddr && ethUtil.getCurrentAccount() === addr) $link.text("You");
            // get gravatar
            const gravatarId = addr.slice(2, 34);
            const $gravatar = $("<img></img>").attr(`src`, `https://www.gravatar.com/avatar/${gravatarId}?d=retro`)
            return $el.append($gravatar).append($link);
        };
        this.$setNetwork = function($e) {
            _$network.removeClass("flash");
            _$network.empty().append($e);
            setTimeout(()=>{ _$network.addClass("flash"); }, 50);
        }
    }
    window.Nav = Nav;
}())