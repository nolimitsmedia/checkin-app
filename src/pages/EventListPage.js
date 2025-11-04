// src/pages/EventListPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import EventTable from "../components/EventTable";
import "./EventListPage.css";

const EventListPage = () => {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const filtered = events.filter((event) =>
      (event.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, events]);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const normalizeDateOnly = (val) => {
    if (!val) return "";
    // Return YYYY-MM-DD if present, regardless of whether there's a time
    return String(val).slice(0, 10);
  };

  const normalizeTimeForInput = (val) => {
    if (!val) return "";
    // Expect "HH:MM[:SS]" -> keep HH:MM
    const s = String(val);
    const m = s.match(/^(\d{2}:\d{2})/);
    return m ? m[1] : s;
  };

  const handleEditClick = (event) => {
    setEditingEvent({
      id: event.id,
      title: event.title || "",
      event_date: normalizeDateOnly(event.event_date),
      event_time: normalizeTimeForInput(event.event_time),
      location: event.location || "",
      description: event.description || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const updatedEvent = {
      ...editingEvent,
      // Ensure date stays date-only on submit
      event_date: normalizeDateOnly(editingEvent.event_date),
      // Leave time as "HH:MM" which your backend/DB TIME should handle
      event_time: normalizeTimeForInput(editingEvent.event_time),
    };

    try {
      await api.put(`/events/${updatedEvent.id}`, updatedEvent);
      setEvents((prev) =>
        prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );
      setEditingEvent(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // (Optional) only used if you wire this into EventTable; EventTable already formats time internally.
  const formatTime = (time) => {
    if (!time) return "--";
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="event-list-wrapper">
      <h2>📋 Event List</h2>

      <div className="top-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="add-event-btn"
          onClick={() => navigate("/add-event")}
        >
          ➕ Add Event
        </button>
      </div>

      <EventTable
        events={filteredEvents}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        eventsPerPage={eventsPerPage}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        formatTime={formatTime}
      />

      {editingEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Event</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                name="title"
                value={editingEvent.title}
                onChange={handleEditChange}
                required
              />

              {/* DATE: keep as plain string YYYY-MM-DD, no Date/ISO conversion */}
              <input
                type="date"
                name="event_date"
                value={normalizeDateOnly(editingEvent.event_date)}
                onChange={handleEditChange}
                required
              />

              {/* TIME: normalized to HH:MM so it fits the input */}
              <input
                type="time"
                name="event_time"
                value={normalizeTimeForInput(editingEvent.event_time)}
                onChange={handleEditChange}
              />

              <input
                type="text"
                name="location"
                value={editingEvent.location}
                onChange={handleEditChange}
              />
              <textarea
                name="description"
                value={editingEvent.description}
                onChange={handleEditChange}
              />
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingEvent(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventListPage;
