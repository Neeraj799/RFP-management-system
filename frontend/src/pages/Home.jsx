import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import { useEffect } from "react";
import EditTodoModal from "../components/EditTodoModal";
import api from "../services/api";

const Home = () => {
  const [todos, setTodos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);

  const handleEdit = (todo) => {
    setSelectedTodo(todo);
    setIsModalOpen(true);
  };

  const fetchTodos = async () => {
    try {
      const res = await api.get("/todos");

      if (res.data.success) {
        setTodos(res.data.todos);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error?.message);
      }
    }
  };

  const deleteTodo = async (id) => {
    try {
      const res = await api.delete(`/todos/delete/${id}`);
      if (res.data.success) {
        setTodos(todos.filter((todo) => todo._id !== id));
        toast.success(res.data.message);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message);
      }
    }
  };

  const toggleCompleted = async (todo) => {
    try {
      const res = await api.patch(`/todos/update/${todo._id}`, {
        completed: !todo.completed,
      });

      if (res.data.success) {
        setTodos((prev) =>
          prev.map((t) =>
            t._id === todo._id ? { ...t, completed: !t.completed } : t
          )
        );
      }
    } catch (error) {
      toast.error(error.response.data.message || error.message);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">My Todos</h1>

      <div className="flex justify-end mb-4">
        <Link
          to="/add"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + Add Todo
        </Link>
      </div>

      <div>
        <ul className="space-y-3">
          {todos.map((todo) => (
            <li
              key={todo._id}
              className="flex justify-between items-center bg-gray-100 p-3 rounded shadow"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleCompleted(todo)}
                />

                <span
                  className={`${
                    todo.completed ? "line-through text-gray-500" : ""
                  }`}
                >
                  {todo.title}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(todo)}
                  className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteTodo(todo._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <EditTodoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        todo={selectedTodo}
        refreshTodos={fetchTodos}
      />
    </div>
  );
};

export default Home;
