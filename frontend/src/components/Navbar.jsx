import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <div className="bg-gray-800 p-4 text-white shadow-md">
      <div className="mx-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          RFP MANAGEMENT SYSTEM
        </Link>

        <div className="flex gap-4 items-center">
          <>
            <Link to="/" className="hover:text-gray-300 rounded shadow-lg">
              Home
            </Link>

            <Link to="/create-rfp" className="hover:text-gray-300">
              Create RFP
            </Link>

            <Link to="/vendors" className="hover:text-gray-300">
              Create RFP
            </Link>
          </>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
