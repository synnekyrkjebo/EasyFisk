import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import MapPage from "./pages/MapPage";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/kart" replace />} />
        <Route path="/kart" element={<MapPage />} />
        <Route path="/fiskekort" element={<PlaceholderPage title="Fiskekort" />} />
        <Route path="/fangst" element={<PlaceholderPage title="Fangst" />} />
        <Route path="/profil" element={<PlaceholderPage title="Profil" />} />
      </Route>
    </Routes>
  );
}
