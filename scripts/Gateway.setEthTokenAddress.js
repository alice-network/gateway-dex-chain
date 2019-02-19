const Gateway = artifacts.require("Gateway");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let tokenAddr = readline.question("Token Address: ");

        const gateway = await Gateway.at(gatewayAddr);
        console.log(await gateway.setEthTokenAddress(tokenAddr));
        callback();
    } catch (e) {
        callback(e);
    }
};
