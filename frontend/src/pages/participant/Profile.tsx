// frontend/src/pages/participant/Profile.tsx
import { useAuth } from "../../context/AuthContext";
import {
  User,
  Mail,
  Code2,
  Shield,
  Calendar,
  Sparkles,
  Trophy,
  Award,
  Target,
  CheckCircle2,
  Zap,
} from "lucide-react";

export const Profile = () => {
  const { user } = useAuth();

  const roleConfig = {
    ADMIN: { label: "Administrator", color: "#FFD700", icon: Shield },
    PARTICIPANT: { label: "Competitor", color: "#64B5F6", icon: Target },
    JUDGE: { label: "Judge", color: "#CE93D8", icon: Award },
  };
  const role = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.PARTICIPANT;
  const RoleIcon = role.icon;

  const initials = user?.username?.charAt(0).toUpperCase() || "?";
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const details = [
    { icon: User, label: "Username", value: user?.username || "—" },
    { icon: Mail, label: "Email", value: user?.email || "—" },
    {
      icon: Code2,
      label: "Codeforces Handle",
      value: user?.codeforcesUsername || "Not connected",
      muted: !user?.codeforcesUsername,
      highlight: user?.codeforcesUsername,
    },
    { icon: Calendar, label: "Member Since", value: joinedDate },
  ];

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-glow" />
        <div className="page-header-content">
          <div className="header-icon">
            <User size={24} />
          </div>
          <div>
            <h1>My Profile</h1>
            <p className="subtitle">Your account information and competitive identity</p>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="profile-hero">
        <div className="profile-hero-glow" />
        <div className="profile-hero-bg" />

        <div className="profile-hero-content">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              <span>{initials}</span>
              <div className="avatar-ring" />
            </div>
            <div className="avatar-status" />
          </div>

          <div className="profile-identity">
            <h2 className="profile-name">{user?.username}</h2>
            <p className="profile-email">{user?.email}</p>

            <div className="profile-badges">
              <div
                className="role-badge"
                style={{ "--role-color": role.color } as React.CSSProperties}
              >
                <RoleIcon size={14} />
                <span>{role.label}</span>
              </div>

              {user?.codeforcesUsername ? (
                <div className="codeforces-badge">
                  <CheckCircle2 size={14} />
                  <span>Codeforces Connected</span>
                </div>
              ) : (
                <div className="codeforces-badge not-connected">
                  <Zap size={14} />
                  <span>Codeforces Not Connected</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="profile-quick-stats">
            <div className="quick-stat">
              <div className="quick-stat-icon gold">
                <Trophy size={18} />
              </div>
              <div>
                <div className="quick-stat-value">0</div>
                <div className="quick-stat-label">Tournaments</div>
              </div>
            </div>
            <div className="quick-stat-divider" />
            <div className="quick-stat">
              <div className="quick-stat-icon blue">
                <Award size={18} />
              </div>
              <div>
                <div className="quick-stat-value">0</div>
                <div className="quick-stat-label">Solved</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="details-card">
        <div className="details-header">
          <div className="details-header-icon">
            <Sparkles size={18} />
          </div>
          <div>
            <h3>Account Details</h3>
            <p>Your personal information</p>
          </div>
        </div>

        <div className="details-grid">
          {details.map(({ icon: Icon, label, value, muted, highlight }) => (
            <div key={label} className="detail-item">
              <div className="detail-icon">
                <Icon size={18} />
              </div>
              <div className="detail-content">
                <div className="detail-label">{label}</div>
                <div
                  className={`detail-value ${muted ? "muted" : ""} ${highlight ? "highlight" : ""}`}
                >
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .profile-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
        }

        /* ============================================
           HEADER
        ============================================ */
        .page-header {
          position: relative;
          padding: 32px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.06), rgba(156, 39, 176, 0.06));
          border: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
        }

        .page-header-glow {
          position: absolute;
          top: -50%;
          right: -10%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.15), transparent 70%);
          filter: blur(60px);
          pointer-events: none;
        }

        .page-header-content {
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: linear-gradient(135deg, #2979FF, #9C27B0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 12px 32px rgba(41, 121, 255, 0.3);
          flex-shrink: 0;
        }

        .page-header h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 4px;
          background: linear-gradient(135deg, #FFFFFF, #90CAF9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header .subtitle {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* ============================================
           PROFILE HERO
        ============================================ */
        .profile-hero {
          position: relative;
          padding: 40px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(41, 121, 255, 0.08), rgba(156, 39, 176, 0.08));
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .profile-hero-glow {
          position: absolute;
          top: -30%;
          left: 30%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(41, 121, 255, 0.2), transparent 70%);
          filter: blur(80px);
          pointer-events: none;
        }

        .profile-hero-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          pointer-events: none;
        }

        .profile-hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        /* Avatar */
        .profile-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .profile-avatar {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 32px;
          background: linear-gradient(135deg, #2979FF, #9C27B0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 48px;
          font-weight: 800;
          box-shadow: 0 20px 60px rgba(41, 121, 255, 0.4);
          overflow: hidden;
        }

        .avatar-ring {
          position: absolute;
          inset: 0;
          border-radius: 32px;
          background: linear-gradient(135deg, rgba(255,255,255,0.25), transparent 40%);
        }

        .avatar-status {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #4CAF50;
          border: 4px solid #080A14;
          box-shadow: 0 0 16px rgba(76, 175, 80, 0.6);
        }

        /* Identity */
        .profile-identity {
          flex: 1;
          min-width: 0;
        }

        .profile-name {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .profile-email {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 16px;
        }

        .profile-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .role-badge,
        .codeforces-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .role-badge {
          background: color-mix(in srgb, var(--role-color) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--role-color) 30%, transparent);
          color: var(--role-color);
        }

        .codeforces-badge {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.25);
          color: #4CAF50;
        }

        .codeforces-badge.not-connected {
          background: rgba(255, 152, 0, 0.1);
          border-color: rgba(255, 152, 0, 0.25);
          color: #FF9800;
        }

        /* Quick Stats */
        .profile-quick-stats {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .quick-stat {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quick-stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .quick-stat-icon.gold {
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.2);
          color: #FFD700;
        }

        .quick-stat-icon.blue {
          background: rgba(41, 121, 255, 0.1);
          border: 1px solid rgba(41, 121, 255, 0.2);
          color: #64B5F6;
        }

        .quick-stat-value {
          font-size: 18px;
          font-weight: 800;
          color: white;
          line-height: 1;
        }

        .quick-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-top: 4px;
        }

        .quick-stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255, 255, 255, 0.08);
        }

        /* ============================================
           DETAILS CARD
        ============================================ */
        .details-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
        }

        .details-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 24px 28px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.01);
        }

        .details-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFD700;
          flex-shrink: 0;
        }

        .details-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: white;
          margin: 0 0 2px;
        }

        .details-header p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: rgba(255, 255, 255, 0.04);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 28px;
          background: rgba(10, 12, 22, 0.6);
          transition: background 0.25s ease;
        }

        .detail-item:hover {
          background: rgba(41, 121, 255, 0.04);
        }

        .detail-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(41, 121, 255, 0.08);
          border: 1px solid rgba(41, 121, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64B5F6;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .detail-item:hover .detail-icon {
          transform: scale(1.05);
          background: rgba(41, 121, 255, 0.15);
        }

        .detail-content {
          min-width: 0;
          flex: 1;
        }

        .detail-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 15px;
          font-weight: 700;
          color: white;
          word-break: break-word;
        }

        .detail-value.muted {
          color: rgba(255, 255, 255, 0.35);
          font-weight: 500;
          font-style: italic;
        }

        .detail-value.highlight {
          font-family: "Fira Code", "JetBrains Mono", monospace;
          color: #64B5F6;
          font-size: 14px;
        }

        /* ============================================
           RESPONSIVE
        ============================================ */
        @media (max-width: 900px) {
          .profile-hero-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .profile-badges {
            justify-content: center;
          }

          .profile-quick-stats {
            width: 100%;
            justify-content: center;
          }

          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .page-header {
            padding: 24px;
          }

          .page-header h1 {
            font-size: 22px;
          }

          .header-icon {
            width: 48px;
            height: 48px;
          }

          .profile-hero {
            padding: 28px 24px;
          }

          .profile-avatar {
            width: 96px;
            height: 96px;
            font-size: 38px;
            border-radius: 26px;
          }

          .profile-name {
            font-size: 24px;
          }

          .profile-quick-stats {
            flex-direction: column;
            gap: 14px;
          }

          .quick-stat-divider {
            width: 100%;
            height: 1px;
          }

          .detail-item {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
