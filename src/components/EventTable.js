import React from "react";
import "./TableStyles.css"; // Or your preferred styles

const EventTable = ({ events, onEdit, onDelete }) => {
  const formatTime = (time) => {
    if (!time) return "--";
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="table-wrapper">
      <table className="styled-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Time</th>
            <th>Location</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                No events found.
              </td>
            </tr>
          ) : (
            events.map((event) => (
              <tr key={event.id}>
                <td data-label="Title">{event.title}</td>
                <td data-label="Date">
                  {event.event_date
                    ? new Date(event.event_date).toLocaleDateString()
                    : "--"}
                </td>
                <td data-label="Time">{formatTime(event.event_time)}</td>
                <td data-label="Location">{event.location || "--"}</td>
                <td data-label="Description">{event.description || "--"}</td>
                <td data-label="Actions">
                  <button onClick={() => onEdit(event)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(event.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EventTable;
