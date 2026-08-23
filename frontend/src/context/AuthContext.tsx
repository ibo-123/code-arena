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
import type { User, LoginCredentials, RegisterData } from "../types/index";
import { authApi } from "../services/api";

// Token management constants
const TOKEN_KEY = "code-arena-token";
const USER_KEY = "code-arena-user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage for faster startup
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

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
          setLoading(false);
          return;
        }

        // Try to get user data
        try {
          const response = await authApi.me();
          setUser(response.user);
          localStorage.setItem(USER_KEY, JSON.stringify(response.user));
          setError(null);
        } catch {
          // Token invalid, clear everything
          clearAuthData();
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        clearAuthData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Clear all auth data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authApi.login(credentials);

      // Store token
      localStorage.setItem(TOKEN_KEY, response.token);

      // Store user data
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authApi.register(data);

      // Store token
      localStorage.setItem(TOKEN_KEY, response.token);

      // Store user data
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuthData();
      setUser(null);
      setLoading(false);
      setError(null);
    }
  }, [clearAuthData]);

  // Refresh user data
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
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Memoized values - fixed to use correct role values
  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);
  const isModerator = useMemo(
    () => user?.role === "ADMIN",
    [user],
  );

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
      isModerator,
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
      isModerator,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook with better error message
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
