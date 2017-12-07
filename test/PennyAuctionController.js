var Registry = artifacts.require("Registry");
var Treasury = artifacts.require("Treasury");
var PennyAuctionController = artifacts.require("PennyAuctionController");
var PennyAuctionFactory = artifacts.require("PennyAuctionFactory");
var PennyAuction = artifacts.require("PennyAuction");

const createDefaultTxTester = require("../js/tx-tester/tx-tester.js")
    .createDefaultTxTester.bind(null, web3, assert, it);
const BigNumber = web3.toBigNumber(0).constructor;

const SUMMARY_0        = "First Auction";
const INITIAL_PRIZE_0  = new BigNumber(.05e18);
const BID_PRICE_0      = new BigNumber(.001e18);
const BID_ADD_BLOCKS_0 = new BigNumber(4);
const BID_FEE_PCT_0    = new BigNumber(60);
const INITIAL_BLOCKS_0 = new BigNumber(10);
const DEF_0 = [SUMMARY_0, INITIAL_PRIZE_0, BID_PRICE_0, BID_ADD_BLOCKS_0, BID_FEE_PCT_0, INITIAL_BLOCKS_0];

const SUMMARY_1        = "Second Auction";
const INITIAL_PRIZE_1  = new BigNumber(.04e18);
const BID_PRICE_1      = new BigNumber(.001e18);
const BID_ADD_BLOCKS_1 = new BigNumber(3);
const BID_FEE_PCT_1    = new BigNumber(30);
const INITIAL_BLOCKS_1 = new BigNumber(5);
const DEF_1 = [SUMMARY_1, INITIAL_PRIZE_1, BID_PRICE_1, BID_ADD_BLOCKS_1, BID_FEE_PCT_1, INITIAL_BLOCKS_1];

const SUMMARY_2        = "Third Auction";
const INITIAL_PRIZE_2  = new BigNumber(.03e18);
const BID_PRICE_2      = new BigNumber(.001e18);
const BID_ADD_BLOCKS_2 = new BigNumber(5);
const BID_FEE_PCT_2    = new BigNumber(30);
const INITIAL_BLOCKS_2 = new BigNumber(7);
const DEF_2 = [SUMMARY_2, INITIAL_PRIZE_2, BID_PRICE_2, BID_ADD_BLOCKS_2, BID_FEE_PCT_2, INITIAL_BLOCKS_2];

const accounts = web3.eth.accounts;
const NO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe('PennyAuctionController', function(){
    var registry;
    var treasury;
    var pac;
    var paf;
    
    const admin = accounts[1];
    const dummyMainController = accounts[2];
    const bidder1 = accounts[3];
    const bidder2 = accounts[4];
    const auctionWinner = accounts[5];
    const notMainController = accounts[6];
    const nonAdmin = accounts[7];


    before("Set up registry and treasury", async function(){
        registry = await Registry.new();
        treasury = await Treasury.new(registry.address);
        pac = await PennyAuctionController.new(registry.address);
        paf = await PennyAuctionFactory.new(registry.address);
        await registry.register("ADMIN", admin);
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
            bidder2: bidder2,
            auctionWinner: auctionWinner
        };
        createDefaultTxTester().plugins.nameAddresses(addresses);
        console.log("Addresses:", addresses);
    });

    describe.only("New Tests", async function(){
        it("should be instantiated with proper settings", async function(){
            return createDefaultTxTester()
                .assertStateAsString(pac, "getAdmin", admin, "sees correct admin")
                .assertStateAsString(pac, "getPennyAuctionFactory", paf.address, "sees correct PAF")
                .start();
        });

        describe(".editDefinedAuction()", async function(){
            it("Cannot edit from non-admin", async function(){
                const callParams = [pac, "editDefinedAuction", 0].concat(DEF_0, {from: nonAdmin})
                return createDefaultTxTester()
                    .assertCallThrows(callParams)
                    .doTx(callParams)
                    .assertInvalidOpCode()
                    .start()
            })
            it("Cannot edit with too high of an index", async function(){
                const callParams = [pac, "editDefinedAuction", 1].concat(DEF_0, {from: admin});
                return createDefaultTxTester()
                    .assertCallReturns(callParams, false)
                    .doTx(callParams)
                    .assertSuccess()
                    .assertOnlyErrorLog("Index out of bounds.")
                    .start()
            });
            it("Adds definedAuction correctly", async function(){
                const callParams = [pac, "editDefinedAuction", 0].concat(DEF_0, {from: admin});
                return createDefaultTxTester()
                    .assertCallReturns(callParams, true)
                    .doTx(callParams)
                    .assertSuccess()
                    .assertOnlyLog("DefinedAuctionEdited", {time: null, index: 0})
                    .assertStateAsString(pac, "numDefinedAuctions", 1)
                    .assertCallReturns([pac, "definedAuctions", 0], [
                        false,
                        "0x0000000000000000000000000000000000000000"].concat(DEF_0))
                    .start()
            });
            it("Cannot edit with too high an index", async function(){
                const callParams = [pac, "editDefinedAuction", 2].concat(DEF_1, {from: admin});
                return createDefaultTxTester()
                    .assertCallReturns(callParams, false)
                    .doTx(callParams)
                    .assertSuccess()
                    .assertOnlyErrorLog("Index out of bounds.")
                    .start()
            });
            it("Adds another definedAuction correctly", async function(){
                const callParams = [pac, "editDefinedAuction", 1].concat(DEF_1, {from: admin});
                return createDefaultTxTester()
                    .assertCallReturns(callParams, true)
                    .doTx(callParams)
                    .assertSuccess()
                    .assertOnlyLog("DefinedAuctionEdited", {time: null, index: 1})
                    .assertStateAsString(pac, "numDefinedAuctions", 2)
                    .assertCallReturns([pac, "definedAuctions", 1], [
                        false,
                        "0x0000000000000000000000000000000000000000"].concat(DEF_1))
                    .start()
            });
            it("Adds another definedAuction correctly", async function(){
                const callParams = [pac, "editDefinedAuction", 2].concat(DEF_2, {from: admin});
                return createDefaultTxTester()
                    .assertCallReturns(callParams, true)
                    .doTx(callParams)
                    .assertSuccess()
                    .assertOnlyLog("DefinedAuctionEdited", {time: null, index: 2})
                    .assertStateAsString(pac, "numDefinedAuctions", 3)
                    .assertCallReturns([pac, "definedAuctions", 2], [
                        false,
                        "0x0000000000000000000000000000000000000000"].concat(DEF_2))
                    .start()
            });
        });

        describe(".enableDefinedAuction()", function(){
            before("definedAuctions exist", async function(){
                assert.strEqual(await pac.numDefinedAuctions(), 3);
                assert.strEqual(await pac.getIsEnabled(0), false);
            });
            it("is only callable by admin", function(){
                return createDefaultTxTester()
                    .assertCallThrows([pac, "enableDefinedAuction", 0, {from: nonAdmin}])
                    .doTx(()=> pac.enableDefinedAuction(0, {from: nonAdmin}))
                    .assertInvalidOpCode()
                    .start();
            });
            it("Fails if index too high", function(){
                return createDefaultTxTester()
                    .assertCallReturns([pac, "enableDefinedAuction", 3, {from: admin}], false)
                    .doTx(()=> pac.enableDefinedAuction(3, {from: admin}))
                    .assertSuccess()
                    .assertOnlyErrorLog("Index out of bounds.")
                    .start();
            });
            it("Works", function(){
                return createDefaultTxTester()
                    .assertCallReturns([pac, "enableDefinedAuction", 0, {from: admin}], true)
                    .doTx(()=> pac.enableDefinedAuction(0, {from: admin}))
                    .assertSuccess()
                    .assertOnlyLog("DefinedAuctionEdited", {time: null, index: 0})
                    .assertAsString(() => pac.getIsEnabled(0), true, "isEnabled is true")
                    .assertStateAsString(pac, "numDefinedAuctions", 3, "still only three")
                    .start();
            });
        });

        describe(".disabledDefinedAuction()", function(){
            before("definedAuctions exist", async function(){
                assert.strEqual(await pac.numDefinedAuctions(), 3);
                assert.strEqual(await pac.getIsEnabled(0), true);
            });
            it("is only callable by admin", function(){
                const callParams = [pac, "disableDefinedAuction", 0, {from: nonAdmin}];
                return createDefaultTxTester()
                    .assertCallThrows(callParams)
                    .doTx(callParams)
                    .assertInvalidOpCode()
                    .start();
            });
            it("Fails if index too high", function(){
                const callParams = [pac, "disableDefinedAuction", 3, {from: admin}];
                return createDefaultTxTester()
                    .assertCallReturns(callParams, false)
                    .doTx(callParams)
                    .assertSuccess()
                    .assertOnlyErrorLog("Index out of bounds.")
                    .start();
            });
            it("Works", function(){
                const callParams = [pac, "disableDefinedAuction", 0, {from: admin}];
                return createDefaultTxTester()
                    .assertCallReturns(callParams, true)
                    .doTx(callParams)
                    .assertSuccess()
                    .assertOnlyLog("DefinedAuctionEdited", {time: null, index: 0})
                    .assertAsString(() => pac.getIsEnabled(0), false,
                        "isEnabled is now false")
                    .assertStateAsString(pac, "numDefinedAuctions", 3, "still only three")
                    .start();
            }); 
        });

        describe(".startDefinedAuction", function(){
            before("definedAuctions 0 and 2 are enabled", async function(){
                await pac.enableDefinedAuction(0, {from: admin});
                await pac.disableDefinedAuction(1, {from: admin});
                await pac.enableDefinedAuction(2, {from: admin});
                assert.strEqual(await pac.getIsEnabled(0), true);
                assert.strEqual(await pac.getIsEnabled(1), false);
                assert.strEqual(await pac.getIsEnabled(2), true);
            });
            it("refunds when index out of bounds", function(){
                const callParams = [pac, "startDefinedAuction", 3, {from: nonAdmin}];
                return createDefaultTxTester()
                    .assertCallReturns(callParams, [false, NO_ADDRESS])
                    .startLedger([nonAdmin, pac])
                    .doTx(callParams)
                    .assertSuccess()
                        .assertOnlyErrorLog("Index out of bounds.")
                    .stopLedger()
                        .assertLostTxFee(nonAdmin)
                        .assertNoDelta(pac)
                    .start();
            });
            it("refunds when not enabled", function(){
                const callParams = [pac, "startDefinedAuction", 1, {from: nonAdmin}];
                return createDefaultTxTester()
                    .assertCallReturns(callParams, [false, NO_ADDRESS])
                    .startLedger([nonAdmin, pac])
                    .doTx(callParams)
                    .assertSuccess()
                        .assertOnlyErrorLog("DefinedAuction is not enabled.")
                    .stopLedger()
                        .assertLostTxFee(nonAdmin)
                        .assertNoDelta(pac)
                    .start();
            });
            it("refunds when incorrect value", function(){
                const callParams = [pac, "startDefinedAuction", 0, {from: nonAdmin, value: 1}]
                return createDefaultTxTester()
                    .assertCallReturns(callParams, [false, NO_ADDRESS])
                    .startLedger([nonAdmin, pac])
                    .doTx(callParams)
                    .assertSuccess()
                        .assertOnlyErrorLog("Value sent does not match initialPrize.")
                    .stopLedger()
                        .assertLostTxFee(nonAdmin)
                        .assertNoDelta(pac)
                    .start();
            });
            it("works", function(){
                var auction;
                const callParams = [pac, "startDefinedAuction", 0, {from: nonAdmin, value: INITIAL_PRIZE_0}];
                return createDefaultTxTester()
                    .assertCallReturns(callParams, [true, null])
                    .startLedger([nonAdmin, pac])
                    .startWatching([paf])
                    .doTx(callParams)
                    .assertSuccess()
                        .assertOnlyLog("AuctionStarted", {time: null, addr: null})
                    .stopLedger()
                        .assertNoDelta(pac)
                    .stopWatching()
                        .assertEvent(paf, "AuctionCreated", {
                            time: null,
                            addr: null,
                            initialPrize: INITIAL_PRIZE_0,
                            bidPrice: BID_PRICE_0,
                            bidAddBlocks: BID_ADD_BLOCKS_0,
                            bidFeePct: BID_FEE_PCT_0,
                            initialBlocks: INITIAL_BLOCKS_0
                        })
                    .doFn((ctx) => { auction = PennyAuction.at(ctx.txRes.logs[0].args.addr) })
                        .assertAsString(() => pac.getAuction(0), () => auction.address,
                            "definedAuctions.auction is set correctly")
                        .assertAsString(() => auction.prize(), INITIAL_PRIZE_0,
                            "created auction has correct initialPrize")
                        .assertAsString(() => auction.bidPrice(), BID_PRICE_0,
                            "created auction has correct bidPrice")
                        .assertAsString(() => auction.bidAddBlocks(), BID_ADD_BLOCKS_0,
                            "created auction has correct biddAddBlocks")
                        .assertAsString(() => auction.bidFeePct(), BID_FEE_PCT_0,
                            "created auction has correct bidFeePct")
                        .assertAsString(() => auction.currentWinner(), treasury.address,
                            "created auction currentWinner is treasury")
                    .start();
            });
            it("refunds when already started", function(){
                const callParams = [pac, "startDefinedAuction", 0, {from: nonAdmin, value: INITIAL_PRIZE_1}];
                return createDefaultTxTester()
                    .assertCallReturns(callParams, [false, NO_ADDRESS])
                    .startLedger([nonAdmin, pac])
                    .doTx(callParams)
                    .assertSuccess()
                        .assertOnlyErrorLog("Auction is already started.")
                    .stopLedger()
                        .assertLostTxFee(nonAdmin)
                        .assertNoDelta(pac)
                    .start();
            });
            it("Starts another", function(){
                var auction;
                const callParams = [pac, "startDefinedAuction", 2, {from: nonAdmin, value: INITIAL_PRIZE_2}];
                return createDefaultTxTester()
                    .assertCallReturns(callParams, [true, null])
                    .startLedger([nonAdmin, pac])
                    .startWatching([paf])
                    .doTx(callParams)
                    .assertSuccess()
                        .assertOnlyLog("AuctionStarted", {time: null, addr: null})
                    .stopLedger()
                        .assertNoDelta(pac)
                    .stopWatching()
                        .assertEvent(paf, "AuctionCreated", {
                            time: null,
                            addr: null,
                            initialPrize: INITIAL_PRIZE_2,
                            bidPrice: BID_PRICE_2,
                            bidAddBlocks: BID_ADD_BLOCKS_2,
                            bidFeePct: BID_FEE_PCT_2,
                            initialBlocks: INITIAL_BLOCKS_2
                        })
                    .doFn((ctx) => { auction = PennyAuction.at(ctx.txRes.logs[0].args.addr) })
                        .assertAsString(() => pac.getAuction(2), () => auction.address,
                            "definedAuctions.auction is set correctly")
                        .assertAsString(() => auction.prize(), INITIAL_PRIZE_2,
                            "created auction has correct initialPrize")
                        .assertAsString(() => auction.bidPrice(), BID_PRICE_2,
                            "created auction has correct bidPrice")
                        .assertAsString(() => auction.bidAddBlocks(), BID_ADD_BLOCKS_2,
                            "created auction has correct biddAddBlocks")
                        .assertAsString(() => auction.bidFeePct(), BID_FEE_PCT_2,
                            "created auction has correct bidFeePct")
                        .assertAsString(() => auction.currentWinner(), treasury.address,
                            "created auction currentWinner is treasury")
                    .start();
            });
        });

        // At this point, definedAuctions[1] is started
        describe("With active auctions", async function(){
            var auction0;
            var auction2;
            before("There are open auctions", async function(){
                auction0 = PennyAuction.at(await pac.getAuction(0));
                assert.notEqual(auction0.address, NO_ADDRESS);
                auction2 = PennyAuction.at(await pac.getAuction(2));
                assert.notEqual(auction0.address, NO_ADDRESS);
            });
            it("Bids on auction twice", async function(){
                await auction0.sendTransaction({from: bidder1, value: BID_PRICE_0});
                await auction0.sendTransaction({from: bidder2, value: BID_PRICE_0});
                await auction2.sendTransaction({from: bidder2, value: BID_PRICE_2});
                await auction2.sendTransaction({from: bidder1, value: BID_PRICE_2});
            });
            describe(".getAvailableFees()", function(){
                it("Returns proper amount", function(){

                });
            })
        });

        //describe(".getAvailableFees()", function(){})
    })
    
    

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