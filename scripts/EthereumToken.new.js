const EthereumToken = artifacts.require("EthereumToken");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");

        EthereumToken.new(gatewayAddr)
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
