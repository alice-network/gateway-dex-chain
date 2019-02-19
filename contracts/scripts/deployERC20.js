const ERC20GatewayMintable = artifacts.require("./token/ERC20GatewayMintable.sol");

require("dotenv").config();

module.exports = async function (callback) {
  const erc20 = await ERC20GatewayMintable.new(
    process.env.PLASMA_GATEWAY_ADDRESS,
    "D",
    "D",
    18
  );

  console.log(erc20.address);

  callback();
};
