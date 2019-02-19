const Gateway = artifacts.require("Gateway");
const ERC721 = artifacts.require("ERC721");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let gatewayAddr = readline.question("Gateway address: ");
        let tokenAddr = readline.question("Token address: ");
        let tokenId = readline.question("Token ID: ");

        const gateway = await Gateway.at(gatewayAddr);
        const erc721 = await ERC721.at(tokenAddr);
        console.log(await erc721.approve(gateway.address, tokenId));
        console.log(await gateway.withdrawERC721(erc721.address, tokenId));
        callback();
    } catch (e) {
        callback(e);
    }
};
