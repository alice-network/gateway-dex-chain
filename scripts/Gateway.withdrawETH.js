const Gateway = artifacts.require("Gateway");
const ERC20 = artifacts.require("ERC20");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let amount = readline.question("Amount: ");

        const gateway = await Gateway.at(gatewayAddr);
        const ethToken = await ERC20.at(await gateway.ethTokenAddress());
        console.log(await ethToken.approve(gateway.address, amount));
        console.log(await gateway.withdrawETH(amount));
        callback();
    } catch (e) {
        callback(e);
    }
};
