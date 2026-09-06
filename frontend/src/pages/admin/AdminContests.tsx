
import { useEffect, useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { AdminContests as AdminContestsComponent } from "../../components/admin";
import { ErrorState, LoadingState } from "../../components/ui";

export const AdminContests = () => {
  const {
    selectedTournament,
    refreshTournaments,
  } = useAdmin();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTournament = async () => {
      try {
        await refreshTournaments();
      } catch (error) {
        console.error(
          "Failed to refresh tournaments:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadTournament();

    return () => {
      mounted = false;
    };
  }, [refreshTournaments]);

  /*
   * Wait until AdminContext has finished loading.
   * Otherwise selectedTournament can temporarily be null
   * while the dashboard is initializing.
   */
  if (loading && !selectedTournament) {
    return <LoadingState />;
  }

  /*
   * No tournament was found after loading.
   */
  if (!selectedTournament) {
    return (
      <ErrorState
        error="No active tournament is selected. Please select or create a tournament first."
      />
    );
  }

  /*
   * Pass the actual tournament to the contest manager.
   */
  return (
    <AdminContestsComponent
      tournament={selectedTournament}
    />
  );
};
