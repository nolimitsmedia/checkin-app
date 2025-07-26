import React, { useEffect, useState } from "react";
import api from "../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CheckInList.css";

function normalizeAvatar(avatar) {
  if (!avatar) return "/default-profile.png";
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/uploads/")) return `http://localhost:3001${avatar}`;
  return `http://localhost:3001/uploads/${avatar}`;
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

  useEffect(() => {
    fetchCheckIns();
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
  };

  const handleCheckOut = async (id) => {
    if (!window.confirm("Check out this user?")) return;
    try {
      await api.delete(`/checkins/${id}`);
      toast.success("Checked out!");
      fetchCheckIns();
    } catch {
      toast.error("Failed to check out.");
    }
  };

  // FILTERING: by name, event, or role (case insensitive)
  const filtered = checkIns.filter((ci) => {
    const term = search.toLowerCase();
    return (
      ci.first_name?.toLowerCase().includes(term) ||
      ci.last_name?.toLowerCase().includes(term) ||
      ci.role?.toLowerCase().includes(term) ||
      ci.event_title?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <ToastContainer position="top-center" autoClose={3000} />
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

      {loading ? (
        <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-list-box">No check-ins found.</div>
      ) : (
        <div className="checkin-list-table-wrapper">
          <table className="checkin-list-table">
            <thead>
              <tr>
                <th>Avatar</th>
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
                    <img
                      src={normalizeAvatar(ci.avatar)}
                      alt="avatar"
                      className="avatar"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        objectFit: "cover",
                        background: "#eee",
                      }}
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
                      onClick={() => handleCheckOut(ci.id)}
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
