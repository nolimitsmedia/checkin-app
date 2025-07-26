// components/Pagination.js
import React from "react";
import "./Pagination.css"; // optional styling

const Pagination = ({ totalPages, currentPage, onPageChange }) => (
  <div className="pagination">
    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        className={currentPage === i + 1 ? "active" : ""}
        onClick={() => onPageChange(i + 1)}
      >
        {i + 1}
      </button>
    ))}
  </div>
);

export default Pagination;
