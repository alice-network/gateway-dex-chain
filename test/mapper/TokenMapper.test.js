const TokenMapper = artifacts.require("./mapper/TokenMapper.sol");
const ERC20Token = artifacts.require("./mock/ERC20Mock.sol");
const ERC721Token = artifacts.require("./mock/ERC721Mock.sol");

const { constants, shouldFail } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

const PROXY_ID_ERC20 = "0xcc4aa204";
const PROXY_ID_ERC721 = "0x9013e617";

contract("TokenMapper", function ([admin, owner, oracle, user]) {
  let mapper;
  let foreignOracle = "0x20B6ca2fa5E09804d0BEE56BfBBc87653F176539";
  let foreignERC20 = "0xB8c77482e45F1F44dE1745F52C74426C631bDD52"; // BNB
  let foreignERC721 = "0x06012c8cf97BEaD5deAe237070F9587f8E7A266d"; // CK;
  let otherForeignERC20 = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC
  let erc20;
  let erc721;

  async function initialize(owner, oracle, foreignOracle) {
    const signature = "initialize(address,address,address)";
    const args = [owner, oracle, foreignOracle];
    await mapper.methods[signature](...args, { from: admin })
  }

  beforeEach(async function () {
    erc20 = await ERC20Token.new();
    erc721 = await ERC721Token.new();
    mapper = await TokenMapper.new({ from: admin });
    await initialize(owner, oracle, foreignOracle)
  });

  context("Add Mapping", function () {
    it("should add token mapping", async function () {
      await mapper.addToken(foreignERC20, erc20.address, PROXY_ID_ERC20, { from: owner });

      assert.equal(true, await mapper.isLocalTokenAdded(erc20.address));
      assert.equal(true, await mapper.isForeignTokenAdded(foreignERC20));
      assert.equal(true, await mapper.isTokenMapped(foreignERC20, erc20.address));

      assert.equal(foreignERC20, await mapper.getForeignTokenOf(erc20.address));
      assert.equal(erc20.address, await mapper.getLocalTokenOf(foreignERC20));
    });

    it("should not add if already mapped", async function () {
      await mapper.addToken(foreignERC20, erc20.address, PROXY_ID_ERC20, { from: owner });
      const otherErc20 = await ERC20Token.new();

      assert.equal(true, await mapper.isLocalTokenAdded(erc20.address));
      assert.equal(true, await mapper.isForeignTokenAdded(foreignERC20));
      assert.equal(true, await mapper.isTokenMapped(foreignERC20, erc20.address));

      assert.equal(false, await mapper.isLocalTokenAdded(otherErc20.address));
      assert.equal(false, await mapper.isForeignTokenAdded(otherForeignERC20));

      await shouldFail.reverting(
        mapper.addToken(foreignERC20, otherErc20.address, PROXY_ID_ERC20, { from: owner })
      );

      await shouldFail.reverting(
        mapper.addToken(otherForeignERC20, erc20.address, PROXY_ID_ERC20, { from: owner })
      );
    });

    it("should not add if not called by owner", async function () {
      await shouldFail.reverting(
        mapper.addToken(foreignERC20, erc20.address, PROXY_ID_ERC20, { from: oracle })
      );
    });

    it("should get mapped tokens by proxy ID", async function () {
      await mapper.addToken(foreignERC20, erc20.address, PROXY_ID_ERC20, { from: owner });
      await mapper.addToken(foreignERC721, erc721.address, PROXY_ID_ERC721, { from: owner });

      let erc20tokens = await mapper.getTokensOf(PROXY_ID_ERC20);
      let erc721tokens = await mapper.getTokensOf(PROXY_ID_ERC721);

      erc20tokens.should.have.lengthOf(1);
      erc721tokens.should.have.lengthOf(1);

      erc20tokens.should.contain(erc20.address);
      erc721tokens.should.contain(erc721.address);
    });

    it("should get proxy ID by mapped token address", async function () {
      await mapper.addToken(foreignERC20, erc20.address, PROXY_ID_ERC20, { from: owner });
      await mapper.addToken(foreignERC721, erc721.address, PROXY_ID_ERC721, { from: owner });

      let idOf20 = await mapper.getProxyIdOf(erc20.address);
      let idOf721 = await mapper.getProxyIdOf(erc721.address);

      idOf20.should.be.equal(PROXY_ID_ERC20);
      idOf721.should.be.equal(PROXY_ID_ERC721);
    });

    it("should get all AddressPairs of mapped token address", async function () {
      const otherErc20 = await ERC20Token.new();
      await mapper.addToken(foreignERC20, erc20.address, PROXY_ID_ERC20, { from: owner });
      await mapper.addToken(otherForeignERC20, otherErc20.address, PROXY_ID_ERC20, { from: owner });
      await mapper.addToken(foreignERC721, erc721.address, PROXY_ID_ERC721, { from: owner });

      let pairs = await mapper.getTokenAddressPairs();

      pairs[0].localAddress.should.be.equal(erc20.address);
      pairs[0].foreignAddress.should.be.equal(foreignERC20);
      pairs[0].proxyId.should.be.equal(PROXY_ID_ERC20);
      pairs[1].localAddress.should.be.equal(otherErc20.address);
      pairs[1].foreignAddress.should.be.equal(otherForeignERC20);
      pairs[1].proxyId.should.be.equal(PROXY_ID_ERC20);
      pairs[2].localAddress.should.be.equal(erc721.address);
      pairs[2].foreignAddress.should.be.equal(foreignERC721);
      pairs[2].proxyId.should.be.equal(PROXY_ID_ERC721);
    });
  });

  context("Remove Mapping", function () {
    let otherErc20;

    before(async function () {
      otherErc20 = await ERC20Token.new();
    });

    beforeEach(async function () {
      await mapper.addToken(foreignERC20, erc20.address, PROXY_ID_ERC20, { from: owner });
      await mapper.addToken(otherForeignERC20, otherErc20.address, PROXY_ID_ERC20, { from: owner });
    });

    it("should remove token mapping", async function () {
      await mapper.removeToken(otherForeignERC20, otherErc20.address, { from: owner });

      assert.equal(false, await mapper.isLocalTokenAdded(otherErc20.address));
      assert.equal(false, await mapper.isForeignTokenAdded(otherForeignERC20));
      assert.equal(false, await mapper.isTokenMapped(otherForeignERC20, otherErc20.address));

      assert.equal(ZERO_ADDRESS, await mapper.getForeignTokenOf(otherErc20.address));
      assert.equal(ZERO_ADDRESS, await mapper.getLocalTokenOf(otherForeignERC20));

      await mapper.removeToken(foreignERC20, erc20.address, { from: owner });

      assert.equal(false, await mapper.isLocalTokenAdded(erc20.address));
      assert.equal(false, await mapper.isForeignTokenAdded(foreignERC20));
      assert.equal(false, await mapper.isTokenMapped(foreignERC20, erc20.address));

      assert.equal(ZERO_ADDRESS, await mapper.getForeignTokenOf(erc20.address));
      assert.equal(ZERO_ADDRESS, await mapper.getLocalTokenOf(foreignERC20));
    });

    it("should not remove if not mapped", async function () {
      await shouldFail.reverting(
        mapper.removeToken(foreignERC721, erc721.address, { from: owner })
      );
    });

    it("should not remove if already removed", async function () {
      await mapper.removeToken(foreignERC20, erc20.address, { from: owner });

      assert.equal(false, await mapper.isLocalTokenAdded(erc20.address));
      assert.equal(false, await mapper.isForeignTokenAdded(foreignERC20));
      assert.equal(false, await mapper.isTokenMapped(foreignERC20, erc20.address));

      assert.equal(ZERO_ADDRESS, await mapper.getForeignTokenOf(erc20.address));
      assert.equal(ZERO_ADDRESS, await mapper.getLocalTokenOf(foreignERC20));

      await shouldFail.reverting(
        mapper.removeToken(foreignERC20, erc20.address, { from: owner })
      );
    });

    it("should not remove if not called by owner", async function () {
      await shouldFail.reverting(
        mapper.removeToken(foreignERC20, erc20.address, { from: user })
      );
    });
  });
});
