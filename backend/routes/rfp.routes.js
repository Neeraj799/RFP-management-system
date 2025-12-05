import express from "express";
import {
  addVendorToRfp,
  compareVendors,
  createRfp,
  deleteRfp,
  getRfp,
  listRfps,
  updateRfp,
} from "../controllers/rfp.controller.js";
import { getProposalsByRfp } from "../controllers/proposal.controller.js";
import { sendRfpToVendors } from "../controllers/email.controller.js";

const router = express.Router();

router.post("/", createRfp);
router.get("/", listRfps);
router.get("/:id", getRfp);
router.put("/:id", updateRfp);
router.delete("/:id", deleteRfp);

router.post("/:id/add-vendor/:vendorId", addVendorToRfp);

router.get("/:id/proposals", getProposalsByRfp);

router.post("/:id/send", sendRfpToVendors);

router.get("/:id/compare", compareVendors);

export default router;
