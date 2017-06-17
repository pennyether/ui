pragma solidity ^0.4.0;

import "./roles/UsingPennyAuctionController.sol";
import "./roles/UsingTreasury.sol";
import "./roles/UsingAdmin.sol";

/**
The MainController is aware of all game controllers and tells them what to do.
	It:
		- holds references to all game controllers, so that
		  a frontend can be displayed

		Admin only:
		- starts games, first by getting funds from treasury
		- tells controllers to update game statuses (eg, finish games)

		Owner only:
		- change PAC settings

For now, there is only one type of game controller, but there may be more
added in the future.  As such, it's best if the MainController contains zero state
so that migrating to another MainController is easy.
*/
//@createInterface
contract MainController is 
	UsingPennyAuctionController,
	UsingTreasury,
	UsingAdmin
{
	event Error(string msg);
	event PennyAuctionStarted(address addr, uint time);
	event UpdatedPennyAuctions(uint numAuctionsClosed, uint time);
	
	function MainController(address _registry)
		UsingPennyAuctionController(_registry)
		UsingTreasury(_registry)
		UsingAdmin(_registry) {}

	function() payable {}

	function createPennyAuction(uint _initialPrize,
	    					 	uint _bidPrice,
	    					 	uint _bidTimeS,
	    					 	uint _bidFeePct,
        					 	uint _auctionTimeS)
		fromAdmin
		returns (bool _success, address _pennyAuction)
	{
		// get wei from treasury, so we can pass to PAC
		getTreasury().fundMainController(_initialPrize);
		// attempt to start a new auction, passing it _initialPrize
		var(_tempSuccess, _pa) =
			getPennyAuctionController().startNewAuction.value(_initialPrize)(
				_initialPrize,
				_bidPrice,
				_bidTimeS,
				_bidFeePct,
				_auctionTimeS
			);
		if (!_tempSuccess) {
			Error("Unable to start a new auction");
			return;
		}

		return (true, _pa);
	}

	function updatePennyAuctions(uint _minFeeThreshold)
		fromAdmin
		returns (bool _success, bool _didUpdate)
	{
		IPennyAuctionController _pac = getPennyAuctionController();
		var (, _naa) = _pac.getNumActionableAuctions();
		var (, _af) = _pac.getAvailableFees();
		if (_naa > 0 || _af > _minFeeThreshold) {
			getPennyAuctionController().checkOpenAuctions();
			return (true, true);
		}
		return (true, false);
	}

	function changePennyAuctionSettings()
		fromOwner
		returns (bool _success)
	{
		return false;
	}


}