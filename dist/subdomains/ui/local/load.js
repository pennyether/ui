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
                name: "Recent Games",
                url: "/games/view-monarchy-game.html"
            },{
                name: "Contract Info",
                url: "/about/contracts-games.html#monarchy-game"
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
                name: "Recent Rolls",
                url: "/games/view-instadice-roll.html"
            },{
                name: "Contract Info",
                url: "/about/contracts-games.html#instadice"
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
                name: "Recent Hands",
                url: "/games/view-videopoker-hand.html"
            },{
                name: "Contract Info",
                url: "/about/contracts-games.html#video-poker"
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
                name: "Blog",
                url: "https://blog.pennyether.com/"
            },{
                name: "Investors",
                url: "https://investors.pennyether.com/"
            }]
        }
    ];
    Loader.load({
        fullAbi: false,
        sitemap: sitemap,
        subdomain: null
    });
}())