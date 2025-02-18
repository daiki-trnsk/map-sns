import { useState, useRef } from "react";
import supabase from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

export default function PostForm({ id, lat, lng, onAddPost }) {
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

  const handleUpload = async () => {
    if (!image) return null;

    setUploading(true);

    const uniqueFileName = `${uuidv4()}_${image.name}`;
    const filePath = `uploads/${uniqueFileName}`;

    const { error } = await supabase.storage
      .from("map-sns")
      .upload(filePath, image);

    if (error) {
      console.error("アップロードエラー:", error);
      setUploading(false);
      return null;
    }

    setUploading(false);
    const { data } = supabase.storage.from("map-sns").getPublicUrl(filePath);
    console.log("data", data);
    const responseUrl = data.publicUrl;
    return responseUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const imageUrl = await handleUpload();
    console.log("imagerurl", imageUrl);

    const newPost = {
      post_title,
      imageUrl,
      description,
      location: { lat: lat, lng: lng },
    };

    fetch(`http://localhost:8000/topics/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newPost),
    })
      .then((res) => res.json())
      .then((data) => {
        onAddPost(data);
        setTitle("");
        setDescription("");
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      })
      .catch((err) => console.error("投稿エラー:", err));
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <input
        type="text"
        value={post_title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        required
      />
      {preview && (
        <img
          src={preview}
          alt="プレビュー"
          style={{ width: "100px", height: "100px", objectFit: "cover" }}
        />
      )}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明"
        required
      />
      <button type="submit" disabled={uploading}>
        {uploading ? "アップロード中..." : "投稿"}
      </button>
    </form>
  );
}
