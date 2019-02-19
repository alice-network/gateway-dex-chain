const Gateway = artifacts.require("Gateway");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let foreignAccount = readline.question("Foreign account: ");

        const gateway = await Gateway.at(gatewayAddr);
        console.log(await gateway.getLocalAccountOf(foreignAccount));
        callback();
    } catch (e) {
        callback(e);
    }
};
