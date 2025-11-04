// client/src/pages/MasterListPage.js
import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import Modal, { MINISTRY_OPTIONS } from "../components/Modal";
import "./MasterListPage.css";

// 🔔 Toasts
import { Toaster, toast } from "react-hot-toast";

/* --------------------------------- helpers -------------------------------- */

function isUserActive(user) {
  return user.active === true || user.active === "true" || user.active === 1;
}

/** Accepts 2264, "2264", "user-2264", "elder-2264" and returns { id: 2264, role: "user"|"elder"|null } */
function extractIdAndRole(rawId) {
  if (rawId == null) return { id: NaN, role: null };
  if (typeof rawId === "number") return { id: rawId, role: null };

  const s = String(rawId);
  const roleMatch = s.match(/^(elder|user|member|staff|volunteer)-/i);
  const role = roleMatch ? roleMatch[1].toLowerCase() : null;

  const idMatch = s.match(/(\d+)$/);
  const id = idMatch ? Number(idMatch[1]) : Number(s);

  return { id, role };
}

/** Normalize ministries into a unique array of numeric ids ([]) */
function normalizeMinistries(input) {
  const arr = Array.isArray(input) ? input : [];
  const ids = arr
    .map((m) => {
      if (m && typeof m === "object") {
        const v = m.value ?? m.id ?? m.label;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      }
      const n = Number(m);
      return Number.isFinite(n) ? n : null;
    })
    .filter((n) => n !== null);
  return Array.from(new Set(ids));
}

/* ---------------------------------- page ---------------------------------- */

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
      toast.error("Failed to fetch users.");
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
        (user.phone ? user.phone.toLowerCase() : "") +
        " " +
        (user.alt_phone ? user.alt_phone.toLowerCase() : "")
      ).includes(lower)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [search, users]);

  const handleDelete = async (rawId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const { id, role } = extractIdAndRole(rawId);
      if (!Number.isFinite(id)) throw new Error("Invalid ID format");

      await api.delete(`/users/${id}${role ? `?role=${role}` : ""}`);
      toast.success("User deleted.");
      await fetchUsers();
    } catch (err) {
      console.error("❌ Delete error:", err.response?.data || err.message);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete failed.";
      toast.error(msg);
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

  // -- Safe and normalized payload for update
  const handleSave = async (updatedUser) => {
    try {
      const { id, role } = extractIdAndRole(updatedUser.id);
      if (!Number.isFinite(id)) {
        toast.error("Invalid ID format.");
        return;
      }

      const payload = {
        id, // numeric
        first_name: updatedUser.first_name?.trim() || "",
        last_name: updatedUser.last_name?.trim() || "",
        email: updatedUser.email?.trim() || "",
        role: (updatedUser.role || "member").toLowerCase(),
        gender: updatedUser.gender || null,
        ministry_ids: normalizeMinistries(updatedUser.ministries),
        active:
          updatedUser.active === true ||
          updatedUser.active === "true" ||
          updatedUser.active === 1,
        avatar: updatedUser.avatar || null,
        family_id:
          updatedUser.family_id === "" || updatedUser.family_id == null
            ? null
            : Number(updatedUser.family_id),
        phone: updatedUser.phone?.trim() || "",
        alt_phone: updatedUser.alt_phone?.trim() || "",
      };

      await api.put(`/users/${id}${role ? `?role=${role}` : ""}`, payload);
      toast.success("Saved successfully.");
      await fetchUsers();
      handleModalClose();
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update failed.";
      console.error("Update error:", err?.response?.data || err);
      toast.error(serverMsg);
    }
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Render ministries with proper labels (supports ids, objects, or labels)
  const renderMinistryLabels = (ministries) => {
    if (!Array.isArray(ministries) || ministries.length === 0) return "-";

    const toLabel = (val) => {
      if (val && typeof val === "object") {
        const v = val.value ?? val.id ?? val.label;
        if (val.label) return String(val.label);

        const n = Number(v);
        if (Number.isFinite(n)) {
          const found = MINISTRY_OPTIONS.find((opt) => Number(opt.value) === n);
          return found?.label ?? String(v);
        }
        const found = MINISTRY_OPTIONS.find(
          (opt) => String(opt.value) === String(v) || opt.label === String(v)
        );
        return found?.label ?? String(v);
      }

      const n = Number(val);
      if (Number.isFinite(n)) {
        const found = MINISTRY_OPTIONS.find((opt) => Number(opt.value) === n);
        return found?.label ?? String(n);
      }

      const found = MINISTRY_OPTIONS.find(
        (opt) => String(opt.value) === String(val) || opt.label === String(val)
      );
      return found?.label ?? String(val);
    };

    return ministries.map(toLabel).join(", ");
  };

  // Modern condensed pagination rendering
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
      {/* Toast portal */}
      <Toaster
        position="top-center"
        containerClassName="nlm-toast-container"
        gutter={12}
        toastOptions={{
          duration: 3500,
          style: {
            // base size + responsiveness
            fontSize: "clamp(14px, 2vw, 18px)",
            padding: "16px 20px",
            borderRadius: "14px",
            maxWidth: "min(92vw, 560px)",
            boxShadow:
              "0 10px 25px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)",
          },
          success: {
            iconTheme: { primary: "#1b8e3e", secondary: "#fff" },
            style: {
              background: "#e7f7ee",
              color: "#0f5132",
              border: "1px solid #a3e6c1",
            },
          },
          error: {
            iconTheme: { primary: "#a94442", secondary: "#fff" },
            style: {
              background: "#fdecea",
              color: "#842029",
              border: "1px solid #f5c2c7",
            },
          },
        }}
      />

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
