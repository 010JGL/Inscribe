import { useCallback, useContext, useEffect } from 'react';
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import { WalletInterface } from "./walletInterface";
import { Client } from "@hashgraph/sdk";
import { SignClientTypes } from "@walletconnect/types";
import { DAppConnector, HederaSessionEvent } from "@hashgraph/hedera-wallet-connect";
import EventEmitter from "events";
import { appConfig } from "../../config";

const refreshEvent = new EventEmitter();

const walletConnectProjectId = "377d75bb6f86a2ffd427d032ff6ea7d3";
const currentNetworkConfig = appConfig.networks.testnet;
const hederaNetwork = currentNetworkConfig.network;
const hederaClient = Client.forName(hederaNetwork);

const metadata: SignClientTypes.Metadata = {
  name: "Hedera CRA Template",
  description: "Hedera CRA Template",
  url: window.location.origin,
  icons: ["https://avatars.githubusercontent.com/u/10696378?v=4"],
};

const dappConnector = new DAppConnector({
  projectId: walletConnectProjectId,
  metadata,
  network: hederaNetwork,
});

export function useWalletInterface() {
  const { accountId, setAccountId, isConnected, setIsConnected } = useContext(WalletConnectContext);

  const connectWallet = useCallback(async () => {
    try {
      const session = await dappConnector.connect();
      const accounts = session.accounts || []; // Ensure `accounts` is properly accessed
      if (accounts.length > 0) {
        setAccountId(accounts[0]); // Set the account ID based on the session
        setIsConnected(true);
      } else {
        console.error("No accounts found in session");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }, [setAccountId, setIsConnected]);

  const disconnectWallet = useCallback(() => {
    try {
      dappConnector.disconnect(); // Call disconnect without arguments
      setAccountId('');
      setIsConnected(false);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }, [setAccountId, setIsConnected]);

  useEffect(() => {
    const onEvent = (event: HederaSessionEvent) => {
      console.log("Event received:", event);
    };

    refreshEvent.on('refresh', onEvent);

    return () => {
      refreshEvent.off('refresh', onEvent);
    };
  }, []);

  const walletInterface: WalletInterface = {
    executeContractFunction: async () => null, // Implement as needed
    disconnect: disconnectWallet,
    transferHBAR: async () => null, // Implement as needed
    transferFungibleToken: async () => null, // Implement as needed
    transferNonFungibleToken: async () => null, // Implement as needed
    associateToken: async () => null, // Implement as needed
  };

  return { accountId, isConnected, walletInterface };
}
