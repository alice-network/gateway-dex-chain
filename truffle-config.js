/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura API
 * keys are available for free at: infura.io/register
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

// const HDWalletProvider = require('truffle-hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
// const mnemonic = fs.readFileSync(".secret").toString().trim();
require("dotenv").config();
const LoomTruffleProvider = require("loom-truffle-provider");

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    coverage: {
      host: "localhost",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
      network_id: "*"
    },
    // development: {
    //   host: "127.0.0.1",
    //   port: 7545,
    //   gas: 6721975, // default gas limit
    //   gasPrice: 20000000000, // 20 gwei
    //   network_id: "*" // Match any network id
    // },
    development: {
      provider: () => {
        const provider = new LoomTruffleProvider(
          process.env.TEST_CHAIN_ID,
          process.env.TEST_WRITE_URL,
          process.env.TEST_READ_URL,
          process.env.TEST_PRIVATE_KEY
        );
        provider.createExtraAccountsFromMnemonic(
          "gravity top burden flip student usage spell purchase hundred improve check genre",
          10
        );
        const engine = provider.getProviderEngine();
        engine.addCustomMethod("web3_clientVersion", () => "");
        return provider;
      },
      network_id: "*"
    },
    deploy: {
      provider: () => {
        const provider = new LoomTruffleProvider(
          process.env.CHAIN_ID,
          process.env.WRITE_URL,
          process.env.READ_URL,
          process.env.ADMIN_PRIVATE_KEY
        );
        const engine = provider.getProviderEngine();
        engine.addCustomMethod("web3_clientVersion", () => "");
        return provider;
      },
      network_id: "*"
    },
    console: {
      provider: () => {
        const provider = new LoomTruffleProvider(
          process.env.CHAIN_ID,
          process.env.WRITE_URL,
          process.env.READ_URL,
          process.env.OWNER_PRIVATE_KEY
        );
        const engine = provider.getProviderEngine();
        engine.addCustomMethod("web3_clientVersion", () => "");
        return provider;
      },
      network_id: "*"
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
    // reporter: "eth-gas-reporter",
    // reporterOptions: {
    //   currency: "USD"
    // }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.0",
      // version: "0.5.1",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
         optimizer: {
           enabled: true,
           runs: 200
         },
         evmVersion: "byzantium"
      }
    }
  }
};
