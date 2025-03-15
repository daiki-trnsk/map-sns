import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";
import "../general.css";

export default function Map({ posts, onAddPost }) {
    const [selectedPosition, setSelectedPosition] = useState(null); // クリックされた位置

    // マップクリック時に座標を取得
    function MapClickHandler() {
        useMapEvents({
            click(e) {
                setSelectedPosition(e.latlng); // クリック位置を保存
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

            {/* 既存の投稿をマーカーとして表示 */}
            {posts.map((post) => {
                const htmlIcon = L.divIcon({
                    className: "custom-div-icon",
                    html: `
            <div class="map-thumbnail">
              <img src="${post.imageUrl}" width="50px" height="50px" />
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
                                alt={post.post_title}
                            />
                        </Popup>
                    </Marker>
                );
            })}

            {/* クリックされた位置にピンを追加し、投稿フォームを表示 */}
            {selectedPosition && (
                <Marker position={[selectedPosition.lat, selectedPosition.lng]}>
                    <Popup>
                        <PostForm
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
