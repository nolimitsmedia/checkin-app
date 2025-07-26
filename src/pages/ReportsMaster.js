import React, { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { CSVLink } from "react-csv";
import { FaSortUp, FaSortDown } from "react-icons/fa";
import "./ReportsMaster.css";

const combineName = (row) =>
  [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "—";

// Remove these columns from all reports
const REMOVE_KEYS = [
  "user_id",
  "ministry_id",
  "id",
  "type",
  "elder_id",
  "event_id",
];

const ReportsMaster = () => {
  const [reportType, setReportType] = useState("attendees");
  const [data, setData] = useState([]);
  const [eventId, setEventId] = useState("");
  const [elderId, setElderId] = useState("");
  const [events, setEvents] = useState([]);
  const [elders, setElders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const role = localStorage.getItem("adminRole");

  useEffect(() => {
    if (role !== "super_admin" && role !== "admin") return;
    const fetchOptions = async () => {
      try {
        const eventRes = await api.get("/events");
        setEvents(eventRes.data);
        const elderRes = await api.get("/users/elders");
        setElders(elderRes.data);
      } catch (err) {
        console.error("Error loading events or elders:", err);
      }
    };
    fetchOptions();
  }, [role]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        let res;
        switch (reportType) {
          case "attendees":
            res = await api.get("/reports/attendees");
            break;
          case "ministry-absent":
            if (eventId)
              res = await api.get(`/reports/ministry-absent/${eventId}`);
            break;
          case "elder":
            if (elderId) res = await api.get(`/reports/elder/${elderId}`);
            break;
          case "elder-absent":
            if (elderId && eventId)
              res = await api.get(
                `/reports/elder-absent/${elderId}/${eventId}`
              );
            break;
          default:
            return;
        }
        if (res) setData(res.data);
      } catch (err) {
        console.error("Report fetch error:", err);
      }
    };
    fetchReport();
  }, [reportType, eventId, elderId]);

  // Prepare visible columns, combine name, remove unwanted
  const columns =
    data.length > 0
      ? [
          "name",
          ...Object.keys(data[0]).filter(
            (key) =>
              !REMOVE_KEYS.includes(key) &&
              key !== "first_name" &&
              key !== "last_name"
          ),
        ]
      : [];

  // Prepare sorted/filtered data
  const processedData = useMemo(() => {
    let items = data.map((row) => ({
      ...row,
      name: combineName(row),
    }));
    if (sortConfig.key) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (typeof valA === "string" && typeof valB === "string") {
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
      });
    }
    return items;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  // CSV export data, only visible columns
  const csvData =
    processedData.length > 0
      ? processedData.map((row) =>
          columns.reduce((obj, key) => {
            obj[key] = row[key];
            return obj;
          }, {})
        )
      : [];

  if (role !== "super_admin" && role !== "admin")
    return <p>Access denied. Admins only.</p>;

  return (
    <div className="reports-master">
      <h2>📋 Reports Center</h2>
      {/* Filters */}
      <div className="report-filters">
        <select
          onChange={(e) => setReportType(e.target.value)}
          value={reportType}
        >
          <option value="attendees">Full Attendee Report</option>
          <option value="ministry-absent">Ministry Absent Report</option>
          <option value="elder">Elder Report</option>
          <option value="elder-absent">Elder Absent Report</option>
        </select>
        {(reportType === "ministry-absent" ||
          reportType === "elder-absent") && (
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Select Event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({new Date(e.event_date).toLocaleDateString("en-US")})
              </option>
            ))}
          </select>
        )}
        {(reportType === "elder" || reportType === "elder-absent") && (
          <select value={elderId} onChange={(e) => setElderId(e.target.value)}>
            <option value="">Select Elder</option>
            {elders.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="report-table-container">
        {processedData.length === 0 ? (
          <p>No data available</p>
        ) : (
          <>
            <CSVLink
              data={csvData}
              filename={`${reportType}-report.csv`}
              className="export-btn"
            >
              ⬇️ Export CSV
            </CSVLink>
            <div className="table-wrapper">
              <table className="responsive-table">
                <thead>
                  <tr>
                    {columns.map((key) => (
                      <th
                        key={key}
                        onClick={() => requestSort(key)}
                        style={{ cursor: "pointer" }}
                      >
                        {key
                          .replace(/_/g, " ")
                          .replace("name", "Name")
                          .toUpperCase()}{" "}
                        {getSortIcon(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((row, i) => (
                    <tr key={i}>
                      {columns.map((key, j) => (
                        <td key={j}>
                          {key.toLowerCase().includes("date")
                            ? new Date(row[key]).toLocaleDateString("en-US")
                            : row[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsMaster;
