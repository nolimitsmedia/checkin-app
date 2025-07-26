import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "https://checkin-app-backend.onrender.com/api/auth/login",
        {
          username,
          password,
        }
      );

      const token = response.data.token;
      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);

      // ✅ Store first name and role if available
      if (decoded) {
        localStorage.setItem("adminFirstName", decoded.firstName || "Admin");
        localStorage.setItem("adminRole", decoded.role || "staff");
      }

      setError(""); // Clear any previous errors
      navigate("/");
    } catch (err) {
      // ❌ Clear potentially stale auth info on error
      localStorage.removeItem("token");
      localStorage.removeItem("adminFirstName");
      localStorage.removeItem("adminRole");
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <input
          className="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="eye-icon"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button onClick={handleLogin}>Login</button>
        {error && <p className="error">{error}</p>}
        <p className="footer">© 2025 No Limits Media</p>
      </div>
    </div>
  );
}

export default Login;
