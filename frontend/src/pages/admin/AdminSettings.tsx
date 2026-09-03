import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  Users,
  Trophy,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
} from "lucide-react";
import { Card, Badge, Button, LoadingState, ErrorState } from "../../components/ui";
import { adminApi } from "../../services/adminApi";
import { useAuth } from "../../context/AuthContext";

interface AdminSettingsData {
  name: string;
  email: string;
  username: string;
  role: string;
  tournamentDefaults: {
    maxParticipants: number;
    numberOfGroups: number;
    participantsPerGroup: number;
    qualifiersPerGroup: number;
    playoffFormat: string;
  };
}

export const AdminSettings = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [defaults, setDefaults] = useState({
    maxParticipants: 20,
    numberOfGroups: 4,
    participantsPerGroup: 5,
    qualifiersPerGroup: 2,
    playoffFormat: "SINGLE_ELIMINATION",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminApi.getSettings();
      if (response.success && response.settings) {
        const data = response.settings;
        setSettings(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          password: "",
          confirmPassword: "",
        });

        if (data.tournamentDefaults) {
          setDefaults({
            maxParticipants: data.tournamentDefaults.maxParticipants || 20,
            numberOfGroups: data.tournamentDefaults.numberOfGroups || 4,
            participantsPerGroup: data.tournamentDefaults.participantsPerGroup || 5,
            qualifiersPerGroup: data.tournamentDefaults.qualifiersPerGroup || 2,
            playoffFormat: data.tournamentDefaults.playoffFormat || "SINGLE_ELIMINATION",
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  const handleDefaultsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDefaults((prev) => ({
      ...prev,
      [name]: name === "playoffFormat" ? value : Number(value),
    }));
    setError("");
    setSuccess("");
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    // Validate password match if password is being changed
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setSaving(false);
      return;
    }

    try {
      const updateData: { name?: string; email?: string; password?: string } = {};

      if (formData.name !== settings?.name) {
        updateData.name = formData.name;
      }
      if (formData.email !== settings?.email) {
        updateData.email = formData.email;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      if (Object.keys(updateData).length === 0) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      await adminApi.updateSettings(updateData);
      await refreshUser();
      setSuccess("Profile updated successfully!");
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDefaultsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Save defaults to admin settings
      await adminApi.updateSettings({
        tournamentDefaults: defaults,
      });
      setSuccess("Tournament defaults updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update defaults");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading admin settings..." />;
  if (error && !settings) return <ErrorState error={error} />;

  return (
    <div style={{ padding: "24px 0", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(41,121,255,0.1)",
                border: "1px solid rgba(41,121,255,0.15)",
                fontSize: "10px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#2979FF",
              }}
            >
              <Settings size={12} style={{ marginRight: "4px", display: "inline" }} />
              Admin
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Control Center
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 3vw, 38px)",
              fontWeight: "800",
              margin: "4px 0 0 0",
              background: "linear-gradient(135deg, #FFFFFF, #64B5F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.5px",
            }}
          >
            Admin Settings
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              marginTop: "4px",
            }}
          >
            Manage your profile and tournament defaults
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Badge tone="gold">
            <Shield size={14} style={{ marginRight: "6px", display: "inline" }} />
            {user?.role || "ADMIN"}
          </Badge>
          <button
            onClick={loadSettings}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.3s ease",
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.2)",
            borderRadius: "12px",
            color: "#FF6B6B",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "14px 20px",
            background: "rgba(76, 175, 80, 0.1)",
            border: "1px solid rgba(76, 175, 80, 0.2)",
            borderRadius: "12px",
            color: "#4CAF50",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Two Column Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Profile Settings */}
        <Card
          style={{
            padding: "28px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "12px",
                background: "rgba(41,121,255,0.1)",
              }}
            >
              <User size={20} color="#2979FF" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "white" }}>
                Profile Settings
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Update your admin account information
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Display Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <User size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Display Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Mail size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleProfileChange}
                  placeholder="admin@example.com"
                  style={inputStyle}
                />
              </div>

              {/* Username (Read-only) */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Crown size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Username
                </label>
                <input
                  type="text"
                  value={settings?.username || ""}
                  disabled
                  style={{
                    ...inputStyle,
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                />
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.3)",
                    marginTop: "4px",
                  }}
                >
                  Username cannot be changed
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Lock size={14} style={{ marginRight: "6px", display: "inline" }} />
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleProfileChange}
                    placeholder="Enter new password (leave blank to keep current)"
                    style={{
                      ...inputStyle,
                      paddingRight: "44px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {formData.password && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: "6px",
                    }}
                  >
                    <Lock size={14} style={{ marginRight: "6px", display: "inline" }} />
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleProfileChange}
                    placeholder="Confirm new password"
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ marginTop: "8px" }}>
                <Button
                  type="submit"
                  disabled={saving}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    background: saving
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #2979FF, #1565C0)",
                    border: "none",
                    color: "white",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Profile Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Tournament Defaults */}
        <Card
          style={{
            padding: "28px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "24px",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                padding: "8px",
                borderRadius: "12px",
                background: "rgba(255,215,0,0.1)",
              }}
            >
              <Trophy size={20} color="#FFD700" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "white" }}>
                Tournament Defaults
              </h2>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Default settings for new tournaments
              </p>
            </div>
          </div>

          <form onSubmit={handleDefaultsSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Users size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Max Participants
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={defaults.maxParticipants}
                  onChange={handleDefaultsChange}
                  min="1"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Users size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Number of Groups
                </label>
                <input
                  type="number"
                  name="numberOfGroups"
                  value={defaults.numberOfGroups}
                  onChange={handleDefaultsChange}
                  min="1"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Users size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Participants Per Group
                </label>
                <input
                  type="number"
                  name="participantsPerGroup"
                  value={defaults.participantsPerGroup}
                  onChange={handleDefaultsChange}
                  min="1"
                  style={inputStyle}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Shield size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Qualifiers Per Group
                </label>
                <input
                  type="number"
                  name="qualifiersPerGroup"
                  value={defaults.qualifiersPerGroup}
                  onChange={handleDefaultsChange}
                  min="1"
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "6px",
                  }}
                >
                  <Trophy size={14} style={{ marginRight: "6px", display: "inline" }} />
                  Playoff Format
                </label>
                <select
                  name="playoffFormat"
                  value={defaults.playoffFormat}
                  onChange={handleDefaultsChange}
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.3)' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                  }}
                >
                  <option value="SINGLE_ELIMINATION">Single Elimination</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <Button
                  type="submit"
                  disabled={saving}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    borderRadius: "12px",
                    background: saving
                      ? "rgba(255,255,255,0.05)"
                      : "linear-gradient(135deg, #FFD700, #FFA000)",
                    border: "none",
                    color: "#0a0e1a",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Defaults
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>

      {/* System Info Card */}
      <Card
        style={{
          marginTop: "24px",
          padding: "24px 28px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              padding: "6px",
              borderRadius: "10px",
              background: "rgba(156,39,176,0.1)",
            }}
          >
            <Settings size={18} color="#9C27B0" />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0, color: "white" }}>
            System Information
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Role
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "white", marginTop: "4px" }}>
              {settings?.role || "ADMIN"}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Clock size={14} style={{ marginRight: "4px", display: "inline" }} />
              Last Updated
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600", color: "white", marginTop: "4px" }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Shield size={14} style={{ marginRight: "4px", display: "inline" }} />
              Security Level
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: "600", color: "#4CAF50", marginTop: "4px" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#4CAF50",
                  marginRight: "8px",
                }}
              />
              High
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Sparkles size={14} style={{ marginRight: "4px", display: "inline" }} />
              Status
            </div>
            <div
              style={{ fontSize: "15px", fontWeight: "600", color: "#64B5F6", marginTop: "4px" }}
            >
              Active
            </div>
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        input:focus, select:focus {
          border-color: #2979FF !important;
          box-shadow: 0 0 0 4px rgba(41,121,255,0.12) !important;
        }
        input:hover, select:hover {
          border-color: rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  );
};

// Input styles
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

export default AdminSettings;
