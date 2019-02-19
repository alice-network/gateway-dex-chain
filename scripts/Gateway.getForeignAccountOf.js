const Gateway = artifacts.require("Gateway");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let localAccount = readline.question("Local account: ");

        const gateway = await Gateway.at(gatewayAddr);
        console.log(await gateway.getForeignAccountOf(localAccount));
        callback();
    } catch (e) {
        callback(e);
    }
};
