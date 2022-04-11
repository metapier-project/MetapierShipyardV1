import path from "path";

import {
    deployContractByName,
    deployContract,
    executeScript,
    sendTransaction,
    getTemplate,
} from "flow-js-testing";

const Mustache = require('mustache');

export const basePath = path.resolve(__dirname, "../..");

export const getCode = async (file, addressMap = {}, variableMap = null) => {
    var code = await getTemplate(path.resolve(basePath, file), addressMap)

    if (variableMap !== null) {
        // use Mustache to render the code template
        code = Mustache.render(code, variableMap);
    }

    return code;
}

const UFIX64_PRECISION = 8;

// UFix64 values shall be always passed as strings
export const toUFix64 = (value) => value.toFixed(UFIX64_PRECISION);

export const toOptionalUFix64 = (value) => {
    if (value == null) {
        return value;
    }

    return toUFix64(value);
};

export const sendTransactionWithErrorRaised = async (...props) => {
    const [resp, err] = await sendTransaction(...props);
    if (err) {
        throw err;
    }
    return resp;
}

export const executeScriptWithErrorRaised = async (...props) => {
    const [resp, err] = await executeScript(...props);
    if (err) {
        throw err;
    }
    return resp;
}

export const deployContractByNameWithErrorRaised = async (...props) => {
    const [resp, err] = await deployContractByName(...props);
    if (err) {
        throw err;
    }
    return resp;
}

export const deployContractByCodeWithErrorRaised = async (...props) => {
    const [resp, err] = await deployContract(...props);
    if (err) {
        throw err;
    }
    return resp;
}
