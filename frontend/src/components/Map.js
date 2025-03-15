import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvent,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useContext, useEffect } from "react";
import "../general.css";
import PostForm from "./PostForm";
import Comment from "./Comment";
import DefaultIcon from "./PostMarker";
import { AuthContext } from "../context/AuthContext";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";

export default function Map({ posts, onAddPost, id }) {
    const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
    const [localPosts, setLocalTopics] = useState(posts);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editedPost, setEditedPost] = useState(null);

    const currentUserID = isLoggedIn ? isLoggedIn.user._id : null;

    useEffect(() => {
        if (posts) {
            setLocalTopics(posts);
        }
    }, [posts]);

    console.log(localPosts);

    function MapClickHandler() {
        useMapEvent({
            click(e) {
                setSelectedPosition((prevPosition) =>
                    prevPosition ? null : e.latlng
                );
            },
        });
        return null;
    }

    const editPost = async (id) => {
        const res = await fetch(`${API_HOST}/posts/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `${getToken()}`,
            },
            body: JSON.stringify(editedPost),
        });
        if (!res.ok) {
            alert("編集に失敗しました");
            return;
        }
        const updatedPost = await res.json();
        setLocalTopics((prevPosts) =>
            prevPosts.map((post) => (post.id === id ? updatedPost : post))
        );
    };

    const deletePost = async (id) => {
        const res = await fetch(`${API_HOST}/posts/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `${getToken()}`,
            },
        });
        if (!res.ok) {
            alert("削除に失敗しました");
            return;
        }
        setLocalTopics((prevPosts) =>
            prevPosts.filter((post) => post.id !== id)
        );
    };

    const handleEditClick = (post, e) => {
        e.stopPropagation();
        setEditingPostId(post.id);
        setEditedPost({
            post_title: post.post_title,
            description: post.description,
        });
    };

    const handleSaveClick = async (id, e) => {
        e.stopPropagation();
        console.log(editedPost);
        editPost(id);
        setEditingPostId(null);
        setEditedPost(null);
    };

    const handleCancelClick = (e) => {
        e.stopPropagation();
        setEditingPostId(null);
        setEditedPost(null);
    };

    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        deletePost(id);
    }

    return (
        <MapContainer
            center={[37, 138]}
            zoom={6}
            zoomControl={false}
            style={{ height: "100vh", width: "100%" }}
        >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png" />
            <MapClickHandler />

            {Array.isArray(localPosts) && localPosts.length > 0 ? (
                localPosts.map((post) => {
                    const isCurrentUserPost = post.user_id === currentUserID;
                    const htmlIcon = L.divIcon({
                        className: `custom-div-icon ${
                            isCurrentUserPost ? "current-user-post" : ""
                        }`,
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
                            <Popup
                                offset={[0, -50]}
                                className="post-detail-popup"
                            >
                                <div className="popup-content">
                                    {editingPostId === post.id ? (
                                        <input
                                            type="text"
                                            value={editedPost.post_title}
                                            onChange={(e) =>
                                                setEditedPost({
                                                    ...editedPost,
                                                    post_title: e.target.value,
                                                })
                                            }
                                        />
                                    ) : (
                                        <h3 className="popup-title">
                                            {post.post_title}
                                        </h3>
                                    )}
                                    {isCurrentUserPost ? (
                                        editingPostId === post.id ? (
                                            <>
                                                <button
                                                    onClick={(e) =>
                                                        handleSaveClick(post.id, e)
                                                    }
                                                >
                                                    save
                                                </button>
                                                <button
                                                    onClick={(e) =>
                                                        handleCancelClick(e)
                                                    }
                                                >
                                                    cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                            <button
                                                onClick={(e) =>
                                                    handleEditClick(post, e)
                                                }
                                            >
                                                edit
                                            </button>
                                            <button
                                            onClick={(e) =>
                                                handleDeleteClick(post.id, e)
                                            }
                                        >
                                            delete
                                        </button>
                                        </>
                                        )
                                    ) : (
                                        <p>by {post.user_id}</p>
                                    )}
                                    <div className="popup-body">
                                        <img
                                            src={post.imageUrl}
                                            className="popup-image"
                                        />
                                        <div className="popup-text">
                                            <div className="description">
                                                {editingPostId === post.id ? (
                                                    <input
                                                        type="text"
                                                        value={
                                                            editedPost.description
                                                        }
                                                        onChange={(e) =>
                                                            setEditedPost({
                                                                ...editedPost,
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    <p>{post.description}</p>
                                                )}
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
                <p style={{ textAlign: "center", color: "#888" }}>
                    投稿がありません
                </p>
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
