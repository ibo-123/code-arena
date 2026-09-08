// frontend/src/pages/participant/Profile.tsx
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Code2, Shield, Calendar } from "lucide-react";

export const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View your account information</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <span>{user?.username?.charAt(0).toUpperCase()}</span>
        </div>
        <div className="profile-details">
          <div className="detail-row">
            <User size={18} />
            <span className="label">Username</span>
            <span className="value">{user?.username}</span>
          </div>
          <div className="detail-row">
            <Mail size={18} />
            <span className="label">Email</span>
            <span className="value">{user?.email}</span>
          </div>
          <div className="detail-row">
            <Code2 size={18} />
            <span className="label">Codeforces</span>
            <span className="value">{user?.codeforcesUsername || "Not connected"}</span>
          </div>
          <div className="detail-row">
            <Shield size={18} />
            <span className="label">Role</span>
            <span className="value">{user?.role}</span>
          </div>
          <div className="detail-row">
            <Calendar size={18} />
            <span className="label">Joined</span>
            <span className="value">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
