const DepositHandler = artifacts.require("./handler/DepositHandler.sol");
const ERC20Token = artifacts.require("./token/ERC20GatewayMintable.sol");
const ERC721Token = artifacts.require("./token/ERC721GatewayMintable.sol");
const EthereumCoin = artifacts.require("./token/EthereumCoin.sol");

const { BN, ether, shouldFail, expectEvent } = require("openzeppelin-test-helpers");

const { signMessageHashWithPrivateKey } = require("../utils/sign.js");

contract("DepositHandler", function([admin, owner, oracle, user1, user2]) {
  const erc20value = new BN("100");
  const erc721tokenId = new BN("253");
  const ethValue = ether("20");
  let handler;
  let foreignOracle = "0x20B6ca2fa5E09804d0BEE56BfBBc87653F176539";
  let erc20;
  let erc721;
  let ethToken;
  let foreignAccount1 = "0x6FFD42164CD57BA12EB8096457BDD5eAcdeDad72";
  let foreignPrivateKey1 = "0x7ce1a71f5e8f3e2f3efe53922b0f59bb76e4f1a70e0fdb1558df41cd50b85d26";
  let foreignAccount2 = "0xb8FD81eD9Ae1000715284cfeA6B0b5684b75d254";
  let foreignPrivateKey2 = "0x9525ae079f9166ed838a7869d125b05159fd2c75307eb6f68f3565a8200f90f7";
  let foreignERC20 = "0xB8c77482e45F1F44dE1745F52C74426C631bDD52"; // BNB
  let foreignERC20TxHash = "0x436fc7d21ed4a0a634f41b50ccb42fca12be7322de5bf9a20c97bdccbb5b2a04";
  let foreignERC721 = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"; // CK;
  let foreignERC721TxHash = "0x691f348ef11e9ef95d540a2da2c5f38e36072619aa44db0827e1b8a276f120f4";
  let msg1;
  let signature1;
  let msg2;
  let signature2;

  async function initialize(owner, oracle, foreignOracle) {
    const signature = "initialize(address,address,address)";
    const args = [owner, oracle, foreignOracle];
    await handler.methods[signature](...args, { from: admin })
  }

  before(async function() {
    msg1 = web3.utils.soliditySha3(
      { type: "address", value: foreignAccount1 },
      { type: "address", value: user1 }
    );
    signature1 = await signMessageHashWithPrivateKey(msg1, foreignPrivateKey1);
    msg2 = web3.utils.soliditySha3(
      { type: "address", value: foreignAccount2 },
      { type: "address", value: user2 }
    );
    signature2 = await signMessageHashWithPrivateKey(msg2, foreignPrivateKey2);
  });

  beforeEach(async function() {
    handler = await DepositHandler.new({ from: admin });
    await initialize(owner, oracle, foreignOracle);

    erc20 = await ERC20Token.new(handler.address, "ERC20", "E20", 18, { from: admin });
    erc721 = await ERC721Token.new(handler.address, "ERC721", "E721", { from: admin });
    ethToken = await EthereumCoin.new(handler.address, { from: admin });
  });

  context("with erc20", async function() {
    it("should deposit if mapped", async function() {
      await handler.addToken(foreignERC20, erc20.address, foreignERC20TxHash, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      let result = await handler.depositERC20(1, foreignAccount1, foreignERC20, erc20value, {
        from: oracle
      });

      let balance = await erc20.balanceOf(user1);

      expectEvent.inLogs(result.logs, "ERC20Deposited", {
        depositId: new BN("1"),
        foreignAccountAddress: foreignAccount1,
        foreignTokenAddress: foreignERC20,
        localAccountAddress: user1,
        localTokenAddress: erc20.address,
        value: erc20value
      });

      balance.should.be.bignumber.equal(erc20value);
    });

    it("should revert when token is not mapped", async function() {
      await handler.addToken(foreignERC721, erc721.address, foreignERC721TxHash, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      await shouldFail.reverting(
        handler.depositERC20(1, foreignAccount1, foreignERC20, erc20value, { from: oracle })
      );
    });

    it("should revert when account is not mapped", async function() {
      await handler.addToken(foreignERC20, erc20.address, foreignERC20TxHash, { from: owner });
      await handler.addAccount(foreignAccount2, user2, signature2, { from: user2 });

      await shouldFail.reverting(
        handler.depositERC20(1, foreignAccount1, foreignERC20, erc20value, { from: oracle })
      );
    });

    it("should revert when not called by oracle", async function() {
      await handler.addToken(foreignERC20, erc20.address, foreignERC20TxHash, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      await shouldFail.reverting(
        handler.depositERC20(1, foreignAccount1, foreignERC20, erc20value, { from: owner })
      );
    });
  });

  context("with erc721", async function() {
    it("should deposit if mapped", async function() {
      await handler.addToken(foreignERC721, erc721.address, foreignERC721TxHash, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      let result = await handler.depositERC721(1, foreignAccount1, foreignERC721, erc721tokenId, {
        from: oracle
      });

      let newOwner = await erc721.ownerOf(erc721tokenId);

      expectEvent.inLogs(result.logs, "ERC721Deposited", {
        depositId: new BN("1"),
        foreignAccountAddress: foreignAccount1,
        foreignTokenAddress: foreignERC721,
        localAccountAddress: user1,
        localTokenAddress: erc721.address,
        tokenId: erc721tokenId
      });

      newOwner.should.be.equal(user1);
    });

    it("should revert when token is not mapped", async function() {
      await handler.addToken(foreignERC20, erc20.address, foreignERC20TxHash, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      await shouldFail.reverting(
        handler.depositERC721(1, foreignAccount1, foreignERC721, erc721tokenId, { from: oracle })
      );
    });

    it("should revert when account is not mapped", async function() {
      await handler.addToken(foreignERC721, erc721.address, foreignERC721TxHash, { from: owner });
      await handler.addAccount(foreignAccount2, user2, signature2, { from: user2 });

      await shouldFail.reverting(
        handler.depositERC721(1, foreignAccount1, foreignERC721, erc721tokenId, { from: oracle })
      );
    });

    it("should revert when not called by oracle", async function() {
      await handler.addToken(foreignERC721, erc721.address, foreignERC721TxHash, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      await shouldFail.reverting(
        handler.depositERC721(1, foreignAccount1, foreignERC721, erc721tokenId, { from: owner })
      );
    });
  });

  context("with eth", async function() {
    it("should deposit", async function() {
      handler.setEthTokenAddress(ethToken.address, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      let result = await handler.depositETH(1, foreignAccount1, ethValue, { from: oracle });

      let balance = await ethToken.balanceOf(user1);

      expectEvent.inLogs(result.logs, "ETHDeposited", {
        depositId: new BN("1"),
        foreignAccountAddress: foreignAccount1,
        localAccountAddress: user1,
        value: ethValue
      });

      balance.should.be.bignumber.equal(ethValue);
    });

    it("should revert when ethereum token address is not registered", async function () {
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      await shouldFail.reverting(handler.depositETH(1, foreignAccount1, ethValue, { from: oracle }));
    });

    it("should revert when account is not mapped", async function() {
      handler.setEthTokenAddress(ethToken.address, { from: owner });
      await handler.addAccount(foreignAccount2, user2, signature2, { from: user2 });

      await shouldFail.reverting(handler.depositETH(1, foreignAccount1, ethValue, { from: oracle }));
    });

    it("should revert when not called by oracle", async function() {
      handler.setEthTokenAddress(ethToken.address, { from: owner });
      await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });

      await shouldFail.reverting(handler.depositETH(1, foreignAccount1, ethValue, { from: owner }));
    });
  });
});
