import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../components/ui";
import { useAdmin } from "../../context/AdminContext";
import {
  Trophy,
  Users,
  ArrowRight,
  Crown,
  Medal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { tournamentApi } from "../../services/tournamentApi";
import type { Bracket, BracketMatch, Participant, Tournament } from "../../types";

export const AdminBracket = () => {
  const { selectedTournament, refreshTournaments } = useAdmin();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedStages, setExpandedStages] = useState<string[]>([
    "QUARTER_FINAL",
    "SEMI_FINAL",
    "FINAL",
  ]);

  useEffect(() => {
    let isMounted = true;
    if (selectedTournament) {
      tournamentApi
        .bracket(selectedTournament._id)
        .then(({ bracket: data }) => {
          if (isMounted) setBracket(data);
        })
        .catch((err: Error) => {
          if (isMounted) setError(err.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedTournament]);

  const reloadBracket = () => {
    if (!selectedTournament) return;
    tournamentApi
      .bracket(selectedTournament._id)
      .then(({ bracket: data }) => setBracket(data))
      .catch((err: Error) => setError(err.message));
  };

  const advanceStage = async (
    stage: "group-stage" | "quarter-final" | "semi-final" | "complete",
  ) => {
    if (!selectedTournament) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await tournamentApi.advance(selectedTournament._id, stage);
      setNotice(`Stage '${stage}' processed successfully.`);
      reloadBracket();
      await refreshTournaments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Advancement failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage],
    );
  };

  if (loading) return <LoadingState label="Loading tournament seeding & bracket..." />;
  if (error) return <ErrorState error={error} />;
  if (!selectedTournament) return <EmptyState label="No tournament selected." />;

  const isCompleted = selectedTournament.status === "COMPLETED";

  const advanceOptions = [
    {
      stage: "GROUP_STAGE",
      label: "Advance Group Stage (Top 8 to QF)",
      action: "group-stage",
      currentStage: "GROUP_STAGE",
      icon: <Users size={18} />,
    },
    {
      stage: "QUARTER_FINAL",
      label: "Advance Quarter Finals to Semi Finals",
      action: "quarter-final",
      currentStage: "QUARTER_FINAL",
      icon: <Medal size={18} />,
    },
    {
      stage: "SEMI_FINAL",
      label: "Advance Semi Finals to Grand Final",
      action: "semi-final",
      currentStage: "SEMI_FINAL",
      icon: <Trophy size={18} />,
    },
    {
      stage: "FINAL",
      label: "Crown Champion & Finish Tournament",
      action: "complete",
      currentStage: "FINAL",
      icon: <Crown size={18} />,
    },
  ];

  const currentAdvanceOption = advanceOptions.find(
    (opt) => opt.currentStage === selectedTournament.currentStage,
  );

  return (
    <div style={{ padding: "24px 0" }}>
      {/* ... rest of component - replace tournament with selectedTournament ... */}
      {/* The rest is the same as before, just use selectedTournament instead of tournament */}
    </div>
  );
};

export default AdminBracket;