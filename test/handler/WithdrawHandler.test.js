const WithdrawHandler = artifacts.require("./handler/WithdrawHandler.sol");
const ERC20Token = artifacts.require("./token/ERC20GatewayMintable.sol");
const ERC721Token = artifacts.require("./token/ERC721GatewayMintable.sol");
const ERC721BasicToken = artifacts.require("./token/ERC721BasicToken.sol");
const EthereumToken = artifacts.require("./token/EthereumToken.sol");

const { BN, ether, constants, shouldFail, expectEvent } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

const { signMessageHash, signMessageHashWithPrivateKey } = require("../utils/sign.js");

contract("WithdrawHandler", function ([admin, owner, oracle, user1, user2, user3]) {
  const erc20value = new BN("100");
  const erc721tokenId = new BN("253");
  const ethValue = ether("20");
  let handler;
  let erc20;
  let erc721;
  let ethToken;
  let notMappedERC20;
  let notMappedERC721;
  let foreignAccount1 = "0x6FFD42164CD57BA12EB8096457BDD5eAcdeDad72";
  let foreignPrivateKey1 = "0x7ce1a71f5e8f3e2f3efe53922b0f59bb76e4f1a70e0fdb1558df41cd50b85d26";
  let foreignAccount2 = "0xb8FD81eD9Ae1000715284cfeA6B0b5684b75d254";
  let foreignPrivateKey2 = "0x9525ae079f9166ed838a7869d125b05159fd2c75307eb6f68f3565a8200f90f7";
  let foreignAccount3 = "0xf2b4686228523F52177122016AEA07250DF37527";
  let foreignPrivateKey3 = "0xa673114a9b5f4bd74599f1d4273733e460e9a1b3707f1bc57b46e59b7eac2991";
  let foreignERC20 = "0xB8c77482e45F1F44dE1745F52C74426C631bDD52"; // BNB
  let foreignERC721 = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"; // CK;
  let foreignERC721_2 = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // CK;
  let foreignOracle = "0x20B6ca2fa5E09804d0BEE56BfBBc87653F176539";
  let foreignOraclePrivateKey = "0x82796c2333e6400f9651a0b4c646af7224945fa7cfd71c0e7672498ec9b2e5a8";
  let msg1;
  let signature1;
  let msg2;
  let signature2;

  async function initialize(owner, oracle, foreignOracle) {
    const signature = "initialize(address,address,address)";
    const args = [owner, oracle, foreignOracle];
    await handler.methods[signature](...args, { from: admin })
  }

  before(async function () {
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

    msg3 = web3.utils.soliditySha3(
      { type: "address", value: foreignAccount3 },
      { type: "address", value: user3 }
    );
    signature3 = await signMessageHashWithPrivateKey(msg3, foreignPrivateKey3);

    notMappedERC20 = await ERC20Token.new(admin, "Not Mapped ERC20", "NOMAP20", 18, { from: admin });
    notMappedERC721 = await ERC721Token.new(admin, "Not Mapped ERC721", "NOMAP721", { from: admin });
  });

  beforeEach(async function () {
    handler = await WithdrawHandler.new({ from: admin });
    await initialize(owner, oracle, foreignOracle);

    erc20 = await ERC20Token.new(handler.address, "Mapped ERC20", "MAP20", 18, { from: admin });
    erc721 = await ERC721Token.new(handler.address, "Mapped ERC721", "MAP721", { from: admin });
    ethToken = await EthereumToken.new(handler.address, { from: admin });

    await handler.addToken(foreignERC20, erc20.address, "0xcc4aa204", { from: owner });
    await handler.addToken(foreignERC721, erc721.address, "0x9013e617", { from: owner });
    await handler.setEthTokenAddress(ethToken.address, { from: owner });
    await handler.addAccount(foreignAccount1, user1, signature1, { from: user1 });
    await handler.addAccount(foreignAccount2, user2, signature2, { from: user2 });
    await handler.addAccount(foreignAccount3, user3, signature3, { from: user3 });

    await handler.depositERC20(1, foreignAccount1, foreignERC20, erc20value, { from: oracle });
    await handler.depositERC20(2, foreignAccount2, foreignERC20, erc20value, { from: oracle });
    await handler.depositERC20(3, foreignAccount3, foreignERC20, erc20value, { from: oracle });
    await handler.depositERC721(4, foreignAccount1, foreignERC721, erc721tokenId, { from: oracle });
    await handler.depositERC721(5, foreignAccount2, foreignERC721, erc721tokenId + 1, { from: oracle });
    await handler.depositERC721(6, foreignAccount3, foreignERC721, erc721tokenId + 2, { from: oracle });
    await handler.depositETH(7, foreignAccount1, ethValue, { from: oracle });
    await handler.depositETH(8, foreignAccount2, ethValue, { from: oracle });
    await handler.depositETH(9, foreignAccount3, ethValue, { from: oracle });

    await handler.removeAccount(foreignAccount3, user3, signature3, { from: user3 });
  });

  context("submit withdraw", async function () {
    context("with erc20", async function () {
      it("should withdraw", async function () {
        let before = await erc20.balanceOf(user1);

        await erc20.approve(handler.address, erc20value, { from: user1 });

        let result = await handler.withdrawERC20(erc20.address, erc20value, {
          from: user1
        });

        let after = await erc20.balanceOf(user1);

        before.sub(after).should.be.bignumber.equal(erc20value);

        expectEvent.inLogs(result.logs, "WithdrawalSubmitted", {
          withdrawalNonce: new BN("1"),
          foreignTokenAddress: foreignERC20,
          foreignAccountAddress: foreignAccount1,
          value: erc20value
        });
      });

      it("should revert if calling account is not mapped", async function () {
        await erc20.approve(handler.address, erc20value, { from: user3 });

        await shouldFail.reverting(
          handler.withdrawERC20(erc20.address, erc20value, { from: user3 })
        );
      });

      it("should revert if token is not mapped", async function () {
        await notMappedERC20.approve(handler.address, erc20value, { from: user1 });

        await shouldFail.reverting(
          handler.withdrawERC20(notMappedERC20.address, erc20value, { from: user1 })
        );
      });

      it("should revert if token is not ERC20", async function () {
        await erc721.approve(handler.address, erc721tokenId, { from: user1 });

        await shouldFail.reverting(
          handler.withdrawERC20(erc721.address, erc721tokenId, { from: user1 })
        );
      });
    });

    context("with erc721", async function () {
      it("should withdraw", async function () {
        let beforeOwner = await erc721.ownerOf(erc721tokenId);

        await erc721.approve(handler.address, erc721tokenId, { from: user1 });

        let result = await handler.withdrawERC721(erc721.address, erc721tokenId, {
          from: user1
        });

        let afterOwner = await erc721.ownerOf(erc721tokenId);

        assert.equal(user1, beforeOwner);
        assert.equal(handler.address, afterOwner);

        expectEvent.inLogs(result.logs, "WithdrawalSubmitted", {
          withdrawalNonce: new BN("1"),
          foreignTokenAddress: foreignERC721,
          foreignAccountAddress: foreignAccount1,
          value: erc721tokenId
        });
      });

      it("should withdraw using safeTransferFrom", async function () {
        let beforeOwner = await erc721.ownerOf(erc721tokenId);

        let result = await erc721.safeTransferFrom(user1, handler.address, erc721tokenId, { from: user1 });

        let afterOwner = await erc721.ownerOf(erc721tokenId);

        assert.equal(user1, beforeOwner);
        assert.equal(handler.address, afterOwner);

        await expectEvent.inTransaction(result.tx, WithdrawHandler, "WithdrawalSubmitted", {
          withdrawalNonce: new BN("1"),
          foreignTokenAddress: foreignERC721,
          foreignAccountAddress: foreignAccount1,
          value: erc721tokenId
        });
      });

      it("should withdraw using safeTransferFrom when erc721 follows old standard", async function () {
        const oldErc721 = await ERC721BasicToken.new(handler.address, "Old ERC721", "OE721", { from: admin });
        await handler.addToken(foreignERC721_2, oldErc721.address, "0x9013e617", { from: owner });
        await handler.depositERC721(5, foreignAccount2, foreignERC721_2, erc721tokenId, { from: oracle });

        let beforeOwner2 = await oldErc721.ownerOf(erc721tokenId);

        let result2 = await oldErc721.safeTransferFrom(user2, handler.address, erc721tokenId, { from: user2 });

        let afterOwner2 = await oldErc721.ownerOf(erc721tokenId);

        assert.equal(user2, beforeOwner2);
        assert.equal(handler.address, afterOwner2);

        await expectEvent.inTransaction(result2.tx, WithdrawHandler, "WithdrawalSubmitted", {
          withdrawalNonce: new BN("1"),
          foreignTokenAddress: foreignERC721_2,
          foreignAccountAddress: foreignAccount2,
          value: erc721tokenId
        });
      });

      it("should revert if calling account is not mapped", async function () {
        await shouldFail.reverting(
          handler.withdrawERC721(erc721.address, erc721tokenId, { from: user3 })
        );
      });

      it("should revert if token is not mapped", async function () {
        await notMappedERC20.approve(handler.address, erc721tokenId, { from: user1 });

        await shouldFail.reverting(
          handler.withdrawERC721(notMappedERC20.address, erc721tokenId, { from: user1 })
        );
      });

      it("should revert if token is not ERC721", async function () {
        await erc20.approve(handler.address, erc20value, { from: user1 });

        await shouldFail.reverting(
          handler.withdrawERC721(erc20.address, erc20value, { from: user1 })
        );
      });
    });

    context("with eth", async function () {
      it("should withdraw", async function () {
        let before = await ethToken.balanceOf(user1);

        await ethToken.approve(handler.address, ethValue, { from: user1 });

        let result = await handler.withdrawETH(ethValue, {
          from: user1
        });

        let after = await ethToken.balanceOf(user1);

        before.sub(after).should.be.bignumber.equal(ethValue);

        expectEvent.inLogs(result.logs, "WithdrawalSubmitted", {
          withdrawalNonce: new BN("1"),
          foreignTokenAddress: ZERO_ADDRESS,
          foreignAccountAddress: foreignAccount1,
          value: ethValue
        });
      });

      it("should revert if calling account is not mapped", async function () {
        await ethToken.approve(handler.address, ethValue, { from: user3 });

        await shouldFail.reverting(
          handler.withdrawETH(ethValue, { from: user3 })
        );
      });
    });
  });

  context("sign withdraw", async function () {
    beforeEach(async function () {
      await erc20.approve(handler.address, erc20value, { from: user1 });

      let result = await handler.withdrawERC20(erc20.address, erc20value, {
        from: user1
      });

      expectEvent.inLogs(result.logs, "WithdrawalSubmitted", {
        withdrawalNonce: new BN("1"),
        foreignTokenAddress: foreignERC20,
        foreignAccountAddress: foreignAccount1,
        value: erc20value
      });
    });

    it("should accept signature", async function () {
      let msg = web3.utils.soliditySha3(
        { type: "uint", value: 1 },
        { type: "address", value: foreignERC20 },
        { type: "address", value: foreignAccount1 },
        { type: "uint", value: erc20value }
      );

      let signature = await signMessageHashWithPrivateKey(msg, foreignOraclePrivateKey);

      let result = await handler.signPendingWithdrawal(1, signature, { from: oracle });

      expectEvent.inLogs(result.logs, "WithdrawalSigned", {
        withdrawalNonce: new BN("1"),
        foreignTokenAddress: foreignERC20,
        foreignAccountAddress: foreignAccount1,
        value: erc20value,
        signature: signature
      });
    });

    it("should revert if withdraw nonce is not valid", async function () {
      let msg = web3.utils.soliditySha3(
        { type: "uint", value: 2 },
        { type: "address", value: foreignERC20 },
        { type: "address", value: foreignAccount1 },
        { type: "uint", value: erc20value }
      );
      let signature = await signMessageHashWithPrivateKey(msg, foreignOraclePrivateKey);

      await shouldFail.reverting(handler.signPendingWithdrawal(2, signature, { from: oracle }));
    });

    it("should revert if withdraw already signed", async function() {
      let msg = web3.utils.soliditySha3(
        { type: "uint", value: 1 },
        { type: "address", value: foreignERC20 },
        { type: "address", value: foreignAccount1 },
        { type: "uint", value: erc20value }
      );

      let signature = await signMessageHashWithPrivateKey(msg, foreignOraclePrivateKey);

      await handler.signPendingWithdrawal(1, signature, { from: oracle });

      await shouldFail.reverting(handler.signPendingWithdrawal(1, signature, { from: oracle }));
    });

    it("should revert if signature is not valid", async function () {
      let msg1 = web3.utils.soliditySha3(
        { type: "uint", value: 1 },
        { type: "address", value: foreignERC721 },
        { type: "address", value: foreignAccount2 },
        { type: "uint", value: erc721tokenId }
      );
      let signature1 = await signMessageHashWithPrivateKey(msg1, foreignOraclePrivateKey);

      // should revert if signature is not signed with withdraw information
      await shouldFail.reverting(
        handler.signPendingWithdrawal(1, signature1, { from: oracle })
      );

      let msg2 = web3.utils.soliditySha3(
        { type: "uint", value: 1 },
        { type: "address", value: foreignERC20 },
        { type: "address", value: foreignAccount1 },
        { type: "uint", value: erc20value }
      );
      let signature2 = await signMessageHash(msg2, owner);

      // should revert if signature is not signed by oracle
      await shouldFail.reverting(
        handler.signPendingWithdrawal(1, signature2, { from: oracle })
      );
    });

    it("should revert if caller is not oracle", async function () {
      let msg = web3.utils.soliditySha3(
        { type: "uint", value: 1 },
        { type: "address", value: foreignERC721 },
        { type: "address", value: foreignAccount2 },
        { type: "uint", value: erc721tokenId }
      );
      let signature = await signMessageHashWithPrivateKey(msg, foreignOraclePrivateKey);

      await shouldFail.reverting(
        handler.signPendingWithdrawal(1, signature, { from: owner })
      );
    });
  });
});
