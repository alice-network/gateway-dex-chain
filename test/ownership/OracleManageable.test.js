const OracleManageable = artifacts.require("./mock/OracleManageableMock.sol");

const { constants, shouldFail } = require("openzeppelin-test-helpers");
const { ZERO_ADDRESS } = constants;

contract("OracleManagable", async function([admin, owner, oracle, newOracle, user]) {
  let managed;
  let foreignOracle = "0x20B6ca2fa5E09804d0BEE56BfBBc87653F176539";
  let newForeignOracle = "0xf9f46919cDf1B8c5c95AA8Be97f8bdDce2830557";

  async function initialize(owner, oracle, foreignOracle) {
    const signature = "initialize(address,address,address)";
    const args = [owner, oracle, foreignOracle];
    await managed.methods[signature](...args, { from: admin })
  }

  beforeEach(async function () {
    managed = await OracleManageable.new({ from: admin });
  });

  context("initialize", function () {
    it("should fail if oracle or foreignOracle is ZERO_ADDRESS", async function () {
      await shouldFail.reverting(initialize(owner, ZERO_ADDRESS, foreignOracle));
      await shouldFail.reverting(initialize(owner, oracle, ZERO_ADDRESS));
      await shouldFail.reverting(initialize(owner, ZERO_ADDRESS, ZERO_ADDRESS));
    });
  });

  context("with oracle", function () {
    beforeEach(async function () {
      await initialize(owner, oracle, foreignOracle);
    });

    it("should change oracle", async function () {
      await managed.changeOracle(newOracle, { from: owner });

      (await managed.oracle()).should.be.equal(newOracle);
    });

    it("should not change oracle if not called by owner", async function () {
      await shouldFail.reverting(managed.changeOracle(newOracle, { from: user }));
    });

    it("should not change oracle if newOracle is ZERO_ADDRESS", async function () {
      await shouldFail.reverting(managed.changeOracle(ZERO_ADDRESS, { from: owner }));
    });

    it("should change foreignOracle", async function () {
      await managed.changeForeignOracle(newForeignOracle, { from: owner });

      (await managed.foreignOracle()).should.be.equal(newForeignOracle);
    });

    it("should not change foreignOracle if not called by owner", async function () {
      await shouldFail.reverting(managed.changeForeignOracle(newForeignOracle, { from: user }));
    });

    it("should not change foreignOracle if newForeignOracle is ZERO_ADDRESS", async function () {
      await shouldFail.reverting(managed.changeForeignOracle(ZERO_ADDRESS, { from: owner }));
    });

    it("should ok onlyOracle if called by oracle", async function () {
      (await managed.restricted({ from: oracle })).should.be.equal(true);
    });

    it("should revert onlyOracle if not called by oracle", async function () {
      await shouldFail.reverting(managed.restricted({ from: user }));
    });
  });
});
