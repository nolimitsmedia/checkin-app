import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import Modal, { MINISTRY_OPTIONS } from "../components/Modal";
import "./MasterListPage.css";

const MasterListPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get(`/users/masterlist`);
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const lower = search.toLowerCase();
    const filtered = users.filter(
      (user) =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(lower) ||
        user.email.toLowerCase().includes(lower) ||
        (user.phone && user.phone.toLowerCase().includes(lower))
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [search, users]);

  const handleDelete = async (rawId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const [role, idPart] =
        typeof rawId === "string" && rawId.includes("-")
          ? rawId.split("-")
          : [null, rawId];
      const id = parseInt(idPart, 10);
      if (!id) throw new Error("Invalid ID format");

      await api.delete(`/users/${id}${role ? `?role=${role}` : ""}`);
      await fetchUsers();
    } catch (err) {
      console.error("❌ Delete error:", err.response?.data || err.message);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  // FIX: Only send ministry IDs (or codes), not names
  const handleSave = async (updatedUser) => {
    try {
      // updatedUser.ministries is now an array of IDs (or codes)
      const payload = {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role,
        ministry_ids: updatedUser.ministries, // Now an array of IDs or codes!
        avatar: updatedUser.avatar,
        family_id: updatedUser.family_id || null, // <--- include family_id here!
      };

      await api.put(`/users/${updatedUser.id}`, payload);
      await fetchUsers();
      handleModalClose();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Show ministries as their labels
  const renderMinistryLabels = (ministries) => {
    if (!ministries || !ministries.length) return "-";
    // Ministries may be array of IDs, codes, or labels (for legacy users)
    return ministries
      .map((val) => {
        const found = MINISTRY_OPTIONS.find(
          (opt) => opt.value === val || opt.label === val
        );
        return found ? found.label : val;
      })
      .join(", ");
  };

  return (
    <div className="masterlist-container">
      <div className="top-bar">
        <h2>📋 Master List</h2>
      </div>

      <div className="search-bar-wrapper">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="clear-btn" onClick={() => setSearch("")}>
            ❌
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ministry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={`${user.id}-${user.email}`}>
                <td data-label="Avatar">
                  <img
                    src={
                      user.avatar?.startsWith("/uploads/")
                        ? `http://localhost:3001${user.avatar}`
                        : `http://localhost:3001/uploads/default-avatar.jpg`
                    }
                    alt="avatar"
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                      borderRadius: "50%",
                      border: "1px solid #ccc",
                    }}
                  />
                </td>
                <td data-label="Name">
                  {user.first_name} {user.last_name}
                </td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Role">{user.role}</td>
                <td data-label="Ministry">
                  {renderMinistryLabels(user.ministries)}
                </td>
                <td data-label="Actions">
                  <button onClick={() => handleEdit(user)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {modalOpen && selectedUser && (
        <Modal
          open={modalOpen}
          user={selectedUser}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default MasterListPage;
