import { useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { API_HOST } from "../common";
import { getToken } from "../utils/auth";
import { AuthContext } from "../context/AuthContext";

export default function PostForm({
    id,
    lat,
    lng,
    onAddPost,
    setSelectedPosition,
}) {
    const { isLoggedIn } = useContext(AuthContext);
    const [post_title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const compressImage = async (file, quality, maxWidth, maxHeight) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(
                            maxWidth / width,
                            maxHeight / height
                        );
                        width *= ratio;
                        height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(
                                    new File([blob], file.name, {
                                        type: "image/jpeg",
                                        lastModified: Date.now(),
                                    })
                                );
                            } else {
                                reject(new Error("Image compression failed"));
                            }
                        },
                        "image/jpeg",
                        quality
                    );
                };

                img.onerror = () => reject(new Error("Failed to load image"));
            };

            reader.onerror = () => reject(new Error("File read failed"));
        });
    };

    const handleUpload = async () => {
        if (!image) return null;

        const compressedImage = await compressImage(image, 0.7, 800, 800);
        const fileExtension = compressedImage.name.split(".").pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `uploads/${uniqueFileName}`;

        const { error } = await supabase.storage
            .from("map-sns")
            .upload(filePath, compressedImage);

        if (error) {
            console.error("Upload Error:", error);
            setUploading(false);
            return null;
        }

        const { data } = supabase.storage
            .from("map-sns")
            .getPublicUrl(filePath);
        const responseUrl = data.publicUrl;
        return responseUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        const imageUrl = await handleUpload();

        const newPost = {
            post_title,
            imageUrl,
            description,
            location: { lat: lat, lng: lng },
        };

        try {
            const res = await fetch(`${API_HOST}/topics/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${getToken()}`,
                },
                body: JSON.stringify(newPost),
            });
            const data = await res.json();
            onAddPost(data);
            setTitle("");
            setDescription("");
            setImage(null);
            setPreview(null);
            setSelectedPosition(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            console.error("Post Error:", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="post-container">
            {isLoggedIn ? (
                <form onSubmit={handleSubmit} className="post-form">
                    <input
                    className="post-form-title"
                        type="text"
                        value={post_title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="タイトル"
                        maxLength={500}
                        required
                    />
                    <textarea
                    className="post-form-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="説明"
                        required
                        maxLength={500}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                    />
                    {preview && (
                        <img
                        className="post-form-img"
                            src={preview}
                            alt="プレビュー"
                            style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "cover",
                                marginBottom: "15px",
                            }}
                        />
                    )}
                    <button
                        type="submit"
                        disabled={uploading}
                    >
                        {uploading ? "アップロード中..." : "投稿"}
                    </button>
                </form>
            ) : (
                <div className="login-for-topic">
                    ログインしてピンを投稿
                    <Link to="/login" className="login-button">
                        Login
                    </Link>
                </div>
            )}
        </div>
    );
}
