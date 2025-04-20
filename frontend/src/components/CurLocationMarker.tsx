import L from "leaflet";
import "leaflet/dist/leaflet.css";
import curLocation from "../assets/curLocation.png";

const currentLocationIcon = L.icon({
    iconUrl: curLocation,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

export default currentLocationIcon;