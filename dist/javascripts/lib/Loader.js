(function(){
    function addScript(src) {
        return new Promise((res, rej)=>{
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = src;
            script.onload = res;
            script.onerror = rej;
            document.getElementsByTagName('head')[0].appendChild(script);
        })
    }
    function addStyle(src) {
        return new Promise((res, rej)=>{
            var link = document.createElement('link');
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = src;
            link.onload = res;
            link.onerror = rej;
            document.getElementsByTagName('head')[0].appendChild(link); 
        })
    }

    /**
    Loads all required scripts and styles, then does the following:
        - sets up an infura _web3 (to use when if/when metamask is broken)
            - also _niceWeb3
        - sets up a default web3 (metamask, fallback to infura)
            - also niceWeb3
        - adds to global scope:
            - ethUtil
            - BigNumber
            - util
            - NiceWeb3: Registry, PennyAuction, etc
            - Also _Registry, _PennyAuction, (uses _niceWeb3)
        - Sets up the Nav and EthStatus
        - Sets up the Logger
        - Initializes all tippies
    */
    function Loader(){
        var _self = this;
        var _network = "none";
        var _registry;
        var _regMappings = {};
        
        var _triggerPageLoaded;
        this.onPageLoad = new Promise((resolve, reject)=>{
            _triggerPageLoaded = resolve;
        });
        var _triggerWeb3Ready;
        this.onWeb3Ready = new Promise((resolve, reject)=>{
            _triggerWeb3Ready = resolve;
        });

        this.nameOf = (addr) => {
            const foundName = Object.keys(_regMappings)
                .find(name => _regMappings[name].toLowerCase() === addr.toLowerCase());
            return foundName || addr;
        };

        this.linkOf = (addr) => {
            var name = _self.nameOf(addr);
            if (name.startsWith("0x")) return util.$getShortAddrLink(name);
            name = name[0].toUpperCase() + name.toLowerCase().slice(1);
            name = name.replace(/_([a-z])/g, (m, w)=>w.toUpperCase())
            name = name.replace(/PennyAuctionController/, "Monarchy");
            const href = ({
                "Treasury": "/status/treasury.html",
                "Comptroller": "/status/comptroller.html",
                "PennyToken": "/status/token.html",
                "TaskManager": "/status/taskmanager.html",
                "Monarchy": "/status/monarchy.html",
                "InstaDice": "/status/instadice.html",
                "VideoPoker": "/status/videopoker.html"
            }[name]);
            if (!href) return util.$getAddrLink(name, addr);
            return $(`<a href="${href}" target="_blank"></a>`).text(name);
        };

        this.getBankrollables = () => {
            return Object.keys(_regMappings).filter(name => {
                name = name.toLowerCase();
                const names = ["penny_auction_controller", "insta_dice", "video_poker"];
                return names.some(tName => name.indexOf(tName) >= 0);
            }).map(name => _regMappings[name]);
        };

        this.addressOf = (name) => {
            if (!_regMappings[name])
                throw new Error(`Registry does not contain an entry for ${name}.`);
            return _regMappings[name];
        };

        this.promise = Promise.all([
            new Promise((res, rej)=>{ window.addEventListener('load', res); }),
            addScript("/javascripts/lib/external/jquery-3.2.1.slim.min.js"),
            addScript("/javascripts/lib/external/tippy.all.min.js"),
            addScript("/javascripts/lib/external/web3.min.js"),
            addScript("/javascripts/lib/external/EthAbi.js"),
            addScript("/javascripts/lib/EthUtil.js"),
            addScript("/javascripts/lib/NiceWeb3.js"),
            addScript("/javascripts/lib/ABIs.js"),
            addScript("/javascripts/lib/PennyEtherWebUtil.js"),
            addScript("/javascripts/lib/Nav.js"),
            addScript("/javascripts/lib/EthStatus.js"),
            addStyle("/styles/global.css")
        ]).then(()=>{
            var Web3 = require("web3");
            if (!window.$) throw new Error("Unable to find jQuery.");
            if (!window.tippy){ throw new Error("Unable to find Tippy."); }
            if (!window.Web3) throw new Error("Unable to find web3.");
            if (!window.ethAbi) throw new Error("Unable to find ethAbi.")
            if (!window.EthUtil) throw new Error("Unable to find EthUtil.");
            if (!window.NiceWeb3) throw new Error("Unable to find NiceWeb3.");
            if (!window.ABIs){ throw new Error("Unable to find ABIs."); }
            if (!window.PennyEtherWebUtil){ throw new Error("Unable to find PennyEtherWebUtil."); }
            if (!window.Nav){ throw new Error("Unable to find Nav"); }
            if (!window.EthStatus){ throw new Error("Unable to find EthStatus"); }

            // create web3 object depending on if its from browser or not
            if (typeof web3 !== 'undefined') {
                window.hasWeb3 = true;
                window.web3 = new Web3(web3.currentProvider);
                console.log(`Using browser-provided web3.`);
            } else {
                window.hasWeb3 = false;
                window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545/"));
                console.log(`No browser-provided web3. Using localhost.`);
            }

            // Public things.
            window.niceWeb3 = new NiceWeb3(web3, ethAbi, EthUtil); 
            window.ethUtil = niceWeb3.ethUtil;
            window.BigNumber = web3.toBigNumber().constructor;
            window.util = new PennyEtherWebUtil(niceWeb3);
            window.ethStatus = new EthStatus(ethUtil, niceWeb3);

            // Expose all ABIs as NiceWeb3 contract factories, since web3 is... um... "beta".
            Object.keys(ABIs).forEach((contractName) => {
                var abi = ABIs[contractName];
                window[contractName] = niceWeb3.createContractFactory(contractName, abi.abi, abi.unlinked_binary);
            });

            // Get the current network, and set up _web3
            const networkPromise = ethUtil.getCurrentState(true).then(state => {
                // Load network name
                const mappings = {1: "main", 3: "ropsten"};
                _network = state.networkId > 10
                    ? "local"
                    : mappings[state.networkId] || "unknown";
                console.log(`Detected network: ${_network}`);

                // Create a backup _web3, since MetaMask's web3 is... um... "beta".
                const providerUrl = ({
                    "main": "https://mainnet.infura.io/",
                    "ropsten": "https://ropsten.infura.io/",
                    "local": "http://localhost:8545/"
                })[_network];
                window._web3 = new Web3(new Web3.providers.HttpProvider(providerUrl));
                window._niceWeb3 = new NiceWeb3(_web3, ethAbi, EthUtil);
                console.log(`Created _web3 [${_network}] @ ${providerUrl}`);
                _triggerWeb3Ready();

                // Load registry depending on web3 network name
                const registryAddr = ({
                    "ropsten": "0xb56db64b37897b24e0cadd9c2eb9dc0d23d11cd7",
                    "local": "0xc4a1282aedb7397d10b8baa89639cfdaff2ee428"
                })[_network];
                _registry = Registry.at(registryAddr || "0x0");
                console.log(`Registry for ${_network} is ${registryAddr}`);

                // Load all registry mappings
                return _registry.mappings().then(arr => {
                    const names = arr[0].map(web3.toUtf8);
                    const addresses = arr[1];
                    names.forEach((name,i) => _regMappings[name] = addresses[i]);
                    console.log("Loaded registry mappings", _regMappings);
                });
            });

            /////////////////////////////////////////////////////////////////////////////
            ///////////// SET UP EVERYTHING ELSE WHILE NETWORK LOADS ////////////////////
            /////////////////////////////////////////////////////////////////////////////

            // Tell ethUtil to poll for state change
            ethUtil.pollForStateChange();

            // Load nav
            const nav = new Nav();
            nav.setEthStatusElement(ethStatus.$e)
            $("#Content").prepend(nav.$e);
            window["nav"] = nav;

            // Attach Tippies
            $(".tip-left").attr("data-tippy-placement", "left");
            tippy.defaults.trigger = "mouseenter";
            tippy.defaults.interactive = true;
            tippy.defaults.sticky = true;
            tippy.defaults.arrow = true;
            tippy.defaults.placement = "top";
            $('[title]:not(.no-tip-style)').addClass("tip");
            tippy('[title]:not(.tip-manually)');

            // Add class for initial transitions
            $("body").addClass("loaded");
            _triggerPageLoaded();

            return networkPromise;
        });

        // Loads items from the registry, and also ensures that ethUtil
        //      has a current state.
        // Returns a fake promise with which you can pass a function.
        // That function will be invoked with params as the instances.
        this.require = function(){
            const strs = Array.prototype.slice.call(arguments);

            const p = Promise.resolve(_self.promise).then(() => {
                /* eslint-disable no-undef */
                const requirements = {
                    "comp": [Comptroller, "COMPTROLLER"],
                    "token": [DividendToken, "PENNY_TOKEN"],
                    "tr": [Treasury, "TREASURY"],
                    "tm": [TaskManager, "TASK_MANAGER"],
                    "monarchy": [MonarchyController, "MONARCHY_CONTROLLER"],
                    "monarchy-factory": [MonarchyFactory, "MONARCHY_FACTORY"],
                    "dice": [InstaDice, "INSTA_DICE"],
                    "vp": [VideoPoker, "VIDEO_POKER"]
                };
                /* eslint-enable no-undef */
                // For each string, map it to the type at the mapped address.
                return strs.map((str)=>{
                    if (!requirements[str] && str!=="reg")
                        throw new Error(`Unknown requirement: ${str}`);
                    if (str==="reg") return _registry;
                    const type = requirements[str][0];
                    const name = requirements[str][1];
                    const addr = _self.addressOf(name);
                    return type.at.call(type, addr)
                });
            });

            return {
                then: function(cb) {
                    return Promise.resolve(p).then(arr=>{
                        return cb.apply(null, arr);
                    });
                }
            }
        };

        this.mineBlock = function(){
            return Promise.resolve().then(()=>{
                if (_network == "local") {
                    return ethUtil.sendAsync("evm_mine", [1]).then(()=>{
                        console.log(`Mined 1 block to bypass ganace block.number bug.`);
                    });
                } else {
                    return;
                }
            })
        };
    }
    window.Loader = new Loader();
}());

// eslint-disable-next-line
function AJAX(url){
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject(new Error(xhr.statusText));
            }
        };
        xhr.onerror = () => reject(new Error(xhr.statusText));
        xhr.send();
    });
}

// eslint-disable-next-line
function doScrolling(element, duration) {
    function getElementY(query) {
        if (typeof query == "number") return query;
        return window.pageYOffset + document.querySelector(query).getBoundingClientRect().top
    }
    var startingY = window.pageYOffset
    var elementY = getElementY(element)
    var targetY = document.body.scrollHeight - elementY < window.innerHeight
        ? document.body.scrollHeight - window.innerHeight
        : elementY
    var diff = targetY - startingY
    var easing = function (t) { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 }
    
    var start;
    if (!diff) return

    // Bootstrap our animation - it will get called right before next frame shall be rendered.
    window.requestAnimationFrame(function step(timestamp) {
        if (!start) start = timestamp
        var time = timestamp - start
        var percent = Math.min(time / duration, 1)
        percent = easing(percent)
        window.scrollTo(0, startingY + diff * percent)
        if (time < duration) {
            window.requestAnimationFrame(step)
        }
    });
}

// eslint-disable-next-line
function promiseInView(el){
    return new Promise((res,rej)=>{
        function check() {
            const rect = el.getBoundingClientRect();
            const elemTop = rect.top;
            const elemBottom = rect.bottom;
            const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
            if (isVisible) {
                res();
                $(document).unbind("scroll", check);
            }
        }
        $(document).on("scroll", check);
        check();
    });
}

Array.prototype.stableSort = function(cmp) {
    cmp = cmp
        ? cmp
        : (a, b) => {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        };
    let stabilizedThis = this.map((el, index) => [el, index]);
    let stableCmp = (a, b) => {
        let order = cmp(a[0], b[0]);
        if (order != 0) return order;
        return a[1] - b[1];
    }
    stabilizedThis.sort(stableCmp);
    for (let i=0; i<this.length; i++) {
        this[i] = stabilizedThis[i][0];
    }
    return this;
};

Promise.obj = function(obj) {
    const promises = Object.keys(obj).map(name => {
        if (!obj[name] || !obj[name].then) return null;
        else return obj[name].then(val => obj[name] = val);
    });
    return Promise.all(promises).then(() => obj);
};
Promise.prototype.finally = function finallyPolyfill(callback) {
    var constructor = this.constructor;

    return this.then(function(value) {
        return constructor.resolve(callback()).then(function() {
            return value;
        });
    }, function(reason) {
        return constructor.resolve(callback()).then(function() {
            throw reason;
        });
    });
};
