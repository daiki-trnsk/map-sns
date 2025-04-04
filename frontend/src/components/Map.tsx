import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvent,
    useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { useState, useContext, useEffect, useRef } from "react";
import "../general.css";
import PostForm from "./PostForm";
import Comment from "./Comment";
import DefaultIcon from "./PostMarker";
import { isMobile, isDesktop } from "react-device-detect";
import { AuthContext } from "../context/AuthContext";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import heartFilled from "../assets/heartFilled.png";
import heartNot from "../assets/heartNot.png";
import pen from "../assets/pen.png";
import garbage from "../assets/garbage.png";
import check from "../assets/check.png";
import back from "../assets/back.png";
import heartGray from "../assets/heartGray.png";
import { formatDateToYYYYMMDD } from "../utils/format";
import React from "react";
import MobileDetail from "./MobileDetail";

interface MapProps {
    posts: Post[];
    onAddPost: (post: Post) => void;
    id: string | undefined;
}

interface EditedPost {
    post_title?: string;
    description?: string;
}

export default function Map({ posts, onAddPost, id }: MapProps) {
    const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
    const [localPosts, setLocalTopics] = useState(posts);
    const [selectedPosition, setSelectedPosition] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editedPost, setEditedPost] = useState<EditedPost | null>(null);
    const [currentUserID, setCurrentUserID] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const mapRef = useRef<L.Map | null>(null!);
    const bottomSheetRef = useRef<HTMLDivElement | null>(null);
    const bottomSheetHeight = 450; // px
    // 実際にモバイルからアクセスすると低めに表示されるので静的に調整
    // プラットフォームによって異なる
    const offsetYAdjustment = 250; // px

    useEffect(() => {
        if (isLoggedIn && typeof isLoggedIn !== "boolean" && isLoggedIn.user) {
            setCurrentUserID(isLoggedIn.user._id);
        } else {
            setCurrentUserID(null);
        }

        if (posts) {
            setLocalTopics(posts);
        }

        if (
            selectedPost &&
            mapRef.current &&
            isMobile &&
            bottomSheetRef.current
        ) {
            const latLng = L.latLng(
                selectedPost.location.lat,
                selectedPost.location.lng
            );
            // mapRef.current.setView(latLng, 15, {
            //     animate: true,
            // });
            const bottomSheetHeight = bottomSheetRef.current.offsetHeight;
            const mapSize = mapRef.current.getSize();
            const markerPoint = mapRef.current.latLngToContainerPoint(latLng);
            const centerX = mapSize.x / 2;
            const offsetX = centerX - markerPoint.x;
            console.log("bottomSheetHeight", bottomSheetHeight);
            console.log("mapSize", mapSize);
            console.log("latLng", latLng);
            console.log("markerPoint", markerPoint);
            const offsetY =
                mapSize.y -
                bottomSheetHeight -
                markerPoint.y -
                offsetYAdjustment;
            console.log("offsetY", offsetY);
            mapRef.current.panBy([-offsetX, -offsetY], { animate: true });
        }
    }, [isLoggedIn, posts, selectedPost]);

    function MapClickHandler() {
        const map = useMap();
        useEffect(() => {
            if (!mapRef.current) {
                mapRef.current = map;
            }
        }, [map]);

        useMapEvent("click", (e: any) => {
            setSelectedPosition((prevPosition) =>
                prevPosition ? null : e.latlng
            );
            if (selectedPost) {
                handleClose();
            }
        });
        return null;
    }

    const updateLocalPost = (updatedPost: Post) => {
        setLocalTopics((prevPosts) =>
            prevPosts.map((post) =>
                post.id === updatedPost.id ? updatedPost : post
            )
        );
        if (selectedPost?.id === updatedPost.id) {
            setSelectedPost(updatedPost);
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setSelectedPosition(null);
        setTimeout(() => {
            setSelectedPost(null);
            setIsClosing(false);
        }, 100);
    };

    const editPost = async (id: string) => {
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
        updateLocalPost(updatedPost);
    };

    const deletePost = async (id: string) => {
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

    const handleEditClick = (
        post: Post,
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.stopPropagation();
        setEditingPostId(post.id);
        setEditedPost({
            post_title: post.post_title,
            description: post.description,
        });
    };

    const handleSaveClick = async (
        id: string,
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.stopPropagation();
        editPost(id);
        setEditingPostId(null);
        setEditedPost(null);
    };

    const handleCancelClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setEditingPostId(null);
        setEditedPost(null);
    };

    const handleDeleteClick = (
        id: string,
        e: React.MouseEvent<HTMLButtonElement>
    ) => {
        e.stopPropagation();
        deletePost(id);
        handleClose();
    };

    const handleLikeClick = async (id: string, isLiked: boolean) => {
        const method = isLiked ? "DELETE" : "POST";
        const res = await fetch(`${API_HOST}/posts/${id}/like`, {
            method: `${method}`,
            headers: {
                "Content-Type": "application/json",
                Authorization: `${getToken()}`,
            },
        });
        if (!res.ok) {
            alert("いいね登録に失敗しました");
            return;
        }
        const updatedPost = await res.json();
        updateLocalPost(updatedPost);
    };

    return (
        <>
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
                        const isCurrentUserPost =
                            post.user_id === currentUserID;
                        const isLikedByUser = post.is_liked === true;

                        const circleClass = isCurrentUserPost
                            ? "circle-current-user"
                            : isLikedByUser
                            ? "circle-liked-by-other"
                            : "circle";

                        const triangleClass = isCurrentUserPost
                            ? "triangle-current-user"
                            : isLikedByUser
                            ? "triangle-liked-by-other"
                            : "triangle";

                        // タイトルの場合のクラス名
                        const titleClass = isCurrentUserPost
                            ? "post-title-current-user"
                            : isLikedByUser
                            ? "post-title-liked-by-other"
                            : "post-title";

                        const htmlIcon = L.divIcon({
                            className: `custom-div-icon ${
                                selectedPost?.id === post.id
                                    ? "selected-post"
                                    : ""
                            }`,
                            html: `
              <div class="map-thumbnail">
                <div class=${circleClass}></div>
                <img src="${post.imageUrl}"/>
                <div class=${triangleClass}></div>
                <div class="${titleClass}"><p>${post.post_title}</p><div>
              </div>
            `,
                            iconSize: [60, 60],
                            iconAnchor: [40, 96],
                        });

                        return (
                            <Marker
                                key={post.id}
                                position={[
                                    post.location.lat,
                                    post.location.lng,
                                ]}
                                icon={htmlIcon}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedPost(post);
                                        // console.log("click", selectedPost);
                                    },
                                    popupclose: () => {
                                        setSelectedPost(null);
                                        // console.log("close", selectedPost);
                                    },
                                }}
                            >
                                {isDesktop && (
                                    <Popup
                                        offset={[0, -85]}
                                        className="post-detail-popup"
                                    >
                                        <div className="popup-content">
                                            {editingPostId === post.id ? (
                                                <input
                                                    type="text"
                                                    value={
                                                        editedPost?.post_title ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setEditedPost({
                                                            ...editedPost,
                                                            post_title:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            ) : (
                                                <h3 className="popup-title">
                                                    {post.post_title}
                                                </h3>
                                            )}
                                            <div className="post-info">
                                                <div className="post-crated">
                                                    <p>
                                                        {post.nickname && (
                                                            <>
                                                                by{" "}
                                                                {post.nickname}
                                                                &emsp;
                                                            </>
                                                        )}
                                                        {formatDateToYYYYMMDD(
                                                            post.created_at
                                                        )}
                                                    </p>
                                                </div>
                                                {isCurrentUserPost &&
                                                    (editingPostId ===
                                                    post.id ? (
                                                        <div className="post-opt">
                                                            <button
                                                                onClick={(e) =>
                                                                    handleCancelClick(
                                                                        e
                                                                    )
                                                                }
                                                            >
                                                                <img
                                                                    src={back}
                                                                    className="back-img"
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={(e) =>
                                                                    handleSaveClick(
                                                                        post.id,
                                                                        e
                                                                    )
                                                                }
                                                            >
                                                                <img
                                                                    src={check}
                                                                    className="check-img"
                                                                />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="post-opt">
                                                            <button
                                                                onClick={(e) =>
                                                                    handleEditClick(
                                                                        post,
                                                                        e
                                                                    )
                                                                }
                                                            >
                                                                <img
                                                                    src={pen}
                                                                    className="pen-img"
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={(e) =>
                                                                    handleDeleteClick(
                                                                        post.id,
                                                                        e
                                                                    )
                                                                }
                                                            >
                                                                <img
                                                                    src={
                                                                        garbage
                                                                    }
                                                                    className="garbage-img"
                                                                />
                                                            </button>
                                                        </div>
                                                    ))}

                                                {isLoggedIn ? (
                                                    <div className="post-like">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleLikeClick(
                                                                    post.id,
                                                                    post.is_liked
                                                                );
                                                            }}
                                                        >
                                                            {post.is_liked ? (
                                                                <img
                                                                    src={
                                                                        heartFilled
                                                                    }
                                                                    className="heart-img"
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={
                                                                        heartNot
                                                                    }
                                                                    className="heart-img"
                                                                />
                                                            )}
                                                        </button>
                                                        <p>{post.like_count}</p>
                                                    </div>
                                                ) : (
                                                    <div className="post-like">
                                                        <img
                                                            src={heartGray}
                                                            className="heart-gray-img"
                                                        />
                                                        <p>{post.like_count}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="popup-body">
                                                <img
                                                    src={post.imageUrl}
                                                    className="popup-image"
                                                />
                                                <div className="popup-text">
                                                    <div className="description">
                                                        {editingPostId ===
                                                        post.id ? (
                                                            <textarea
                                                                value={
                                                                    editedPost?.description ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    setEditedPost(
                                                                        {
                                                                            ...editedPost,
                                                                            description:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }
                                                                    )
                                                                }
                                                            />
                                                        ) : (
                                                            <p>
                                                                {
                                                                    post.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Comment id={post.id} />
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                )}
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
                                id={id || ""}
                                lat={selectedPosition.lat}
                                lng={selectedPosition.lng}
                                onAddPost={onAddPost}
                                setSelectedPosition={setSelectedPosition}
                            />
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
            {isMobile && (
                <div
                    ref={bottomSheetRef}
                    className={`bottom-sheet ${
                        selectedPost ? (isClosing ? "closing" : "active") : ""
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {selectedPost && (
                        <MobileDetail
                            post={selectedPost}
                            handleClose={handleClose}
                            handleLikeClick={handleLikeClick}
                            handleEditClick={handleEditClick}
                            handleDeleteClick={handleDeleteClick}
                            handleSaveClick={handleSaveClick}
                            handleCancelClick={handleCancelClick}
                            editingPostId={editingPostId}
                            setEditingPostId={setEditingPostId}
                            setEditedPost={setEditedPost}
                            isLoggedIn={isLoggedIn}
                            editedPost={editedPost}
                            isCurrentUserPost={
                                selectedPost.user_id === currentUserID
                            }
                        />
                    )}
                </div>
            )}
        </>
    );
}
