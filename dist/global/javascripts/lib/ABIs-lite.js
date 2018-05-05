(function(){
        window.ABIs = {
  "Comptroller": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "capitalPctBips",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "endSale",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "capitalFundable",
        "outputs": [
          {
            "name": "_amt",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "wasSoftCapMet",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "wallet",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "refund",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "treasury",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "wasSaleEnded",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "wasSaleStarted",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "amtFunded",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "softCap",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_dateStarted",
            "type": "uint256"
          },
          {
            "name": "_dateEnded",
            "type": "uint256"
          },
          {
            "name": "_softCap",
            "type": "uint256"
          },
          {
            "name": "_hardCap",
            "type": "uint256"
          },
          {
            "name": "_bonusCap",
            "type": "uint256"
          },
          {
            "name": "_capitalPctBips",
            "type": "uint256"
          }
        ],
        "name": "initSale",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "fundCapital",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "fund",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "dateSaleEnded",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_ethAmt",
            "type": "uint256"
          }
        ],
        "name": "getTokensMintedAt",
        "outputs": [
          {
            "name": "_numTokens",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_amt",
            "type": "uint256"
          }
        ],
        "name": "getTokensFromEth",
        "outputs": [
          {
            "name": "_numTokens",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalRaised",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "locker",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "dateSaleStarted",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bonusCap",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "hardCap",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "token",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_wallet",
            "type": "address"
          },
          {
            "name": "_treasury",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "wallet",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "treasury",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "token",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "locker",
            "type": "address"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "SaleInitalized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "SaleStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "SaleSuccessful",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "SaleFailed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "funded",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "numTokens",
            "type": "uint256"
          }
        ],
        "name": "BuyTokensSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reason",
            "type": "string"
          }
        ],
        "name": "BuyTokensFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "refund",
            "type": "uint256"
          }
        ],
        "name": "UserRefunded",
        "type": "event"
      }
    ]
  },
  "CustodialWallet": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_data",
            "type": "bytes"
          },
          {
            "name": "_msg",
            "type": "string"
          }
        ],
        "name": "doCall",
        "outputs": [
          {
            "name": "_success",
            "type": "bool"
          }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "custodian",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "supervisor",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_newSupervisor",
            "type": "address"
          },
          {
            "name": "_newOwner",
            "type": "address"
          }
        ],
        "name": "setSupervisor",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_newCustodian",
            "type": "address"
          },
          {
            "name": "_newSupervisor",
            "type": "address"
          }
        ],
        "name": "setCustodian",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_recipient",
            "type": "address"
          },
          {
            "name": "_newSupervisor",
            "type": "address"
          }
        ],
        "name": "collect",
        "outputs": [
          {
            "name": "_success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_custodian",
            "type": "address"
          },
          {
            "name": "_supervisor",
            "type": "address"
          },
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "CallSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "CallFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amt",
            "type": "uint256"
          }
        ],
        "name": "CollectSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amt",
            "type": "uint256"
          }
        ],
        "name": "CollectFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "prevAddr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "newAddr",
            "type": "address"
          }
        ],
        "name": "CustodianChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "prevAddr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "newAddr",
            "type": "address"
          }
        ],
        "name": "SupervisorChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "prevAddr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "newAddr",
            "type": "address"
          }
        ],
        "name": "OwnerChanged",
        "type": "event"
      }
    ]
  },
  "DividendToken": {
    "abi": [
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "creditedPoints",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_spender",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_from",
            "type": "address"
          },
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isFrozen",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          },
          {
            "name": "_data",
            "type": "bytes"
          }
        ],
        "name": "transferAndCall",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "mint",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "collectOwedDividends",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "dividendsTotal",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "dividendsCollected",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_account",
            "type": "address"
          }
        ],
        "name": "getOwedDividends",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_account",
            "type": "address"
          },
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "lastPointsPerToken",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_isFrozen",
            "type": "bool"
          }
        ],
        "name": "freeze",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalBurned",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          },
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalPointsPerToken",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_name",
            "type": "string"
          },
          {
            "name": "_symbol",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Frozen",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "UnFrozen",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalSupply",
            "type": "uint256"
          }
        ],
        "name": "TokensMinted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "newTotalSupply",
            "type": "uint256"
          }
        ],
        "name": "TokensBurned",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "CollectedDividends",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "DividendReceived",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "AllowanceUsed",
        "type": "event"
      }
    ]
  },
  "DividendTokenLocker": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "tokensUnvested",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "tokensAvailable",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "tokensVested",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "tokens",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_numTokens",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "vestingStartDay",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_numTokens",
            "type": "uint256"
          },
          {
            "name": "_vestingDays",
            "type": "uint256"
          }
        ],
        "name": "startVesting",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "vestingAmt",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "collect",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "vestingDays",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "token",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_token",
            "type": "address"
          },
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "comptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "token",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "numTokens",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "vestingDays",
            "type": "uint256"
          }
        ],
        "name": "VestingStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "numTokens",
            "type": "uint256"
          }
        ],
        "name": "Transferred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "Collected",
        "type": "event"
      }
    ]
  },
  "InstaDice": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollAvailable",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankroll",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addBankroll",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numUsers",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profits",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "maxBet",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "payoutPreviousRoll",
        "outputs": [
          {
            "name": "_success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "comment": "Pays out the winnings from the previous roll."
      },
      {
        "constant": true,
        "inputs": [],
        "name": "maxNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getTreasury",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollerTable",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          },
          {
            "name": "",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "effectiveMaxBet",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "bankrolledBy",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "version",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "minNumber",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "ledger",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getRegistry",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "sendProfits",
        "outputs": [
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_minBet",
            "type": "uint64"
          },
          {
            "name": "_maxBet",
            "type": "uint64"
          },
          {
            "name": "_minNumber",
            "type": "uint8"
          },
          {
            "name": "_maxNumber",
            "type": "uint8"
          },
          {
            "name": "_feeBips",
            "type": "uint16"
          }
        ],
        "name": "changeSettings",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCollateral",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_number",
            "type": "uint8"
          }
        ],
        "name": "roll",
        "outputs": [
          {
            "name": "_success",
            "type": "bool"
          }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function",
        "comment": "Rolls the dice, if number lands <= number, you win."
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_callbackFn",
            "type": "string"
          }
        ],
        "name": "removeBankroll",
        "outputs": [
          {
            "name": "_recalled",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getAdmin",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_blockNumber",
            "type": "uint32"
          },
          {
            "name": "_id",
            "type": "uint32"
          }
        ],
        "name": "computeResult",
        "outputs": [
          {
            "name": "_result",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_bet",
            "type": "uint256"
          },
          {
            "name": "_number",
            "type": "uint256"
          }
        ],
        "name": "computePayout",
        "outputs": [
          {
            "name": "_wei",
            "type": "uint72"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalWagered",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "removeFromWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "curMaxBet",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "whitelist",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "minBet",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsTotal",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "users",
        "outputs": [
          {
            "name": "id",
            "type": "uint32"
          },
          {
            "name": "r_id",
            "type": "uint32"
          },
          {
            "name": "r_block",
            "type": "uint32"
          },
          {
            "name": "r_number",
            "type": "uint8"
          },
          {
            "name": "r_payout",
            "type": "uint72"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalWon",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getWhitelistOwner",
        "outputs": [
          {
            "name": "_wlOwner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "feeBips",
        "outputs": [
          {
            "name": "",
            "type": "uint16"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "addToWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsSent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numRolls",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_registry",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "admin",
            "type": "address"
          }
        ],
        "name": "SettingsChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "bet",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "number",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "payout",
            "type": "uint256"
          }
        ],
        "name": "RollWagered",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          },
          {
            "indexed": false,
            "name": "bet",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "number",
            "type": "uint8"
          }
        ],
        "name": "RollRefunded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "result",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "payout",
            "type": "uint256"
          }
        ],
        "name": "RollFinalized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "PayoutError",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "treasury",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ProfitsSent",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "AddedToWhitelist",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "RemovedFromWhitelist",
        "type": "event"
      }
    ]
  },
  "MonarchyGame": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "decree",
        "outputs": [
          {
            "name": "",
            "type": "bytes23"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalFees",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isPaid",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_gasLimit",
            "type": "uint256"
          }
        ],
        "name": "sendPrize",
        "outputs": [
          {
            "name": "_success",
            "type": "bool"
          },
          {
            "name": "_prizeSent",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "comment": "Sends the prize money to the winner of the game."
      },
      {
        "constant": true,
        "inputs": [],
        "name": "reignBlocks",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "prizeIncr",
        "outputs": [
          {
            "name": "",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getBlocksRemaining",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "initialPrize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "collector",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "monarch",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "blockEnded",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "fees",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "prevBlock",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "isEnded",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numOverthrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_decree",
            "type": "bytes23"
          }
        ],
        "name": "overthrow",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function",
        "comment": "Overthrows the current Monarch, and announces a decree. Refunds if for any reason sender does not become the new Monarch."
      },
      {
        "constant": true,
        "inputs": [],
        "name": "fee",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "sendFees",
        "outputs": [
          {
            "name": "_feesSent",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "prize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_collector",
            "type": "address"
          },
          {
            "name": "_initialPrize",
            "type": "uint256"
          },
          {
            "name": "_fee",
            "type": "uint256"
          },
          {
            "name": "_prizeIncr",
            "type": "int256"
          },
          {
            "name": "_reignBlocks",
            "type": "uint256"
          },
          {
            "name": "_initialBlocks",
            "type": "uint256"
          }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback",
        "comment": "Overthrows the current Monarch. Refunds if for any reason sender does not become the new Monarch."
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "SendPrizeError",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "initialBlocks",
            "type": "uint256"
          }
        ],
        "name": "Started",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "newMonarch",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "decree",
            "type": "bytes23"
          },
          {
            "indexed": true,
            "name": "prevMonarch",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "fee",
            "type": "uint256"
          }
        ],
        "name": "OverthrowOccurred",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          },
          {
            "indexed": true,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "OverthrowRefundSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          },
          {
            "indexed": true,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "OverthrowRefundFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "gasLimit",
            "type": "uint256"
          }
        ],
        "name": "SendPrizeSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "redeemer",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "gasLimit",
            "type": "uint256"
          }
        ],
        "name": "SendPrizeFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "collector",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "FeesSent",
        "type": "event"
      }
    ]
  },
  "MonarchyController": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollAvailable",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankroll",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalFees",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addBankroll",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getNumEndableGames",
        "outputs": [
          {
            "name": "_count",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalPrizes",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "refreshGames",
        "outputs": [
          {
            "name": "_numGamesEnded",
            "type": "uint256"
          },
          {
            "name": "_feesCollected",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profits",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDailyLimitRemaining",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "name": "getIsEnabled",
        "outputs": [
          {
            "name": "",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numEndedGames",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getTreasury",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getFirstStartableIndex",
        "outputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getAvailableFees",
        "outputs": [
          {
            "name": "_feesAvailable",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDailyLimitUsed",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollerTable",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          },
          {
            "name": "",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "bankrolledBy",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numDefinedGames",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "version",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "ledger",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getRegistry",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "sendProfits",
        "outputs": [
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "name": "startDefinedGame",
        "outputs": [
          {
            "name": "_game",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCollateral",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          },
          {
            "name": "_bool",
            "type": "bool"
          }
        ],
        "name": "enableDefinedGame",
        "outputs": [
          {
            "name": "_success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_callbackFn",
            "type": "string"
          }
        ],
        "name": "removeBankroll",
        "outputs": [
          {
            "name": "_recalled",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getAdmin",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "name": "getInitialPrize",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "name": "startDefinedGameManually",
        "outputs": [
          {
            "name": "_game",
            "type": "address"
          }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "removeFromWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "whitelist",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsTotal",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "name": "getIsStartable",
        "outputs": [
          {
            "name": "_isStartable",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "name": "getGame",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDailyLimit",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "setDailyLimit",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          },
          {
            "name": "_summary",
            "type": "string"
          },
          {
            "name": "_initialPrize",
            "type": "uint256"
          },
          {
            "name": "_fee",
            "type": "uint256"
          },
          {
            "name": "_prizeIncr",
            "type": "int256"
          },
          {
            "name": "_reignBlocks",
            "type": "uint256"
          },
          {
            "name": "_initialBlocks",
            "type": "uint256"
          }
        ],
        "name": "editDefinedGame",
        "outputs": [
          {
            "name": "_success",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getWhitelistOwner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "endedGames",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getMonarchyFactory",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numActiveGames",
        "outputs": [
          {
            "name": "_count",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalOverthrows",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "addToWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsSent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "definedGames",
        "outputs": [
          {
            "name": "game",
            "type": "address"
          },
          {
            "name": "isEnabled",
            "type": "bool"
          },
          {
            "name": "summary",
            "type": "string"
          },
          {
            "name": "initialPrize",
            "type": "uint256"
          },
          {
            "name": "fee",
            "type": "uint256"
          },
          {
            "name": "prizeIncr",
            "type": "int256"
          },
          {
            "name": "reignBlocks",
            "type": "uint256"
          },
          {
            "name": "initialBlocks",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_num",
            "type": "uint256"
          }
        ],
        "name": "recentlyEndedGames",
        "outputs": [
          {
            "name": "_addresses",
            "type": "address[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_registry",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newValue",
            "type": "uint256"
          }
        ],
        "name": "DailyLimitChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "Error",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "index",
            "type": "uint256"
          }
        ],
        "name": "DefinedGameEdited",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "index",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "isEnabled",
            "type": "bool"
          }
        ],
        "name": "DefinedGameEnabled",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "index",
            "type": "uint256"
          }
        ],
        "name": "DefinedGameFailedCreation",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "index",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "initialPrize",
            "type": "uint256"
          }
        ],
        "name": "GameStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "index",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "winner",
            "type": "address"
          }
        ],
        "name": "GameEnded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "FeesCollected",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "treasury",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ProfitsSent",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "AddedToWhitelist",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "RemovedFromWhitelist",
        "type": "event"
      }
    ]
  },
  "MonarchyFactory": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "lastCreatedGame",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_initialPrize",
            "type": "uint256"
          },
          {
            "name": "_fee",
            "type": "uint256"
          },
          {
            "name": "_prizeIncr",
            "type": "int256"
          },
          {
            "name": "_reignBlocks",
            "type": "uint256"
          },
          {
            "name": "_initialBlocks",
            "type": "uint256"
          }
        ],
        "name": "createGame",
        "outputs": [
          {
            "name": "_game",
            "type": "address"
          }
        ],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCollector",
        "outputs": [
          {
            "name": "_collector",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "version",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getRegistry",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getMonarchyController",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_registry",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "collector",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "initialPrize",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "fee",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "prizeIncr",
            "type": "int256"
          },
          {
            "indexed": false,
            "name": "reignBlocks",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "initialBlocks",
            "type": "uint256"
          }
        ],
        "name": "GameCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      }
    ]
  },
  "Registry": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "_name",
            "type": "bytes32"
          }
        ],
        "name": "unregister",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "bytes32"
          }
        ],
        "name": "entries",
        "outputs": [
          {
            "name": "addr",
            "type": "address"
          },
          {
            "name": "next",
            "type": "bytes32"
          },
          {
            "name": "prev",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "mappings",
        "outputs": [
          {
            "name": "_names",
            "type": "bytes32[]"
          },
          {
            "name": "_addresses",
            "type": "address[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "size",
        "outputs": [
          {
            "name": "_size",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_name",
            "type": "bytes32"
          }
        ],
        "name": "addressOf",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_name",
            "type": "bytes32"
          },
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "register",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          }
        ],
        "name": "nameOf",
        "outputs": [
          {
            "name": "_name",
            "type": "bytes32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "name",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "name": "addr",
            "type": "address"
          }
        ],
        "name": "Registered",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "name",
            "type": "bytes32"
          }
        ],
        "name": "Unregistered",
        "type": "event"
      }
    ]
  },
  "TaskManager": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "refreshMonarchyGamesReward",
        "outputs": [
          {
            "name": "_reward",
            "type": "uint256"
          },
          {
            "name": "_numEndable",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollAvailable",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankroll",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_bips",
            "type": "uint256"
          }
        ],
        "name": "setIssueDividendReward",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addBankroll",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profits",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDailyLimitRemaining",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "issueDividendReward",
        "outputs": [
          {
            "name": "_reward",
            "type": "uint256"
          },
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getTreasury",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_bankrollable",
            "type": "address"
          }
        ],
        "name": "sendProfitsReward",
        "outputs": [
          {
            "name": "_reward",
            "type": "uint256"
          },
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "refreshMonarchyGames",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDailyLimitUsed",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollerTable",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          },
          {
            "name": "",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "bankrolledBy",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "version",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "startMonarchyGameReward",
        "outputs": [
          {
            "name": "_reward",
            "type": "uint256"
          },
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "ledger",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getRegistry",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "sendProfits",
        "outputs": [
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCollateral",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "issueDividendRewardBips",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getMonarchyController",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_callbackFn",
            "type": "string"
          }
        ],
        "name": "removeBankroll",
        "outputs": [
          {
            "name": "_recalled",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getAdmin",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "removeFromWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "whitelist",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "monarchyStartReward",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsTotal",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDailyLimit",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalRewarded",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "name": "setDailyLimit",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_bips",
            "type": "uint256"
          }
        ],
        "name": "setSendProfitsReward",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "sendProfitsRewardBips",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getWhitelistOwner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_index",
            "type": "uint256"
          }
        ],
        "name": "startMonarchyGame",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_bankrollable",
            "type": "address"
          }
        ],
        "name": "doSendProfits",
        "outputs": [
          {
            "name": "_reward",
            "type": "uint256"
          },
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "addToWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsSent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "monarchyEndReward",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_startReward",
            "type": "uint256"
          },
          {
            "name": "_endReward",
            "type": "uint256"
          }
        ],
        "name": "setMonarchyRewards",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "doIssueDividend",
        "outputs": [
          {
            "name": "_reward",
            "type": "uint256"
          },
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_registry",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newValue",
            "type": "uint256"
          }
        ],
        "name": "DailyLimitChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newValue",
            "type": "uint256"
          }
        ],
        "name": "IssueDividendRewardChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "newValue",
            "type": "uint256"
          }
        ],
        "name": "SendProfitsRewardChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "startReward",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "endReward",
            "type": "uint256"
          }
        ],
        "name": "MonarchyRewardsChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "caller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "TaskError",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "caller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reward",
            "type": "uint256"
          }
        ],
        "name": "RewardSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "caller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "reward",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "RewardFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "treasury",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "profitsSent",
            "type": "uint256"
          }
        ],
        "name": "IssueDividendSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankrollable",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "profitsSent",
            "type": "uint256"
          }
        ],
        "name": "SendProfitsSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "initialPrize",
            "type": "uint256"
          }
        ],
        "name": "MonarchyGameStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "numEnded",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "feesCollected",
            "type": "uint256"
          }
        ],
        "name": "MonarchyGamesRefreshed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "treasury",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ProfitsSent",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "AddedToWhitelist",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "RemovedFromWhitelist",
        "type": "event"
      }
    ]
  },
  "Treasury": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "capitalAllocated",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "name": "requests",
        "outputs": [
          {
            "name": "id",
            "type": "uint32"
          },
          {
            "name": "typeId",
            "type": "uint8"
          },
          {
            "name": "dateCreated",
            "type": "uint32"
          },
          {
            "name": "dateCancelled",
            "type": "uint32"
          },
          {
            "name": "dateExecuted",
            "type": "uint32"
          },
          {
            "name": "createdMsg",
            "type": "string"
          },
          {
            "name": "cancelledMsg",
            "type": "string"
          },
          {
            "name": "executedMsg",
            "type": "string"
          },
          {
            "name": "executedSuccessfully",
            "type": "bool"
          },
          {
            "name": "target",
            "type": "address"
          },
          {
            "name": "value",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          }
        ],
        "name": "executeRequest",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "capitalLedger",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numCancelledRequests",
        "outputs": [
          {
            "name": "_num",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "TIMEOUT_TIME",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "curRequestId",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profits",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "MAX_PENDING_REQUESTS",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "capitalAllocation",
        "outputs": [
          {
            "name": "_addresses",
            "type": "address[]"
          },
          {
            "name": "_amounts",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addCapital",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "WAITING_TIME",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "issueDividend",
        "outputs": [
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_comptroller",
            "type": "address"
          }
        ],
        "name": "initComptroller",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_requestId",
            "type": "uint32"
          }
        ],
        "name": "isRequestExecutable",
        "outputs": [
          {
            "name": "_isExecutable",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getRegistry",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "comptroller",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "cancelledRequestIds",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getAdmin",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "completedRequestIds",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_typeId",
            "type": "uint256"
          },
          {
            "name": "_target",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          },
          {
            "name": "_msg",
            "type": "string"
          }
        ],
        "name": "createRequest",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "capitalRaisedTarget",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "pendingRequestIds",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "capitalAllocatedTo",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsTotal",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "capitalNeeded",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numPendingRequests",
        "outputs": [
          {
            "name": "_num",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          },
          {
            "name": "_msg",
            "type": "string"
          }
        ],
        "name": "cancelRequest",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "capital",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_requestId",
            "type": "uint32"
          }
        ],
        "name": "getRequest",
        "outputs": [
          {
            "name": "_id",
            "type": "uint32"
          },
          {
            "name": "_typeId",
            "type": "uint8"
          },
          {
            "name": "_target",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          },
          {
            "name": "_executedSuccessfully",
            "type": "bool"
          },
          {
            "name": "_dateCreated",
            "type": "uint32"
          },
          {
            "name": "_dateCancelled",
            "type": "uint32"
          },
          {
            "name": "_dateExecuted",
            "type": "uint32"
          },
          {
            "name": "_createdMsg",
            "type": "string"
          },
          {
            "name": "_cancelledMsg",
            "type": "string"
          },
          {
            "name": "_executedMsg",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsSendable",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsSent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "capitalRaised",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numCompletedRequests",
        "outputs": [
          {
            "name": "_num",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_registry",
            "type": "address"
          },
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "comptroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "token",
            "type": "address"
          }
        ],
        "name": "ComptrollerSet",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "CapitalAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "recipient",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "CapitalRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "CapitalRaised",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "sender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ProfitsReceived",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankrollable",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ExecutedSendCapital",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankrollable",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ExecutedRecallCapital",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ExecutedRaiseCapital",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ExecutedDistributeCapital",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "token",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "DividendSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "DividendFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "typeId",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "target",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "RequestCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "typeId",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "target",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "RequestCancelled",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "typeId",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "target",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "success",
            "type": "bool"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "RequestExecuted",
        "type": "event"
      }
    ]
  },
  "VideoPoker": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollAvailable",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankroll",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "bet",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function",
        "comment": "Starts a new hand using ETH sent."
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          }
        ],
        "name": "getDHandRank",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addBankroll",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "curUserId",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "name": "userAddresses",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          }
        ],
        "name": "getDHand",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profits",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "maxBet",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getTreasury",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addCredits",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          }
        ],
        "name": "getIHand",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "userIds",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollerTable",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          },
          {
            "name": "",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "effectiveMaxBet",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "bankrolledBy",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "version",
        "outputs": [
          {
            "name": "",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "ledger",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getRegistry",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "sendProfits",
        "outputs": [
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "curId",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCollateral",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amt",
            "type": "uint256"
          }
        ],
        "name": "cashOut",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          },
          {
            "name": "_hashCheck",
            "type": "bytes32"
          }
        ],
        "name": "betFromGame",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "comment": "Starts a new game using credits from a winning game. Credits the remaining winnings, if any, to the user."
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_callbackFn",
            "type": "string"
          }
        ],
        "name": "removeBankroll",
        "outputs": [
          {
            "name": "_recalled",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getAdmin",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_hand",
            "type": "uint32"
          }
        ],
        "name": "getHandRank",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCurPayTable",
        "outputs": [
          {
            "name": "",
            "type": "uint16[12]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "curPayTableId",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalWagered",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "removeFromWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "curMaxBet",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "whitelist",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "minBet",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_bet",
            "type": "uint64"
          }
        ],
        "name": "betWithCredits",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "comment": "Starts a new hand using the user's credits."
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsTotal",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_hand",
            "type": "uint32"
          }
        ],
        "name": "handToCards",
        "outputs": [
          {
            "name": "_cards",
            "type": "uint8[5]"
          }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          },
          {
            "name": "_hashCheck",
            "type": "bytes32"
          }
        ],
        "name": "finalize",
        "outputs": [
          {
            "name": "_didFinalize",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "comment": "Credits the user any winnings for the hand."
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalWon",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_minBet",
            "type": "uint64"
          },
          {
            "name": "_maxBet",
            "type": "uint64"
          },
          {
            "name": "_payTableId",
            "type": "uint8"
          }
        ],
        "name": "changeSettings",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalCredits",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getWhitelistOwner",
        "outputs": [
          {
            "name": "_wlOwner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_rf",
            "type": "uint16"
          },
          {
            "name": "_sf",
            "type": "uint16"
          },
          {
            "name": "_fk",
            "type": "uint16"
          },
          {
            "name": "_fh",
            "type": "uint16"
          },
          {
            "name": "_fl",
            "type": "uint16"
          },
          {
            "name": "_st",
            "type": "uint16"
          },
          {
            "name": "_tk",
            "type": "uint16"
          },
          {
            "name": "_tp",
            "type": "uint16"
          },
          {
            "name": "_jb",
            "type": "uint16"
          }
        ],
        "name": "addPayTable",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_id",
            "type": "uint32"
          },
          {
            "name": "_draws",
            "type": "uint8"
          },
          {
            "name": "_hashCheck",
            "type": "bytes32"
          }
        ],
        "name": "draw",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function",
        "comment": "Updates the user's hand by discarding and redrawing selected cards. This is passed \"hashCheck\" to ensure the user is drawing against the expected hand. For example, there may be a blockchain re-org and the user may not want to draw cards against a different hand."
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_hash",
            "type": "uint256"
          }
        ],
        "name": "getHand",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_hash",
            "type": "uint256"
          },
          {
            "name": "_hand",
            "type": "uint32"
          },
          {
            "name": "_draws",
            "type": "uint256"
          }
        ],
        "name": "drawToHand",
        "outputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "payable": false,
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint32"
          }
        ],
        "name": "games",
        "outputs": [
          {
            "name": "userId",
            "type": "uint32"
          },
          {
            "name": "bet",
            "type": "uint64"
          },
          {
            "name": "payTableId",
            "type": "uint16"
          },
          {
            "name": "iBlock",
            "type": "uint32"
          },
          {
            "name": "iHand",
            "type": "uint32"
          },
          {
            "name": "draws",
            "type": "uint8"
          },
          {
            "name": "dBlock",
            "type": "uint32"
          },
          {
            "name": "dHand",
            "type": "uint32"
          },
          {
            "name": "handRank",
            "type": "uint8"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "addToWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsSent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "numPayTables",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_payTableId",
            "type": "uint16"
          }
        ],
        "name": "getPayTable",
        "outputs": [
          {
            "name": "",
            "type": "uint16[12]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "credits",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_registry",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          }
        ],
        "name": "Created",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "payTableId",
            "type": "uint256"
          }
        ],
        "name": "PayTableAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "admin",
            "type": "address"
          }
        ],
        "name": "SettingsChanged",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "bet",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "payTableId",
            "type": "uint256"
          }
        ],
        "name": "BetSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "bet",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "BetFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "iHand",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "draws",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "warnCode",
            "type": "uint8"
          }
        ],
        "name": "DrawSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "draws",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "DrawFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "dHand",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "handRank",
            "type": "uint8"
          },
          {
            "indexed": false,
            "name": "payout",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "warnCode",
            "type": "uint8"
          }
        ],
        "name": "FinalizeSuccess",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "msg",
            "type": "string"
          }
        ],
        "name": "FinalizeFailure",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "CreditsAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "id",
            "type": "uint32"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "CreditsUsed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "user",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "CreditsCashedout",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "treasury",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ProfitsSent",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "AddedToWhitelist",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "RemovedFromWhitelist",
        "type": "event"
      }
    ]
  },
  "Ledger": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "total",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          },
          {
            "name": "_amt",
            "type": "uint256"
          }
        ],
        "name": "subtract",
        "outputs": [
          {
            "name": "_amtRemoved",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "_balance",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "balances",
        "outputs": [
          {
            "name": "_addresses",
            "type": "address[]"
          },
          {
            "name": "_balances",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "size",
        "outputs": [
          {
            "name": "_size",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "entries",
        "outputs": [
          {
            "name": "balance",
            "type": "uint256"
          },
          {
            "name": "next",
            "type": "address"
          },
          {
            "name": "prev",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          },
          {
            "name": "_amt",
            "type": "uint256"
          }
        ],
        "name": "add",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      }
    ]
  },
  "Bankrollable": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollAvailable",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankroll",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "addBankroll",
        "outputs": [],
        "payable": true,
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profits",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getTreasury",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "bankrollerTable",
        "outputs": [
          {
            "name": "",
            "type": "address[]"
          },
          {
            "name": "",
            "type": "uint256[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "bankrolledBy",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "ledger",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getRegistry",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "sendProfits",
        "outputs": [
          {
            "name": "_profits",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getCollateral",
        "outputs": [
          {
            "name": "_amount",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_amount",
            "type": "uint256"
          },
          {
            "name": "_callbackFn",
            "type": "string"
          }
        ],
        "name": "removeBankroll",
        "outputs": [
          {
            "name": "_recalled",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "removeFromWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "whitelist",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsTotal",
        "outputs": [
          {
            "name": "_profits",
            "type": "int256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getWhitelistOwner",
        "outputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_addr",
            "type": "address"
          }
        ],
        "name": "addToWhitelist",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "profitsSent",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_registry",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "bankroller",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "bankroll",
            "type": "uint256"
          }
        ],
        "name": "BankrollRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "treasury",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "ProfitsSent",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "AddedToWhitelist",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "time",
            "type": "uint256"
          },
          {
            "indexed": true,
            "name": "addr",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "wlOwner",
            "type": "address"
          }
        ],
        "name": "RemovedFromWhitelist",
        "type": "event"
      }
    ]
  },
  "AddressSet": {
    "abi": [
      {
        "constant": false,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          }
        ],
        "name": "add",
        "outputs": [
          {
            "name": "_didCreate",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          }
        ],
        "name": "has",
        "outputs": [
          {
            "name": "_exists",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_address",
            "type": "address"
          }
        ],
        "name": "remove",
        "outputs": [
          {
            "name": "_didExist",
            "type": "bool"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "size",
        "outputs": [
          {
            "name": "_size",
            "type": "uint256"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "addresses",
        "outputs": [
          {
            "name": "_addresses",
            "type": "address[]"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "entries",
        "outputs": [
          {
            "name": "exists",
            "type": "bool"
          },
          {
            "name": "next",
            "type": "address"
          },
          {
            "name": "prev",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
      }
    ]
  }
}
    }());