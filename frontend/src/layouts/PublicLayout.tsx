import { Outlet } from "react-router-dom";
import { PublicNavbar } from "../components/navigation/PublicNavbar";

export const PublicLayout = () => {
  return (
    <div className="public-layout">
      <PublicNavbar />
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
