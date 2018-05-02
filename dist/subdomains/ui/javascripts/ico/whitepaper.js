Loader.onPageLoad.then(()=>{
	function NavBar(selectors) {
		const _selectors = [".page-section > .head", ".page-subsection > .head", "h3", "h4"];
		const _items = _selectors.map(s=>$(s));
		const _$e = $(`<div class='NavBar'></div>`)
			.appendTo("#Nav .breadcrumb")
			.css({
				display: "inline-block",
				position: "absolute",
				top: 6,
				left: 230,
				zIndex: 10
			});

		// return the first item that is above the fold.
		function getFirstAboveFold(elements) {
			const top = window.pageYOffset;
			const el = elements.reverse().find(el=>el.getBoundingClientRect().top < 130);
			return el ? $(el) : null;
		}

		$(window).on("scroll", function(){
			const $navItems = [];
			_items
				.map(cat => getFirstAboveFold(cat.toArray()))
				.filter($el => !!$el)
				.forEach(($el, i) => {
					if (i==0) { $navItems.push($el); return; }
					const prevTop = $navItems.slice(-1).pop()[0].getBoundingClientRect().top;
					const curTop = $el[0].getBoundingClientRect().top;
					if (curTop > prevTop) { $navItems.push($el); }
				});
			_$e.text($navItems.map($e=>$e.text()).join(" » "));
		});
	}
	window.navBar = new NavBar();
});