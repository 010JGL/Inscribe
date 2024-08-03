import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";

export function initializeClient(walletInterface: any, isMainnet: boolean): Client {
  const accountId = process.env.REACT_APP_MY_ACCOUNT_ID;
  const privateKey = process.env.REACT_APP_MY_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("Account ID or Private Key is missing in environment variables.");
  }

  // Determine the network based on the isMainnet flag
  const network = isMainnet ? "mainnet" : "testnet";

  console.log(`Initializing Hedera client with network: ${network}`);
  console.log(`Account ID: ${accountId}`);
  
  let client: Client;

  if (walletInterface) {
    // If wallet interface is provided, use its network configuration
    console.log("Using wallet interface for network configuration.");
    console.log("Wallet network configuration:", walletInterface.network);
    client = Client.forNetwork(walletInterface.network);
    client.setOperator(
      walletInterface.accountId,
      walletInterface.privateKey
    );
  } else {
    // Use default network configuration based on isMainnet flag
    console.log("Using default network configuration.");
    client = Client.forName(network);
    client.setOperator(
      AccountId.fromString(accountId),
      PrivateKey.fromString(privateKey)
    );
  }

  console.log("Client configured with network:", client.network);
  console.log("Client operator set to account ID:", accountId);

  return client;
}

