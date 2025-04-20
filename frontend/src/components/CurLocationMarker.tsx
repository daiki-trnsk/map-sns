import L from "leaflet";
import "leaflet/dist/leaflet.css";
import curLocation from "../assets/curLocation.png";

const currentLocationIcon = L.divIcon({
    html: `
    <div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
    ">
      <img src="${curLocation}" style="width: 100%; height: 100%; object-fit: contain; display: block" />
    </div>
  `,
    // iconUrl: curLocation,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

export default currentLocationIcon;
