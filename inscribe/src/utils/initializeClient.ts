// src/utils/initializeClient.ts

import { Client, PrivateKey, AccountId } from "@hashgraph/sdk";

export function initializeClient(walletInterface: any, network: 'mainnet' | 'testnet'): Client {
  const accountId = process.env.REACT_APP_MY_ACCOUNT_ID;
  const privateKey = process.env.REACT_APP_MY_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("Account ID or Private Key is missing in environment variables.");
  }

  const client = network === 'mainnet'
    ? Client.forMainnet()
    : Client.forTestnet();

  client.setOperator(
    walletInterface ? walletInterface.accountId : AccountId.fromString(accountId),
    walletInterface ? walletInterface.privateKey : PrivateKey.fromString(privateKey)
  );
  
  return client;
}
