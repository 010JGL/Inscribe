import { createContext, useState, ReactNode } from "react";

interface WalletConnectContextType {
  accountId: string;
  setAccountId: (newValue: string) => void;
  isConnected: boolean;
  setIsConnected: (newValue: boolean) => void;
}

const defaultValue: WalletConnectContextType = {
  accountId: '',
  setAccountId: () => {},
  isConnected: false,
  setIsConnected: () => {},
}

export const WalletConnectContext = createContext<WalletConnectContextType>(defaultValue);

export const WalletConnectContextProvider = (props: { children: ReactNode }) => {
  const [accountId, setAccountId] = useState<string>(defaultValue.accountId);
  const [isConnected, setIsConnected] = useState<boolean>(defaultValue.isConnected);

  return (
    <WalletConnectContext.Provider
      value={{
        accountId,
        setAccountId,
        isConnected,
        setIsConnected
      }}
    >
      {props.children}
    </WalletConnectContext.Provider>
  )
}

