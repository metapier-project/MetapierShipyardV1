import path from "path";
import { emulator, init, getAccountAddress, mintFlow, shallRevert, shallThrow } from "flow-js-testing";
import { deployToken, getTokenBalance, mintToken } from "../src/tokens"
import { 
  deployLaunchpad, 
  addNewPool, 
  updatePool, 
  getPoolIds, 
  getPoolStatus, 
  userAddFunds, 
  userWithdrawFunds, 
  userClaimLaunchToken, 
  getLaunchpadAdmin, 
  projectDepositLaunchToken,
  projectWithdrawFunds,
  mintOwnerPassCollection,
  lookupOwnerPassIds
} from "../src/launchpad"
import { toUFix64 } from "../src/common";

const _ = require('lodash');

// Increase timeout if your tests failing due to timeout
jest.setTimeout(100000);

describe("basic-test", ()=>{
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
    return emulator.stop();
  });

  it("basic flow", async () => {
    await deployLaunchpad();

    const alice = await getAccountAddress("Alice");
    const bob = await getAccountAddress("Bob");
    const tokenA = "TokenA";
    const tokenB = "tokenB";

    await deployToken(tokenA);
    await deployToken(tokenB);
    await mintToken(alice, tokenA, 100);
    await mintToken(bob, tokenA, 0);
    await mintToken(bob, tokenB, 100);

    const poolId = "pool_1";
    const startTime = _.now() / 1000 - 1000;
    const endTime = startTime + 2000;
    const claimTime = endTime + 2000;

    // You can log or check any response objects.
    // var res = await addNewPool(tokenA, tokenB, "pool_1", 2, 100, 1000, startTime, endTime, claimTime);
    // console.log(res);

    await mintOwnerPassCollection(bob);
    await addNewPool(tokenA, tokenB, poolId, bob, 2, 100, 1000, startTime, endTime, claimTime, 0);
    await updatePool(poolId, 1);

    var res = await getPoolIds();
    console.log(res);

    res = await getPoolStatus(poolId);
    console.log(res);

    res = await lookupOwnerPassIds(bob, poolId);
    console.log(res);

    await userAddFunds(alice, poolId, tokenA, tokenB, 10);
    await userWithdrawFunds(alice, poolId, tokenA, 5);

    // Unfortunately, we cannot alter the block timestamp.
    // So here we change the config instead.
    await updatePool(poolId, 1, null, null, startTime - 100, startTime - 10, startTime);

    await projectDepositLaunchToken(bob, poolId, tokenB, 5);
    await projectWithdrawFunds(bob, poolId, tokenA, 5);
    await userClaimLaunchToken(alice, poolId, tokenB);

    res = await getPoolStatus(poolId);
    console.log(res);

    expect(res.participations[alice].amount).toBe(toUFix64(5));
    expect(res.participations[alice].hasClaimed).toBeTruthy();
    expect(await getTokenBalance(alice, tokenA)).toBe(toUFix64(95));
    expect(await getTokenBalance(alice, tokenB)).toBe(toUFix64(5));
    expect(await getTokenBalance(bob, tokenA)).toBe(toUFix64(5));
    expect(await getTokenBalance(bob, tokenB)).toBe(toUFix64(95));
  });
})
