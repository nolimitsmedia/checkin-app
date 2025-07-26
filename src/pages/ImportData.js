import React, { useState } from "react";
import api from "../api/api";
import { toast, ToastContainer } from "react-toastify";

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return toast.error("Please select a file.");
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/import/users", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Import successful!");
    } catch (err) {
      toast.error("Import failed: " + (err.response?.data?.message || "Error"));
    }
    setImporting(false);
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "auto",
        padding: "50px",

        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderRadius: "20px",
      }}
    >
      <ToastContainer />
      <h2>Import Users</h2>
      <input type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
      <button
        onClick={handleImport}
        disabled={importing}
        style={{ marginLeft: 8 }}
      >
        {importing ? "Importing..." : "Import"}
      </button>
    </div>
  );
}
