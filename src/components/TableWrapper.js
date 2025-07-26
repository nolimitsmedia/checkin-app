// components/TableWrapper.js
import React from "react";
import "./TableWrapper.css"; // Create this CSS for styling

const TableWrapper = ({ title, searchValue, onSearchChange, children }) => {
  return (
    <div className="table-container">
      <h2>{title}</h2>

      <div className="table-wrapper">
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {children}
      </div>
    </div>
  );
};

export default TableWrapper;
