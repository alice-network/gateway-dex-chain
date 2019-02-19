pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

import "./IERC20GatewayMintable.sol";


contract ERC20GatewayMintable is ERC20, ERC20Detailed, IERC20GatewayMintable {
    address public gateway;

    constructor (
        address gatewayAddress, string memory name, string memory symbol, uint8 decimals
    ) public ERC20Detailed(name, symbol, decimals) {
        gateway = gatewayAddress;
    }

    function mintToGateway(uint256 amount) public {
        require(msg.sender == gateway);

        _mint(gateway, amount);
    }
}
