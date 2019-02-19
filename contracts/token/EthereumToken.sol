pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

import "./ERC20GatewayMintable.sol";


contract EthereumToken is ERC20GatewayMintable {
    constructor(address _gateway) public ERC20GatewayMintable(_gateway, "Ethereum", "ETH", 18) {
    }
}
