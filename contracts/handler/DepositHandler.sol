pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";

import "../token/IERC20GatewayMintable.sol";
import "../token/IERC721GatewayMintable.sol";

import "../mapper/TokenMapper.sol";


/**
 * @title DepositHandler
 */
contract DepositHandler is Initializable, TokenMapper {
    event ERC20Deposited(
        uint indexed depositId,
        address foreignAccountAddress, address foreignTokenAddress,
        address indexed localAccountAddress, address indexed localTokenAddress,
        uint256 value
    );

    event ERC721Deposited(
        uint indexed depositId,
        address foreignAccountAddress, address foreignTokenAddress,
        address indexed localAccountAddress, address indexed localTokenAddress,
        uint256 tokenId
    );

    event ETHDeposited(
        uint indexed depositId,
        address foreignAccountAddress,
        address indexed localAccountAddress,
        uint256 value
    );

    /**
     * @notice Map Ether to specific token
     */
    address public ethTokenAddress;

    /**
     * @dev set Ethereum mapping coin address
     */
    function setEthTokenAddress(address newEthTokenAddress) external onlyOwner {
        ethTokenAddress = newEthTokenAddress;
    }

    function initialize(address owner, address oracle, address foreignOracle) public initializer {
        TokenMapper.initialize(owner, oracle, foreignOracle);
    }

    /**
     * @dev deposit ERC20 token.
     * @param depositId The deposit ID from ethereum chain
     * @param foreignAccountAddress The address of ethereum chain account.
     * @param foreignTokenAddress The address of ethereum chain token contract.
     * @param amount The token amount to deposit
     */
    function depositERC20(
        uint depositId,
        address foreignAccountAddress, address foreignTokenAddress, uint amount
    ) public onlyOracle {
        address localTokenAddress = getLocalTokenOf(foreignTokenAddress);
        address localAccountAddress = getLocalAccountOf(foreignAccountAddress);

        require(localTokenAddress != address(0));
        require(localAccountAddress != address(0));

        IERC20GatewayMintable(localTokenAddress).mintToGateway(uint256(amount));

        IERC20GatewayMintable(localTokenAddress).transfer(localAccountAddress, amount);

        emit ERC20Deposited(
            depositId,
            foreignAccountAddress, foreignTokenAddress,
            localAccountAddress, localTokenAddress,
            amount
        );
    }

    /**
     * @dev deposit ERC721 token.
     * @param depositId The deposit ID from ethereum chain
     * @param foreignAccountAddress The address of ethereum chain account.
     * @param foreignTokenAddress The address of ethereum chain token contract.
     * @param tokenId The token ID to deposit
     */
    function depositERC721(
        uint depositId,
        address foreignAccountAddress, address foreignTokenAddress, uint tokenId
    ) public onlyOracle {
        address localTokenAddress = getLocalTokenOf(foreignTokenAddress);
        address localAccountAddress = getLocalAccountOf(foreignAccountAddress);

        require(localTokenAddress != address(0));
        require(localAccountAddress != address(0));

        IERC721GatewayMintable(localTokenAddress).mintToGateway(tokenId);

        IERC721GatewayMintable(localTokenAddress).safeTransferFrom(address(this), localAccountAddress, tokenId);

        emit ERC721Deposited(
            depositId,
            foreignAccountAddress, foreignTokenAddress,
            localAccountAddress, localTokenAddress,
            tokenId
        );
    }

    /**
     * @dev deposit ETH.
     * @param depositId The deposit ID from ethereum chain
     * @param foreignAccountAddress The address of ethereum chain account.
     * @param amount The wei amount to deposit
     */
    function depositETH(
        uint depositId,
        address foreignAccountAddress, uint amount
    ) public onlyOracle {
        address localAccountAddress = getLocalAccountOf(foreignAccountAddress);

        require(ethTokenAddress != address(0));
        require(localAccountAddress != address(0));

        IERC20GatewayMintable(ethTokenAddress).mintToGateway(amount);

        IERC20GatewayMintable(ethTokenAddress).transfer(localAccountAddress, amount);

        emit ETHDeposited(
            depositId,
            foreignAccountAddress,
            localAccountAddress,
            amount
        );
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
