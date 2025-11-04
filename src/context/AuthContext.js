// src/context/AuthContext.js
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // read persisted stuff (token set by your login)
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [role, setRole] = useState(
    () => localStorage.getItem("adminRole") || "admin"
  );
  const [name, setName] = useState(
    () => localStorage.getItem("adminFirstName") || "Admin"
  );

  // expose helpers (you can call these from Login page after auth)
  const login = ({ token, role, name }) => {
    if (token) localStorage.setItem("token", token);
    if (role) localStorage.setItem("adminRole", role);
    if (name) localStorage.setItem("adminFirstName", name);
    setToken(token || "");
    setRole(role || "admin");
    setName(name || "Admin");
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminFirstName");
    setToken("");
    setRole("");
    setName("");
  };

  // keep context value stable
  const value = useMemo(
    () => ({ token, role, name, login, logout }),
    [token, role, name]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
