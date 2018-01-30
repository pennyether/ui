Loader.require("comp")
.then(function(comp){
	const _$progress = $(".progress");
	const _$progressAmt = $(".progress .amt");
	const _$statSoftCap = $(".stat.softCap .value");
	const _$statHardCap = $(".stat.hardCap .value");
	const _$statRaised = $(".stat.raised .value");
	const _$statBonus = $(".stat.bonus .value");
	const _$cdSummary = $(".countdown .summary");
	const _$days = $(".days .value");
	const _$hours = $(".hours .value");
	const _$minutes = $(".minutes .value");
	const _$seconds = $(".seconds .value");
	const _$contText = $(".contributeText");
	const _$contTip = $(".contributeTip");
	const _$contBtn = _$contTip.find("button").click(contribute);
	const _$txtEther = _$contTip.find(".txtEther");
	const _gps = util.getGasPriceSlider(20);

	var _totalRaised;
	var _softCap;
	var _endCap;
	var _dateSaleStarted;
	var _dateSaleEnded;

	ethUtil.onStateChanged((state)=>{
		if (!state.isConnected) return;
		refreshAll();
	});

	(function(){
		_gps.refresh();
		_gps.$e.appendTo(_$contTip.find(".gasSlider"));

		// attach txtEther to $numTokens
		const $numTokens = _$contTip.find(".numTokens");
		_$txtEther.on("input", function(){
			Promise.resolve().then(()=>{
				const val = (new BigNumber(_$txtEther.val())).mul(1e18);
				return comp.getTokensFromEth([val]).then((tokens)=>{
					$numTokens.text(tokens.div(1e18).toFixed(2));
				});
			}).catch(()=>{
				$numTokens.text("--");
			})
		}).trigger("input");
		tippy(_$contText[0], {
			trigger: "mouseenter",
			html: _$contTip.show()[0],
			animation: "scale",
			theme: "light",
			onShown: ()=>{
				_gps.refresh();
			}
		})
	}());

	// initialize sale parameters
	const _initialized = Promise.all([
		comp.dateSaleStarted(),
		comp.dateSaleEnded(),
		comp.softCap(),
		comp.hardCap()
	]).then(arr=>{
		_dateSaleStarted = arr[0].toNumber();
		_dateSaleEnded = arr[1].toNumber();
		_softCap = arr[2];
		_hardCap = arr[3];
		updateCountdown();
	});

	function contribute() {
		var gas = 200000;
		if (_totalRaised.gt(0)) gas = 100000;
		if (_totalRaised.gt(_softCap)) gas = 75000;
		comp.sendTransaction({gas: gas});
	}

	// get values that may have changed, refresh stuff
	function refreshAll() {
		Promise.all([
			comp.totalRaised(),
			comp.wasSaleEnded(),
			comp.getTokensFromEth([1e12]),
			_initialized
		]).then(arr=>{
			_totalRaised = arr[0];
			const wasSaleEnded = arr[1];
			const bonusPct = arr[2].div(1e12).minus(1).mul(100);
			const progressPct = _totalRaised.div(_hardCap).mul(100).toFixed(2);
			if (bonusPct.equals(0)){ _$statBonus.hide(); }
			if (_totalRaised.gt(_hardCap.minus(1))){
				_$statHardCap.parent().addClass("reached");
			};
			if (_totalRaised.gt(_softCap.minus(1))){
				_$statSoftCap.parent().addClass("reached");
			}

			console.log(_totalRaised);
			_$progressAmt.css({
				width: `${progressPct}%`,
				opacity: 1
			});
			_$statSoftCap.text(`${_softCap.div(1e18)} Eth`);
			_$statHardCap.text(`${_hardCap.div(1e18)} Eth`);
			_$statRaised.text(`${_totalRaised.div(1e18).toFixed(2)} Eth`);
			_$statBonus.text(`${bonusPct.round()}%`);
			updateCountdown();
		});
	}
		

	var _timeLastUpdated = null;
	var _timeLeft = null;
	function updateCountdown() {
		const blockTime = ethUtil.getCurrentBlockTime();
		if (blockTime > _dateSaleEnded || _totalRaised && _totalRaised.equals(_hardCap)){
			_timeLeft = null;
			_$progress.show();
			_$cdSummary.text(`Sale Ended!`);
			return;
		}

		if (_dateSaleStarted > blockTime) {
			// sale not started yet.
			_timeLeft = _dateSaleStarted - blockTime;
			_timeLastUpdated = +new Date();
			_$progress.hide();
			_$cdSummary.text(`Sale starts ${util.toDateStr(_dateSaleStarted)}`);
			refreshCountdown();
			return;
		}

		if (_dateSaleEnded > blockTime) {
			// sale not ended yet
			_timeLeft = _dateSaleEnded - blockTime;
			_timeLastUpdated = +new Date();
			_$progress.show();
			_$cdSummary.text(`Sale ends ${util.toDateStr(_dateSaleEnded)}`);
			refreshCountdown();
			return;
		}
	};
	function refreshCountdown(){
		if (_timeLeft == null) {
			_$days.text("00");
			_$hours.text("00");
			_$minutes.text("00");
			_$seconds.text("00");
			return;
		};
		var timeLeft = _timeLeft + (_timeLastUpdated - (+ new Date()))/1000;

		var days = Math.floor(timeLeft/(60*60*24));
		_$days.text(`${days<10?"0":""}${days}`);
		timeLeft -= days * 60*60*24;

		var hours = Math.floor(timeLeft/(60*60));
		_$hours.text(`${hours<10?"0":""}${hours}`);
		timeLeft -= hours * 60*60;

		var minutes = Math.floor(timeLeft/60);
		_$minutes.text(`${minutes<10?"0":""}${minutes}`);
		timeLeft -= minutes*60;

		var seconds = Math.floor(timeLeft);
		_$seconds.text(`${seconds<10?"0":""}${seconds}`);
	};
	(function pollCountdown(){
		setTimeout(pollCountdown, 1000);
		refreshCountdown();
	}());
});