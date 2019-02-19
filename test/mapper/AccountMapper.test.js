const AccountMapper = artifacts.require("./mapper/AccountMapper.sol");
const ERC721Token = artifacts.require("./mock/ERC721Mock.sol");

const { shouldFail } = require("openzeppelin-test-helpers");

const { signMessageHashWithPrivateKey } = require("../utils/sign.js");

contract("AccountMapper", async function([admin, owner, oracle, user1, user2]) {
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  let mapper;
  let foreignOracle = "0x20B6ca2fa5E09804d0BEE56BfBBc87653F176539";
  let foreignAccount = "0x6FFD42164CD57BA12EB8096457BDD5eAcdeDad72";
  let foreignPrivateKey = "0x7ce1a71f5e8f3e2f3efe53922b0f59bb76e4f1a70e0fdb1558df41cd50b85d26";
  let foreignAccount2 = "0xb8FD81eD9Ae1000715284cfeA6B0b5684b75d254";
  let foreignPrivateKey2 = "0x9525ae079f9166ed838a7869d125b05159fd2c75307eb6f68f3565a8200f90f7";
  let msg;
  let signature;

  async function initialize(owner, oracle, foreignOracle) {
    const signature = "initialize(address,address,address)";
    const args = [owner, oracle, foreignOracle];
    await mapper.methods[signature](...args, { from: admin })
  }

  beforeEach(async function() {
    erc721 = await ERC721Token.new();
    mapper = await AccountMapper.new({ from: admin });
    await initialize(owner, oracle, foreignOracle);

    msg = web3.utils.soliditySha3(
      { type: "address", value: foreignAccount },
      { type: "address", value: user1 }
    );

    signature = await signMessageHashWithPrivateKey(msg, foreignPrivateKey);
  });

  context("Add Mapping", async function() {
    it("should add account mapping", async function() {
      await mapper.addAccount(foreignAccount, user1, signature, { from: user1 });

      assert.equal(true, await mapper.isLocalAccountAdded(user1));
      assert.equal(true, await mapper.isForeignAccountAdded(foreignAccount));
      assert.equal(true, await mapper.isAccountMapped(foreignAccount, user1));

      assert.equal(foreignAccount, await mapper.getForeignAccountOf(user1));
      assert.equal(user1, await mapper.getLocalAccountOf(foreignAccount));
    });

    it("should not add if already mapped", async function() {
      await mapper.addAccount(foreignAccount, user1, signature, { from: user1 });

      assert.equal(true, await mapper.isLocalAccountAdded(user1));
      assert.equal(true, await mapper.isForeignAccountAdded(foreignAccount));
      assert.equal(true, await mapper.isAccountMapped(foreignAccount, user1));

      assert.equal(foreignAccount, await mapper.getForeignAccountOf(user1));
      assert.equal(user1, await mapper.getLocalAccountOf(foreignAccount));

      // Should not add both account is already mapped
      await shouldFail.reverting(
        mapper.addAccount(foreignAccount, user1, signature, { from: user1 })
      );

      let msg2 = web3.utils.soliditySha3(
        { type: "address", value: foreignAccount },
        { type: "address", value: user2 }
      );

      let signature2 = await signMessageHashWithPrivateKey(msg2, foreignPrivateKey);

      // should not add if foreign account is already added
      await shouldFail.reverting(
        mapper.addAccount(foreignAccount, user2, signature2, { from: user2 })
      );

      let msg3 = web3.utils.soliditySha3(
        { type: "address", value: foreignAccount2 },
        { type: "address", value: user1 }
      );

      let signature3 = await signMessageHashWithPrivateKey(msg3, foreignPrivateKey2);

      // should not add if local address is already added
      await shouldFail.reverting(
        mapper.addAccount(foreignAccount2, user1, signature3, { from: user1 })
      );
    });

    it("should not add if not called by owner", async function() {
      await shouldFail.reverting(
        mapper.addAccount(foreignAccount, user1, signature, { from: user2 })
      );
    });

    it("should not add if signiture is not valid", async function() {
      msg1 = web3.utils.soliditySha3(
        { type: "address", value: foreignAccount },
        { type: "address", value: user2 }
      );

      signature1 = await signMessageHashWithPrivateKey(msg1, foreignPrivateKey);

      msg2 = web3.utils.soliditySha3(
        { type: "address", value: foreignAccount2 },
        { type: "address", value: user1 }
      );

      signature2 = await signMessageHashWithPrivateKey(msg2, foreignPrivateKey);

      await shouldFail.reverting(
        mapper.addAccount(foreignAccount, user1, signature1, { from: user1 })
      );

      await shouldFail.reverting(
        mapper.addAccount(foreignAccount, user1, signature2, { from: user1 })
      );
    });
  });

  context("Remove Mapping", async function() {
    beforeEach(async function() {
      await mapper.addAccount(foreignAccount, user1, signature, { from: user1 });
    });

    it("should remove account mapping", async function() {
      await mapper.removeAccount(foreignAccount, user1, signature, { from: user1 });

      assert.equal(false, await mapper.isLocalAccountAdded(user1));
      assert.equal(false, await mapper.isForeignAccountAdded(foreignAccount));
      assert.equal(false, await mapper.isAccountMapped(foreignAccount, user1));

      assert.equal(zeroAddress, await mapper.getForeignAccountOf(user1));
      assert.equal(zeroAddress, await mapper.getLocalAccountOf(foreignAccount));
    });

    it("should not remove if already removed", async function() {
      await mapper.removeAccount(foreignAccount, user1, signature, { from: user1 });

      assert.equal(false, await mapper.isLocalAccountAdded(user1));
      assert.equal(false, await mapper.isForeignAccountAdded(foreignAccount));
      assert.equal(false, await mapper.isAccountMapped(foreignAccount, user1));

      assert.equal(zeroAddress, await mapper.getForeignAccountOf(user1));
      assert.equal(zeroAddress, await mapper.getLocalAccountOf(foreignAccount));

      await shouldFail.reverting(
        mapper.removeAccount(foreignAccount, user1, signature, {
          from: user1
        })
      );
    });

    it("should not remove if not called by owner", async function() {
      await shouldFail.reverting(
        mapper.removeAccount(foreignAccount, user1, signature, { from: user2 })
      );
    });

    it("should not remove if signiture is not valid", async function() {
      msg1 = web3.utils.soliditySha3(
        { type: "address", value: foreignAccount },
        { type: "address", value: user2 }
      );

      signature1 = await signMessageHashWithPrivateKey(msg1, foreignPrivateKey);

      msg2 = web3.utils.soliditySha3(
        { type: "address", value: foreignAccount2 },
        { type: "address", value: user1 }
      );

      signature2 = await signMessageHashWithPrivateKey(msg2, foreignPrivateKey);

      await shouldFail.reverting(
        mapper.removeAccount(foreignAccount, user1, signature1, { from: user1 })
      );

      await shouldFail.reverting(
        mapper.removeAccount(foreignAccount, user1, signature2, { from: user1 })
      );
    });
  });
});
