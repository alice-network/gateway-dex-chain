const ERC20 = artifacts.require("ERC20");
const readline = require("readline-sync");

module.exports = async function (callback) {
    try {
        let tokenAddr = readline.question("Token address: ");
        let myAddr = readline.question("My address: ");

        const erc20 = await ERC20.at(tokenAddr);
        const balance = await erc20.balanceOf(myAddr);
        console.log(balance.toString());
        callback();
    } catch (e) {
        callback(e);
    }
};
