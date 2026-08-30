/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import type { User, LoginCredentials, RegisterData } from "../types";
import { authApi } from "../services/authApi";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>; // FIXED
  register: (data: RegisterData) => Promise<User>; // FIXED
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "code-arena-token";
const USER_KEY = "code-arena-user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        setError(null);
      } catch {
        clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [clearAuthData]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<User> => {
      // FIXED
      try {
        setError(null);
        setLoading(true);

        const response = await authApi.login(credentials);
        localStorage.setItem(TOKEN_KEY, response.token);
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

        return response.user; // FIXED
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Login failed. Please check your credentials.";
        setError(errorMessage);
        throw new Error(errorMessage, { cause: err });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    // FIXED
    try {
      setError(null);
      setLoading(true);

      const response = await authApi.register(data);
      localStorage.setItem(TOKEN_KEY, response.token);
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));

      return response.user; // FIXED
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authApi.logout();
    } catch {
      // Ignore logout request errors
    } finally {
      clearAuthData();
      setUser(null);
      setLoading(false);
      setError(null);
    }
  }, [clearAuthData]);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authApi.me();
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh user data";
      setError(errorMessage);
      throw new Error(errorMessage, { cause: err });
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
      isAuthenticated,
      isAdmin,
    }),
    [
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
      isAuthenticated,
      isAdmin,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
        "Ensure your component is wrapped in <AuthProvider>.",
    );
  }
  return context;
};
