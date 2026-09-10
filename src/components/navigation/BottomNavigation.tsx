import { Fish, Map, Ticket, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  { to: "/kart", label: "Kart", icon: Map },
  { to: "/fiskekort", label: "Fiskekort", icon: Ticket },
  { to: "/fangst", label: "Fangst", icon: Fish },
  { to: "/profil", label: "Profil", icon: UserRound },
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Hovedmeny">
      {navigationItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `bottom-navigation__item${isActive ? " bottom-navigation__item--active" : ""}`
          }
        >
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
