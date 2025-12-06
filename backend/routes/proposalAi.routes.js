// backend/routes/proposalAi.js
import express from "express";
import { parseAndCreateProposal } from "../controllers/proposalAi.controller.js";

const router = express.Router();

router.post("/parse-and-create-proposal", parseAndCreateProposal);

export default router;
