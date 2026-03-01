# Web 3.0 Front-end Development Challenge: Building a Decentralized Application (DApp)

## Objective

To develop a decentralized application (DApp) that interacts with a smart contract on a blockchain. This DApp will enable users to perform basic transactions and view information stored on the blockchain.

## Technical Requirements

- Utilize React (v18+) and PrimeReact (v10.5+) for front-end development.
- Integrate the DApp with Web3.js to interact with smart contracts on the blockchain.
- Use one of Ethereum's TestNets (e.g., preferably Sepolia).

## Features

### Connecting to the Blockchain

- Allow users to connect their wallets via Metamask.
- Display the connected wallet address.

### Viewing Data on the Blockchain

- Fetch and display information from a smart contract on the blockchain. The app will contain two tabs.
- The first tab will at least display:
  - Total wallet value.
  - Wallet composition: a list of contained coins and the quantity of each.
- The second tab will include:
  - A transaction history of the connected wallet.

### Performing Transactions

- Enable users to send a transaction through the DApp: transferring coins to another wallet by entering its address.
  - Display the gas rate before executing the transaction.
  - Validate that the necessary amounts are sufficient and show appropriate alerts.

### Event Handling

- Implement subscription to smart contract events and update the user interface when a new transaction is received.

## Deliverables

- Source code of the DApp, which can be shared as a zip file or accessed in a Git repository.
- Detailed instructions for executing and testing the DApp.

## Evaluation Criteria

- Correct implementation of the connection to the blockchain.
- Complete and error-free functionalities.
- Clean and well-commented code.
- Proper use of best front-end development practices.

Sample images of what the interface should look like are attached.

## Bonus Challenge

This section is not required but desired.
It's not necessary, but extra points will be awarded for:

- Setting up CI/CD pipelines for building and testing projects, using repository tools (e.g., GitHub Actions or Bitbucket Pipelines).

This challenge will assess the candidate's ability to work with Web 3.0 technologies, interact with smart contracts, and develop an effective user interface. Good luck!

# React.js Project with Vite 🚀

Welcome to this React.js project using Vite for front-end development. Here you'll find all the necessary instructions to get the project up and running, whether you prefer to install it directly on your machine using PNPM or run it within Docker containers.

## Table of Contents

- [Web 3.0 Front-end Development Challenge: Building a Decentralized Application (DApp)](#web-30-front-end-development-challenge-building-a-decentralized-application-dapp)
  - [Objective](#objective)
  - [Technical Requirements](#technical-requirements)
  - [Features](#features)
    - [Connecting to the Blockchain](#connecting-to-the-blockchain)
    - [Viewing Data on the Blockchain](#viewing-data-on-the-blockchain)
    - [Performing Transactions](#performing-transactions)
    - [Event Handling](#event-handling)
  - [Deliverables](#deliverables)
  - [Evaluation Criteria](#evaluation-criteria)
  - [Bonus Challenge](#bonus-challenge)
- [React.js Project with Vite 🚀](#reactjs-project-with-vite-)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Environment Variable Setup](#environment-variable-setup)
  - [Installation and Running with PNPN](#installation-and-running-with-pnpn)
  - [Using Docker](#using-docker)
    - [With Makefile](#with-makefile)
      - [Development Environment](#development-environment)
    - [Production Environment](#production-environment)
    - [Without Makefile](#without-makefile)
  - [Running Integration Tests](#running-integration-tests)
  - [Integration Tests Configuration](#integration-tests-configuration)

## Prerequisites

Before getting started, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [PNPM](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/get-docker/)

## Environment Variable Setup

Copy `.env.example` to `.env` and fill in the required values:

```sh
cp .env.example .env
```

or with the Makefile

```sh
make create-env-file
```

Essential variables in `.env`:

- `VITE_ALCHEMY_API_KEY_ETH_MAINNET`: Your Alchemy API key for the Ethereum mainnet. Used as an RPC endpoint URL for reliable JSON-RPC access via ethers.js. 🌐
- `VITE_ALCHEMY_API_KEY_ETH_SEPOLIA`: Your Alchemy API key for the Sepolia testnet. Used as an RPC endpoint URL for reliable JSON-RPC access via ethers.js. 🛠️
- `VITE_ETHERSCAN_API_KEY`: Your Etherscan API key. Used to fetch transaction history data (normal, internal, and ERC20 transfers). Free tier available at https://etherscan.io/apis. 🔍
- `VITE_COINGECKO_API_KEY`: Your API key for CoinGecko. This service allows you to fetch real-time token and cryptocurrency prices for free, adding valuable data to your dApp. 📈

## Installation and Running with PNPN

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Run in development mode:

   ```sh
   pnpm dev
   ```

Open `http://localhost:5173/` in your browser to see your dApp in action. 🚀

## Using Docker

### With Makefile

For convenience, the `Makefile` includes predefined commands to manage Docker environments. This allows you to easily build and run your dApp with simple make commands.

#### Development Environment

To set up your development environment using the `Makefile`, run:

```sh
make docker-dev
```

### Production Environment

```sh
make docker-pro
```

### Without Makefile

```sh
docker compose -f docker-compose.dev.yml up --build
```

```sh
docker compose up --build
```

## Running Integration Tests

To run integration tests with Cypress in this project, follow these steps:

To ensure the integration tests run correctly, follow these two steps:

1. **Start the Project**: Before running the tests, the project server needs to be up and running. Use the command:

```sh
pnpm dev
```

Wait until the server is fully operational.

1. **Run Cypress Tests**: Once the server is running, you can execute the integration tests with:

```sh
pnpm test:e2e
```

Ensure the server is fully active before initiating the tests to prevent any connection-related test failures.

## Integration Tests Configuration

For the integration tests to run properly, a `.env` file must be present in the `__tests__/drivers/synpress` directory. This file should include:

```env
SECRET_WORDS="your mnemonic phrase here"
NETWORK_NAME=sepolia
```

SECRET_WORDS should be a real mnemonic phrase from an Ethereum wallet.
NETWORK_NAME specifies the Ethereum network, like sepolia for testing.

Ensure these values are correctly set before running tests.

Please replace `"your mnemonic phrase here"` with your actual mnemonic phrase for the tests.
