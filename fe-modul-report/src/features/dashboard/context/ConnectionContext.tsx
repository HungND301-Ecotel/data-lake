import { createContext, useContext, useState, type ReactNode } from "react";
import type { SyncConnectionConfig } from "../../server/types/server";

interface ConnectionContextType {
  selectedConfig: SyncConnectionConfig | null;
  setSelectedConfig: (config: SyncConnectionConfig | null) => void;
}

const ConnectionContext = createContext<ConnectionContextType>({
  selectedConfig: null,
  setSelectedConfig: () => {},
});

export const useConnection = () => useContext(ConnectionContext);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedConfig, setSelectedConfig] = useState<SyncConnectionConfig | null>(null);

  return (
    <ConnectionContext.Provider value={{ selectedConfig, setSelectedConfig }}>
      {children}
    </ConnectionContext.Provider>
  );
};
