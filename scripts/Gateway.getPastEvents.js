const Gateway = artifacts.require("Gateway");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let name = readline.question("Event name: ");

        const gateway = await Gateway.at(gatewayAddr);
        console.log(await gateway.getPastEvents(name, {fromBlock: 0, toBlock: "latest"}));
        callback();
    } catch (e) {
        callback(e);
    }
};
