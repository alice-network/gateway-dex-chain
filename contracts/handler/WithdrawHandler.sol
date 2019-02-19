pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "./DepositHandler.sol";


contract WithdrawHandler is Initializable, DepositHandler, IERC721Receiver {
    using SafeMath for uint;
    using ECDSA for bytes32;

    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    // which can be also obtained as `IERC721Receiver(0).onERC721Received.selector`
    bytes4 private constant ERC721_RECEIVED = 0x150b7a02;
    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256)"))`
    // This is old ERC721 spec. We added this for compatibility
    bytes4 private constant ERC721_RECEIVED_OLD = 0xf0b9e5ba;

    event WithdrawalSubmitted(
        uint indexed withdrawalNonce,
        address foreignTokenAddress,
        address foreignAccountAddress,
        uint value
    );

    event WithdrawalSigned(
        uint indexed withdrawalNonce,
        address foreignTokenAddress,
        address foreignAccountAddress,
        uint value,
        bytes signature
    );

    enum WithdrawalStatus {
        prepared,
        submitted,
        signed
    }

    enum TokenType {
        unknown,
        eth,
        erc20,
        erc721
    }

    struct Withdrawal {
        uint nonce;
        address foreignToken;
        address foreignAccount;
        uint value;
        TokenType tokenType;
        bytes signature;
    }

    uint public nonce;

    mapping(uint => WithdrawalStatus) public withdrawalStatus;
    mapping(uint => Withdrawal) public withdrawals;

    function initialize(address owner, address oracle, address foreignOracle) public initializer {
        DepositHandler.initialize(owner, oracle, foreignOracle);
    }

    /**
     * @dev withdrawERC20
     * @param localTokenAddress The address of local chain token contract.
     * @param amount The token amount of ERC20 to withdraw
     */
    function withdrawERC20(address localTokenAddress, uint amount) public {
        _processWithdraw(localTokenAddress, msg.sender, amount, TokenType.erc20);

        IERC20(localTokenAddress).transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev withdrawERC721
     * @param localTokenAddress The address of local chain token contract.
     * @param tokenId The token Id of ERC721 to withdraw
     */
    function withdrawERC721(address localTokenAddress, uint tokenId) public {
        _processWithdraw(localTokenAddress, msg.sender, tokenId, TokenType.erc721);

        IERC721(localTokenAddress).transferFrom(msg.sender, address(this), tokenId);
    }

    /**
     * @dev withdrawETH
     * @param amount The amount of ETH to withdraw
     */
    function withdrawETH(uint amount) public {
        _processWithdraw(ethTokenAddress, msg.sender, amount, TokenType.eth);

        IERC20(ethTokenAddress).transferFrom(msg.sender, address(this), amount);
    }

    function onERC721Received(
        address, /* operator */
        address from,
        uint256 tokenId,
        bytes memory /* data */
    ) public returns (bytes4) {
        _processWithdraw(msg.sender, from, tokenId, TokenType.erc721);

        return ERC721_RECEIVED;
    }

    function onERC721Received(
        address from,
        uint256 tokenId,
        bytes memory /* data */)
    public returns (bytes4) {
        _processWithdraw(msg.sender, from, tokenId, TokenType.erc721);

        return ERC721_RECEIVED_OLD;
    }

    /**
     * @dev Sign pending withdrawal.
     * @param withdrawalNonce The nonce of withdrawal
     * @param signature The signature of withdrawal
     */
    function signPendingWithdrawal(uint withdrawalNonce, bytes memory signature) public onlyOracle {
        require(withdrawalNonce <= nonce, "invalid nonce");

        Withdrawal storage withdraw = withdrawals[withdrawalNonce];

        require(withdrawalStatus[withdrawalNonce] == WithdrawalStatus.submitted, "withdraw is not submitted");

        bytes32 hash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(
                withdraw.nonce, withdraw.foreignToken, withdraw.foreignAccount, withdraw.value
            ))
        ));

        address signer = hash.recover(signature);

        require(signer == foreignOracle(), "signer is not oracle");

        withdrawalStatus[withdrawalNonce] = WithdrawalStatus.signed;
        withdrawals[withdrawalNonce].signature = signature;

        emit WithdrawalSigned(
            withdrawalNonce,
            withdraw.foreignToken,
            withdraw.foreignAccount,
            withdraw.value,
            signature
        );
    }

    /**
     * @notice Process deposit token
     */
    function _processWithdraw(
        address localTokenAddress,
        address localAccountAddress,
        uint256 value,
        TokenType tokenType
    ) private {
        nonce = nonce.add(1);
        withdrawalStatus[nonce] = WithdrawalStatus.submitted;

        address foreignAccountAddress = getForeignAccountOf(localAccountAddress);
        require(foreignAccountAddress != address(0), "invalid account");

        address foreignTokenAddress = getForeignTokenOf(localTokenAddress);
        require(foreignTokenAddress != address(0) || localTokenAddress == ethTokenAddress, "invalid token");

        if (tokenType == TokenType.erc20) {
            require(getProxyIdOf(localTokenAddress) == PROXY_ID_ERC20, "not ERC20");
        } else if (tokenType == TokenType.erc721) {
            require(getProxyIdOf(localTokenAddress) == PROXY_ID_ERC721, "not ERC721");
        }

        withdrawals[nonce].nonce = nonce;
        withdrawals[nonce].foreignToken = foreignTokenAddress;
        withdrawals[nonce].foreignAccount = foreignAccountAddress;
        withdrawals[nonce].tokenType = tokenType;
        withdrawals[nonce].value = value;

        emit WithdrawalSubmitted(nonce, foreignTokenAddress, foreignAccountAddress, value);
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
