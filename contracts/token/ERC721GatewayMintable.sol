pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol";

import "./IERC721GatewayMintable.sol";


contract ERC721GatewayMintable is ERC721, ERC721Metadata, IERC721GatewayMintable {
    address public gateway;

    constructor (address gatewayAddress, string memory name, string memory symbol) public ERC721Metadata(name, symbol) {
        gateway = gatewayAddress;
    }

    function mintToGateway(uint256 tokenId) public {
        require(msg.sender == gateway);

        _mint(gateway, tokenId);
    }
}
