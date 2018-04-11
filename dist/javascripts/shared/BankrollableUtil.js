(function(){
	function $getHealth(instance) {
		return Promise.obj({
			balance: ethUtil.getBalance(instance),
			collateral: instance.getCollateral(),
			bankroll: instance.bankroll()
		}).then(obj => {
			const $e = $(`
				<div class="Health">
					<div class="blob-ctnr" style="text-align: center;">
						<div class="blob">
							<div class="label">Bankrolled</div>
							<div class="value total-bankrolled"></div>
							<div class="eth">ETH</div>
						</div>
						<div class="blob">
							<div class="label">Available Bankroll</div>
							<div class="value bankroll-available"></div>
							<div class="eth">ETH</div>
						</div>
						<div class="blob">
							<div class="label">Current Profit</div>
							<div class="value profit"></div>
							<div class="eth">ETH</div>
						</div>
					</div>
					<table width=100%>
						<tr class="collateral hide">
							<td class="label">
								<div class="tipLeft" title="The amount of Ether that cannot be used as bankroll.">Collateral:</div>
							</td>
							<td class="value"></td>
							<td><div class="bar"><div class="inner-bar"></div></div></div>
						</tr>
						<tr class="bankroll">
							<td class="label">
								<div class="tipLeft" title="The amount of Ether to be used to stake games.">Bankroll:</div>
							</td>
							<td class="value"></td>
							<td width="100%"><div class="bar"><div class="inner-bar"></div></div></div>
						</tr>
						<tr class="balance">
							<td class="label">
								<div class="tipLeft" title="The total amount of Ether this contract has.">Balance:</div>
							</td>
							<td class="value"></td>
							<td><div class="bar"><div class="inner-bar"></div></div></div>
						</tr>
						<tr class="profit">
							<td class="label">
								<div class="tipLeft" title="Balance - (collateral + bankroll).">Profit:</div>
							</td>
							<td class="value"></td>
							<td><div class="bar"><div class="inner-bar"></div></div></div>
						</tr>
					</table>
					<div class="status">
						<div class="bubble profit hide">
							<div class="item">
								This contract can currently send <span class="amount"></span> to the Treasury.
							</div>
							<div class="item">
								All bankroll is available to be recalled.
							</div>
							<div class="item collateral hide">
								All collateral is covered.
							</div>
						</div>
						<div class="bubble loss hide">
							<div class="item">
								This contract needs <span class="amount"></span> more in order to have profits.
							</div>
							<div class="item">
								<span class="available"></span> of bankroll is available and can be recalled.
							</div>
							<div class="item collateral hide">
								All collateral is covered.
							</div>
						</div>
						<div class="bubble insolvant hide">
							<div class="item">
								Only <span class="amount"></span> of collateral is covered.
							</div>
							<div class="item">
								No bankroll can be removed until the collateral is covered.
							</div>
						</div>
					</div>
				</div>
			`);
			const $status = $e.find(".status");
			const $table = $e.find("table");
			
			// settimeout lets the width transitions take effect.
			setTimeout(() => {
				const balance = obj.balance;
				const collateral = obj.collateral;
				const bankroll = obj.bankroll;
				const profit = balance.minus(collateral.plus(bankroll));
				const bankrollAvailable = BigNumber.max(balance.minus(collateral), 0);

				const lossColor = (function(){
					function interp(p, color1, color2) {
						return color1.map((rgba, i) => {
							const v = rgba + p*(color2[i] - rgba);
							return i==3 ? v.toFixed(2) : Math.round(v);
						});
					}

					const p = profit.abs().div(bankroll);
					const c = interp(p, [0,0,0,.2], [255,0,0,.8]);
					return `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`;
				}());

				// update the blobs
				$e.find(".blob .total-bankrolled").text(util.toEthStrFixed(bankroll, 3, ""));
				$e.find(".blob .bankroll-available").text(util.toEthStrFixed(bankrollAvailable, 3, ""));
				$e.find(".blob .profit").text(util.toEthStrFixed(profit, 3, ""));

				// update the bubbles
				if (profit.gte(0)) {
					const $el = $status.find(".profit").show();
					$el.find(".amount").text(util.toEthStr(profit));
					if (collateral.gt(0)) $el.find(".collateral").show();
				} else if (profit.abs().lte(bankroll)) {
					const $el = $status.find(".loss").show();
					const bankrollPct = bankrollAvailable.div(bankroll).mul(100).toFixed(2);
					const bankrollStr = `${util.toEthStr(bankrollAvailable)} (${bankrollPct}%)`;
					$el.find(".available").text(bankrollStr);
					$el.find(".amount").text(util.toEthStr(profit.mul(-1)));
					$el.css("background", lossColor);
					if (collateral.gt(0)) $el.find(".collateral").show();
				} else {
					const $el = $status.find(".insolvant").show();
					const balancePct = balance.div(collateral).mul(100).toFixed(2);
					const balanceStr = `${util.toEthStr(balance)} (${balancePct}%)`;
					$el.find(".amount").text(balanceStr);
				}

				// draw the bars
				tippy($table.find(".label div").toArray(), {trigger: "mouseenter", placement: "left"});
				const max = BigNumber.max(balance, collateral.plus(bankroll));
				function toPct(v, offsetLeft){
					const thisMax = offsetLeft ? max.minus(offsetLeft) : max;
					return `${v.div(thisMax).mul(100).toFixed(2)}%`;
				}
				if (collateral.gt(0)) {
					$table.find(".collateral").show();
					$table.find(".collateral .value").text(util.toEthStr(collateral));
					$table.find(".collateral .inner-bar").width(toPct(collateral));
				}

				$table.find(".bankroll .value").text(util.toEthStr(bankroll));
				$table.find(".bankroll .inner-bar")
					.css("left", toPct(collateral))
					.width(toPct(bankroll));

				$table.find(".balance .value").text(util.toEthStr(balance));
				$table.find(".balance .inner-bar").width(toPct(balance));

				$table.find(".profit .value").text(util.toEthStr(profit));			
				if (profit.gte(0)) {
					$table.find(".profit .inner-bar")
						.css("left", toPct(collateral.plus(bankroll)))
						.width(toPct(profit))
						.css("background", "rgba(0,128,0,.8)");
				} else {
					// loss (or insolvant)
					$table.find(".profit .inner-bar")
						.css("left", toPct(balance))
						.width(toPct(max.minus(balance)))
						.css("background", lossColor);
					$table.find(".balance .bar").css("background", `rgba(0,0,0,.2)`);
				}
			}, 100);

			return $e;
		});
	}

	window.BankrollableUtil = {
		$getHealth: $getHealth
	};
}())