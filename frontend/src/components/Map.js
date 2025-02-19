import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import "../general.css";
import PostForm from "./PostForm";
import Comment from "./Comment";
import DefaultIcon from "./PostMarker";

export default function Map({ posts, onAddPost, id }) {
  const [selectedPosition, setSelectedPosition] = useState(null);

  function MapClickHandler() {
    useMapEvent({
      click(e) {
        setSelectedPosition((prevPosition) => (prevPosition ? null : e.latlng));
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
              <Popup offset={[0, -50]} className="post-detail-popup">
                <div className="popup-content">
                  <h3 className="popup-title">{post.post_title}</h3>
                  <div className="popup-body">
                    <img src={post.imageUrl} className="popup-image" />
                    <div className="popup-text">
                      <div className="description">
                        <p>{post.description}</p>
                      </div>
                      <Comment id={post.id} />
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })
      ) : (
        <p style={{ textAlign: "center", color: "#888" }}>投稿がありません</p>
      )}

      {selectedPosition && (
        <Marker
          position={[selectedPosition.lat, selectedPosition.lng]}
          icon={DefaultIcon}
          eventHandlers={{
            add: (e) => {
              e.target.openPopup();
            },
          }}
        >
          <Popup className="post-form-popup">
            <PostForm
              id={id}
              lat={selectedPosition.lat}
              lng={selectedPosition.lng}
              onAddPost={onAddPost}
              setSelectedPosition={setSelectedPosition}
            />
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
