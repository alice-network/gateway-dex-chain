# Gateway DEX Chain

Solidity contracts for the gateway on the DEX Chain. It accepts deposits from, and grants withdrawals to a foreign blockchain(like ethereum).

## Documentation

Documentation is not ready.

## Development

First, install Node.js and npm. Then grep the source code.

### Get the source

Fork this repo and clone it to your local machine:

```sh
$ git clone git@github.com:your-username/gateway-dex-chain.git
```

Once git clone is done, use npm to install dependencies:

```sh
$ npm install
```

### Truffle network

- `coverage`: this network is for **solidity-coverage** report
- `development`: this network is used for local development
- `deploy`: this network is used for deploying contracts
- `console`: this network is used for `truffle console`

### Test

To run tests, run command below:

```sh
$ npm run test
```

#### Coverage

To get coverage report, run command below:

```sh
$ npm run test:coverage
```

## License

Gateway DEX chain is licensed under the [MIT License](/LICENSE).
