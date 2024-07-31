import { useState, useEffect } from 'react';
import { MetaMaskWallet } from './metamask/metamaskClient';
import { WalletConnectWallet } from './walletconnect/walletConnectClient';

interface WalletInterfaceState {
  walletInterface: MetaMaskWallet | WalletConnectWallet | null;
  accountId: string | null;
  isConnected: boolean;
}

export function useWalletInterface(): WalletInterfaceState {
  const [walletInterface, setWalletInterface] = useState<MetaMaskWallet | WalletConnectWallet | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeWallet = async () => {
      const wallet = new MetaMaskWallet(); // Or switch to WalletConnectWallet based on your logic
      const connected = await wallet.isConnected();
      setWalletInterface(wallet);
      setAccountId(connected ? wallet.accountId : null);
      setIsConnected(connected);
    };

    initializeWallet();
  }, []);

  return { walletInterface, accountId, isConnected };
}
