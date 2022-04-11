import { 
    mintFlow, 
    getAccountAddress,
    getContractAddress
} from "flow-js-testing";

import {
	sendTransactionWithErrorRaised, 
	executeScriptWithErrorRaised, 
	deployContractByNameWithErrorRaised,
    getCode,
    toUFix64,
    toOptionalUFix64,
} from "./common";

import { getTokenAdmin, deployInterfaces } from "./tokens";

export const getLaunchpadAdmin = async() => getAccountAddress("LaunchpadAdmin");

export const deployLaunchpad = async() => {
    await deployInterfaces();

    const tokenAdmin = await getTokenAdmin();
    const launchpadAdmin = await getLaunchpadAdmin();

    var addressMap = { 
		NonFungibleToken: tokenAdmin,
	};

    await deployContractByNameWithErrorRaised({ to: launchpadAdmin, name: "MetapierLaunchpadPass", addressMap });
    await deployContractByNameWithErrorRaised({ to: launchpadAdmin, name: "MetapierLaunchpadOwnerPass", addressMap });

    addressMap = { 
		NonFungibleToken: tokenAdmin,
        MetapierLaunchpadPass: launchpadAdmin,
        MetapierLaunchpadOwnerPass: launchpadAdmin,
	};

    await deployContractByNameWithErrorRaised({ to: launchpadAdmin, name: "MetapierLaunchpad", addressMap });
}

export const addNewPool = async(
    fundsToken, 
    launchToken, 
    poolId, 
    projectOwner, 
    price, 
    personalCap, 
    totalCap, 
    fundingStartTime, 
    fundingEndTime, 
    claimingStartTime,
    fundsDepositOnlyPeriod
) => {
    const tokenAdmin = await getTokenAdmin();
    const launchpadAdmin = await getLaunchpadAdmin();
    const variables = {
        fundsToken,
        launchToken,
        fundsTokenAddress: tokenAdmin,
        launchTokenAddress: tokenAdmin,
    };
    const code = await getCode("transactions/admin/add_pool.cdc", {}, variables);
    const args = [
        poolId,
        projectOwner,
        toUFix64(price),
        toUFix64(personalCap),
        toUFix64(totalCap),
        toUFix64(fundingStartTime),
        toUFix64(fundingEndTime),
        toUFix64(claimingStartTime),
        toUFix64(fundsDepositOnlyPeriod),
    ];
    const signers = [launchpadAdmin];

    return sendTransactionWithErrorRaised({ code, args, signers });
}

export const updatePool = async(
    poolId, 
    price = null, 
    personalCap = null, 
    totalCap = null, 
    fundingStartTime = null, 
    fundingEndTime = null, 
    claimingStartTime = null,
    fundsDepositOnlyPeriod = null,
    addWhitelists = [],
    removeWhitelists = [],
) => {
    const launchpadAdmin = await getLaunchpadAdmin();
    const name = "admin/update_pool";
    const signers = [launchpadAdmin];
    const args = [
        poolId, 
        toOptionalUFix64(price),
        toOptionalUFix64(personalCap), 
        toOptionalUFix64(totalCap), 
        toOptionalUFix64(fundingStartTime), 
        toOptionalUFix64(fundingEndTime), 
        toOptionalUFix64(claimingStartTime), 
        toOptionalUFix64(fundsDepositOnlyPeriod), 
        addWhitelists, 
        removeWhitelists
    ];

    return sendTransactionWithErrorRaised({ name, args, signers });
}

export const getPoolIds = async() => {
    const name = "get_pools";

	return executeScriptWithErrorRaised({ name });
}

export const getPoolStatus = async(poolId) => {
    const name = "get_pool_status";
    const args = [poolId];

    return executeScriptWithErrorRaised({ name, args });
}

export const userAddFunds = async(user, poolId, fundsToken, launchToken, amount) => {
    const tokenAdmin = await getTokenAdmin();
    const variables = {
        fundsToken,
        launchToken,
        fundsTokenAddress: tokenAdmin,
        launchTokenAddress: tokenAdmin,
        fundsTokenStoragePath: `${fundsToken}.TokenStoragePath`
    };
    const code = await getCode("transactions/add_funds.cdc", {}, variables);
    const args = [poolId, toUFix64(amount)];
    const signers = [user];

    return sendTransactionWithErrorRaised({ code, args, signers });
}

export const userWithdrawFunds = async(user, poolId, fundsToken, amount) => {
    const variables = {
        fundsTokenReceiverPath: `/public/test${fundsToken}Receiver` // hardcoded for now
    };
    const code = await getCode("transactions/withdraw_funds.cdc", {}, variables);
    const args = [poolId, toUFix64(amount)];
    const signers = [user];

    return sendTransactionWithErrorRaised({ code, args, signers });
}

export const userClaimLaunchToken = async(user, poolId, launchToken) => {
    const tokenAdmin = await getTokenAdmin();
    const variables = {
        launchToken,
        launchTokenAddress: tokenAdmin,
        launchTokenStoragePath: `${launchToken}.TokenStoragePath`,
        launchTokenPublicReceiverPath: `${launchToken}.TokenPublicReceiverPath`,
        launchTokenPublicBalancePath: `${launchToken}.TokenPublicBalancePath`,
    };
    const code = await getCode("transactions/claim_token.cdc", {}, variables);
    const args = [poolId];
    const signers = [user];

    return sendTransactionWithErrorRaised({ code, args, signers });
}

export const projectDepositLaunchToken = async(projectOwner, poolId, launchToken, amount) => {
    const tokenAdmin = await getTokenAdmin();
    const variables = {
        launchToken,
        launchTokenAddress: tokenAdmin,
        launchTokenStoragePath: `${launchToken}.TokenStoragePath`,
    };
    const code = await getCode("transactions/project_owner/add_launch_token.cdc", {}, variables);
    const args = [poolId, toUFix64(amount)];
    const signers = [projectOwner];

    return sendTransactionWithErrorRaised({ code, args, signers });
}

export const lookupOwnerPassIds = async(projectOwner, poolId) => {
    const name = "lookup_owner_pass_ids_by_pool_id";
    const args = [projectOwner, poolId];
	return executeScriptWithErrorRaised({ name, args });
}

export const projectWithdrawFundsWithPassId = async(
    projectOwner, 
    passId, 
    fundsToken, 
    amount, 
    overwritePoolId = null
) => {
    const tokenAdmin = await getTokenAdmin();
    const variables = {
        fundsToken,
        fundsTokenAddress: tokenAdmin,
        fundsTokenStoragePath: `${fundsToken}.TokenStoragePath`,
    };
    
    var code = await getCode("transactions/project_owner/withdraw_funds.cdc", {}, variables);
    if (overwritePoolId != null) {
        // a hacky way to change code behavior
        code = code.replace("ownerPass.launchPoolId", `"${overwritePoolId}"`);
    }

    const args = [passId, toUFix64(amount)];
    const signers = [projectOwner];

    return sendTransactionWithErrorRaised({ code, args, signers });
}

export const projectWithdrawFunds = async(projectOwner, poolId, fundsToken, amount) => {
    const passIds = await lookupOwnerPassIds(projectOwner, poolId);
    if (passIds.length != 1) {
        throw 'Found zero or multiple passes!';
    }

    return projectWithdrawFundsWithPassId(projectOwner, passIds[0], fundsToken, amount);
}

export const mintOwnerPassCollection = async(projectOwner) => {
    const code = await getCode("transactions/project_owner/create_pass_collection.cdc");
    const signers = [projectOwner];
    return sendTransactionWithErrorRaised({ code, signers });
}
