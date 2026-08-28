import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTournament } from "../../services/tournamentApi";
import type { PlayoffFormat } from "../../types/tournament";
import {
  ArrowLeft,
  Calendar,
  Trophy,
  Users,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

const CreateTournament: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    registrationStart: "",
    registrationEnd: "",
    tournamentStart: "",
    tournamentEnd: "",
    maxParticipants: 20,
    numberOfGroups: 4,
    qualifiersPerGroup: 2,
    groupContests: 1,
    playoffFormat: "SINGLE_ELIMINATION" as PlayoffFormat,
    participantsPerGroup: 5,
  });

  const [calculatedParticipantsPerGroup, setCalculatedParticipantsPerGroup] =
    useState<number | null>(5);

  useEffect(() => {
    const max = Number(formData.maxParticipants);
    const groups = Number(formData.numberOfGroups);

    if (max > 0 && groups > 0 && max % groups === 0) {
      const calculated = max / groups;
      setCalculatedParticipantsPerGroup(calculated);
      setFormData((prev) => ({
        ...prev,
        participantsPerGroup: calculated,
      }));
    } else {
      setCalculatedParticipantsPerGroup(null);
    }
  }, [formData.maxParticipants, formData.numberOfGroups]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate dates
      const regStart = new Date(formData.registrationStart);
      const regEnd = new Date(formData.registrationEnd);
      const tournStart = new Date(formData.tournamentStart);
      const tournEnd = new Date(formData.tournamentEnd);

      if (regStart >= regEnd) {
        setError("Registration end must be after registration start");
        setIsLoading(false);
        return;
      }

      if (regEnd > tournStart) {
        setError("Tournament start must be after registration end");
        setIsLoading(false);
        return;
      }

      if (tournStart >= tournEnd) {
        setError("Tournament end must be after tournament start");
        setIsLoading(false);
        return;
      }

      // Validate participants per group
      if (formData.maxParticipants % formData.numberOfGroups !== 0) {
        setError("Maximum participants must be divisible by number of groups");
        setIsLoading(false);
        return;
      }

      const participantsPerGroup =
        formData.maxParticipants / formData.numberOfGroups;
      if (formData.qualifiersPerGroup >= participantsPerGroup) {
        setError(
          "Qualifiers per group must be less than participants per group",
        );
        setIsLoading(false);
        return;
      }

      const payload = {
        ...formData,
        participantsPerGroup: participantsPerGroup,
      };

      await createTournament(payload);
      setSuccess(true);

      setTimeout(() => {
        navigate("/admin/tournaments");
      }, 1500);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors
          .map((e: any) => `${e.field}: ${e.message}`)
          .join(", ");
        setError(errorMessages);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to create tournament. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable input styles
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "white",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "8px",
  };

  const sectionStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  return (
    <div style={{ padding: "24px 0", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <small
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "2px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} color="#FFD700" />
            New Tournament
          </small>
          <h1
            style={{
              fontSize: "clamp(24px, 2.5vw, 36px)",
              fontWeight: "700",
              margin: "4px 0 0 0",
              background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Create Tournament
          </h1>
        </div>

        <button
          onClick={() => navigate("/admin/tournaments")}
          style={{
            padding: "10px 20px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.3s ease",
          }}
        >
          <ArrowLeft size={16} />
          Back to Tournaments
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.2)",
            color: "#FF6B6B",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: "12px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
            color: "#4CAF50",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
          }}
        >
          <CheckCircle size={20} />
          Tournament created successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            <Trophy size={18} color="#FFD700" />
            Basic Information
          </h2>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}
          >
            <div>
              <label style={labelStyle}>Tournament Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="e.g., Code Arena 2026"
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Enter tournament description..."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Registration Schedule */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            <Calendar size={18} color="#2979FF" />
            Registration Schedule
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Registration Start *</label>
              <input
                type="datetime-local"
                name="registrationStart"
                value={formData.registrationStart}
                onChange={handleChange}
                required
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Registration End *</label>
              <input
                type="datetime-local"
                name="registrationEnd"
                value={formData.registrationEnd}
                onChange={handleChange}
                required
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tournament Schedule */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            <Calendar size={18} color="#9C27B0" />
            Tournament Schedule
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Tournament Start *</label>
              <input
                type="datetime-local"
                name="tournamentStart"
                value={formData.tournamentStart}
                onChange={handleChange}
                required
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Tournament End *</label>
              <input
                type="datetime-local"
                name="tournamentEnd"
                value={formData.tournamentEnd}
                onChange={handleChange}
                required
                style={{ ...inputStyle, colorScheme: "dark" }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Tournament Structure */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            <Users size={18} color="#4CAF50" />
            Tournament Structure
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Maximum Participants *</label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                required
                min="1"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Number of Groups *</label>
              <input
                type="number"
                name="numberOfGroups"
                value={formData.numberOfGroups}
                onChange={handleChange}
                required
                min="1"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Participants Per Group</label>
              <div
                style={{
                  ...inputStyle,
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "18px",
                  color:
                    calculatedParticipantsPerGroup !== null
                      ? "#4CAF50"
                      : "rgba(255,255,255,0.3)",
                }}
              >
                {calculatedParticipantsPerGroup !== null
                  ? calculatedParticipantsPerGroup
                  : "Invalid"}
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.3)",
                  marginTop: "6px",
                }}
              >
                Automatically calculated
              </p>
            </div>

            <div>
              <label style={labelStyle}>Qualifiers Per Group *</label>
              <input
                type="number"
                name="qualifiersPerGroup"
                value={formData.qualifiersPerGroup}
                onChange={handleChange}
                required
                min="1"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Number of Group Contests *</label>
              <input
                type="number"
                name="groupContests"
                value={formData.groupContests}
                onChange={handleChange}
                required
                min="1"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Playoff Format *</label>
              <select
                name="playoffFormat"
                value={formData.playoffFormat}
                onChange={handleChange}
                required
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option
                  value="SINGLE_ELIMINATION"
                  style={{ background: "#1a1f35" }}
                >
                  Single Elimination
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/admin/tournaments")}
            disabled={isLoading}
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading || success}
            style={{
              padding: "12px 32px",
              borderRadius: "10px",
              background:
                isLoading || success
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, #2979FF, #1565C0)",
              border: "none",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              cursor: isLoading || success ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.3s ease",
              opacity: isLoading || success ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Loader2
                  size={18}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Create Tournament
              </>
            )}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, textarea:focus, select:focus {
          border-color: #2979FF !important;
          box-shadow: 0 0 0 3px rgba(41,121,255,0.15) !important;
        }
        input:hover, textarea:hover, select:hover {
          border-color: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
};

export default CreateTournament;
