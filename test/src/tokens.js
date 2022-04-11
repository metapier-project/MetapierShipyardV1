import { 
    mintFlow, 
    getAccountAddress,
    getContractAddress
} from "flow-js-testing";

import {
	sendTransactionWithErrorRaised, 
	executeScriptWithErrorRaised, 
	deployContractByNameWithErrorRaised,
    deployContractByCodeWithErrorRaised,
    getCode,
    toUFix64
} from "./common";

export const getTokenAdmin = async() => getAccountAddress("TokenAdmin");

export const deployInterfaces = async() => {
    const tokenAdmin = await getTokenAdmin();

    // NOTE: NEVER DEPLOY FUNGIBLETOKEN CONTRACT -- IT'LL BE HANDLED BY THE FRAMEWORK!
    await deployContractByNameWithErrorRaised({ to: tokenAdmin, name: "NonFungibleToken" });
}

export const deployToken = async(name) => {
    const tokenAdmin = await getTokenAdmin();
    const code = await getCode("test-libs/contracts/TestToken.cdc", {}, { token: name })

    return deployContractByCodeWithErrorRaised({ 
        code,
        name,
        to: tokenAdmin
    });
}

export const mintToken = async(address, name, amount) => {
    const code = await getCode("test-libs/transactions/mint_test_token.cdc", {}, { token: name })
    const args = [toUFix64(amount)];
    const signers = [address];

    return sendTransactionWithErrorRaised({ code, args, signers });
}

export const getTokenBalance = async(address, token) => {
    const variables = {
        tokenPublicBalancePath: `/public/test${token}Balance` // hard-coded for now
    };
    const code = await getCode("test-libs/scripts/get_token_balance.cdc", {}, variables);
    const args = [address];

    return executeScriptWithErrorRaised({ code, args });
}
