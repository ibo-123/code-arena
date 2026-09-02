import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react"; // ✅ Use type-only import
import type { Tournament } from "../types";
import { tournamentApi } from "../services/tournamentApi";

interface AdminContextType {
  selectedTournament: Tournament | null;
  setSelectedTournament: (tournament: Tournament | null) => void;
  tournaments: Tournament[];
  loading: boolean;
  refreshTournaments: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const { tournaments: allTournaments } = await tournamentApi.list();
      setTournaments(allTournaments);

      if (allTournaments.length > 0) {
        const savedId = localStorage.getItem("admin-selected-tournament");
        const found = savedId ? allTournaments.find((t) => t._id === savedId) : null;
        setSelectedTournament(found || allTournaments[0]);
      }
    } catch (error) {
      console.error("Failed to load tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      localStorage.setItem("admin-selected-tournament", selectedTournament._id);
    }
  }, [selectedTournament]);

  return (
    <AdminContext.Provider
      value={{
        selectedTournament,
        setSelectedTournament,
        tournaments,
        loading,
        refreshTournaments: loadTournaments,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
