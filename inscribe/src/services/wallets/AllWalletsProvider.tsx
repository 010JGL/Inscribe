import { ReactNode } from "react"
import { MetamaskContextProvider } from "../../contexts/MetamaskContext"
import { WalletConnectContextProvider } from "../../contexts/WalletConnectContext"
import { MetaMaskClient } from "./metamask/metamaskClient"
import { WalletConnectClient } from "./walletconnect/walletConnectClient"

interface AllWalletsProviderProps {
  children: ReactNode;
  isMainnet: boolean; // Add isMainnet prop
}

export const AllWalletsProvider = ({ children, isMainnet }: AllWalletsProviderProps) => {
  return (
    <MetamaskContextProvider>
      <WalletConnectContextProvider>
        <MetaMaskClient />
        <WalletConnectClient isMainnet={isMainnet} /> {/* Pass isMainnet prop */}
        {children}
      </WalletConnectContextProvider>
    </MetamaskContextProvider>
  )
}

