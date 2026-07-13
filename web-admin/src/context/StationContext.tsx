import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';
import { Station } from '../types';
import { useAuth } from './AuthContext';

interface StationContextValue {
  stations: Station[];
  currentStationId: string | null;
  setCurrentStationId: (id: string) => void;
  refresh: () => Promise<void>;
}

const StationContext = createContext<StationContextValue | undefined>(undefined);

export function StationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStationId, setCurrentStationIdState] = useState<string | null>(
    localStorage.getItem('currentStationId'),
  );

  async function refresh() {
    if (!user) return;
    const { data } = await api.get<Station[]>('/stations');
    setStations(data);
    if (!currentStationId && data.length > 0) {
      setCurrentStationId(data[0].id);
    }
  }

  function setCurrentStationId(id: string) {
    localStorage.setItem('currentStationId', id);
    setCurrentStationIdState(id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <StationContext.Provider value={{ stations, currentStationId, setCurrentStationId, refresh }}>
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const ctx = useContext(StationContext);
  if (!ctx) throw new Error('useStation must be used within StationProvider');
  return ctx;
}
