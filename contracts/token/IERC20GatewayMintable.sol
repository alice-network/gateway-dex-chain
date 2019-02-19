pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract IERC20GatewayMintable is IERC20 {
    function mintToGateway(uint256 amount) public;
}
