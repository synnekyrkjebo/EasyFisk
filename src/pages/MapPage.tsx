import { LocateFixed } from "lucide-react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

const zones = [
  { name: "Sone 1", position: [58.038, 7.478] as [number, number], color: "#8cc9f0" },
  { name: "Sone 2", position: [58.095, 7.49] as [number, number], color: "#b8d5bc" },
  { name: "Sone 3", position: [58.158, 7.505] as [number, number], color: "#f0c4b3" },
  { name: "Sone 4", position: [58.215, 7.52] as [number, number], color: "#c7c0ec" },
];

const riverLine: [number, number][] = zones.map((zone) => zone.position);

function LocateButton() {
  const map = useMap();

  const locateUser = () => {
    map.locate({ setView: true, maxZoom: 14 });
  };

  return (
    <button className="locate-button" onClick={locateUser} aria-label="Vis min posisjon">
      <LocateFixed size={21} />
    </button>
  );
}

export default function MapPage() {
  return (
    <section className="map-page" aria-label="Kart over fiskesonene i Mandalselva">
      <MapContainer
        center={[58.13, 7.5]}
        zoom={10}
        zoomControl={false}
        className="river-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={riverLine} pathOptions={{ color: "#2999d5", weight: 5 }} />

        {zones.map((zone) => (
          <CircleMarker
            key={zone.name}
            center={zone.position}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#1376b3", fillOpacity: 1 }}
          >
            <Tooltip permanent direction="right" offset={[12, 0]} opacity={1} className="zone-label">
              <span style={{ backgroundColor: zone.color }}>{zone.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}

        <LocateButton />
      </MapContainer>
    </section>
  );
}
