pragma solidity ^0.4.0;

// Holds the house tokens, receives dividends.
// Cannot ever transfer or burn the tokens.
contract Locker {
	PyramidToken public token;
	address public owner;
	function () payable public {}
    function Locker(address _token, address _owner) public {
		token = PyramidToken(_token);
		owner = _owner;
	}
	function collectDividends() public {
		token.collectDividends();
		owner.transfer(this.balance);
	}
}

/*
	Holds all ETH.  Only ever sends ETH out:
		1) When somebody burns their tokens (sends refund)
		2) When somebody buys tokens (sends dividends)

	To prevent rounding errors, minimum buy-in is 1,000,000 wei
	Which is 0.000000001 ETH
*/
contract PyramidScheme {
	uint public amtIn;
	uint public amtOut;
	PyramidToken public token = new PyramidToken();
	Locker public locker = new Locker(token, msg.sender);
	
	function PyramidScheme() public payable {
	    token.mintTokens(locker, 1);
	}

	// Mints tokens for the user and locker.
	// Sends 1% to the token as dividends, passing all gas (*giggle*).
	function buyTokens() public payable {
		require(msg.value >= 10000000);
		uint _dividend = msg.value / 100;
		require(token.call.value(_dividend)());
		amtIn += msg.value - _dividend;
		token.mintTokens(msg.sender, msg.value);
		token.mintTokens(locker, msg.value / 20);
	}

	// Burns the tokens for the user and locker.
	// Refunds the user 99% of burnt tokens.
	// If passed too much, will burn entire balance.
	function burnTokens(uint _amt) public {
		require(_amt >= 1000000);
		if (_amt > token.balanceOf(msg.sender))	_amt = token.balanceOf(msg.sender);
		token.burnTokens(msg.sender, _amt);
		token.burnTokens(locker, _amt / 20);
		uint _refund = (_amt * 99) / 100;
		amtOut += _refund;
		msg.sender.transfer(_refund);
	}

	function getDividendsPaid() public constant returns (uint _amount) {
		return token.totalDividends();
	}
}

contract PyramidToken {
	// This is PyramidToken.  Can call .mintTokens() and .burnTokens().
	address public owner = msg.sender;
	modifier onlyOwner(){ require(msg.sender==owner); _; }

	/* STANDARD ERC20 TOKEN */
	string public name = "PyramidScheme";
	string public symbol = "SCAM";
	uint8 public decimals = 18;
	uint public totalSupply;
	event Transfer(address indexed from, address indexed to, uint amount);
	event Approval(address indexed owner, address indexed spender, uint amount);

	// non public state variables
	mapping (address => uint) balances;
	mapping (address => mapping (address => uint)) allowed;
	event TransferFrom(address indexed spender, address indexed from, address indexed to, uint amount);

	// Dividend Stuff
	// - Each time a new deposit is made, totalWeiPerToken is incremented based
	//   on the weiPerToken of the dividend.
	//
	// - .getUncreditedDividends() calculates how much wei a balance should be credited.
	//   this is: (totalWeiPerToken - lastWeiPerToken[account]) * balance[account]
	//
	// - .updateCreditedDividends(_account) will increment creditedDividends[account]
	//   by the value of .getUncreditedDividends().  It then sets lastWeiPerToken[account]
	//   to the current totalWeiPerToken, since they are all square.
	//   This is called before an account sends or receive tokens or if they call
	//   collectDividends().
	//
	// - To reduce rounding errors, totalWeiPerToken is multiplied by BIG_NUMBER;
	//   it is divided away in .getUncreditedDividends().
	uint constant BIG_NUMBER = 1e32;
	uint public totalDividends;
	uint public collectedDividends;
	uint public totalWeiPerToken;
	mapping (address => uint) public creditedDividends;
	mapping (address => uint) public lastWeiPerToken;
	event CollectedDividends(address indexed account, uint amount);
	event DividendReceived(address indexed sender, uint amount);

	function PyramidToken() public {}

	// Upon receiving payment, increment totalWeiPerToken.
	function () payable public {
		// BIG_NUMBER is 1e32 -- no overflow unless we get 1e45 wei (1e27 ETH)
		totalWeiPerToken += (msg.value * BIG_NUMBER) / totalSupply;
		totalDividends += msg.value;
		DividendReceived(msg.sender, msg.value);
	}

	// ERC20
	function transfer(address _to, uint _value)
		public
	{
		_transfer(msg.sender, _to, _value);
	}

	// ERC20
	function transferFrom(address _from, address _to, uint256 _value)
		public
		returns (bool success)
	{
		require(allowed[_from][msg.sender] >= _value);
		allowed[_from][msg.sender] -= _value;
		TransferFrom(msg.sender, _from, _to, _value);
		_transfer(_from, _to, _value);
		return true;
	}

	// ERC20
	function approve(address _spender, uint _value)
		public
		returns (bool success)
	{
		allowed[msg.sender][_spender] = _value;
		Approval(msg.sender, _spender, _value);
		return true;
	}

	// ERC20
	function allowance(address _owner, address _spender)
		public
		constant
		returns (uint remaining)
	{
		return allowed[_owner][_spender];
	}

	// ERC20
	function balanceOf(address _owner)
		public
		constant
		returns (uint balance)
	{
		return balances[_owner];
	}

	function mintTokens(address _to, uint _amount)
		onlyOwner
		public
	{
		updateCreditedDividends(_to);
		totalSupply += _amount;
		balances[_to] += _amount;
	}
	
	function burnTokens(address _account, uint _amount)
	    onlyOwner
	    public
	{
	    require(balances[_account] >= _amount);
	    updateCreditedDividends(_account);
	    balances[_account] -= _amount;
	    totalSupply -= _amount;
	}

	// Normal ERC20 transfer, except before transferring
	// it credits dividends for the sender and receiver.
	function _transfer(address _from, address _to, uint _value)
		private
	{
		// check for overflow and for sufficient funds
		require(balances[_to] + _value > balances[_to]);
		require(balances[_from] >= _value);
		
		// Credit _to and _from with dividends before transferring.
		// See: updatedCreditedDividends() for more info.
		updateCreditedDividends(_to);
		updateCreditedDividends(_from);
		balances[_from] -= _value;
		balances[_to] += _value;
		Transfer(_from, _to, _value);
	}

	// Updates creditedDividends and sends them all to owner.
	function collectDividends()
		public
	{
		// update creditedDividends, store amount, and zero it.
		updateCreditedDividends(msg.sender);
		uint _amount = creditedDividends[msg.sender];
		creditedDividends[msg.sender] = 0;
		CollectedDividends(msg.sender, _amount);
		msg.sender.transfer(_amount);
	}

	// Credits _account with whatever dividends they haven't yet been credited.
	// This needs to be called before a user's balance changes to ensure their
	// "lastWeiPerToken" is always accurate.  If this isn't called, a user
	// could simply transfer a large amount of tokens and receive a large dividend
	// (or conversely transfer out tokens and receive no dividend).
	function updateCreditedDividends(address _account)
		private
	{
		creditedDividends[_account] += getUncreditedDividends(_account);
		lastWeiPerToken[_account] = totalWeiPerToken;
	}

	// For a given account, returns how many Wei they haven't yet been credited.
	function getUncreditedDividends(address _account)
		private
		constant
		returns (uint _amount)
	{
		// This cannot overflow because totalWeiPerToken is already divided by BIG_NUMBER
		uint _weiPerToken = totalWeiPerToken - lastWeiPerToken[_account];
		return (_weiPerToken * balances[_account]) / BIG_NUMBER;
	}

	// Returns how many wei a call to .collectDividends() would transfer.
	function getCollectableDividends(address _account)
		public
		constant
		returns (uint _amount)
	{
		return getUncreditedDividends(_account) + creditedDividends[_account];
	}
}