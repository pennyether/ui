(function(){
    var sitemap = [
        {
            name: "Posts",
            url: "/posts/index.html",
            children: [{
                name: "Dividend Tokens",
                url: "/posts/realtime-dividend-token.html"
            },{
                name: "PennyEther is Live!",
                url: "/posts/soft-launch.html"
            }]
        },{
            name: "Tags",
            url: "/tag/updates.html",
            children: [{
                name: "Updates",
                url: "/tag/updates.html"
            },{
                name: "Tech",
                url: "/tag/tech.html"
            }]
        },{
            name: "More",
            url: "https://www.pennyether.com",
            children: [{
                name: "Play!",
                url: "https://www.pennyether.com",
            }, {
                name: "Investors",
                url: "https://invest.pennyether.com",
            }]
        }
    ];
    Loader.load({
        fullAbi: false,
        sitemap: sitemap,
        subdomain: "blog"
    });
}())