(function(){
    var sitemap = [
        {
            name: "Home",
            url: "/"
        }, {
            name: "About",
            url: "/about/investor-mission.html",
            children: [{
                name: "Our Mission",
                url: "/about/investor-mission.html"
            },{
                name: "Overview",
                url: "/about/overview.html"
            },{
                name: "Contracts",
                url: "/about/all-contracts.html",
            },{
                name: "Audits",
                url: "/about/audits.html"
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
        sitemap: sitemap,
        subdomain: "investor"
    });
}())