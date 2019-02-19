const ERC20GatewayMintable = artifacts.require("./token/ERC20GatewayMintable.sol");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let name = readline.question("Name: ");
        let symbol = readline.question("Symbol: ");
        let decimals = readline.question("Decimals: ");

        ERC20GatewayMintable.new(gatewayAddr, name, symbol, Number(decimals))
            .on("receipt", receipt => {
                console.log(receipt);
                callback();
            })
            .on("error", e => {
                console.error(e);
                callback(e);
            });
    } catch (e) {
        callback(e);
    }
};
