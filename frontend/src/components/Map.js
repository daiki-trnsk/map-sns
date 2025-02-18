import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useParams } from "react";
import "../general.css";
import PostForm from "./PostForm";

export default function Map({ posts, onAddPost, id }) {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showForm, setShowForm] = useState(false);
  function MapClickHandler() {
    useMapEvent({
      click(e) {
        setSelectedPosition(e.latlng);
        setShowForm(true);
      },
    });
    return null; 
  }
  return (
    <MapContainer
      center={[35.66572, 139.731]}
      zoom={10}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" />
      <MapClickHandler />

      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map((post) => {
          const htmlIcon = L.divIcon({
            className: "custom-div-icon",
            html: `
              <div class="map-thumbnail">
                <img src="${post.imageUrl}"/>
                <p>${post.post_title}</p>
              </div>
            `,
            iconSize: [60, 60],
            iconAnchor: [30, 60],
          });

          return (
            <Marker
              key={post.id}
              position={[post.location.lat, post.location.lng]}
              icon={htmlIcon}
            >
              <Popup offset={[0, -50]}>
                <b>{post.post_title}</b>
                <br />
                <img
                  src={post.imageUrl}
                  width="100px"
                  height="100px"
                />
                <br />
                <p>{post.description}</p>
              </Popup>
            </Marker>
          );
        })
      ) : (
        <p style={{ textAlign: "center", color: "#888" }}>投稿がありません</p>
      )}

      {selectedPosition && showForm && (
        <Marker position={[selectedPosition.lat, selectedPosition.lng]}>
          <Popup autoOpen={true}>
            <PostForm
              id={id}
              lat={selectedPosition.lat}
              lng={selectedPosition.lng}
              onAddPost={onAddPost}
            />
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
