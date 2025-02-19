import React, { useEffect, useState, useRef } from "react";
import { API_HOST } from "../common";

export default function Comment({ id }) {
  const [commentList, setCommentList] = useState([]);
  const [comment, setComment] = useState("");
  const commentBoxRef = useRef(null);

  useEffect(() => {
    fetch(`${API_HOST}/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCommentList(data);
        } else {
          setCommentList([]);
        }
      })
      .catch((err) => console.error("Error:", err));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment) {
      alert("コメントを入力してください！");
      return;
    }

    const newComment = {
      text: comment,
    };

    try {
      const res = await fetch(`${API_HOST}/posts/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newComment),
      });

      if (!res.ok) {
        throw new Error("コメントの投稿に失敗しました");
      }

      const data = await res.json();
      console.log("cm data", data);

      setCommentList((prevCommentList) => [...prevCommentList, data]);

      setComment("");

      if (commentBoxRef.current) {
        commentBoxRef.current.scrollTop = 0;
      }
    } catch (error) {
      console.error("エラー:", error);
      alert("コメントの投稿に失敗しました");
    }
  };

  return (
    <div className="comment-container">
      <h4>コメント</h4>
      <div className="comment-box" ref={commentBoxRef}>
        {commentList.length > 0 ? (
          commentList.slice().reverse().map((c, index) => (
            <div key={index} className="comment-item">
              <p>{c.text}</p>
              <hr/>
            </div>
          ))
        ) : (
          <p className="no-comment">まだコメントはありません</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="comment-form">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="コメントを入力"
          required
        />
        <button type="submit">➤</button>
      </form>
    </div>
  );
}
