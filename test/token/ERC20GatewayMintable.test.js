const ERC20GatewayMintable = artifacts.require("./token/ERC20GatewayMintable.sol");

const { BN, constants, shouldFail, expectEvent } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

contract("ERC20GatewayMintable", function([admin, gateway, user]) {
  const amount = new BN("1");
  let token;

  beforeEach(async function() {
    token = await ERC20GatewayMintable.new(gateway, "ERC20", "E20", 18, { from: admin });
  });

  context("called by gateway", function() {
    let logs;

    beforeEach(async function() {
      let result = await token.mintToGateway(amount, { from: gateway });
      logs = result.logs;
    });

    it("should mint requested token", async function() {
      (await token.balanceOf(gateway)).should.be.bignumber.equal(amount);
    });

    it("should emit a transfer event", async function() {
      expectEvent.inLogs(logs, "Transfer", {
        from: ZERO_ADDRESS,
        to: gateway,
        value: amount
      });
    });
  });

  context("not called by gateway", function() {
    it("should revert", async function() {
      await shouldFail.reverting(token.mintToGateway(amount, { from: user }));
    });
  });
});
