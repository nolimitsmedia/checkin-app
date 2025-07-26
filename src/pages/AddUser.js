import React, { useState, useEffect } from "react";
import api from "../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AddUser.css";

const initialState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "member",
  avatar: null,
};

function AddUser() {
  const [formData, setFormData] = useState(initialState);
  const [avatarFile, setAvatarFile] = useState(null);
  const [families, setFamilies] = useState([]);
  const [familyId, setFamilyId] = useState("");
  const [familyQuery, setFamilyQuery] = useState("");
  const [showFamilyDropdown, setShowFamilyDropdown] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [addingNewFamily, setAddingNewFamily] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFamilies();
  }, []);

  useEffect(() => {
    if (familyId) {
      api
        .get(`/families/${familyId}/members`)
        .then((res) => setFamilyMembers(res.data))
        .catch(() => setFamilyMembers([]));
    } else {
      setFamilyMembers([]);
    }
  }, [familyId]);

  const fetchFamilies = () => {
    api
      .get("/families")
      .then((res) => setFamilies(res.data))
      .catch(() => setFamilies([]));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatarFile(file);
  };

  const handleAddFamily = async () => {
    if (!newFamilyName.trim()) {
      toast.error("Please enter a family name.");
      return;
    }
    try {
      const res = await api.post("/families", { family_name: newFamilyName });
      setFamilies((prev) => [...prev, res.data]);
      setFamilyId(res.data.id);
      setFamilyQuery(res.data.family_name);
      setAddingNewFamily(false);
      setNewFamilyName("");
      toast.success("Household created!");
    } catch (err) {
      toast.error("Failed to add family.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let avatarUrl = "";

    try {
      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        const res = await fetch(
          `http://localhost:3001/api/uploads/avatar?type=user`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: form,
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Upload failed");
        avatarUrl = data.url;
      }

      const payload = {
        ...formData,
        avatar: avatarUrl || null,
        family_id: familyId || null,
      };

      await api.post("/users", payload);

      toast.success("User added!");
      setFormData(initialState);
      setAvatarFile(null);
      setFamilyId("");
      setFamilyQuery("");
      setFamilyMembers([]);
    } catch (err) {
      toast.error("Failed to add user.");
    }
    setLoading(false);
  };

  // Autocomplete filtered families
  const filteredFamilies = families.filter((fam) =>
    fam.family_name.toLowerCase().includes(familyQuery.toLowerCase())
  );

  return (
    <div className="form-container" style={{ maxWidth: 600, margin: "auto" }}>
      <ToastContainer position="top-center" />
      <h2 style={{ textAlign: "center", marginBottom: 32 }}>Add New User</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="input-group">
          <label>First Name</label>
          <input
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-group">
          <label>Last Name</label>
          <input
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>
        <div className="input-group">
          <label>Phone</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        <div className="input-group">
          <label>User Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            required
          >
            <option value="member">Member</option>
            <option value="volunteer">Volunteer</option>
            <option value="elder">Elder</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div className="input-group">
          <label>Upload Avatar</label>
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>
        {/* --- Household Section Autocomplete --- */}

        <div className="input-group">
          <label>Household / Family</label>
          {!addingNewFamily ? (
            <div className="family-autocomplete">
              <input
                type="text"
                placeholder="Type household name"
                value={familyQuery}
                readOnly={!!familyId}
                onChange={(e) => {
                  setFamilyQuery(e.target.value);
                  setShowFamilyDropdown(true);
                  setFamilyId(""); // reset familyId until picked
                }}
                onFocus={() => setShowFamilyDropdown(true)}
                onBlur={() =>
                  setTimeout(() => setShowFamilyDropdown(false), 120)
                }
                autoComplete="off"
              />
              {familyId && (
                <button
                  type="button"
                  className="btn-clear-family"
                  title="Clear selection"
                  onClick={() => {
                    setFamilyId("");
                    setFamilyQuery("");
                    setFamilyMembers([]);
                  }}
                >
                  ×
                </button>
              )}
              {showFamilyDropdown &&
                !familyId &&
                familyQuery.trim().length > 0 && (
                  <div className="family-dropdown">
                    {filteredFamilies.length > 0 &&
                      filteredFamilies.map((fam) => (
                        <div
                          key={fam.id}
                          className="family-option"
                          onMouseDown={() => {
                            setFamilyQuery(fam.family_name);
                            setFamilyId(fam.id);
                            setShowFamilyDropdown(false);
                          }}
                        >
                          {fam.family_name}
                        </div>
                      ))}
                    {!filteredFamilies.some(
                      (fam) =>
                        fam.family_name.toLowerCase() ===
                        familyQuery.toLowerCase()
                    ) && (
                      <div
                        className="family-option add-new"
                        onMouseDown={() => {
                          setNewFamilyName(familyQuery.trim());
                          setAddingNewFamily(true);
                          setShowFamilyDropdown(false);
                        }}
                      >
                        + Add New Family: "{familyQuery.trim()}"
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                placeholder="Family Name"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAddFamily}
                className="btn-primary"
                style={{ width: "90px" }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setAddingNewFamily(false)}
                className="btn-outline"
                style={{ width: "90px" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Show members of selected family */}
        {familyId && familyMembers.length > 0 && (
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #eee",
              marginTop: 10,
              marginBottom: 12,
              borderRadius: 6,
              padding: 12,
            }}
          >
            <strong>Current Household Members:</strong>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: 18 }}>
              {familyMembers.map((m) => (
                <li key={m.id}>
                  {m.first_name} {m.last_name}{" "}
                  <span style={{ color: "#888", fontSize: "0.9em" }}>
                    ({m.role})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="submit"
          className="btn-primary"
          style={{ width: 160, margin: "24px auto 0 auto", display: "block" }}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>
    </div>
  );
}

export default AddUser;
