import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

const Register = () => {
  const initialState = {
    username: "",
    email: "",
    password: "",
  };

  const [formData, setFormData] = useState(initialState);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/user/register", formData);

      if (res.data.success) {
        toast.success("Registeration successful! Please login.");
        navigate("/login");
      }
    } catch (error) {
      const data = error.response?.data;

      if (data?.error) {
        if (Array.isArray(data.error)) {
          data.error.forEach((err) => toast.error(err.message));
        } else {
          toast.error(data.error);
        }
      } else if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error("Registration failed");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        <input
          type="text"
          name="username"
          placeholder="Name"
          value={formData.username}
          onChange={handleChange}
          className="w-full p-2 border mb-3 rounded"
          required
        />

        <input
          type="text"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border mb-3 rounded"
          required
        />

        <input
          type="text"
          name="password"
          placeholder="Password"
          value={FormData.password}
          onChange={handleChange}
          className="w-full p-2 border mb-3 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Register
        </button>

        <p className="mt-3 text-center text-sm">
          Already have an account?
          <span
            className="text-blue-500 cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
