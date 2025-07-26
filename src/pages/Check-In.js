import React from "react";
import { Link } from "react-router-dom";

function CheckIn() {
  return (
    <div className="checkin-options">
      <h2>Choose Check-In Method</h2>
      <ul>
        <li>
          <Link to="/check-in-name">Check In by Name</Link>
        </li>
        {/* Future: Add QR code or mobile check-in option */}
      </ul>
    </div>
  );
}

export default CheckIn;
