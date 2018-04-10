Loader.require("pac")
.then(function(pac){
	if (!BankrollableUtil) throw new Error("This requires BankrollableUtil to be loaded.");

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
			$health: BankrollableUtil.$getHealth(pac)
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
			$e.find(".health-ctnr").append(obj.$health);
		}
	}
});