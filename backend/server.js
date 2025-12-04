import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import envConfig from "./config/envConfig.js";
import { connectDB } from "./config/db.js";
import vendorRoutes from "../backend/routes/vendor.routes.js";
import rfpRoutes from "../backend/routes/rfp.routes.js";
import proposalRoutes from "../backend/routes/proposal.routes.js";
import proposalFileRoutes from "../backend/routes/proposalFiles.routes.js";
import aiRoutes from "../backend/routes/ai.routes.js";
import proposalAiRoutes from "../backend/routes/proposalAi.routes.js";
import emailRoutes from "../backend/routes/email.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.resolve("backend/uploads");
app.use("/uploads", express.static(uploadsPath));

connectDB();

const PORT = envConfig.general.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/api/vendors", vendorRoutes);
app.use("/api/rfp", rfpRoutes);
app.use("/api/proposal", proposalRoutes);
app.use("/api/proposal-files", proposalFileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/ai", proposalAiRoutes);
app.use("/api/email", emailRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
