# AirVault and Airdrop Service

A prototype for a vault contract and airdrop rewarding tokens for staking tokens. This project involves two main components: a smart contract (AirVault) that allows users to deposit and withdraw ERC20 tokens, and a backend service that airdrops reward tokens (WIN) based on the amount of tokens deposited over a configurable interval of blocks.

## Frameworks, Libraries, and Design Decisions

### Hardhat

- **Reason**: Chosen for its comprehensive tooling for Ethereum smart contract development. It provides a local Ethereum network for testing, powerful debugging features, and plugins for tasks such as contract deployment and verification.
- **Usage**: Used for developing, testing, and deploying the smart contracts.

### JavaScript

- **Reason**: Chosen due to familiarity and experience, making development faster and more efficient. JavaScript is versatile for both scripting and interacting with Web3.
- **Usage**: Used for writing scripts, backend services, and integration with the smart contracts.

### AWS Lambda

- **Reason**: Chosen for its serverless architecture, which simplifies deployment and scaling. Lambda functions are triggered by events, making them ideal for the periodic tasks required in this project.
- **Usage**: Used to implement the backend service for monitoring deposits and distributing airdrop rewards.

### Serverless Framework

- **Reason**: Makes deploying APIs, scheduled tasks, workflows, and event-driven applications to AWS Lambda straightforward. It abstracts much of the configuration and deployment complexity.
- **Usage**: Used to deploy and manage the AWS Lambda functions.

### AWS DynamoDB (Suggested)

- **Reason**: A managed NoSQL database service that integrates well with AWS Lambda. Using DynamoDB for state management ensures that the backend service can reliably store and retrieve data such as the block number for listening to events.
- **Usage**: Suggested for production use to store the block number and other state information.
- **Prototype Alternative**: For prototyping, a simple JSON file (`state.json`) is used to store the block number.

## How to Setup the Project

### Prerequisites

- Node.js and npm installed
- AWS account with permissions to create and manage Lambda functions
- Serverless Framework installed globally (`npm install -g serverless`)

### Smart Contract Development

1. Clone the repository and navigate to the project directory:
    ```sh
    git clone https://github.com/your-repo/airvault-airdrop.git
    cd airvault-airdrop
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Compile the contracts:
    ```sh
    npx hardhat compile
    ```

4. Run the tests:
    ```sh
    npx hardhat test
    ```

5. Deploy the contracts to a testnet (e.g., Sepolia):
    ```sh
    npx hardhat ignition deploy ./ignition/modules/FUDToken.ts --network sepolia
    npx hardhat ignition deploy ./ignition/modules/WINToken.ts --network sepolia
    npx hardhat ignition deploy ./ignition/modules/AirVault.ts --network sepolia
    ```

### Backend Service

The backend service is located in the `airvault-backend` folder.

1. Navigate to the backend folder:
    ```sh
    cd airvault-backend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `state.json` file in the `airvault-backend` directory with the following content:
    ```json
    {
      "lastProcessedBlock": 6030400
    }
    ```
    - Initialize `lastProcessedBlock` with a block number that is prior to any deposit transactions, ideally the block number of the AirVault contract deployment transaction.

4. Deploy the backend service using Serverless Framework:
    ```sh
    serverless deploy
    ```

5. To test the backend service locally, you can invoke the function manually:
    ```sh
    serverless offline
    ```
    or 
    ```sh
    npm run dev
    ```
    To test it locally without serverless, run:
    ```sh
    node runAirdrop.js
    ```
    (update the interval if required inside the runAirdrop.js script)


## Configuration Variables

### Hardhat Project

Variables for the Hardhat project are set via tasks in the `vars` scope and can be retrieved in the config using the `vars` object. This approach is recommended by Hardhat over using `.env` and `dotenv`.

To set the variables, you can use the following command:

```sh
npx hardhat vars set <VARIABLE_NAME> <VARIABLE_VALUE>
```

For example, to set the INFURA_API_KEY:
```sh
npx hardhat vars set INFURA_API_KEY <your_infura_api_key>
```

Other variables to configure include:

* PVT_KEY_1: Your private key for deploying and interacting with the contracts.
* FUD_TOKEN_ADDRESS: The deployed address of the FUD token contract.
* WIN_TOKEN_ADDRESS: The deployed address of the WIN token contract.

These variables are required for unit tests as well.

### Backend Service

The backend service uses dotenv and a .env file to manage configuration variables. Ensure you create a .env file in the airvault-backend directory with the following content:

```
NETWORK=sepolia
INFURA_PROJECT_ID=<your_infura_project_id>
PRIVATE_KEY=<your_private_key>
WIN_TOKEN_ADDRESS=<deployed_win_token_address>
AIRVAULT_CONTRACT_ADDRESS=<deployed_airvault_contract_address>
AIRDROP_INTERVAL=100
```

* NETWORK: The network to connect to (e.g., sepolia).
* INFURA_PROJECT_ID: Your Infura project ID for connecting to the Ethereum network.
* PRIVATE_KEY: The private key for the account that will interact with the contracts.
* WIN_TOKEN_ADDRESS: The deployed address of the WIN token contract.
* AIRVAULT_CONTRACT_ADDRESS: The deployed address of the AirVault contract.
* AIRDROP_INTERVAL: The number of blocks between each airdrop.

Make sure to replace the placeholder values with your actual configuration data.


## Suggested Enhancements

### State Management with DynamoDB 

For production, use AWS DynamoDB to store the `lastProcessedBlock` and other state information. This ensures reliable and scalable state management integrated within the AWS ecosystem.

**Example Configuration for AWS DynamoDB**: (Optional)

1. Create a DynamoDB table with a primary key `id`.
2. Modify the Lambda function to read/write the `lastProcessedBlock` from/to DynamoDB instead of `state.json`.

### Private Key Management with AWS Secrets

Storing private keys in `.env` files is convenient for development and local testing but is not secure for production environments, especially for services like AWS Lambda. 
A solution for securely managing sensitive information like private keys is to use services like AWS Secrets Manager is designed to securely store and manage sensitive information such as database credentials, API keys, and private keys.

- Advantages: Integrated with other AWS services, automatic rotation of secrets, fine-grained access control.
- Usage: Store your private key in AWS Secrets Manager. Use AWS SDK in your Lambda function to retrieve the secret at runtime.
