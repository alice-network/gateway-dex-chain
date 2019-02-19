pragma solidity ^0.5.0;

import "./ERC721GatewayMintable.sol";


contract IERC721ReceiverOld {
    /**
     * @notice Handle the receipt of an NFT
     * @dev The ERC721 smart contract calls this function on the recipient
     * after a `safeTransfer`. This function MUST return the function selector,
     * otherwise the caller will revert the transaction. The selector to be
     * returned can be obtained as `this.onERC721Received.selector`. This
     * function MAY throw to revert and reject the transfer.
     * Note: the ERC721 contract address is always the message sender.
     * @param from The address which previously owned the token
     * @param tokenId The NFT identifier which is being transferred
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`
     */
    function onERC721Received(address from, uint256 tokenId, bytes memory data)
    public returns (bytes4);
}


contract ERC721BasicToken is ERC721GatewayMintable {
    bytes4 private constant ERC721_RECEIVED_OLD = 0xf0b9e5ba;

    constructor (address gatewayAddress, string memory name, string memory symbol)
        public ERC721GatewayMintable(gatewayAddress, name, symbol) {}

    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data)
        internal returns (bool)
    {
        if (!to.isContract()) {
            return true;
        }

        bytes4 retval = IERC721ReceiverOld(to).onERC721Received(from, tokenId, _data);
        return (retval == ERC721_RECEIVED_OLD);
    }
}
