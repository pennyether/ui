Loader.require("pac")
.then(function(pac){
	ethUtil.getCurrentState().then(() => {
		_refreshAll();
	});

	function _refreshAll(){
		Promise.all([
			_refreshHealth(),
			// _refreshTasks(),
			// _refreshRewards(),
		]).then(()=>{
			// tm.getEvents("Created").then(arr => {
			// 	return arr[0].blockNumber;
			// }).then(creationBlockNum => {
			// 	_initEventLog(creationBlockNum);
			// 	Promise.all([
			// 		ethUtil.getBlock(creationBlockNum),
			// 		_niceWeb3.ethUtil.getAverageBlockTime(),
			// 	]).then(arr => {
			// 		_initRewards(arr[0], arr[1]);
			// 	});
			// });
		});
	}

	function _refreshHealth() {
		const $e = $(".cell.health");
		const $loading = $e.find(".loading").show();
		const $error = $e.find(".error").hide();
		const $doneLoading = $e.find(".done-loading").hide();

		return Promise.obj({
			$healthBars: createHealthBars(pac)
		}).then(doRefresh).then(()=>{
			$loading.hide();
			$doneLoading.show();
		},e => {
			console.warn(e);
			$loading.hide();
			$error.show();
			$error.find(".error-msg").text(e.message);
		});

		function doRefresh(obj) {
			$e.find(".hb-ctnr").append(obj.$healthBars);
		}
	}

	function createHealthBars(instance) {
		return Promise.obj({
			balance: ethUtil.getBalance(instance),
			collateral: instance.getCollateral(),
			bankroll: instance.bankroll()
		}).then(obj => {
			const $e = $(`
				<div class="HealthBar">
					<table width=100%>
						<tr class="collateral">
							<td class="label">
								<div class="tipLeft" title="The amount of Ether that cannot be used as bankroll.">Collateral:</div>
							</td>
							<td class="value"></td>
							<td class="bar" width="100%"><div class="inner-bar"></div></div>
						</tr>
						<tr class="bankroll">
							<td class="label">
								<div class="tipLeft" title="The amount of Ether to be used to stake games.">Bankroll:</div>
							</td>
							<td class="value"></td>
							<td class="bar"><div class="inner-bar"></div></div>
						</tr>
						<tr class="balance">
							<td class="label">
								<div class="tipLeft" title="The total amount of Ether this contract has.">Balance:</div>
							</td>
							<td class="value"></td>
							<td class="bar"><div class="inner-bar"></div></div>
						</tr>
						<tr class="profit">
							<td class="label">
								<div class="tipLeft" title="Balance - (collateral + bankroll).">Profit:</div>
							</td>
							<td class="value"></td>
							<td class="bar"><div class="inner-bar"></div></div>
						</tr>
					</table>
				</div>
			`);

			// settimeout lets the width transitions take effect.
			setTimeout(() => {
				const balance = obj.balance;
				const collateral = obj.collateral;
				const bankroll = obj.bankroll;
				const profit = balance.minus(collateral.plus(bankroll));

				tippy($e.find(".label div").toArray(), {trigger: "mouseenter", placement: "left"});
				const max = BigNumber.max(balance, collateral.plus(bankroll));
				function toPct(v, offsetLeft){
					const thisMax = offsetLeft ? max.minus(offsetLeft) : max;
					return `${v.div(thisMax).mul(100).toFixed(2)}%`;
				}
				$e.find(".collateral .value").text(util.toEthStr(collateral));
				$e.find(".collateral .inner-bar").width(toPct(collateral));

				$e.find(".bankroll .value").text(util.toEthStr(bankroll));
				$e.find(".bankroll .inner-bar")
					.css("left", toPct(collateral))
					.width(toPct(bankroll));

				$e.find(".balance .value").text(util.toEthStr(balance));
				$e.find(".balance .inner-bar").width(toPct(balance));

				$e.find(".profit .value").text(util.toEthStr(profit));			
				if (profit.gt(0)) {
					$e.find(".profit .inner-bar")
						.css("left", toPct(collateral.plus(bankroll)))
						.width(toPct(profit))
						.css("background", "rgba(0,128,0,.8)")
				} else {
					$e.find(".profit .inner-bar")
						.css("left", toPct(balance))
						.width(toPct(max.minus(balance)))
					if (profit.abs().gt(bankroll)) {
						$e.find(".profit .inner-bar")
							.css("background", "red");
					} else {
						const p = profit.abs().div(bankroll);
						const c = interp(p, [0,0,0,.2], [255,0,0,1]);
						$e.find(".profit .inner-bar")
							.css("background", `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`);
					}
				}
			}, 100);

			return $e;
		});

		function interp(p, color1, color2) {
			return color1.map((rgba, i) => {
				const v = rgba + p*(color2[i] - rgba);
				return i==3 ? v.toFixed(2) : Math.round(v);
			});
		}
	}
});