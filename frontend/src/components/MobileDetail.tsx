import "leaflet/dist/leaflet.css";
import { useState, useContext, useEffect } from "react";
import "../general.css";
import PostForm from "./PostForm";
import Comment from "./Comment";
import { AuthContext } from "../context/AuthContext";
import heartFilled from "../assets/heartFilled.png";
import heartNot from "../assets/heartNot.png";
import pen from "../assets/pen.png";
import garbage from "../assets/garbage.png";
import check from "../assets/check.png";
import back from "../assets/back.png";
import heartGray from "../assets/heartGray.png";
import { formatDateToYYYYMMDD } from "../utils/format";
import React from "react";
import { UserData } from "../types/user";
import close from "../assets/close.png";

interface EditedPost {
    post_title?: string;
    description?: string;
}

interface MobileDetailProps {
    post: Post;
    handleClose: () => void;
    handleLikeClick: (id: string, isLiked: boolean) => void;
    handleEditClick: (
        post: Post,
        e: React.MouseEvent<HTMLButtonElement>
    ) => void;
    handleDeleteClick: (
        id: string,
        e: React.MouseEvent<HTMLButtonElement>
    ) => void;
    handleCancelClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    handleSaveClick: (
        id: string,
        e: React.MouseEvent<HTMLButtonElement>
    ) => void;
    openGoogleMap: () => void;
    isCurrentUserPost: boolean;
    isLoggedIn: boolean | UserData | null;
    editingPostId: string | null;
    setEditingPostId: React.Dispatch<React.SetStateAction<string | null>>;
    setEditedPost: React.Dispatch<React.SetStateAction<EditedPost | null>>;
    editedPost: EditedPost | null;
}

const MobileDetail: React.FC<MobileDetailProps> = ({
    post,
    handleClose,
    handleLikeClick,
    handleEditClick,
    handleDeleteClick,
    handleCancelClick,
    handleSaveClick,
    openGoogleMap,
    isLoggedIn,
    editingPostId,
    setEditingPostId,
    setEditedPost,
    editedPost,
    isCurrentUserPost,
}) => {
    return (
        <>
            <div className="bottom-sheet-header">
                <button className="mobile-button" onClick={handleClose}>
                    <img src={close} className="close-img" />
                </button>
            </div>
            <div className="popup-content">
                {editingPostId === post.id ? (
                    <input
                        type="text"
                        value={editedPost?.post_title || ""}
                        onChange={(e) =>
                            setEditedPost({
                                ...editedPost,
                                post_title: e.target.value,
                            })
                        }
                    />
                ) : (
                    <h3 className="popup-title">{post.post_title}</h3>
                )}
                <div className="post-info">
                    <div className="post-crated">
                        <p>
                            {post.nickname && (
                                <>
                                    by {post.nickname}
                                    &emsp;
                                </>
                            )}
                            {formatDateToYYYYMMDD(post.created_at)}
                        </p>
                    </div>
                    {isCurrentUserPost &&
                        (editingPostId === post.id ? (
                            <div className="post-opt">
                                <button onClick={(e) => handleCancelClick(e)}>
                                    <img src={back} className="back-img" />
                                </button>
                                <button
                                    onClick={(e) => handleSaveClick(post.id, e)}
                                >
                                    <img src={check} className="check-img" />
                                </button>
                            </div>
                        ) : (
                            <div className="post-opt">
                                <button
                                    onClick={(e) => handleEditClick(post, e)}
                                >
                                    <img src={pen} className="pen-img" />
                                </button>
                                <button
                                    onClick={(e) =>
                                        handleDeleteClick(post.id, e)
                                    }
                                >
                                    <img
                                        src={garbage}
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
                                    handleLikeClick(post.id, post.is_liked);
                                }}
                            >
                                {post.is_liked ? (
                                    <img
                                        src={heartFilled}
                                        className="heart-img"
                                    />
                                ) : (
                                    <img src={heartNot} className="heart-img" />
                                )}
                            </button>
                            <p>{post.like_count}</p>
                        </div>
                    ) : (
                        <div className="post-like">
                            <img src={heartGray} className="heart-gray-img" />
                            <p>{post.like_count}</p>
                        </div>
                    )}
                </div>
                <div className="mobile-googlemap">
                    <button
                        onClick={openGoogleMap}
                        className="google-map-button"
                    >
                        GoogleMap
                    </button>
                </div>
                <div className="popup-body">
                    <div className="popup-text">
                        <div className="description">
                            {editingPostId === post.id ? (
                                <textarea
                                    value={editedPost?.description || ""}
                                    onChange={(e) =>
                                        setEditedPost({
                                            ...editedPost,
                                            description: e.target.value,
                                        })
                                    }
                                />
                            ) : (
                                <p>{post.description}</p>
                            )}
                        </div>

                        {post.imageUrl && (
                            <img src={post.imageUrl} className="popup-image" />
                        )}
                        <Comment id={post.id} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default MobileDetail;
