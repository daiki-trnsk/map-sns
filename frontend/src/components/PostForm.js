import { useState, useRef } from "react";
import supabase from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { API_HOST } from "../common";

export default function PostForm({
  id,
  lat,
  lng,
  onAddPost,
  setSelectedPosition,
}) {
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
            const ratio = Math.min(maxWidth / width, maxHeight / height);
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

    setUploading(true);
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

    setUploading(false);
    const { data } = supabase.storage.from("map-sns").getPublicUrl(filePath);
    const responseUrl = data.publicUrl;
    return responseUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const imageUrl = await handleUpload();

    const newPost = {
      post_title,
      imageUrl,
      description,
      location: { lat: lat, lng: lng },
    };

    fetch(`${API_HOST}/topics/${id}`, {
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
        setSelectedPosition(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      })
      .catch((err) => console.error("Post Error:", err));
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "250px",
        margin: "0 auto",
        paddingTop: "10px",
      }}
    >
      <input
        type="text"
        value={post_title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        maxLength={500}
        required
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="説明"
        required
        maxLength={500}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          resize: "vertical",
        }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        ref={fileInputRef}
        required
        style={{
          marginBottom: "15px",
        }}
      />
      {preview && (
        <img
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
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          color: "#fff",
          backgroundColor: "#f703fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#a804ad")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#f703ff")}
      >
        {uploading ? "アップロード中..." : "投稿"}
      </button>
    </form>
  );
}
