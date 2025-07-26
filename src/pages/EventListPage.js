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
      event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, events]);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents(events.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEditClick = (event) => {
    setEditingEvent({
      id: event.id,
      title: event.title,
      event_date: event.event_date,
      event_time: event.event_time || "",
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
      event_date: editingEvent.event_date.split("T")[0],
    };

    try {
      await api.put(`/events/${updatedEvent.id}`, updatedEvent);
      setEvents(
        events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );
      setEditingEvent(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

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
              <input
                type="date"
                name="event_date"
                value={
                  editingEvent.event_date
                    ? new Date(editingEvent.event_date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                onChange={handleEditChange}
                required
              />
              <input
                type="time"
                name="event_time"
                value={editingEvent.event_time}
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
