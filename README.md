# Penny Ether UI

Our UI is fully open source, with no external dependancies other than jQuery and Tippy.

## Running the UI

The UI is just standard html files. There's no build process at all.

Simply run a webserver whose root directory is `/dist`:

You can run a simple http server in node quite easily:

- Install `node` and `npm`
- `npm install -g http-server`
- `http-server /path/to/pennyether-ui/dist`

## Architecture

- Loader.js loads all scripts that are needed on every page
	- `ABI.js`
	- web3 (either browser or infura)
	- dependancies (jQuery, tippy, internal libs)
- Page scripts:
	- Automatically load singleton contract instances:
	  ```
		Loader.require("tr","comp").then((tr,comp)=>{
			// All required JS files loaded.
			// Treasury and Comptroller loaded from Registry.
			// do stuff here...
		});
	  ```
	- When blockchain state changes:
	  ```
		ethUtil.onStateChanged((state)=>{
			if (!state.isConnected) return;
			// user, network, or block changed. do stuff.
		});
	  ```
- `NiceWeb3` wraps Web3. It's a lot nicer than web3.
	- Promisifies everything
	- Decodes events nicely
	- Makes getting logs easy and compatible with MetaMask
- `EthUtil` monitors the current web3 connection
	- Notifies subscribers when state changes (isConnected, account, network, block)
	- Allows promisified calls to web3.eth
	- Allows promisified transactions (resolved when receipt received)
	- Some other goodies
- `EthStatus` shows the status of web3, and any pending transactions.
	- A nice UI to show current Ethereum connection status
	- Shows pending transactions, with lots of details

## Developer Notes

- Anytime contracts are changed:
	- Execute `scripts/generate_abis.js /path/to/build`
	- This will update ABIs.js
- **When running with a local Ganache**:
	- anytime you restart Ganache, log out of MetaMask, log back in.
	- select main network, then select private network.
	- otherwise there may be silent nonce issues (Ganache won't mine)

## Todo

- At some point we plan on running this entirely on IPFS.
- Versioning may become an issue in the future. For now, we instruct users to do a hard refresh (cmd+shift+r) if anything is acting up.