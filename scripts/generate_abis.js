#!/usr/bin/env node

/**
Usage: ./generate_abis.js path/to/build

Looks in a build folder and plucks out ABIs and binary data.
Stores them in an object where the key is the contract name.
Only looks for certain ABIs.
*/
const fs = require('fs');
const path = require('path');
const libDir = path.join(__dirname, "../dist/global/javascripts/lib");
if (!fs.existsSync(libDir) || !fs.lstatSync(libDir).isDirectory()){
    throw new Error(`Unable to find output directory: ${libDir}`);
}
const inputDir = process.argv[2];
if (!inputDir){
    throw new Error(`Please provide the input directory, eg: /path/to/pennyether-contracts/build`);
}
if (!fs.existsSync(inputDir) || !fs.lstatSync(inputDir).isDirectory()){
    throw new Error(`Unable to find input directory: ${inputDir}`);
}

const comments = {
    TaskManager: {
        startPennyAuction: `Starts a pre-defined Penny Auction for a given index, \
provided it can be started. On success, rewards the caller.`,
        refreshPennyAuctions: `For each active auction, will send the collected fees \
to the Treasury. For any auction that has ended, will pay the winner and move \
the auction to the endedAuctions array. Rewards the caller with a percentage \
of the fees collected, as well as a fixed amount per auction ended.`,
    },

    MonarchyGame: {
        fallback: `Overthrows the current Monarch. Refunds if for any reason sender \
does not become the new Monarch.`,
        overthrow: `Overthrows the current Monarch, and announces a decree. Refunds if for any reason sender \
does not become the new Monarch.`,
        sendPrize: `Sends the prize money to the winner of the game.`
    },

    InstaDice: {
        roll: `Rolls the dice, if number lands <= number, you win.`,
        payoutPreviousRoll: `Pays out the winnings from the previous roll.`
    },

    VideoPoker: {
        bet: `Starts a new hand using ETH sent.`,
        betWithCredits: `Starts a new hand using the user's credits.`,
        betFromGame: `Starts a new game using credits from a winning game. \
Credits the remaining winnings, if any, to the user.`,
        draw: `Updates the user's hand by discarding and redrawing selected cards. \
This is passed "hashCheck" to ensure the user is drawing against the expected hand. \
For example, there may be a blockchain re-org and the user may not want to draw \
cards against a different hand.`,
        finalize: `Credits the user any winnings for the hand.`
    }
};

var result = {};
var filenames = [
    "Comptroller.json",
    "CustodialWallet.json",
    "DividendToken.json",
    "DividendTokenLocker.json",
    "InstaDice.json",
    "MonarchyGame.json",
    "MonarchyController.json",
    "MonarchyFactory.json",
    "Registry.json",
    "TaskManager.json",
    "Treasury.json",
    "VideoPoker.json",
    "Ledger.json",
    "Bankrollable.json"
];

// only pluck out the requested contracts
filenames.forEach((filename)=>{
    const fullpath = `${inputDir}/${filename}`;
    if (!fs.existsSync(fullpath)) {
        throw new Error(`Couldn't find ${fullpath}`);
    }
    const obj = JSON.parse(fs.readFileSync(fullpath))
    const name = filename.slice(0, -5); // remove trailing ".json"
    result[name] = {
        "abi": obj.abi,
        "unlinked_binary": obj.unlinked_binary
    };
});

// inject comments into functions
Object.keys(comments).forEach((cName)=>{
    const abi = result[cName].abi;
    if (!abi){
        console.log(`Comment defined for ${cName}, but no ABI found.`);
        return;
    }
    const fnComments = comments[cName];
    Object.keys(fnComments).forEach((fnName)=>{
        const fDef = abi.find((def)=>
            fnName=="fallback" ? def.type=="fallback" : (def.type=="function" && def.name==fnName)
        );
        if (!fDef){
            console.log(`Comment defined for ${cName}.${fnName}, but no such function defined in ABI.`);
            return;
        }
        fDef.comment = fnComments[fnName];
        console.log(`Added comment for ${cName}.${fnName}`);
    });
});

// create ABIs-full.js
(function(){
    const json = JSON.stringify(result, null, 2);
    const fileout = path.join(libDir, "ABIs-full.js");
    const str = 
    `(function(){
        window.ABIs = ${json}
    }());`;

    fs.writeFile(fileout, str, function(err) {
        if(err) { return console.error(err); }
        console.log(`Saved to ${fileout}.`);
    }); 
}());

// create ABIs.js
(function(){
    Object.keys(result).forEach(name => {
        delete result[name].unlinked_binary;
    });
    
    const json = JSON.stringify(result, null, 2);
    const fileout = path.join(libDir, "ABIs-lite.js");
    const str = 
    `(function(){
        window.ABIs = ${json}
    }());`;

    fs.writeFile(fileout, str, function(err) {
        if(err) { return console.error(err); }
        console.log(`Saved to ${fileout}.`);
    }); 
}());