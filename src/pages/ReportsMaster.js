import React, { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { CSVLink } from "react-csv";
import { FaSortUp, FaSortDown } from "react-icons/fa";
import "./ReportsMaster.css";

// Change these IDs/names to match your actual database records
const OVERSEER_MINISTRY_NAME = "Overseers";
const STAFF_MINISTRY_NAME = "Staff";

// Helper: join first and last name
const combineName = (row) =>
  [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "—";

const REMOVE_KEYS = [
  "user_id",
  "ministry_id",
  "id",
  "type",
  "elder_id",
  "event_id",
  "checkin_id",
];

const ReportsMaster = () => {
  const [reportType, setReportType] = useState("attendees");
  const [data, setData] = useState([]);
  const [eventId, setEventId] = useState("");
  const [elderId, setElderId] = useState("");
  const [events, setEvents] = useState([]);
  const [elders, setElders] = useState([]);
  const [ministries, setMinistries] = useState([]);
  const [ministryId, setMinistryId] = useState("");
  const [overseerMinistryId, setOverseerMinistryId] = useState("");
  const [staffMinistryId, setStaffMinistryId] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const role = localStorage.getItem("adminRole");

  // Fetch events, elders, ministries
  useEffect(() => {
    if (role !== "super_admin" && role !== "admin") return;
    const fetchOptions = async () => {
      try {
        const eventRes = await api.get("/events");
        setEvents(eventRes.data);
        const elderRes = await api.get("/users/elders");
        setElders(elderRes.data);
        const minRes = await api.get("/reports/ministries"); // updated route
        setMinistries(minRes.data);

        // Find special ministry IDs by name
        const overseerMinistry = minRes.data.find((m) =>
          m.name.toLowerCase().includes(OVERSEER_MINISTRY_NAME.toLowerCase())
        );
        const staffMinistry = minRes.data.find((m) =>
          m.name.toLowerCase().includes(STAFF_MINISTRY_NAME.toLowerCase())
        );
        setOverseerMinistryId(overseerMinistry ? overseerMinistry.id : "");
        setStaffMinistryId(staffMinistry ? staffMinistry.id : "");
      } catch (err) {
        console.error("Error loading events, elders, or ministries:", err);
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
          case "overseer-attendance":
            if (overseerMinistryId) {
              let url = `/reports/ministry-attendance/${overseerMinistryId}`;
              if (eventId) url += `?event_id=${eventId}`;
              res = await api.get(url);
            }
            break;
          case "staff-attendance":
            if (staffMinistryId) {
              let url = `/reports/ministry-attendance/${staffMinistryId}`;
              if (eventId) url += `?event_id=${eventId}`;
              res = await api.get(url);
            }
            break;
          case "ministry-attendance":
            if (ministryId) {
              let url = `/reports/ministry-attendance/${ministryId}`;
              if (eventId) url += `?event_id=${eventId}`;
              res = await api.get(url);
            }
            break;
          case "ministry-absent":
            if (eventId) {
              // ministryId is passed as query param now
              let url = `/reports/ministry-absent/${eventId}`;
              const params = ministryId ? { ministry_id: ministryId } : {};
              res = await api.get(url, { params });
            }
            break;
          case "elder":
            if (elderId) {
              let url = `/reports/elder/${elderId}`;
              if (eventId) url += `?event_id=${eventId}`;
              res = await api.get(url);
            }
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
        else setData([]);
      } catch (err) {
        console.error("Report fetch error:", err);
        setData([]);
      }
    };
    fetchReport();
  }, [
    reportType,
    eventId,
    elderId,
    ministryId,
    overseerMinistryId,
    staffMinistryId,
  ]);

  // Prepare visible columns
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
          onChange={(e) => {
            setReportType(e.target.value);
            setEventId("");
            setElderId("");
            setMinistryId("");
            setData([]);
          }}
          value={reportType}
        >
          <option value="attendees">Full Attendee Report</option>
          <option value="overseer-attendance">
            Overseer Attendance Report
          </option>
          <option value="staff-attendance">Staff Attendance Report</option>
          <option value="ministry-attendance">
            Ministry Attendance Report
          </option>
          <option value="ministry-absent">Ministry Absent Report</option>
          <option value="elder">Elder Report</option>
          <option value="elder-absent">Elder Absent Report</option>
        </select>

        {(reportType === "overseer-attendance" ||
          reportType === "staff-attendance" ||
          reportType === "ministry-attendance") && (
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">All Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({new Date(e.event_date).toLocaleDateString("en-US")})
              </option>
            ))}
          </select>
        )}

        {reportType === "ministry-attendance" && (
          <select
            value={ministryId}
            onChange={(e) => setMinistryId(e.target.value)}
          >
            <option value="">Select Ministry</option>
            {ministries.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {reportType === "ministry-absent" && (
          <>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">Select Event</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} (
                  {new Date(e.event_date).toLocaleDateString("en-US")})
                </option>
              ))}
            </select>
            <select
              value={ministryId}
              onChange={(e) => setMinistryId(e.target.value)}
            >
              <option value="">Select Ministry</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </>
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
        {reportType === "elder-absent" && (
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">Select Event</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({new Date(e.event_date).toLocaleDateString("en-US")})
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
                          {key.toLowerCase().includes("date") && row[key]
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
