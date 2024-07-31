import React, { useContext, useEffect, useState } from 'react';
import { WalletInterface } from "../walletInterface";
import { AccountId, Client, TransferTransaction, PrivateKey, TokenId, ContractId, ContractFunctionParameterBuilder, TransactionId } from "@hashgraph/sdk";
import { SignClientTypes } from "@walletconnect/types";
import { DAppConnector, HederaJsonRpcMethod, HederaSessionEvent, HederaChainId } from "@hashgraph/hedera-wallet-connect";
import EventEmitter from "events";
import { WalletConnectContext } from "../../../contexts/WalletConnectContext";

// Define network configurations
const networkConfigs = {
  testnet: {
    network: "testnet",
    chainId: HederaChainId.Testnet,
  },
  mainnet: {
    network: "mainnet",
    chainId: HederaChainId.Mainnet,
  }
};

const walletConnectProjectId = "377d75bb6f86a2ffd427d032ff6ea7d3";

const defaultNetworkConfig = networkConfigs.testnet;
const dappConnector = new DAppConnector(
  {
    name: "Hedera CRA Template",
    description: "Hedera CRA Template",
    url: window.location.origin,
    icons: [`${window.location.origin}/logo192.png`],
  },
  defaultNetworkConfig.chainId,
  walletConnectProjectId,
  Object.values(HederaJsonRpcMethod),
  [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
  [defaultNetworkConfig.chainId]
);

const refreshEvent = new EventEmitter();

let walletConnectInitPromise: Promise<void> | undefined = undefined;

const initializeWalletConnect = async () => {
  if (walletConnectInitPromise === undefined) {
    walletConnectInitPromise = dappConnector.init();
  }
  await walletConnectInitPromise;
};

export const openWalletConnectModal = async () => {
  await initializeWalletConnect();
  await dappConnector.openModal().then(() => {
    refreshEvent.emit("sync");
  });
};

export class WalletConnectWallet implements WalletInterface {
  private getSigner() {
    if (dappConnector.signers.length === 0) {
      throw new Error('No signers found!');
    }
    return dappConnector.signers[0];
  }

  private getAccountId() {
    return AccountId.fromString(this.getSigner().getAccountId().toString());
  }

  async transferHBAR(toAddress: AccountId, amount: number): Promise<TransactionId> {
    const transferTransaction = new TransferTransaction()
      .addHbarTransfer(this.getAccountId(), -amount)
      .addHbarTransfer(toAddress, amount);

    const signer = this.getSigner();
    await transferTransaction.freezeWithSigner(signer);
    const txResult = await transferTransaction.executeWithSigner(signer);
    return txResult.transactionId;
  }

  async transferFungibleToken(toAddress: AccountId, tokenId: TokenId, amount: number): Promise<TransactionId> {
    const transferTransaction = new TransferTransaction()
      .addTokenTransfer(tokenId, this.getAccountId(), -amount)
      .addTokenTransfer(tokenId, toAddress, amount);

    const signer = this.getSigner();
    await transferTransaction.freezeWithSigner(signer);
    const txResult = await transferTransaction.executeWithSigner(signer);
    return txResult.transactionId;
  }

  async transferNonFungibleToken(toAddress: AccountId, tokenId: TokenId, serialNumber: number): Promise<TransactionId> {
    const transferTransaction = new TransferTransaction()
      .addNftTransfer(tokenId, serialNumber, this.getAccountId(), toAddress);

    const signer = this.getSigner();
    await transferTransaction.freezeWithSigner(signer);
    const txResult = await transferTransaction.executeWithSigner(signer);
    return txResult.transactionId;
  }

  async executeContractFunction(contractId: ContractId, functionName: string, functionParameters: ContractFunctionParameterBuilder, gasLimit: number): Promise<string | TransactionId | null> {
    // Implement the logic for executing a contract function
    throw new Error("Method not implemented.");
  }

  async associateToken(tokenId: TokenId): Promise<string | TransactionId | null> {
    // Implement the logic for associating a token
    throw new Error("Method not implemented.");
  }

  async signMessage(message: Uint8Array): Promise<string> {
    // Note: Adjust this according to available methods in your signer
    throw new Error("Method not implemented.");
  }
}

const WalletConnectClient: React.FC = () => {
  const { setAccountId, setIsConnected } = useContext(WalletConnectContext);
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);

  useEffect(() => {
    const handleWalletConnection = async () => {
      try {
        await initializeWalletConnect();
        const session = dappConnector.getSession();
        setIsWalletConnected(!!session);
        setIsConnected(!!session);
        setAccountId(session?.accounts[0] || '');

        const chainId = session?.chainId;
        const network = chainId === HederaChainId.Mainnet ? 'mainnet' : 'testnet';
        const networkConfig = networkConfigs[network];
        const client = Client.forName(networkConfig.network);
        setAccountId(client);
      } catch (err) {
        console.error("Error connecting to wallet: ", err);
      }
    };

    handleWalletConnection();
  }, [setAccountId, setIsConnected]);

  return null;
};

export default WalletConnectClient;


