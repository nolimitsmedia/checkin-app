import React from "react";
import { Link } from "react-router-dom";

function Reports() {
  return (
    <div className="report-options">
      <h2>Reports</h2>
      <ul>
        <li>
          <Link to="/reports">Reports Dashboard</Link>
        </li>
        {/* Future: Add custom reports or filters */}
      </ul>
    </div>
  );
}

export default Reports;
