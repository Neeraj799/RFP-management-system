import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import { ToastContainer } from "react-toastify";
import AddTodo from "./pages/AddTodo";
import { useState } from "react";
import { useEffect } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <>
      <div>
        <ToastContainer />
        <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <Routes>
          <Route
            path="/register"
            element={<Register setIsLoggedIn={setIsLoggedIn} />}
          />
          <Route
            path="/login"
            element={<Login setIsLoggedIn={setIsLoggedIn} />}
          />

          {isLoggedIn ? (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<AddTodo />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to={"/login"} />} />
          )}
        </Routes>
      </div>
    </>
  );
}

export default App;
