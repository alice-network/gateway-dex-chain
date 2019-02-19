pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "../ownership/OracleManageable.sol";


/**
 * @title AccountManager
 */
contract AccountMapper is Initializable, OracleManageable {
    using ECDSA for bytes32;

    event AccountAdded(address indexed foreignAccountAddress, address indexed localAccountAddress);
    event AccountRemoved(address indexed foreignAccountAddress, address indexed localAccountAddress);

    mapping(address => address) private accountForeignToLocal;
    mapping(address => address) private accountLocalToForeign;

    function initialize(address owner, address oracle, address foreignOracle) public initializer {
        OracleManageable.initialize(owner, oracle, foreignOracle);
    }

    /**
     * @dev Add account mapping.
     * @notice Reverts if not called by localAccount owner
     *         or if account is already mapped
     *         or localAccountAddress is a contract
     *         or signature is not valid.
     * @param foreignAccountAddress The address of ethereum chain account.
     * @param localAccountAddress The address of local chain account.
     * @param signature The signature signed with foreignAddress`s private key
     */
    function addAccount(
        address foreignAccountAddress, address localAccountAddress, bytes memory signature
    ) public {
        require(msg.sender == localAccountAddress, "not called by local account owner");
        require(!isLocalAccountAdded(localAccountAddress), "local account already added");
        require(!isForeignAccountAdded(foreignAccountAddress), "foreign account already added");
        require(_isValidAccountSignature(foreignAccountAddress, localAccountAddress, signature), "invalid signature");

        accountForeignToLocal[foreignAccountAddress] = localAccountAddress;
        accountLocalToForeign[localAccountAddress] = foreignAccountAddress;

        emit AccountAdded(foreignAccountAddress, localAccountAddress);
    }

    /**
     * @dev Remove account mapping
     * @notice Reverts if not called by localAccountAddress owner
     *         or if account is not mapped or signature is not valid.
     * @param foreignAccountAddress The address of ethereum chain account.
     * @param localAccountAddress The address of local chain account.
     * @param signature The signature signed with foreignAddress`s private key
     */
    function removeAccount(
        address foreignAccountAddress, address localAccountAddress, bytes memory signature
    ) public {
        require(msg.sender == localAccountAddress, "not called by local account owner");
        require(isAccountMapped(foreignAccountAddress, localAccountAddress), "account is not added");
        require(_isValidAccountSignature(foreignAccountAddress, localAccountAddress, signature), "invalid signature");

        accountForeignToLocal[foreignAccountAddress] = address(0);
        accountLocalToForeign[localAccountAddress] = address(0);

        emit AccountRemoved(foreignAccountAddress, localAccountAddress);
    }

    /**
     * @param foreignAccountAddress The address of ethereum chain account.
     * @param localAccountAddress The address of local chain account.
     * @return true if account is already mapped.
     */
    function isAccountMapped(
        address foreignAccountAddress,
        address localAccountAddress
    ) public view returns (bool) {
        return accountForeignToLocal[foreignAccountAddress] == localAccountAddress
            && accountLocalToForeign[localAccountAddress] == foreignAccountAddress;
    }

    /**
     * @param localAccountAddress The address of local chain account.
     * @return true if account is already mapped.
     */
    function isLocalAccountAdded(address localAccountAddress) public view returns (bool) {
        return accountLocalToForeign[localAccountAddress] != address(0);
    }

    /**
     * @param foreignAccountAddress The address of ethereum chain account.
     * @return true if account is already mapped.
     */
    function isForeignAccountAdded(address foreignAccountAddress) public view returns (bool) {
        return accountForeignToLocal[foreignAccountAddress] != address(0);
    }

    /**
     * @return The local chain account address of given ethereum chain account address.
     */
    function getLocalAccountOf(address foreignAccountAddress) public view returns (address) {
        return accountForeignToLocal[foreignAccountAddress];
    }

    /**
     * @return The ethereum chain account address of given local chain account address.
     */
    function getForeignAccountOf(address localAccountAddress) public view returns (address) {
        return accountLocalToForeign[localAccountAddress];
    }

    /**
     * @dev Check given signature is valid account signature.
     * @return true if signature is valid
     */
    function _isValidAccountSignature(
        address foreignAccountAddress,
        address localAccountAddress,
        bytes memory signature
    ) private pure returns (bool) {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(foreignAccountAddress, localAccountAddress))
        )).recover(signature) == foreignAccountAddress;
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
