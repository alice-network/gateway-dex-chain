pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "zos-lib/contracts/Initializable.sol";

import "./AccountMapper.sol";


/**
 * @title TokenMapper
 */
contract TokenMapper is Initializable, AccountMapper {
    bytes4 internal constant PROXY_ID_ERC20 = 0xcc4aa204;
    bytes4 internal constant PROXY_ID_ERC721 = 0x9013e617;

    event TokenAdded(
        address indexed foreignContractAddress,
        address indexed localContractAddress,
        bytes4 indexed proxyId
    );

    event TokenRemoved(
        address indexed foreignContractAddress,
        address indexed localContractAddress
    );

    struct AddressPair {
        address localAddress;
        address foreignAddress;
        bytes4 proxyId;
    }

    mapping(address => address) private tokenForeignToLocal;
    mapping(address => address) private tokenLocalToForeign;
    mapping(address => bytes4) private tokenProxyIds;
    mapping(bytes4 => address[]) private proxyIdToTokens;

    /**
     * @dev Add token mapping.
     * @notice Reverts if token is already mapped or localContractAddress is not a contract.
     * @param foreignContractAddress The address of ethereum chain token contract.
     * @param localContractAddress The address of local chain token contract.
     * @param proxyId The localContract's Proxy ID
     */
    function addToken(
        address foreignContractAddress,
        address localContractAddress,
        bytes4 proxyId
    ) external onlyOwner {
        require(!isLocalTokenAdded(localContractAddress), "local token already added");
        require(!isForeignTokenAdded(foreignContractAddress), "foreign token already added");

        tokenForeignToLocal[foreignContractAddress] = localContractAddress;
        tokenLocalToForeign[localContractAddress] = foreignContractAddress;
        tokenProxyIds[localContractAddress] = proxyId;
        proxyIdToTokens[proxyId].push(localContractAddress);

        emit TokenAdded(foreignContractAddress, localContractAddress, proxyId);
    }

    /**
     * @dev Remove token mapping
     * @notice Reverts if token is not mapped.
     * @param foreignContractAddress The address of ethereum chain token contract.
     * @param localContractAddress The address of local chain token contract.
     */
    function removeToken(
        address foreignContractAddress,
        address localContractAddress
    ) external onlyOwner {
        require(isTokenMapped(foreignContractAddress, localContractAddress), "token is not added");

        tokenForeignToLocal[foreignContractAddress] = address(0);
        tokenLocalToForeign[localContractAddress] = address(0);

        address[] storage contracts = proxyIdToTokens[tokenProxyIds[localContractAddress]];

        for (uint i = 0; i < contracts.length; i++) {
            if (contracts[i] == localContractAddress) {
                contracts[i] = contracts[contracts.length - 1];
                contracts.length--;
                break;
            }
        }

        tokenProxyIds[localContractAddress] = bytes4(0);

        emit TokenRemoved(foreignContractAddress, localContractAddress);
    }

    function initialize(address owner, address oracle, address foreignOracle) public initializer {
        AccountMapper.initialize(owner, oracle, foreignOracle);
    }

    function getTokensOf(bytes4 proxyId) public view returns (address[] memory) {
        return proxyIdToTokens[proxyId];
    }

    function getProxyIdOf(address localContractAddress) public view returns (bytes4) {
        return tokenProxyIds[localContractAddress];
    }

    /**
     * @param foreignContractAddress The address of ethereum chain token contract.
     * @param localContractAddress The address of local chain token contract.
     * @return true if token is already mapped.
     */
    function isTokenMapped(
        address foreignContractAddress,
        address localContractAddress
    ) public view returns (bool) {
        return tokenForeignToLocal[foreignContractAddress] == localContractAddress
            && tokenLocalToForeign[localContractAddress] == foreignContractAddress;
    }

    /**
     * @param localContractAddress The address of local chain token contract.
     * @return true if token is already mapped.
     */
    function isLocalTokenAdded(address localContractAddress) public view returns (bool) {
        return tokenLocalToForeign[localContractAddress] != address(0);
    }

    /**
     * @param foreignContractAddress The address of ethereum chain token contract.
     * @return true if token is already mapped.
     */
    function isForeignTokenAdded(address foreignContractAddress) public view returns (bool) {
        return tokenForeignToLocal[foreignContractAddress] != address(0);
    }

    /**
     * @return The local chain token address of given ethereum chain token address.
     */
    function getLocalTokenOf(address foreignContractAddress) public view returns (address) {
        return tokenForeignToLocal[foreignContractAddress];
    }

    /**
     * @return The ethereum chain token address of given local chain token address.
     */
    function getForeignTokenOf(address localContractAddress) public view returns (address) {
        return tokenLocalToForeign[localContractAddress];
    }

    /**
     * @return The address pairs of all registered token mapping.
     */
    function getTokenAddressPairs() public view returns (AddressPair[] memory) {
        address[] storage erc20Tokens = proxyIdToTokens[PROXY_ID_ERC20];
        address[] storage erc721Tokens = proxyIdToTokens[PROXY_ID_ERC721];

        AddressPair[] memory pairs = new AddressPair[](erc20Tokens.length + erc721Tokens.length);

        uint i = 0;
        for (i = 0; i < erc20Tokens.length; i++) {
            pairs[i].localAddress = erc20Tokens[i];
            pairs[i].foreignAddress = tokenLocalToForeign[erc20Tokens[i]];
            pairs[i].proxyId = PROXY_ID_ERC20;
        }

        i = erc20Tokens.length;

        for (uint j = 0; j < erc721Tokens.length; j++) {
            pairs[i + j].localAddress = erc721Tokens[j];
            pairs[i + j].foreignAddress = tokenLocalToForeign[erc721Tokens[j]];
            pairs[i + j].proxyId = PROXY_ID_ERC721;
        }

        return pairs;
    }

    // Reserved storage space to allow for layout changes in the future.
    uint256[50] private ______gap;
}
