import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

const Home = () => {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState();

  const fetchRfps = async () => {
    try {
      setLoading(true);

      const res = await api.get("/rfp");

      if (res.data?.success) {
        setRfps(res.data.rfps || []);
      } else {
        toast.error(res.data?.error || "Failed to fetch RFPs");
      }
    } catch (error) {
      const msg =
        error.response?.data.error || error.message || "Something went wrong";
      console.error("fetchRfps error:", error);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfps();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between my-6">
        <h1 className="text-2xl font-semibold">RFPs</h1>

        <Link
          to="/create-rfp"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          New RFP
        </Link>
      </div>

      {rfps?.length === 0 ? (
        <div className="p-6 bg-white rounded shadow">
          No RFPs found. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {rfps?.map((r) => (
            <Link
              key={r._id}
              to={`/rfp/${r._id}`}
              className="block bg-white p-4 rounded shadow hover:shadow-md tarnstion"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-lg">{r.title || ""}</div>
                  <div className="font-medium text-lg">
                    {r.description || ""}
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
