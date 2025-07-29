// src/components/Footer.js
import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        // background: "transparent",
        color: "#1e293b",
        textAlign: "center",
        padding: "16px 0",
        marginTop: "auto",
        fontSize: "0.97em",
        zIndex: -1,
      }}
    >
      © {new Date().getFullYear()} No Limits Media LLC. All Rights Reserved.
    </footer>
  );
}
