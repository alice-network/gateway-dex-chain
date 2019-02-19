const ERC721GatewayMintable = artifacts.require("./token/ERC721GatewayMintable.sol");

const { BN, constants, shouldFail, expectEvent } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

contract("ERC721GatewayMintable", function([admin, gateway, user]) {
  const tokenId = new BN("1");
  let token;

  beforeEach(async function() {
    token = await ERC721GatewayMintable.new(gateway, "ERC721", "E721", { from: admin });
  });

  context("called by gateway", function() {
    let logs;

    beforeEach(async function() {
      let result = await token.mintToGateway(tokenId, { from: gateway });
      logs = result.logs;
    });

    it("should mint requested token", async function() {
      (await token.ownerOf(tokenId)).should.be.equal(gateway);
    });

    it("should emit a transfer event", async function() {
      expectEvent.inLogs(logs, "Transfer", {
        from: ZERO_ADDRESS,
        to: gateway,
        tokenId: tokenId
      });
    });
  });

  context("not called by gateway", function() {
    it("should revert", async function() {
      await shouldFail.reverting(token.mintToGateway(tokenId, { from: user }));
    });
  });
});
