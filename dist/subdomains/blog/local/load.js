(function(){
    var sitemap = [
        {
            name: "Home",
            url: "/index.html",
        }, {
            name: "Our Mission",
            url: "/about/mission.html",
        }, {
            name: "Contact",
            url: "/about/contact.html",
        }]
    ];
    Loader.load({
        fullAbi: false,
        sitemap: sitemap,
        subdomain: "blog"
    });
}())