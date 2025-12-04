import express from "express";
import {
  createProposal,
  deleteProposal,
  getProposal,
  listProposals,
  updateProposal,
} from "../controllers/proposal.controller.js";

const router = express.Router();

router.post("/", createProposal);
router.get("/", listProposals);
router.get("/:id", getProposal);
router.put("/:id", updateProposal);
router.delete("/:id", deleteProposal);

export default router;
