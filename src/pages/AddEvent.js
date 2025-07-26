import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./AddEvent.css";

function AddEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    event_date: "",
    event_time: "",
    location: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/events", formData);
      navigate("/eventlist");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create event.");
    }
  };

  const handleCancel = () => {
    navigate("/eventlist"); // ✅ redirect on cancel
  };

  return (
    <div className="event-form-wrapper">
      <div className="event-form-card">
        <h2 className="event-form-title">📅 Add New Event</h2>
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label htmlFor="title">Event Title</label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Sunday Worship, Volunteer Meetup"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event_date">Event Date</label>
            <input
              type="date"
              name="event_date"
              id="event_date"
              value={formData.event_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="event_time">Event Time</label>
            <input
              type="time"
              name="event_time"
              id="event_time"
              value={formData.event_time}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Fellowship Hall, Room 201"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              name="description"
              id="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description (optional)"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Create Event
            </button>
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEvent;
