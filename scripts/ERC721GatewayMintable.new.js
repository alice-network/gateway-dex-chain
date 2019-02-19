const ERC721GatewayMintable = artifacts.require("./token/ERC721GatewayMintable.sol");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let name = readline.question("Name: ");
        let symbol = readline.question("Symbol: ");

        ERC721GatewayMintable.new(gatewayAddr, name, symbol)
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
