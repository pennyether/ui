(function(){
    var sitemap = [
        {
            name: "👑 Monarchy",
            url: "/games/monarchy.html",
            children: [{
                name: "Play!",
                url: "/games/monarchy.html"
            },{
                name: "FAQs",
                url: "/games/monarchy-faqs.html"
            },{
                name: "View Recent Games",
                url: "/view/monarchy-games.html"
            },{
                name: "Contract Info",
                url: "/about/game-contracts.html#monarchy-game"
            }]
        },{
            name: "🎲 InstaDice",
            url: "/games/instadice.html",
            children: [{
                name: "Play!",
                url: "/games/instadice.html"
            },{
                name: "FAQs",
                url: "/games/instadice-faqs.html"
            },{
                name: "View Past Rolls",
                url: "/view/instadice-rolls.html"
            },{
                name: "Contract Info",
                url: "/about/game-contracts.html#instadice"
            }]
        },{
            name: "🃏 Video Poker",
            url: "/games/videopoker.html",
            children: [{
                name: "Play!",
                url: "/games/videopoker.html"
            },{
                name: "FAQs",
                url: "/games/videopoker-faqs.html"
            },{
                name: "View Past Hands",
                url: "/view/videopoker-hands.html"
            },{
                name: "Contract Info",
                url: "/about/game-contracts#video-poker"
            }]
        },{
            name: "More",
            url: "/about/player-mission.html",
            children: [{
                name: "Our Mission",
                url: "/about/player-mission.html"
            },{
                name: "Contracts",
                url: "/about/game-contracts.html"
            },{
                name: "Player History",
                url: "/tools/player.html"
            },{
                name: "Blog",
                url: "https://blog.pennyether.com/"
            },{
                name: "Investors",
                url: "https://investor.pennyether.com/"
            }]
        }
    ];
    Loader.load({
        fullAbi: false,
        sitemap: sitemap,
        subdomain: null
    });
}())