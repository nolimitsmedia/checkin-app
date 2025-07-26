import React, { useState, useEffect } from "react";
import api from "../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./FormStyles.css";

// Helper: Avatar image URL
function normalizeAvatar(avatar) {
  if (!avatar) return "/default-profile.png";
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/uploads/")) return `http://localhost:3001${avatar}`;
  return `http://localhost:3001/uploads/${avatar}`;
}

// Helper: Format time 12hr
function formatTime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${mins} ${ampm}`;
}

export default function CheckInName() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [familyName, setFamilyName] = useState("");
  const [eventCheckIns, setEventCheckIns] = useState([]);
  const [eventLocation, setEventLocation] = useState("");

  // Fetch all events and users on mount
  useEffect(() => {
    api.get("/events").then((res) => setEvents(res.data));
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    api.get("/users").then((res) => {
      const enriched = res.data.map((u) => {
        const isElder =
          u.role === "elder" || u.id.toString().startsWith("elder-");
        return {
          ...u,
          id: `${isElder ? "elder" : "user"}-${u.id
            .toString()
            .replace(/^[^\d]+/, "")}`,
          checked: false,
        };
      });
      setUsers(enriched);
    });
  };

  // Fetch event check-ins and location whenever event changes
  useEffect(() => {
    if (!selectedEventId) {
      setEventCheckIns([]);
      setEventLocation("");
      return;
    }
    api.get(`/events/${selectedEventId}`).then((res) => {
      setEventLocation(res.data.location || "");
    });
    api.get(`/checkins/event/${selectedEventId}`).then((res) => {
      setEventCheckIns(res.data || []);
    });
  }, [selectedEventId]);

  // Only search when pressing Enter (not onChange)
  const handleSearch = async () => {
    const term = searchTerm.trim();
    setFilteredUsers([]);
    setFamilyName("");

    if (!term) return;

    // Try full name (e.g., "Lesley Louis")
    const nameParts = term.split(" ").filter(Boolean);
    const isFullName = nameParts.length >= 2;
    let foundUser = null;
    let foundFamilyId = null;

    if (isFullName) {
      const lowerTerm = term.toLowerCase();
      foundUser = users.find(
        (u) => `${u.first_name} ${u.last_name}`.toLowerCase() === lowerTerm
      );
      if (foundUser && foundUser.family_id) {
        foundFamilyId = foundUser.family_id;
        // All family members with this family_id
        const familyMembers = users.filter(
          (u) => u.family_id && u.family_id === foundFamilyId
        );
        setFilteredUsers(familyMembers);
        setFamilyName(foundUser.family_name || "");
        return;
      }
    }

    // Fallback: last name only (show all with matching last name)
    const lowerTerm = term.toLowerCase();
    const lastNameResults = users.filter(
      (u) => u.last_name.toLowerCase() === lowerTerm
    );
    if (lastNameResults.length > 1) {
      setFilteredUsers(lastNameResults);
      setFamilyName(lastNameResults[0]?.family_name || "");
      return;
    }

    // Fallback: by first or last name, or phone
    const anyMatch = users.filter(
      (u) =>
        u.first_name.toLowerCase().includes(lowerTerm) ||
        u.last_name.toLowerCase().includes(lowerTerm) ||
        (u.phone && u.phone.includes(lowerTerm))
    );
    if (anyMatch.length > 0) {
      setFilteredUsers(anyMatch);
      setFamilyName("");
      return;
    }

    toast.info("No match found.");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectAll = (checked) => {
    setUsers((prev) =>
      prev.map((u) =>
        filteredUsers.some((f) => f.id === u.id) ? { ...u, checked } : u
      )
    );
    setFilteredUsers((prev) => prev.map((u) => ({ ...u, checked })));
  };

  const handleMassCheckIn = async () => {
    if (!selectedEventId) return toast.warn("Please select an event.");
    const selectedUsers = users.filter((u) => u.checked);
    if (selectedUsers.length === 0) {
      return toast.warn("No users selected for check-in.");
    }

    const checkedIn = [];
    const duplicates = [];
    for (const user of selectedUsers) {
      try {
        const isElder = user.id.startsWith("elder-");
        const idValue = parseInt(user.id.replace(/^[^\d]+/, ""));
        const payload = {
          event_id: parseInt(selectedEventId),
          ...(isElder ? { elder_id: idValue } : { user_id: idValue }),
        };
        await api.post("/checkins", payload);
        checkedIn.push(`${user.first_name} ${user.last_name}`);
      } catch (err) {
        if (err.response?.status === 409) {
          duplicates.push(`${user.first_name} ${user.last_name}`);
        } else {
          toast.error(`❌ Failed for ${user.first_name} ${user.last_name}`);
        }
      }
    }
    if (checkedIn.length > 0)
      toast.success(`✅ Checked in: ${checkedIn.join(", ")}`);
    if (duplicates.length > 0)
      toast.info(`⚠️ Already checked in: ${duplicates.join(", ")}`);

    setUsers((prev) => prev.map((u) => ({ ...u, checked: false })));
    setFilteredUsers((prev) => prev.map((u) => ({ ...u, checked: false })));
  };

  const hasSearch = filteredUsers.length > 0;

  // Helper: Find check-in record for this user/elder for this event
  function getUserCheckIn(user) {
    if (!user) return null;
    if (user.role === "elder" || user.id.toString().startsWith("elder-")) {
      const id = parseInt(user.id.replace(/^[^\d]+/, ""));
      return eventCheckIns.find((c) => c.elder_id === id);
    } else {
      const id = parseInt(user.id.replace(/^[^\d]+/, ""));
      return eventCheckIns.find((c) => c.user_id === id);
    }
  }

  return (
    <div
      className="form-container"
      style={{ maxWidth: "720px", margin: "auto" }}
    >
      <ToastContainer position="top-center" autoClose={4000} />
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        🧾 Express Check-In
      </h2>

      <div className="form-group">
        <label htmlFor="event-select">📅 Select Event:</label>
        <select
          id="event-select"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="form-input"
        >
          <option value="">-- Choose an Event --</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} ({event.event_date})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="🔍 Search by name or phone"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setFilteredUsers([]);
            setFamilyName("");
          }}
          onKeyDown={handleKeyDown}
          className="form-input"
        />
      </div>

      {hasSearch && (
        <div className="user-list-section">
          {/* FAMILY NAME HOUSEHOLD HEADER */}
          {familyName && (
            <div
              style={{
                fontWeight: 600,
                fontSize: "1.12em",
                color: "#4f2e90",
                margin: "10px 0 20px 0",
              }}
            >
              {familyName} Household
            </div>
          )}

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={filteredUsers.every((u) => u.checked)}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />{" "}
            Select All
          </label>

          <ul
            className="user-checkbox-list"
            style={{ maxHeight: "300px", overflowY: "auto" }}
          >
            {filteredUsers.map((user) => {
              const checkIn = getUserCheckIn(user);
              return (
                <li key={user.id} className="user-entry user-card">
                  <label className="user-card-label">
                    <input
                      type="checkbox"
                      checked={user.checked || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUsers((prev) =>
                          prev.map((u) =>
                            u.id === user.id ? { ...u, checked } : u
                          )
                        );
                        setFilteredUsers((prev) =>
                          prev.map((u) =>
                            u.id === user.id ? { ...u, checked } : u
                          )
                        );
                      }}
                    />
                    <img
                      src={normalizeAvatar(user.avatar)}
                      alt="avatar"
                      className="user-avatar"
                      style={{
                        width: 44,
                        height: 44,
                        objectFit: "cover",
                        borderRadius: "50%",
                        margin: "0 12px",
                        background: "#f7f7fb",
                      }}
                    />
                    <div className="user-info">
                      <strong>
                        {user.first_name} {user.last_name}
                      </strong>
                      <div className="user-meta">
                        <span className="role-badge">{user.role}</span>
                        <span style={{ marginLeft: "10px", fontSize: "0.9em" }}>
                          📞 {user.phone || "No phone"}
                        </span>
                        {/* Show check-in info if already checked-in */}
                        {checkIn && (
                          <span
                            style={{
                              marginLeft: "12px",
                              color: "#a86c00",
                              fontSize: "0.95em",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <span title="Checked in">
                              <b>🕒</b> {formatTime(checkIn.checkin_time)}
                              {eventLocation && (
                                <>
                                  {" "}
                                  <b style={{ margin: "0 3px" }}>📍</b>{" "}
                                  {eventLocation}
                                </>
                              )}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          <button
            onClick={handleMassCheckIn}
            className="btn-primary"
            disabled={!selectedEventId || !filteredUsers.some((u) => u.checked)}
            style={{ marginTop: "20px" }}
          >
            ✅ Check In Selected
          </button>
        </div>
      )}
    </div>
  );
}
