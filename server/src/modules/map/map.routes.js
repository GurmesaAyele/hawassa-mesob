import express from "express";
import {
  getMapLocation,
  updateMapLocation,
  getContactInfo,
  submitContactMessage,
  listContactMessages,
} from "./map.controller.js";

const router = express.Router();

// GET /api/map - Complete map and headquarters info
router.get("/", getMapLocation);

// PUT & POST /api/map - Form endpoint to update map/location/headquarters info
router.put("/", updateMapLocation);
router.post("/", updateMapLocation);

export default router;

// Dedicated Contact Router for /api/contact
export const contactRouter = express.Router();
contactRouter.get("/", getContactInfo);
contactRouter.post("/", submitContactMessage);
contactRouter.post("/submit", submitContactMessage);
contactRouter.get("/messages", listContactMessages);
