const Gateway = artifacts.require("Gateway");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let foreignContract = readline.question("Foreign contract: ");
        let localContract = readline.question("Local contract: ");

        const gateway = await Gateway.at(gatewayAddr);
        console.log(await gateway.removeToken(foreignContract, localContract));
        callback();
    } catch (e) {
        callback(e);
    }
};
