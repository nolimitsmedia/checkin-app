import React, { useState } from "react";
import api from "../api/api";

const AvatarUpload = ({ avatar, setAvatar }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    try {
      const res = await api.post("/uploads/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatar(res.data.url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload">
      {avatar && <img src={avatar} alt="Avatar" className="avatar-preview" />}
      <input type="file" onChange={handleFileChange} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
};

export default AvatarUpload;
