const Gateway = artifacts.require("./Gateway.sol");
const ERC20Token = artifacts.require("./token/ERC20GatewayMintable.sol");
const ERC721Token = artifacts.require("./token/ERC721GatewayMintable.sol");
const EthereumCoin = artifacts.require("./token/EthereumCoin.sol");

const { BN, ether, constants, expectEvent } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;
const { signMessageHashWithPrivateKey } = require("./utils/sign.js");

contract("Gateway", function([admin, owner, oracle, user1, user2]) {
  const erc20value = new BN("100");
  const erc721tokenId = new BN("253");
  const ethValue = ether("20");

  let gateway;
  let erc20;
  let erc721;
  let ethToken;
  let foreignAccount1 = "0x6FFD42164CD57BA12EB8096457BDD5eAcdeDad72";
  let foreignPrivateKey1 = "0x7ce1a71f5e8f3e2f3efe53922b0f59bb76e4f1a70e0fdb1558df41cd50b85d26";
  let foreignAccount2 = "0xb8FD81eD9Ae1000715284cfeA6B0b5684b75d254";
  let foreignPrivateKey2 = "0x9525ae079f9166ed838a7869d125b05159fd2c75307eb6f68f3565a8200f90f7";
  let foreignERC20 = "0xB8c77482e45F1F44dE1745F52C74426C631bDD52"; // BNB
  let foreignERC721 = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"; // CK;
  let foreignOracle = "0x20B6ca2fa5E09804d0BEE56BfBBc87653F176539";
  let foreignOraclePrivateKey = "0x82796c2333e6400f9651a0b4c646af7224945fa7cfd71c0e7672498ec9b2e5a8";

  async function initialize(owner, oracle, foreignOracle) {
    const signature = "initialize(address,address,address)";
    const args = [owner, oracle, foreignOracle];
    await gateway.methods[signature](...args, { from: admin });
  }

  before(async function() {
    gateway = await Gateway.new({ from: admin });
    await initialize(owner, oracle, foreignOracle);

    erc20 = await ERC20Token.new(gateway.address, "ERC20", "E20", 18, { from: admin });
    erc721 = await ERC721Token.new(gateway.address, "ERC721", "E721", { from: admin });
    ethToken = await EthereumCoin.new(gateway.address, { from: admin });

    await gateway.setEthTokenAddress(ethToken.address, { from: owner });

    accountSignature1 = await signMessageHashWithPrivateKey(
      web3.utils.soliditySha3(
        { type: "address", value: foreignAccount1 },
        { type: "address", value: user1 }
      ),
      foreignPrivateKey1
    );
    accountSignature2 = await signMessageHashWithPrivateKey(
      web3.utils.soliditySha3(
        { type: "address", value: foreignAccount2 },
        { type: "address", value: user2 }
      ),
      foreignPrivateKey2
    );
    withdrawSignature1 = await signMessageHashWithPrivateKey(
      web3.utils.soliditySha3(
        { type: "uint", value: 1 },
        { type: "address", value: ZERO_ADDRESS },
        { type: "address", value: foreignAccount1 },
        { type: "uint", value: ethValue }
      ),
      foreignOraclePrivateKey
    );
    withdrawSignature2 = await signMessageHashWithPrivateKey(
      web3.utils.soliditySha3(
        { type: "uint", value: 2 },
        { type: "address", value: foreignERC20 },
        { type: "address", value: foreignAccount1 },
        { type: "uint", value: erc20value }
      ),
      foreignOraclePrivateKey
    );
    withdrawSignature3 = await signMessageHashWithPrivateKey(
      web3.utils.soliditySha3(
        { type: "uint", value: 3 },
        { type: "address", value: foreignERC721 },
        { type: "address", value: foreignAccount1 },
        { type: "uint", value: erc721tokenId }
      ),
      foreignOraclePrivateKey
    );
  });

  context("Token Mapping", async function() {
    it("should add token mapping", async function() {
      await gateway.addToken(foreignERC20, erc20.address, "0xcc4aa204", { from: owner });
      (await gateway.isTokenMapped(foreignERC20, erc20.address)).should.be.equal(true);
      await gateway.addToken(foreignERC721, erc721.address, "0x9013e617", { from: owner });
      (await gateway.isTokenMapped(foreignERC721, erc721.address)).should.be.equal(true);
    });
  });

  context("Address Mapping", async function() {
    it("should add address mapping", async function() {
      await gateway.addAccount(foreignAccount1, user1, accountSignature1, { from: user1 });
      (await gateway.isAccountMapped(foreignAccount1, user1)).should.be.equal(true);
      await gateway.addAccount(foreignAccount2, user2, accountSignature2, { from: user2 });
      (await gateway.isAccountMapped(foreignAccount2, user2)).should.be.equal(true);
    });
  });

  context("Deposit", async function() {
    context("ETH", async function() {
      it("should deposit eth", async function() {
        let result = await gateway.depositETH(1, foreignAccount1, ethValue, { from: oracle });
        let balance = await ethToken.balanceOf(user1);

        expectEvent.inLogs(result.logs, "ETHDeposited", {
          depositId: new BN("1"),
          foreignAccountAddress: foreignAccount1,
          localAccountAddress: user1,
          value: ethValue
        });

        balance.should.be.bignumber.equal(ethValue);
      });
    });

    context("ERC20", async function() {
      it("should deposit ERC20", async function() {
        let result = await gateway.depositERC20(1, foreignAccount1, foreignERC20, erc20value, { from: oracle });
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
    });

    context("ERC721", async function() {
      it("should deposit ERC721", async function() {
        let result = await gateway.depositERC721(1, foreignAccount1, foreignERC721, erc721tokenId, { from: oracle });
        let owner = await erc721.ownerOf(erc721tokenId);

        expectEvent.inLogs(result.logs, "ERC721Deposited", {
          depositId: new BN("1"),
          foreignAccountAddress: foreignAccount1,
          foreignTokenAddress: foreignERC721,
          localAccountAddress: user1,
          localTokenAddress: erc721.address,
          tokenId: erc721tokenId
        });

        owner.should.be.equal(user1);
      });
    });
  });

  context("Withdraw", async function() {
    context("submit", async function() {
      context("ETH", async function() {
        it("should submit withdraw", async function() {
          let before = await ethToken.balanceOf(user1);

          await ethToken.approve(gateway.address, ethValue, { from: user1 });

          let result = await gateway.withdrawETH(ethValue, { from: user1 });

          let after = await ethToken.balanceOf(user1);

          ethValue.should.be.bignumber.equal(before.sub(after));

          expectEvent.inLogs(result.logs, "WithdrawalSubmitted", {
            withdrawalNonce: new BN("1"),
            foreignTokenAddress: ZERO_ADDRESS,
            foreignAccountAddress: foreignAccount1,
            value: ethValue
          });
        });
      });

      context("ERC20", async function() {
        it("should submit withdraw", async function() {
          let before = await erc20.balanceOf(user1);

          await erc20.approve(gateway.address, erc20value, { from: user1 });

          let result = await gateway.withdrawERC20(erc20.address, erc20value, { from: user1 });

          let after = await erc20.balanceOf(user1);

          erc20value.should.be.bignumber.equal(before.sub(after));

          expectEvent.inLogs(result.logs, "WithdrawalSubmitted", {
            withdrawalNonce: new BN("2"),
            foreignTokenAddress: foreignERC20,
            foreignAccountAddress: foreignAccount1,
            value: erc20value
          });
        });
      });

      context("ERC721", async function() {
        it("should submit withdraw", async function() {
          let beforeOwner = await erc721.ownerOf(erc721tokenId);

          await erc721.approve(gateway.address, erc721tokenId, { from: user1 });

          let result = await gateway.withdrawERC721(erc721.address, erc721tokenId, { from: user1 });

          let afterOwner = await erc721.ownerOf(erc721tokenId);

          beforeOwner.should.be.equal(user1);
          afterOwner.should.be.equal(gateway.address);

          expectEvent.inLogs(result.logs, "WithdrawalSubmitted", {
            withdrawalNonce: new BN("3"),
            foreignTokenAddress: foreignERC721,
            foreignAccountAddress: foreignAccount1,
            value: erc721tokenId
          });
        });
      });
    });

    context("sign", async function() {
      it("should process with valid signature", async function() {
        let result1 = await gateway.signPendingWithdrawal(1, withdrawSignature1, { from: oracle });

        expectEvent.inLogs(result1.logs, "WithdrawalSigned", {
          withdrawalNonce: new BN("1"),
          signature: withdrawSignature1
        });

        let result2 = await gateway.signPendingWithdrawal(2, withdrawSignature2, { from: oracle });

        expectEvent.inLogs(result2.logs, "WithdrawalSigned", {
          withdrawalNonce: new BN("2"),
          signature: withdrawSignature2
        });

        let result3 = await gateway.signPendingWithdrawal(3, withdrawSignature3, { from: oracle });

        expectEvent.inLogs(result3.logs, "WithdrawalSigned", {
          withdrawalNonce: new BN("3"),
          signature: withdrawSignature3
        });
      });
    });
  });
});
