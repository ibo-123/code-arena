import { Outlet } from "react-router-dom";
import { ParticipantSidebar } from "../components/navigation/ParticipantSidebar";

export const ParticipantLayout = () => {
  return (
    <div className="participant-layout">
      <ParticipantSidebar />
      <main className="participant-main">
        <Outlet />
      </main>
    </div>
  );
};

export default ParticipantLayout;
