import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserPlus,
  FaChartBar,
  FaUserCheck,
  FaSignOutAlt,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaCalendar,
  FaList,
} from "react-icons/fa";
import "./SidebarLayout.css";

const SidebarLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("Admin");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem("adminFirstName");
    if (name) setAdminName(name);
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/", icon: <FaHome /> },
    { label: "CheckIn", path: "/check-in-name", icon: <FaUserCheck /> },
    { label: "Check-In List", path: "/checkin-list", icon: <FaList /> },
    { label: "Reports", path: "/reports-master", icon: <FaChartBar /> },
    { label: "Masterlist", path: "/masterlist", icon: <FaList /> },
    { label: "Eventlist", path: "/eventlist", icon: <FaCalendar /> },
    { label: "Add User", path: "/add-user", icon: <FaUserPlus /> },
    { label: "Import Data", path: "/import-data", icon: <FaUserPlus /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminFirstName");
    navigate("/login");
  };

  return (
    <div
      className={`layout-container ${
        sidebarOpen ? "sidebar-visible" : "sidebar-hidden"
      }`}
    >
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <button
          className="toggle-close-btn"
          onClick={() => setSidebarOpen(false)}
        >
          <FaTimes /> <span>Close</span>
        </button>
        <h2 className="logo">Mt Gilead Helps</h2>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <div className="topbar">
          {!sidebarOpen && (
            <button
              className="toggle-sidebar-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars /> <span>Menu</span>
            </button>
          )}
          <div
            className="admin-dropdown"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="avatar">{adminName.charAt(0)}</div>
            <span className="admin-name">{adminName}</span>
            <FaChevronDown className="chevron" />
            {dropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
