import { Bell } from "lucide-react";
import { Outlet } from "react-router-dom";
import BottomNavigation from "../navigation/BottomNavigation";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <span className="top-bar__spacer" aria-hidden="true" />
        <h1>Mandalselva</h1>
        <button className="icon-button" aria-label="Varsler">
          <Bell size={20} strokeWidth={1.8} />
        </button>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
}
