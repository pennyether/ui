var Registry = artifacts.require("Registry");
var Treasury = artifacts.require("Treasury");
var PennyAuctionController = artifacts.require("PennyAuctionController");
var PennyAuctionFactory = artifacts.require("PennyAuctionFactory");
var PennyAuction = artifacts.require("PennyAuction");

const createDefaultTxTester = require("../js/tx-tester/tx-tester.js")
    .createDefaultTxTester.bind(null, web3, assert, it);
const BigNumber = web3.toBigNumber(0).constructor;

const INITIAL_PRIZE  = new BigNumber(.05e18);
const BID_PRICE      = new BigNumber(.001e18);
const BID_TIME_S     = new BigNumber(600);
const BID_FEE_PCT    = new BigNumber(60);
const AUCTION_TIME_S = new BigNumber(60*60*12);

const MAX_OPEN_AUCTIONS = 2;
const MAX_INITIAL_PRIZE = INITIAL_PRIZE;

const accounts = web3.eth.accounts;

describe('PennyAuctionController', function(){
    var registry;
    var treasury;
    var pac;
    var paf;
    var dummyMainController = accounts[5];

    const bidder1 = accounts[1];
    const bidder2 = accounts[2];
    const auctionWinner = accounts[3];
    const notMainController = accounts[4];

    before("Set up registry and treasury", async function(){
        registry = await Registry.new();
        treasury = await Treasury.new(registry.address);
        pac = await PennyAuctionController.new(registry.address, MAX_OPEN_AUCTIONS, MAX_INITIAL_PRIZE);
        paf = await PennyAuctionFactory.new(registry.address);
        await registry.register("TREASURY", treasury.address);
        await registry.register("MAIN_CONTROLLER", dummyMainController);
        await registry.register("PENNY_AUCTION_CONTROLLER", pac.address);
        await registry.register("PENNY_AUCTION_FACTORY", paf.address);
        const addresses = {
            registry: registry.address,
            treasury: treasury.address,
            pac: pac.address,
            paf: paf.address,
            dummyMainController: dummyMainController,
            bidder1: bidder1,
            auctionWinner: auctionWinner
        };
        createDefaultTxTester().plugins.nameAddresses(addresses);
        console.log("Addresses:", addresses);
    });

    it("should be instantiated with proper settings", async function(){
        return createDefaultTxTester()
            .assertCallResult([pac, "maxOpenAuctions"], MAX_OPEN_AUCTIONS)
            .assertCallResult([pac, "maxInitialPrize"], MAX_INITIAL_PRIZE)
            .assertCallResult([pac, "getMainController"], dummyMainController)
            .start();
    });
    
    describe(".setSettings()", function(){
        it("cannot be changed by randos", async function(){
            return createDefaultTxTester()
                .doTx(() => pac.setSettings(5, 10e18, {from: notMainController}))
                .assertInvalidOpCode()
                .start();
        });
        it("can be called by MainController", async function(){
            const newMoa = new BigNumber(5);
            const newMip = new BigNumber(10e18);
            await createDefaultTxTester()
                .doTx(() => pac.setSettings(newMoa, newMip, {from: dummyMainController}))
                .assertCallResult([pac, "maxOpenAuctions"], newMoa)
                .assertCallResult([pac, "maxInitialPrize"], newMip)
                .start();
            await pac.setSettings(MAX_OPEN_AUCTIONS, MAX_INITIAL_PRIZE, {from: dummyMainController});
        });
    });

    describe(".startNewAuction()", function(){
        it("it should not start a new auction from randos", async function(){
            return createDefaultTxTester()
                .doTx(() => pac.startNewAuction(
                    INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S, 
                    {from: accounts[3], value: INITIAL_PRIZE}
                ))
                .assertInvalidOpCode()
                .start();
        });
        it("it should return false and refund if wrong amount sent", async function(){
            // do call, have ledger watch
            await createDefaultTxTester()
                .startLedger([dummyMainController, pac])
                .doTx(() => pac.startNewAuction(
                    INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S,
                    {from: dummyMainController, value: INITIAL_PRIZE.plus(1)}
                ))
                .stopLedger()
                .assertOnlyErrorLog("Value must equal initialPrize")
                .assertLostTxFee(dummyMainController)
                .assertNoDelta(pac.address)
                .start();

            // make sure call returns correctly as well
            var res = await pac.startNewAuction.call(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S,
                {from: dummyMainController, value: INITIAL_PRIZE.plus(1)}
            );
            assert.strEqual(res[0], false, "Returns false");
            console.log("✓ .call returns false");
        });
        it("returns false, refunds, and errors if too many auctions open", async function(){
            console.log("setting maxOpenAuctions to 0...");
            await pac.setSettings(0, MAX_INITIAL_PRIZE, {from: dummyMainController});
            
            await createDefaultTxTester()
                .startLedger([dummyMainController, pac])
                .doTx(() => pac.startNewAuction(
                    INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S, 
                    {from: dummyMainController, value: INITIAL_PRIZE}
                ))
                .stopLedger()
                .assertOnlyErrorLog("Too many auctions open")
                .assertLostTxFee(dummyMainController)
                .assertNoDelta(pac)
                .start();
            
            // make sure call returns correctly as well
            var res = await pac.startNewAuction.call(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S, 
                {from: dummyMainController, value: INITIAL_PRIZE}
            );
            console.log("✓ .call returns false");

            console.log(`setting maxOpenAuctions back to ${MAX_OPEN_AUCTIONS}...`);
            await pac.setSettings(MAX_OPEN_AUCTIONS, MAX_INITIAL_PRIZE, {from: dummyMainController});
        });
        it("correctly starts an auction", async function(){
            const res = await pac.startNewAuction.call(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S, 
                {from: dummyMainController, value: INITIAL_PRIZE}
            );
            console.log("✓ .call returns true");

            const txRes = await createDefaultTxTester()
                .startLedger([dummyMainController, pac])
                .startWatching([paf])
                .doTx(() => pac.startNewAuction(
                    INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S, 
                    {from: dummyMainController, value: INITIAL_PRIZE}
                ))
                .stopLedger()
                .stopWatching()
                .assertDeltaMinusTxFee(dummyMainController, INITIAL_PRIZE.mul(-1))
                .assertNoDelta(pac)
                .assertOnlyLog("AuctionStarted", {
                    addr: null,
                    time: null,
                    initialPrize: INITIAL_PRIZE,
                    bidPrice: BID_PRICE,
                    bidTimeS: BID_TIME_S,
                    bidFeePct: BID_FEE_PCT,
                    auctionTimeS: AUCTION_TIME_S
                })
                .assertOnlyEvent(paf, "AuctionCreated", {
                    addr: null,
                    initialPrize: INITIAL_PRIZE,
                    bidPrice: BID_PRICE,
                    bidTimeS: BID_TIME_S,
                    auctionTimeS: AUCTION_TIME_S
                })
                .getTxResult()
                .start();

            const openAuction = PennyAuction.at(txRes.logs[0].args.addr);
            createDefaultTxTester().plugins.nameAddresses({openAuction: openAuction}, false);
            console.log(`Created auction @ ${openAuction.address}`);

            assert.strEqual(await pac.openAuctions(0), openAuction.address);
            console.log(`✓ .openAuctions(0) is 'openAuction'`);
        });
    });

    describe("The open auction works", async function(){
        const openAuction = PennyAuction.at(await pac.openAuctions(0));
        before("there is an openAuction", async function(){
            assert.strEqual(await openAuction.state(), 1, "Auction is OPENED");
        });

        it("openAuction is set up correctly", async function(){
            const openAuction = PennyAuction.at(await pac.openAuctions(0));
            await createDefaultTxTester()
                .assertCallResult([openAuction, "admin"], pac.address)
                .assertCallResult([openAuction, "collector"], treasury.address)
                .assertCallResult([openAuction, "state"], 1, "is OPENED")
                .assertCallResult([openAuction, "prize"], INITIAL_PRIZE)
                .assertCallResult([openAuction, "bidPrice"], BID_PRICE)
                .assertCallResult([openAuction, "bidTimeS"], BID_TIME_S)
                .assertCallResult([openAuction, "bidFeePct"], BID_FEE_PCT)
                .assertCallResult([openAuction, "auctionTimeS"], AUCTION_TIME_S)
                .assertBalance(openAuction, INITIAL_PRIZE)
                .start();
        });
        it("openAuction accepts bids...", async function(){
            await openAuction.sendTransaction({value: BID_PRICE, from: bidder1});
            await openAuction.sendTransaction({value: BID_PRICE, from: bidder2});
            await openAuction.sendTransaction({value: BID_PRICE, from: bidder1});
            const fees = BID_PRICE.mul(BID_FEE_PCT.div(100)).mul(3);
            await createDefaultTxTester()
                .assertCallResult([openAuction, "numBids"], 3)
                .assertCallResult([openAuction, "fees"], fees)
                .assertCallResult([openAuction, "currentWinner"], bidder1)
                .start()
        });
    });

    describe("Misc helper functions", async function(){
        const openAuction = PennyAuction.at(await pac.openAuctions(0));
        before("there is an openAuction", async function(){
            assert.strEqual(await openAuction.state(), 1, "Auction is OPENED");
        });

        it("helper functions work", async function(){
            await createDefaultTxTester()
                .assertCallResult([pac, "getNumActionableAuctions"], 0)
                .assertCallResult([pac, "getNumOpenAuctions"], 1)
                .assertCallResult([pac, "getNumClosedAuctions"], 0)
                .assertCallResult([pac, "getAvailableFees"], await openAuction.fees())
                .start();
        });
    });

    describe(".checkOpenAuctions()", async function(){
        const openAuction = PennyAuction.at(await pac.openAuctions(0));
        before("there is an openAuction", async function(){
            assert.equal(await openAuction.state(), 1, "Auction is OPENED");
        });

        it("not callable by randos", async function(){
            await createDefaultTxTester()
                .doTx(() => pac.checkOpenAuctions({from: notMainController}))
                .assertInvalidOpCode()
                .start();
        });
        it("Gets the correct return value (0 closed, X fees redeemed)", async function(){
            const fees = await openAuction.fees();
            await createDefaultTxTester()
                .assertCallResult([pac, "checkOpenAuctions", {from: dummyMainController}], [0, fees])
                .start();
        });
        it("works correctly", async function(){
            const fees = await openAuction.fees();
            const prize = await openAuction.prize();
            return createDefaultTxTester()
                .startLedger([treasury, openAuction, dummyMainController])
                .doTx(() => pac.checkOpenAuctions({from: dummyMainController}))
                .stopLedger()
                .assertSuccess()
                .assertDelta(treasury, fees, "gained fees")
                .assertDelta(openAuction, fees.mul(-1), "lost fees")
                .assertLostTxFee(dummyMainController, "lost txFee")
                .assertCallResult([pac, "totalFees"], fees, "incremented totalFees")
                .assertCallResult([openAuction, "fees"], 0, "no fees left to redeem")
                .assertBalance(openAuction, prize, "equal to prize")
                .assertCallResult([pac, "openAuctions", 0], openAuction.address)
                .assertCallResult([pac, "getAvailableFees"], 0)
                .start()
        });
    });

    describe("Finishing openAuction...", async function(){
        const openAuction = PennyAuction.at(await pac.openAuctions(0));
        before("there is an openAuction", async function(){
            assert.equal(await openAuction.state(), 1, "Auction is opened");
        });

        it("openAuction accepts more bids, fast forwards, and is now closeable", async function(){
            const testUtil = createDefaultTxTester().plugins.testUtil;
            await openAuction.sendTransaction({value: BID_PRICE, from: auctionWinner});

            const numBids = await openAuction.numBids();
            const getTimeRemaining = await openAuction.getTimeRemaining();
            testUtil.fastForward((await openAuction.getTimeRemaining()).plus(1));
            assert.equal(await openAuction.isCloseable(), true, "should be closeable");
        });
    });

    describe("Misc helper functions", async function(){
        const openAuction = PennyAuction.at(await pac.openAuctions(0));
        before("openAuction has no time left", async function(){
            assert.strEqual((await openAuction.getTimeRemaining()), 0, "should have no time left");    
        });

        it("helper functions work", async function(){
            await createDefaultTxTester()
                .assertCallResult([pac, "getNumActionableAuctions"], 1)
                .assertCallResult([pac, "getNumOpenAuctions"], 1)
                .assertCallResult([pac, "getNumClosedAuctions"], 0)
                .assertCallResult([pac, "getAvailableFees"], await openAuction.fees())
                .start();
        });
    });

    describe(".checkOpenAuctions() when auction is done", async function(){
        const openAuction = PennyAuction.at(await pac.openAuctions(0));
        before("openAuction has no time left", async function(){
            assert.strEqual((await openAuction.getTimeRemaining()), 0, "should have no time left");    
        });
        
        it(".checkOpenAuctions call returns (1 completed, X fees redeemed)", async function(){
            const fees = await openAuction.fees();
            const res = await pac.checkOpenAuctions.call({from: dummyMainController});
            assert.strEqual(res[0], 1, "one redeemed");
            assert.strEqual(res[1], fees, "fees redeemed");
        });
        it("works correctly", async function(){
            const prize = await openAuction.prize();
            const numBids = await openAuction.numBids();
            const fees = await openAuction.fees();
            const prevFees = await pac.totalFees();
            const prevPrizes = await pac.totalPrizes();
            await createDefaultTxTester()
                .startLedger([treasury, openAuction, dummyMainController, auctionWinner])
                .startWatching([openAuction])
                .doTx(() => pac.checkOpenAuctions({from: dummyMainController}))
                .stopLedger()
                .stopWatching()
                .assertSuccess()
                .assertDelta(treasury, fees, "got fees")
                .assertLostTxFee(dummyMainController)
                .assertDelta(auctionWinner, prize, "got prize")
                .assertOnlyLog("AuctionCompleted", {
                    addr: openAuction.address,
                    winner: auctionWinner,
                    prize: prize,
                    numBids, numBids
                })
                .assertEvent(openAuction, "Closed")
                .assertEvent(openAuction, "Redeemed", {
                    time: null,
                    redeemer: pac.address,
                    recipient: auctionWinner,
                    amount: prize
                })
                .assertCallResult([pac, "totalFees"], prevFees.plus(fees))
                .assertCallResult([pac, "totalPrizes"], prevPrizes.plus(prize))
                .assertCallResult([pac, "getNumOpenAuctions"], 0)
                .assertCallResult([pac, "getNumClosedAuctions"], 1)
                .assertCallResult([pac, "getNumActionableAuctions"], 0)
                .start();
        });
    })


    describe("more checkOpenAuctions tests", async function(){
        var pac;
        var MAX_OPEN_AUCTIONS = new BigNumber(5);
        var auction1;
        var auction2;
        var auction3;
        var auction4;
        var auction5;
        
        before("create new pac and 5 auctions", async function(){
            pac = await PennyAuctionController.new(registry.address, MAX_OPEN_AUCTIONS, MAX_INITIAL_PRIZE);
            registry.register("PENNY_AUCTION_CONTROLLER", pac.address);
            
            // not the auction_time_s values: 1, 4, 2, 3, 5
            await pac.startNewAuction(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S, 
                {from: dummyMainController, value: INITIAL_PRIZE}
            );
            await pac.startNewAuction(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S.plus(12000), 
                {from: dummyMainController, value: INITIAL_PRIZE}
            );
            await pac.startNewAuction(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S.plus(18000), 
                {from: dummyMainController, value: INITIAL_PRIZE}
            );
            await pac.startNewAuction(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S.plus(6000), 
                {from: dummyMainController, value: INITIAL_PRIZE}
            );
            await pac.startNewAuction(
                INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S.plus(24000), 
                {from: dummyMainController, value: INITIAL_PRIZE}
            );
            auction1 = PennyAuction.at(await pac.openAuctions(0));
            auction2 = PennyAuction.at(await pac.openAuctions(1));
            auction3 = PennyAuction.at(await pac.openAuctions(2));
            auction4 = PennyAuction.at(await pac.openAuctions(3));
            auction5 = PennyAuction.at(await pac.openAuctions(4));
            createDefaultTxTester().plugins.nameAddresses({
                pac: pac,
                dummyMainController: dummyMainController,
                auction1: auction1,
                auction2: auction2,
                auction3: auction3,
                auction4: auction4,
                auction5: auction5
            });
        });
        it(".startNewAuction() refunds and errors when too many open", async function(){
            await createDefaultTxTester()
                .startLedger([pac, dummyMainController])
                .doTx(() => pac.startNewAuction(
                    INITIAL_PRIZE, BID_PRICE, BID_TIME_S, BID_FEE_PCT, AUCTION_TIME_S, 
                    {from: dummyMainController, value: INITIAL_PRIZE}
                ))
                .stopLedger()
                .assertSuccess()
                .assertOnlyErrorLog("Too many auctions open")
                .assertLostTxFee(dummyMainController)
                .assertNoDelta(pac)
                .assertCallResult([pac, "getNumOpenAuctions"], 5, "still only 5")
                .start();
        });

        describe("After closing the first auction", function(){
            before("bid and close first auction", async function(){
                const testUtil = createDefaultTxTester().plugins.testUtil;
                await auction1.sendTransaction({from: bidder1, value: BID_PRICE});
                await auction1.sendTransaction({from: bidder2, value: BID_PRICE});
                await auction1.sendTransaction({from: auctionWinner, value: BID_PRICE});
                await testUtil.fastForward((await auction1.getTimeRemaining()).plus(1));
                await auction1.close();
            });

            it(".checkOpenAuctions() works", async function(){
                const fees = await auction1.fees();
                const expectedTotalPrizes = (await pac.totalPrizes()).plus(await auction1.prize());
                const expectedTotalBids = (await pac.totalBids()).plus(await auction1.numBids());
                await createDefaultTxTester()
                    .assertCallResult([pac, "checkOpenAuctions", {from: dummyMainController}],
                        [1, fees])
                    .doTx(() => pac.checkOpenAuctions({from: dummyMainController}))
                    .assertSuccess()
                    .assertCallResult([auction1, "state"], 3)
                    .assertCallResult([pac, "getNumOpenAuctions"], 4)
                    .assertCallResult([pac, "getNumClosedAuctions"], 1)
                    .assertCallResult([pac, "totalPrizes"], expectedTotalPrizes)
                    .assertCallResult([pac, "totalBids"], expectedTotalBids)
                    .assertCallResult([auction1, "state"], 3, "REDEEMED")
                    .start();
            });

            it("has correct values in the arrays", async function(){
                await createDefaultTxTester()
                    .assertCallResult([pac, "closedAuctions", 0], auction1.address)
                    .assertCallResult([pac, "openAuctions", 0], auction2.address)
                    .assertCallResult([pac, "openAuctions", 1], auction3.address)
                    .assertCallResult([pac, "openAuctions", 2], auction4.address)
                    .assertCallResult([pac, "openAuctions", 3], auction5.address)
                    .start();
            });
        });

        describe("After closing and redeeming the fourth auction", async function(){
            before("bid, close, redeem auction4", async function(){
                assert.strEqual(await pac.getNumOpenAuctions(), 4);
                const testUtil = createDefaultTxTester().plugins.testUtil;
                await auction4.sendTransaction({from: bidder1, value: BID_PRICE});
                await auction4.sendTransaction({from: bidder2, value: BID_PRICE});
                await auction4.sendTransaction({from: auctionWinner, value: BID_PRICE});
                await testUtil.fastForward((await auction4.getTimeRemaining()).plus(1));
                await auction4.close();
                await auction4.redeem({from: auctionWinner});
                assert.strEqual(await auction4.state(), 3, "auction4 is redeemed");
            });

            it(".checkOpenAuctions() works", async function(){
                const fees = await auction4.fees();
                const expectedTotalPrizes = (await pac.totalPrizes()).plus(await auction4.prize());
                const expectedTotalBids = (await pac.totalBids()).plus(await auction4.numBids());
                await createDefaultTxTester()
                    .assertCallResult([pac, "checkOpenAuctions", {from: dummyMainController}],
                        [1, fees])
                    .startLedger([treasury])
                    .doTx(() => pac.checkOpenAuctions({from: dummyMainController}))
                    .stopLedger()
                    .assertSuccess()
                    .assertDelta(treasury, fees, "got fees")
                    .assertCallResult([pac, "getNumOpenAuctions"], 3)
                    .assertCallResult([pac, "getNumClosedAuctions"], 2)
                    .assertCallResult([pac, "totalPrizes"], expectedTotalPrizes)
                    .assertCallResult([pac, "totalBids"], expectedTotalBids)
                    .start();
            });
            it("shifted array of active auctions", async function(){
                await createDefaultTxTester()
                    .assertCallResult([pac, "closedAuctions", 0], auction1.address)
                    .assertCallResult([pac, "closedAuctions", 1], auction4.address)
                    .assertCallResult([pac, "openAuctions", 0], auction2.address)
                    .assertCallResult([pac, "openAuctions", 1], auction3.address)
                    .assertCallResult([pac, "openAuctions", 2], auction5.address)
                    .start();
            });
        });

        describe("After closing all auctions", async function(){
            before("close all auctions", async function(){
                const testUtil = createDefaultTxTester().plugins.testUtil;
                assert.strEqual(await pac.getNumOpenAuctions(), 3);
                await testUtil.fastForward((await auction5.getTimeRemaining()).plus(1));
            });

            it(".checkOpenAuctions() works", async function(){
                const fees = 0;
                await createDefaultTxTester()
                    .assertCallResult([pac, "checkOpenAuctions", {from: dummyMainController}],
                        [3, fees])
                    .doTx(() => pac.checkOpenAuctions({from: dummyMainController}))
                    .assertSuccess()
                    .assertCallResult([auction1, "state"], 3)
                    .assertCallResult([pac, "getNumOpenAuctions"], 0)
                    .assertCallResult([pac, "getNumClosedAuctions"], 5)
                    .assertCallResult([auction2, "state"], 3, "REDEEMED")
                    .assertCallResult([auction3, "state"], 3, "REDEEMED")
                    .assertCallResult([auction5, "state"], 3, "REDEEMED")
                    .start();
            })
        })

    });

});