import React, { useEffect, useState } from "react";
import api from "../api/api";
import { format } from "date-fns";
import "./Dashboard.css";

// 🔔 Toast Component
function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div className={`dashboard-toast dashboard-toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>&times;</button>
    </div>
  );
}

// ⚠️ Confirmation Modal
function ConfirmDialog({ show, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <p>{message}</p>
        <div className="confirm-buttons">
          <button onClick={onConfirm} className="btn-confirm">
            Yes
          </button>
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const eventHeaders = [
  { key: "title", label: "Title" },
  { key: "event_date", label: "Date" },
  { key: "event_time", label: "Time" },
  { key: "location", label: "Location" },
];

const checkinHeaders = [
  { key: "name", label: "Name" },
  { key: "ministry", label: "Ministry" },
  { key: "event_title", label: "Event" },
  { key: "checkin_time", label: "Time" },
];

function Dashboard() {
  const [stats, setStats] = useState({});
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allCheckins, setAllCheckins] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 700);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    checkinId: null,
  });

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 700);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const dashboardRes = await api.get("/dashboard");
      setStats(dashboardRes.data.stats);
      setUpcomingEvents(dashboardRes.data.upcomingEvents);
      setAllCheckins(dashboardRes.data.allCheckins);
    } catch (err) {
      setToast({ message: "Failed to load dashboard data.", type: "error" });
      console.error("Failed to load dashboard:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const confirmDelete = async () => {
    const id = confirmDialog.checkinId;
    setConfirmDialog({ show: false, checkinId: null });

    try {
      await api.delete(`/checkins/${id}`);
      setAllCheckins((prev) => prev.filter((c) => c.id !== id));
      setToast({ message: "Check-in deleted successfully.", type: "success" });
    } catch (err) {
      setToast({ message: "Failed to delete check-in.", type: "error" });
      console.error(err);
    }
  };

  // 1. Always include event_date and event_time in the mapping!
  const formattedCheckins = allCheckins.map((c) => ({
    ...c,
    name: `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
    checkin_time: c.checkin_time ? format(new Date(c.checkin_time), "Pp") : "—",
    event_title: c.event_title || c.eventname || "—",
    ministry: c.ministry || "N/A",
    event_date: c.event_date,
    event_time: c.event_time,
  }));

  // 2. Only show check-ins for events that have not expired (+1 hour past event start)
  const now = new Date();
  const activeCheckins = formattedCheckins.filter((c) => {
    if (!c.event_date || !c.event_time) return true;
    const eventDateTime = new Date(`${c.event_date}T${c.event_time}`);
    return eventDateTime.getTime() + 60 * 60 * 1000 > now.getTime();
  });
  console.log("Check-in debug:", formattedCheckins);

  const formattedEvents = upcomingEvents.map((event) => ({
    ...event,
    event_date: event.event_date
      ? format(new Date(event.event_date), "P")
      : "—",
    event_time: event.event_time
      ? format(new Date(`1970-01-01T${event.event_time}`), "h:mm a")
      : "—",
    location: event.location || "—",
    description: event.description || "—",
  }));

  const totalUsers = (stats.totalUsers ?? 0) + (stats.totalElders ?? 0);

  return (
    <div className="dashboard-container">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => {
          setToast({ message: "", type: "" });
          setTimeout(fetchDashboardData, 300);
        }}
      />

      <ConfirmDialog
        show={confirmDialog.show}
        message="Are you sure you want to delete this check-in?"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ show: false, checkinId: null })}
      />

      <div className="dashboard-header">
        <h2>
          Welcome, Admin{" "}
          <span role="img" aria-label="wave">
            👋
          </span>
        </h2>
        <p className="dashboard-sub">Here is your overview dashboard</p>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="stat-title">Check-Ins Today</div>
          <div className="stat-value">{stats.checkInsToday ?? 0}</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{totalUsers}</div>
        </div>
      </div>

      {/* UPCOMING EVENTS SECTION */}
      <div className="dashboard-section">
        <h3>📅 Upcoming Events</h3>
        {formattedEvents.length === 0 ? (
          <p className="empty">No upcoming events.</p>
        ) : (
          <div className="dashboard-table-wrapper">
            {isMobile ? (
              formattedEvents.map((event, idx) => (
                <div className="dashboard-mobile-card" key={idx}>
                  {eventHeaders.map((col) => (
                    <div className="dashboard-mobile-row" key={col.key}>
                      <span className="mobile-label">{col.label}</span>
                      <span className="mobile-value">{event[col.key]}</span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    {eventHeaders.map((h) => (
                      <th key={h.key}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {formattedEvents.map((event, idx) => (
                    <tr key={idx}>
                      {eventHeaders.map((col) => (
                        <td key={col.key}>{event[col.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
