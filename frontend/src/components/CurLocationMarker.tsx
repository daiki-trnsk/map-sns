import L from "leaflet";
import "leaflet/dist/leaflet.css";
import curLocation from "../assets/curLocation.png";

const currentLocationIcon = L.divIcon({
    html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
    ">
      <img src="${curLocation}" style="width: 100%; height: 100%; object-fit: contain; display: block" />
    </div>
  `,
    // iconUrl: curLocation,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

export default currentLocationIcon;
