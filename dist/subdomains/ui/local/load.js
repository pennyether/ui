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
                name: "Contract Status",
                url: "/status/monarchy.html"
            },{
                hide: true,
                name: "View Game",
                url: "/games/view-monarchy-game.html"
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
                name: "Contract Status",
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
                name: "Contract Status",
                url: "/status/videopoker.html"
            },{
                hide: true,
                name: "View Hand",
                url: "/games/view-videopoker-hand.html"
            }]
        },{
            name: "About",
            url: "/about/mission.html",
            children: [{
                name: "Our Mission",
                url: "/about/mission.html"
            },{
                name: "Contracts",
                url: "/about/contracts-games.html"
            },{
                name: "Contact Us",
                url: "/about/contact.html"
            },{
                name: "Blog",
                url: "/"
            },{
                name: "Investors",
                url: "/"
            }]
        }
    ];
    Loader.load({
        fullAbi: false,
        sitemap: sitemap,
        subdomain: null
    });
}())