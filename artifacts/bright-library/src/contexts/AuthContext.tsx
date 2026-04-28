// @refresh reset
import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(
    () => typeof localStorage !== "undefined" ? localStorage.getItem("token") : null
  );

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
  };

  const logout = () => {
    setToken(null);
  };

  const isLoading = isUserLoading;

  return (
    <AuthContext.Provider value={{ user: user || null, token, setToken, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
