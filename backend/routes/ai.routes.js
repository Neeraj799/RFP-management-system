import express from "express";
import {
  parseAndCreateRfp,
  parseRfpFromText,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/parse-rfp", parseRfpFromText);
router.post("/parse-and-create", parseAndCreateRfp);

export default router;
