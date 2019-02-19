pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";


contract IERC721GatewayMintable is IERC721 {
    function mintToGateway(uint256 tokenId) public;
}
