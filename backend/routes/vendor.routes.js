import express from "express";
import {
  createVendor,
  deleteVendor,
  getVendor,
  listVendors,
  updateVendor,
} from "../controllers/vendor.controller.js";

const router = express.Router();

router.post("/", createVendor);
router.get("/", listVendors);
router.get("/:id", getVendor);
router.get("/:id", updateVendor);
router.patch("/:id", updateVendor);
router.delete("/:id", deleteVendor);

export default router;
