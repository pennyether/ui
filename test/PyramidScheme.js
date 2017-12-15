const PyramidScheme = artifacts.require("PyramidScheme");
const DividendToken = artifacts.require("DividendToken");
const Locker = artifacts.require("Locker");

const createDefaultTxTester = require("../js/tx-tester/tx-tester.js")
    .createDefaultTxTester.bind(null, web3, assert, it);
const testUtil = createDefaultTxTester().plugins.testUtil;
const BigNumber = web3.toBigNumber(0).constructor;

const accounts = web3.eth.accounts;
const owner = accounts[1];
const account1 = accounts[2];
const account2 = accounts[3];
const account3 = accounts[4];
const account4 = accounts[5];
const random = accounts[7];

var scheme;
var token;
var locker;
var trackedAccounts;

describe('PyramidScheme', function(){
    before("Initialize PyramidScheme", async function(){
        scheme = await PyramidScheme.new({from: owner});
        token = DividendToken.at(await scheme.token());
        locker = Locker.at(await scheme.locker())
        trackedAccounts = [locker.address, account1, account2, account3, account4];
        collectedDividends = trackedAccounts.map(()=>new BigNumber(0));

        const addresses = {
            owner: accounts[1],
            account1: account1,
            account2: account2,
            account3: account3, 
            account4: account4, 
            random: random,
            scheme: scheme.address,
            token: token.address,
            locker: locker.address
        };
        await createDefaultTxTester()
            .nameAddresses(addresses)
            .start();
    });
    it("Has right stuff", function(){
        return createDefaultTxTester()
            .assertCallReturns([scheme, "token"], token.address)
            .assertCallReturns([scheme, "locker"], locker.address)
            .assertCallReturns([token, "owner"], scheme.address)
            .assertCallReturns([locker, "owner"], owner)
            .assertCallReturns([token, "balanceOf", locker.address], 1)
            .start();
    });
    itMintsTokens(1, 1e11);
    itMintsTokens(2, 1e12);
    itMintsTokens(1, 4e11);
    itBurnsTokens(1, 3e11);
    itBurnsTokens(2, 1e18);
});

// Upon minting a token:
//  - users should receive split dividend of 1% of amt
//  - user should NOT get any more dividend
//  - user should get amt tokens
//  - locker should get amt.mul(.05) tokens
//  - totalSupply increases by amt.mul(1.05)
//  - account should lose amt
//  - scheme should gain 99%
//  - token should gain 1%
async function itMintsTokens(accountNum, amt) {
    amt = new BigNumber(amt);
    it(`Mints ${amt} tokens for account${accountNum}`, async function(){
        const account = trackedAccounts[accountNum];
        const totalSupply = await token.totalSupply();
        const expectedDiv = amt.mul(".01");
        const expectedDivs = await Promise.all(trackedAccounts.map(async function(acc){
            const balance = await token.balanceOf(acc);
            const divShare = expectedDiv.mul(balance).div(totalSupply).floor();
            const curDiv = await token.getCollectableDividends(acc);
            return curDiv.plus(divShare);
        }));
        const curBalance = await token.balanceOf(account);
        const lockerBalance = await token.balanceOf(locker.address);
        const expectedBalance = curBalance.plus(amt);
        const expectedLockerBalance = lockerBalance.plus(amt.mul(".05"));
        const expectedTotalSupply = totalSupply.plus(amt.mul("1.05"));
        const expectedCred = expectedDivs[accountNum];

        const tester = createDefaultTxTester()
            .startLedger([token, scheme, account])
            .doTx([scheme, "buyTokens", {from: account, value: amt}])
            .assertSuccess()
            .stopLedger()
                .assertDeltaMinusTxFee(account, amt.mul(-1))
                .assertDelta(scheme, amt.mul(.99))
                .assertDelta(token, amt.mul(.01))
            .assertCallReturns([token, "balanceOf", account], expectedBalance)
            .assertCallReturns([token, "balanceOf", locker.address], expectedLockerBalance)
            .assertCallReturns([token, "totalSupply"], expectedTotalSupply)
            .assertCallReturns([token, "creditedDividends", account], {within1: expectedCred});
        expectedDivs.forEach((div, i)=>{
            tester.assertCallReturns([token, "getCollectableDividends", trackedAccounts[i]], {within1: div})
        })
        return tester.start();
    });
}
// Upon minting a token:
//  - dividends should not change
//  - user should NOT get any more dividend
//  - user should be credited all dividends
//  - user should lose amt tokens
//  - locker should lose amt.mul(.05) tokens
//  - totalSupply descreases by amt.mul(1.05)
//  - account should gain amt.mul(.99)
//  - scheme should lose 99%
async function itBurnsTokens(accountNum, amt) {
    amt = new BigNumber(amt);
    it(`Burns ${amt} tokens for account${accountNum}`, async function(){
        const origAmt = amt;
        const account = trackedAccounts[accountNum];
        const curBalance = await token.balanceOf(account);
        if (amt.gt(curBalance)) {
            console.log(`Should burn full balance of ${curBalance} instead of ${amt}`);
            amt = curBalance;
        }

        const totalSupply = await token.totalSupply();
        const expectedDivs = await Promise.all(trackedAccounts.map(async function(acc){
            return await token.getCollectableDividends(acc);
        }));
        
        const lockerBalance = await token.balanceOf(locker.address);
        const expectedBalance = curBalance.minus(amt);
        const expectedLockerBalance = lockerBalance.minus(amt.mul(".05"));
        const expectedTotalSupply = totalSupply.minus(amt.mul("1.05"));
        const expectedCred = expectedDivs[accountNum];

        const tester = createDefaultTxTester()
            .startLedger([token, scheme, account])
            .doTx([scheme, "burnTokens", origAmt, {from: account}])
            .assertSuccess()
            .stopLedger()
                .assertDeltaMinusTxFee(account, amt.mul(.99))
                .assertDelta(scheme, amt.mul(-.99))
            .assertCallReturns([token, "balanceOf", account], expectedBalance)
            .assertCallReturns([token, "balanceOf", locker.address], expectedLockerBalance)
            .assertCallReturns([token, "totalSupply"], expectedTotalSupply)
            .assertCallReturns([token, "creditedDividends", account], {within1: expectedCred});
        expectedDivs.forEach((div, i)=>{
            tester.assertCallReturns([token, "getCollectableDividends", trackedAccounts[i]], {within1: div})
        })
        return tester.start();
    })
    // it("Burn tokens for account1", async function(){
    //     const balance1 = await token.balanceOf(account1);
    //     const amt = balance1.div(2);
    //     const totalSupply = await token.totalSupply();
    //     const balanceLocker = await token.balanceOf(locker.address);

    //     const expectedRefund = amt.mul(.99);
    //     const expectedBalance1 = balance1.minus(amt);
    //     const expectedBalanceLocker = balanceLocker.minus(amt.mul(.05));
    //     const expectedTotalSupply = totalSupply.minus(amt).minus(amt.mul(.05));

    //     return createDefaultTxTester()
    //         .startLedger([token, scheme, account1])
    //         .doTx([scheme, "burnTokens", amt, {from: account1}])
    //         .assertSuccess()
    //         .stopLedger()
    //             .assertNoDelta(token)
    //             .assertDelta(scheme, expectedRefund.mul(-1))
    //             .assertDeltaMinusTxFee(account1, expectedRefund)
    //         .assertCallReturns([token, "balanceOf", account1], expectedBalance1)
    //         .assertCallReturns([token, "balanceOf", locker.address], expectedBalanceLocker)
    //         .assertCallReturns([token, "totalSupply"], expectedTotalSupply)
    //         .start();
}