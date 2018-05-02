(function(){
    var sitemap = [
        {
            name: "👑 Monarchy",
            url: "/games/monarchy.html",
            children: [{
                name: "Play!",
                url: "/games/monarchy.html"
            },{
                name: "How to Play",
                url: "/games/monarchy-faqs.html"
            },{
                name: "Contract Details",
                url: "/status/monarchy.html"
            }]
        },{
            name: "🎲 InstaDice",
            url: "/games/instadice.html",
            children: [{
                name: "Play!",
                url: "/games/instadice.html"
            },{
                name: "How to Play",
                url: "/games/instadice-faqs.html"
            },{
                name: "Contract Details",
                url: "/status/instadice.html"
            },{
                hide: true,
                name: "View Roll",
                url: "/games/view-instadice-roll.html"
            }]
        },{
            name: "🃏 Video Poker",
            url: "/games/videopoker.html",
            children: [{
                name: "Play!",
                url: "/games/videopoker.html"
            },{
                name: "How to Play",
                url: "/games/videopoker-faqs.html"
            },{
                name: "Contract Details",
                url: "/status/videopoker.html"
            }]
        },{
            name: "About",
            url: "/about/mission.html",
            children: [{
                name: "Our Mission",
                url: "/about/mission.html"
            },{
                name: "Contracts",
                url: "/about/contracts.html"
            },{
                name: "Blog",
                url: "/"
            },{
                name: "Investors",
                url: "/"
            },{
                name: "Contact",
                url: "/about/contact.html"
            }]
        }
    ];
    var _sitemap = [
        {
            name: "Play!",
            url: "/index.html#games",
            children: [{
                name: "👑 Monarchy",
                url: "/games/monarchy.html",
                linkInBreadcrumb: true,
                children: [{
                    name: "View Game",
                    url: "/games/view-monarchy-game.html"
                }]
            },{
                name: "🎲 InstaDice",
                url: "/games/instadice.html",
                linkInBreadcrumb: true,
                children: [{
                    name: "View Roll",
                    url: "/games/view-instadice-roll.html"
                }]
            },{
                name: "🃏 Video Poker",
                url: "/games/videopoker.html",
                linkInBreadcrumb: true,
                children: [{
                    name: "View Game",
                    url: "/games/view-videopoker-hand.html"
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
                url: "/about/overview.html"
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
            url: "/status/overview.html",
            children: [{
                name: "Realtime Overview",
                url: "/status/overview.html",
                class: "overview"
            },{
                name: "Core"
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
                name: "Games"
            },{
                name: "Monarchy Status",
                url: "/status/monarchy.html",
            },{
                name: "InstaDice Status",
                url: "/status/instadice.html",
            },{
                name: "VideoPoker Status",
                url: "/status/videopoker.html",
            },{
                name: "Other"
            },{
                name: "TaskManager Status",
                url: "/status/taskmanager.html"
            },]
        }, {
            name: "Tools",
            url: "/tools/player.html",
            children: [{
                name: "Player History",
                url: "/tools/player.html"
            },{
                name: "Token Holder UI",
                url: "/tools/tokenholder.html"
            },{
                name: "Admin UI",
                url: "/tools/admin.html"
            }]
        }, {
            name: "ICO",
            url: "/ico/whitepaper.html",
            children: [{
                name: "Intro",
                url: "/ico/intro.html"
            },{
                name: "Whitepaper",
                url: "/ico/whitepaper.html"
            },{
                name: "CrowdSale",
                class: "crowdsale",
                url: "/ico/crowdsale.html"
            }]
        }
    ];
    Loader.load({
        fullAbi: false,
        sitemap: sitemap
    });
}())