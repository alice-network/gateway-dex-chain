const Gateway = artifacts.require("Gateway");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let privateKey = readline.question("Private key: ");
        if (!privateKey.startsWith("0x")) {
            privateKey = "0x" + privateKey;
        }
        let foreignAccount = readline.question("Foreign account: ");
        let localAccount = readline.question("Local account: ");

        const message = this.web3.utils.soliditySha3(
            {type: "address", value: foreignAccount},
            {type: "address", value: localAccount}
        );
        const signature = this.web3.eth.accounts.sign(message, privateKey).signature;

        const gateway = await Gateway.at(gatewayAddr);
        console.log(await gateway.addAccount(foreignAccount, localAccount, signature));
        callback();
    } catch (e) {
        callback(e);
    }
};
