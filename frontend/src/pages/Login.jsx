import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

const Login = ({ setIsLoggedIn }) => {
  const initialState = {
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
      const res = await api.post("/user/login", formData);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setIsLoggedIn(true);
        toast.success("Login successful");
        navigate("/");
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
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <input
          type="text"
          name="email"
          value={formData.email}
          placeholder="Email"
          onChange={handleChange}
          className="w-full p-2 border mb-3 rounded"
          required
        />

        <input
          type="text"
          name="password"
          value={formData.password}
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-2 border mb-3 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
