pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";

import "./handler/WithdrawHandler.sol";


/**
 * @title Gateway
 * @dev This contract does nothing but wrapping WithdrawHandler
 */
contract Gateway is Initializable, WithdrawHandler {
    /**
     * @param oracle The address of oracle who is interacts with this Gateway contract.
     * @param foreignOracle The address of foreign oracle
     */
    function initialize(address owner, address oracle, address foreignOracle) public initializer {
        WithdrawHandler.initialize(owner, oracle, foreignOracle);
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
