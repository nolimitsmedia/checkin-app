import React, { useEffect, useState } from "react";
import axios from "axios";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./ReportsPage.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function ReportsPage() {
  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    eventId: "",
    startDate: "",
    endDate: "",
    ministry: "",
  });
  const [summary, setSummary] = useState({
    totalAttendees: 0,
    totalMinistries: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [ministryChartData, setMinistryChartData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/events")
      .then((res) => setEvents(res.data));
    fetchAttendees(); // Initial fetch
  }, []);

  const fetchAttendees = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3001/api/reports/attendees",
        {
          params: filters,
        }
      );
      setAttendees(res.data);

      const totalAttendees = res.data.length;
      const ministries = new Set(res.data.map((a) => a.ministry)).size;
      setSummary({ totalAttendees, totalMinistries: ministries });

      const eventGroup = res.data.reduce((acc, curr) => {
        const title = curr.event_title;
        acc[title] = acc[title] ? acc[title] + 1 : 1;
        return acc;
      }, {});
      const chartFormat = Object.keys(eventGroup).map((key) => ({
        name: key,
        attendees: eventGroup[key],
      }));
      setChartData(chartFormat);

      const ministryGroup = res.data.reduce((acc, curr) => {
        const ministry = curr.ministry || "Unknown";
        acc[ministry] = acc[ministry] ? acc[ministry] + 1 : 1;
        return acc;
      }, {});
      const ministryFormat = Object.keys(ministryGroup).map((key) => ({
        name: key,
        value: ministryGroup[key],
      }));
      setMinistryChartData(ministryFormat);
    } catch (error) {
      console.error("Failed to fetch attendees", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchAttendees();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Attendees Report", 14, 16);
    const tableColumn = ["Name", "Email", "Phone", "Event", "Date"];
    const tableRows = [];
    attendees.forEach((a) => {
      tableRows.push([
        `${a.first_name} ${a.last_name}`,
        a.email,
        a.phone,
        a.event_title,
        new Date(a.event_date).toLocaleString(),
      ]);
    });
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
    doc.save("attendees_report.pdf");
  };

  return (
    <div className="reports-container">
      <h2 className="report-title">📊 Ministry Attendance Report</h2>

      <div className="report-filters">
        <select
          name="eventId"
          value={filters.eventId}
          onChange={handleFilterChange}
        >
          <option value="">All Events</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="ministry"
          placeholder="Filter by Ministry"
          value={filters.ministry}
          onChange={handleFilterChange}
        />
        <button onClick={applyFilters}>Apply Filters</button>
      </div>

      <div className="report-header">
        <div className="report-box">
          <h4>Total Attendees</h4>
          <p>{summary.totalAttendees}</p>
        </div>
        <div className="report-box">
          <h4>Total Ministries</h4>
          <p>{summary.totalMinistries}</p>
        </div>
      </div>

      <div className="report-actions">
        <CSVLink data={attendees} filename="attendees.csv" className="btn-csv">
          Export CSV
        </CSVLink>
        <button onClick={exportPDF} className="btn-pdf">
          Export PDF
        </button>
      </div>

      <div className="chart-wrapper">
        <div className="chart-item">
          <h4>Attendees per Event</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="attendees" fill="#7dd3fc" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item">
          <h4>Ministry Participation</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ministryChartData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {ministryChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#f472b6", "#60a5fa", "#34d399", "#facc15"][index % 4]
                    }
                  />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-wrapper">
        <h4>👥 Grouped Attendees by Event</h4>
        {Object.entries(
          attendees.reduce((acc, attendee) => {
            const key = attendee.event_title;
            if (!acc[key]) acc[key] = [];
            acc[key].push(attendee);
            return acc;
          }, {})
        ).map(([event, attendees]) => (
          <div key={event} className="event-group">
            <h5>{event}</h5>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a, idx) => (
                  <tr key={idx}>
                    <td>
                      {a.first_name} {a.last_name}
                    </td>
                    <td>{a.email}</td>
                    <td>{a.phone}</td>
                    <td>{new Date(a.event_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportsPage;
