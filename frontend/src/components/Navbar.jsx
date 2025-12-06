import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="text-lg sm:text-xl font-semibold tracking-wide text-gray-900 hover:text-indigo-600 transition-colors"
          >
            RFP MANAGEMENT SYSTEM
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition"
            >
              Home
            </Link>

            <Link
              to="/create-rfp"
              className="px-3 py-1.5 rounded-md text-sm text-gray-700 hover:text-white hover:bg-indigo-600 transition"
            >
              Create RFP
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
