import React, { useEffect, useState } from "react";
import api from "../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CheckInList.css";

// --- Simple Modal Component ---
function ConfirmModal({ open, onClose, onConfirm, message }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Confirmation</h3>
        <p style={{ margin: "16px 0" }}>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
            style={{ marginLeft: 8 }}
          >
            Yes, Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(datetime) {
  if (!datetime) return "";
  const date = new Date(datetime);
  let hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} ${ampm}`;
}

export default function CheckInList() {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null); // { type: "bulk"|"single", id?:number }
  const [modalMsg, setModalMsg] = useState("");

  useEffect(() => {
    fetchCheckIns();
    // eslint-disable-next-line
  }, []);

  const fetchCheckIns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/checkins/all");
      setCheckIns(res.data);
    } catch (err) {
      toast.error("Failed to load check-ins.");
    }
    setLoading(false);
    setSelected([]);
    setSelectAll(false);
  };

  // --- Modal Confirmations ---
  const openConfirmModal = (actionType, ids = null) => {
    if (actionType === "bulk") {
      setModalMsg(`Check out ${selected.length} selected users?`);
      setModalAction({ type: "bulk" });
      setModalOpen(true);
    } else if (actionType === "single") {
      setModalMsg("Check out this user?");
      setModalAction({ type: "single", id: ids });
      setModalOpen(true);
    }
  };
  const closeModal = () => setModalOpen(false);

  const handleModalConfirm = async () => {
    setModalOpen(false);
    if (modalAction?.type === "single" && modalAction.id) {
      try {
        await api.delete(`/checkins/${modalAction.id}`);
        toast.success("Checked out!");
        fetchCheckIns();
      } catch {
        toast.error("Failed to check out.");
      }
    }
    if (modalAction?.type === "bulk") {
      try {
        await api.post("/checkins/bulk-checkout", { ids: selected });
        toast.success("Bulk check-out successful!");
        fetchCheckIns();
      } catch {
        toast.error("Bulk check-out failed.");
      }
    }
  };

  // --- Selection Logic ---
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sel) => sel !== id) : [...prev, id]
    );
  };
  const handleSelectAll = () => {
    if (selectAll) {
      setSelected([]);
      setSelectAll(false);
    } else {
      setSelected(filtered.map((ci) => ci.id));
      setSelectAll(true);
    }
  };

  // --- Filtering: by name, event, or role (case insensitive)
  const filtered = checkIns.filter((ci) => {
    const term = search.toLowerCase();
    return (
      ci.first_name?.toLowerCase().includes(term) ||
      ci.last_name?.toLowerCase().includes(term) ||
      ci.role?.toLowerCase().includes(term) ||
      ci.event_title?.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    setSelected((prev) =>
      prev.filter((id) => filtered.some((ci) => ci.id === id))
    );
    setSelectAll(
      filtered.length > 0 && filtered.every((ci) => selected.includes(ci.id))
    );
    // eslint-disable-next-line
  }, [search, checkIns]);

  return (
    <div className="page-container">
      <ToastContainer position="top-center" autoClose={3000} />
      {/* Modal for confirmation */}
      <ConfirmModal
        open={modalOpen}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        message={modalMsg}
      />

      <h2 style={{ margin: "24px 0 10px" }}>🧾 All Check-Ins</h2>
      <p>List of all recent check-ins.</p>

      {/* --- SEARCH BAR --- */}
      <div style={{ margin: "18px 0 12px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, event, or role…"
          style={{
            padding: "9px 16px",
            fontSize: "1em",
            borderRadius: 7,
            border: "1px solid #eee",
            width: "100%",
            maxWidth: 340,
            boxShadow: "0 1px 2px #f5f5f7",
            outline: "none",
          }}
        />
      </div>

      {/* --- BULK CHECK-OUT BUTTON --- */}
      {filtered.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn btn-danger"
            style={{ marginRight: 6 }}
            disabled={selected.length === 0}
            onClick={() => openConfirmModal("bulk")}
          >
            Bulk Check-Out ({selected.length})
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-list-box">No check-ins found.</div>
      ) : (
        <div className="checkin-list-table-wrapper">
          <table className="checkin-list-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Name</th>
                <th>Role</th>
                <th>Event</th>
                <th>Time</th>
                <th>Check-Out</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ci) => (
                <tr key={ci.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(ci.id)}
                      onChange={() => handleSelect(ci.id)}
                    />
                  </td>
                  <td>
                    {ci.first_name} {ci.last_name}
                  </td>
                  <td>
                    <span className="role-badge">{ci.role}</span>
                  </td>
                  <td>{ci.event_title}</td>
                  <td>
                    <span role="img" aria-label="clock">
                      🕒
                    </span>{" "}
                    {formatTime(ci.checkin_time)}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => openConfirmModal("single", ci.id)}
                    >
                      Check-Out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
