import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import Modal, { MINISTRY_OPTIONS } from "../components/Modal";
import "./MasterListPage.css";

// Helper function for booleans and strings from backend
function isUserActive(user) {
  return user.active === true || user.active === "true" || user.active === 1;
}

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
    const filtered = users.filter((user) =>
      (
        `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase() +
        " " +
        (user.email ? user.email.toLowerCase() : "") +
        " " +
        (user.phone ? user.phone.toLowerCase() : "")
      ).includes(lower)
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

  // -- FIX: Safe and normalized payload
  const handleSave = async (updatedUser) => {
    try {
      // Defensive: Always ensure ministries is an array (never undefined/null)
      let ministries =
        Array.isArray(updatedUser.ministries) && updatedUser.ministries.length
          ? updatedUser.ministries
          : [];
      // Some react-select edge-cases can send array of objects, so normalize
      ministries = ministries.map((m) =>
        typeof m === "object" && m !== null ? m.value || m.id || m.label : m
      );
      // Remove null/undefined/empty
      ministries = ministries.filter(
        (v) => v !== null && v !== undefined && v !== ""
      );

      const payload = {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role || "member",
        gender: updatedUser.gender || null,
        ministry_ids: ministries,
        active: updatedUser.active,
        avatar: updatedUser.avatar,
        family_id: updatedUser.family_id || null,
      };

      await api.put(`/users/${updatedUser.id}`, payload);
      await fetchUsers();
      handleModalClose();
    } catch (err) {
      console.error("Update error:", err?.response?.data || err.message || err);
      alert("Error updating user. See console for details.");
    }
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Show ministries as their labels (supports array of IDs, objects, or string names)
  const renderMinistryLabels = (ministries) => {
    if (!ministries || ministries.length === 0) return "-";
    return ministries
      .map((val) => {
        // If object with label/id/value
        if (typeof val === "object" && val !== null) {
          if (val.label) return val.label;
          if (val.value) {
            const found = MINISTRY_OPTIONS.find(
              (opt) => opt.value === val.value
            );
            return found ? found.label : val.value;
          }
          if (val.id) {
            const found = MINISTRY_OPTIONS.find((opt) => opt.value === val.id);
            return found ? found.label : val.id;
          }
        }
        // If number or string
        const found = MINISTRY_OPTIONS.find(
          (opt) => opt.value === val || opt.label === val
        );
        return found ? found.label : val;
      })
      .join(", ");
  };

  // --- MODERN/CONDENSED PAGINATION ---
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    pages.push(
      <button
        key={1}
        className={currentPage === 1 ? "active" : ""}
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
      >
        1
      </button>
    );
    if (currentPage > 4) {
      pages.push(
        <span key="start-ellipsis" className="ellipsis">
          ...
        </span>
      );
    }
    for (
      let i = Math.max(2, currentPage - 2);
      i <= Math.min(totalPages - 1, currentPage + 2);
      i++
    ) {
      if (i === 1 || i === totalPages) continue;
      pages.push(
        <button
          key={i}
          className={currentPage === i ? "active" : ""}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </button>
      );
    }
    if (currentPage < totalPages - 3) {
      pages.push(
        <span key="end-ellipsis" className="ellipsis">
          ...
        </span>
      );
    }
    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          className={currentPage === totalPages ? "active" : ""}
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </button>
      );
    }
    return (
      <>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        {pages}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </>
    );
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
              <th>Name</th>
              <th>Gender</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ministry</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => {
              const active = isUserActive(user);
              return (
                <tr key={`${user.id}-${user.email}`}>
                  <td data-label="Name">
                    {user.first_name} {user.last_name}
                  </td>
                  <td data-label="Gender" className="gender">
                    {user.gender || "-"}
                  </td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Role" className="role">
                    {user.role || "-"}
                  </td>
                  <td data-label="Ministry">
                    {renderMinistryLabels(user.ministries)}
                  </td>
                  <td data-label="Active">
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        background: active ? "#d1f5e1" : "#f8d7da",
                        color: active ? "#1b8e3e" : "#a94442",
                        fontWeight: "bold",
                        fontSize: "0.9em",
                      }}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <button
                      onClick={() => handleEdit(user)}
                      className="edit-btn"
                    >
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
              );
            })}
            {paginatedUsers.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "1rem" }}
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">{renderPagination()}</div>

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
