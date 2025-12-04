import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

const EditTodoModal = ({ isOpen, onClose, todo, refreshTodos }) => {
  const initialState = {
    title: "",
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (todo) {
      setFormData({ title: todo.title });
    }
  }, [todo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/todos/update/${todo._id}`, formData);
      if (res.data.success) {
        toast.success(res.data.success);
        refreshTodos();
        onClose();
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-none">
      <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-2xl font-bold mb-4 text-center">Edit Todo</div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Update todo title"
            className="w-full p-2 border focus:outline-none focus:ring focus:ring-blue-300"
            required
          />

          <div className="flex justify-between mt-4 space-x-3">
            <button
              type="button"
              className="w-1/2 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="w-1/2 bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTodoModal;
