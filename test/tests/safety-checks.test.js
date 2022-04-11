import path from "path";
import { emulator, init, getAccountAddress, mintFlow, shallRevert, shallThrow } from "flow-js-testing";
import { deployToken, getTokenBalance, mintToken } from "../src/tokens"
import {
    deployLaunchpad, 
    addNewPool, 
    updatePool,
    userAddFunds, 
    userWithdrawFunds, 
    userClaimLaunchToken, 
    getLaunchpadAdmin, 
    projectDepositLaunchToken,
    projectWithdrawFunds,
    mintOwnerPassCollection,
    lookupOwnerPassIds,
    projectWithdrawFundsWithPassId,
} from "../src/launchpad"
import { toUFix64 } from "../src/common";

const _ = require('lodash');

const createTimeline = function(startOffset, endOffset, claimOffset) {
    const startTime = _.now() / 1000 + startOffset;
    const endTime = startTime + endOffset;
    const claimTime = endTime + claimOffset;

    return [startTime, endTime, claimTime];
};

var contractsDeployed = false

const commonSetup = async function(
    username,
    projectOwnerName,
    poolId,
    startOffset = -1000, 
    endOffset = 2000, 
    claimOffset = 2000,
    price = 1, 
    pcap = 100, 
    tcap = 1000
) {
    if (!contractsDeployed) {
        await deployLaunchpad();
        await deployToken("TokenA");
        await deployToken("TokenB");
        contractsDeployed = true;
    }
    
    const user = await getAccountAddress(username);
    const projectOwner = await getAccountAddress(projectOwnerName);

    await mintToken(user, "TokenA", 100000);
    await mintToken(user, "TokenB", 100000);
    await mintToken(projectOwner, "TokenA", 100000);
    await mintToken(projectOwner, "TokenB", 100000);

    var [startTime, endTime, claimTime] = createTimeline(startOffset, endOffset, claimOffset);

    await mintOwnerPassCollection(projectOwner);
    await addNewPool("TokenA", "TokenB", poolId, projectOwner, price, pcap, tcap, startTime, endTime, claimTime, 0);

    return [user, projectOwner];
};

// Increase timeout if your tests failing due to timeout
jest.setTimeout(100000);

describe("safety-checks", () => {
    beforeEach(async () => {
        const basePath = path.resolve(__dirname, "../..");
        // You can specify different port to parallelize execution of describe blocks
        const port = 8080;
        // Setting logging flag to true will pipe emulator output to console
        const logging = false;

        await init(basePath, { port });
        return emulator.start(port, logging);
    });

    // Stop emulator, so it could be restarted
    afterEach(async () => {
        contractsDeployed = false;
        return emulator.stop();
    });

    it("cannot update a pool that doesn't exist", async () => {
        const poolId = "pool_1";
        await deployLaunchpad();
        await expect(updatePool(poolId, 1)).rejects.toContain('cadence runtime error');
    });

    it("cannot use invalid funds", async() => {
        const poolId = "pool_1";
        const [alice, bob] = await commonSetup("Alice", "Bob", poolId);
        await expect(userAddFunds(alice, poolId, "TokenB", "TokenA", 10)).rejects.toContain('Invalid funds type');
    });

    it("checks timestamp for each action", async() => {
        const poolId = "pool_1";
        const [alice, bob] = await commonSetup("Alice", "Bob", poolId, 1000, 2000, 2000);
        
        // too early to add/withdraw funds
        await expect(userAddFunds(alice, poolId, "TokenA", "TokenB", 10)).rejects.toContain('Funds are frozen');
        await expect(projectWithdrawFunds(bob, poolId, "TokenA", 10)).rejects.toContain("Can't withdraw in funding period");

        var [startTime, endTime, claimTime] = createTimeline(-1000, 2000, 2000);

        await updatePool(poolId, 1, null, null, startTime, endTime, claimTime);

        // add/withdraw funds are now open for participants
        await userAddFunds(alice, poolId, "TokenA", "TokenB", 10);
        await userWithdrawFunds(alice, poolId, "TokenA", 5);
        // withdraw funds is not available for project owner
        await expect(projectWithdrawFunds(bob, poolId, "TokenA", 5)).rejects.toContain("Can't withdraw in funding period");

        [startTime, endTime, claimTime] = createTimeline(-1000, 1, 2000);

        await updatePool(poolId, 1, null, null, startTime, endTime, claimTime);

        // add/withdraw funds are now closed
        await expect(userAddFunds(alice, poolId, "TokenA", "TokenB", 10)).rejects.toContain('Funds are frozen');
        await expect(userWithdrawFunds(alice, poolId, "TokenA", 5)).rejects.toContain('Funds are frozen');
        // withdraw funds is now available for project owner
        await projectWithdrawFunds(bob, poolId, "TokenA", 5);
        expect(await getTokenBalance(bob, "TokenA")).toBe(toUFix64(100005));

        // too early to claim launch token
        await expect(userClaimLaunchToken(alice, poolId, "TokenB")).rejects.toContain('Claiming is not available');
    });

    it("personal cap and total cap", async() => {
        const poolId = "pool_1";
        const [alice, bob] = await commonSetup("Alice", "Bob", poolId, -1000, 2000, 2000, 1, 100, 200);

        await userAddFunds(alice, poolId, "TokenA", "TokenB", 100);
        await expect(userAddFunds(alice, poolId, "TokenA", "TokenB", 0.00000001)).rejects
            .toContain('Cannot exceed personal cap');

        await expect(userWithdrawFunds(alice, poolId, "TokenA", 100.00000001)).rejects
            .toContain('Cannot withdraw an amount more than deposited');

        await userWithdrawFunds(alice, poolId, "TokenA", 10.5);
        await userWithdrawFunds(alice, poolId, "TokenA", 89.5);

        for(var i = 0; i < 2; i++){
            // add more funds to reach total cap
            const user = await getAccountAddress(`user${i}`);
            await mintToken(user, "TokenA", 100);
            await userAddFunds(user, poolId, "TokenA", "TokenB", 100);
        }

        // total cap reached
        await expect(userAddFunds(alice, poolId, "TokenA", "TokenB", 0.00000001)).rejects
            .toContain('Cannot exceed total cap');
    });

    it("whitelist works properly", async() => {
        const poolId = "pool_1";
        const [alice, bob] = await commonSetup("Alice", "Bob", poolId);
        const alex = await getAccountAddress("Alex");
        const tim = await getAccountAddress("Tim");

        await updatePool(poolId, 1, null, null, null, null, null, null, [alex, tim], []);

        await expect(userAddFunds(alice, poolId, "TokenA", "TokenB", 100)).rejects
            .toContain('Address not whitelisted');

        await mintToken(alex, "TokenA", 100000);
        await mintToken(tim, "TokenA", 100000);

        await userAddFunds(alex, poolId, "TokenA", "TokenB", 100);
        await userAddFunds(tim, poolId, "TokenA", "TokenB", 100);

        // no one can add funds now
        await updatePool(poolId, 1, null, null, null, null, null, null, [], [alex, tim]);
        await expect(userAddFunds(alex, poolId, "TokenA", "TokenB", 100)).rejects
            .toContain('Address not whitelisted');

        // but you can still withdraw funds
        await userWithdrawFunds(alex, poolId, "TokenA", 100);
    });

    it("token claiming works properly", async() => {
        const poolId = "pool_1";
        const [alice, bob] = await commonSetup("Alice", "Bob", poolId, -1000, 2000, 2000, 2.123);
        const alex = await getAccountAddress("Alex");
        const tim = await getAccountAddress("Tim");

        await mintToken(alex, "TokenA", 1000);
        await mintToken(tim, "TokenA", 100);
        await mintToken(tim, "TokenB", 100);
        await projectDepositLaunchToken(bob, poolId, "TokenB", 1000);

        await userAddFunds(alice, poolId, "TokenA", "TokenB", 100);
        await userAddFunds(alex, poolId, "TokenA", "TokenB", 99.999999);

        // Tim eventually chooses to not participate
        await userAddFunds(tim, poolId, "TokenA", "TokenB", 100);
        await userWithdrawFunds(tim, poolId, "TokenA", 100);

        const [startTime, endTime, claimTime] = createTimeline(-1000, 1, 200);
        await updatePool(poolId, null, null, null, startTime, endTime, claimTime);

        await expect(userClaimLaunchToken(alice, poolId, "TokenA")).rejects
            .toContain('Cannot deposit an incompatible token type');

        await userClaimLaunchToken(alice, poolId, "TokenB");
        await userClaimLaunchToken(alex, poolId, "TokenB");
        await userClaimLaunchToken(tim, poolId, "TokenB");

        await expect(userClaimLaunchToken(alice, poolId, "TokenB")).rejects
            .toContain('already claimed');

        expect(await getTokenBalance(alice, "TokenA")).toBe(toUFix64(99900));
        expect(await getTokenBalance(alex, "TokenA")).toBe(toUFix64(900.000001));
        expect(await getTokenBalance(tim, "TokenA")).toBe(toUFix64(100));
        expect(await getTokenBalance(alice, "TokenB")).toBe(toUFix64(100212.3));
        expect(await getTokenBalance(alex, "TokenB")).toBe(toUFix64(212.29999787));
        expect(await getTokenBalance(tim, "TokenB")).toBe(toUFix64(100));
    });

    it("cannot duplicate pool id", async() => {
        const poolId = "pool_1";
        await commonSetup("Alice", "Bob", poolId);
        await expect(commonSetup("Alice", "Bob", poolId)).rejects.toContain('already exists');
    });

    it("only the correct project owner can withdraw funds", async() => {
        const [alice, bob] = await commonSetup("Alice", "Bob", "pool_1"); // passId = 0
        const [alex, tim] = await commonSetup("Alex", "Tim", "pool_2"); // passId = 1
        await expect(projectWithdrawFundsWithPassId(tim, 1, "TokenA", 1, "pool_1")).rejects
            .toContain('Invalid owner pass');
    });

    it("deposit only period", async() => {
        const poolId = "pool_1";
        const [alice, bob] = await commonSetup("Alice", "Bob", "pool_1"); // passId = 0

        // update pool to disallow funds withdrawal
        await updatePool(poolId, null, null, null, null, null, null, 3000);
        await userAddFunds(alice, poolId, "TokenA", "TokenB", 100);
        await expect(userWithdrawFunds(alice, poolId, "TokenA", 100)).rejects
            .toContain('Funds are frozen');
        
        // update pool to allow funds withdrawal
        await updatePool(poolId, null, null, null, null, null, null, 100);
        await userWithdrawFunds(alice, poolId, "TokenA", 100);
    });
});
