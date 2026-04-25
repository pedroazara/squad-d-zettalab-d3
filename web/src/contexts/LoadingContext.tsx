import { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  isLoading: boolean;
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  getLoadingState: (key: string) => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => {
      if (loading) {
        return { ...prev, [key]: true };
      } else {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  const clearLoading = (key: string) => {
    setLoadingStates(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const clearAllLoading = () => {
    setLoadingStates({});
  };

  const getLoadingState = (key: string) => {
    return loadingStates[key] || false;
  };

  const isLoading = Object.values(loadingStates).some(state => state);

  const value: LoadingContextType = {
    isLoading,
    loadingStates,
    setLoading,
    clearLoading,
    clearAllLoading,
    getLoadingState
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook for async operations with automatic loading state management
export const useLoadingOperation = <T, Args extends any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  loadingKey: string
) => {
  const { setLoading, clearLoading, getLoadingState } = useLoading();

  const execute = async (...args: Args): Promise<T> => {
    setLoading(loadingKey, true);
    
    try {
      const result = await asyncFn(...args);
      return result;
    } finally {
      clearLoading(loadingKey);
    }
  };

  const isLoading = getLoadingState(loadingKey);

  return { execute, isLoading };
};
