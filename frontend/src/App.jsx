import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import { ToastContainer } from "react-toastify";
import Navbar from "./components/Navbar";
import CreateRfp from "./pages/CreateRfp";
import Vendors from "./pages/Vendors";
import RfpDetails from "./pages/RfpDetails";

function App() {
  return (
    <>
      <div>
        <ToastContainer />
        <Navbar />
        <Routes>
          <>
            <Route path="/" element={<Home />} />
            <Route path="/create-rfp" element={<CreateRfp />} />
            <Route path="/vendors" element={<Vendors />} />

            <Route path="/rfp/:id" element={<RfpDetails />} />
          </>
        </Routes>
      </div>
    </>
  );
}

export default App;
