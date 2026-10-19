import { INITIAL_MAP_LOCATION } from "./map.data.js";
import prisma from "../../config/db.js";

let mapLocation = JSON.parse(JSON.stringify(INITIAL_MAP_LOCATION));
let contactMessages = [];

/**
 * GET /api/map (also alias /api/location)
 * Returns the Hawassa MESOB Center map coordinates, embed iframe, address, and operating hours.
 */
export async function getMapLocation(req, res) {
  try {
    return res.json(mapLocation);
  } catch (error) {
    console.error("Error in getMapLocation:", error);
    return res.status(500).json({ error: "Failed to retrieve map and location information" });
  }
}

/**
 * PUT & POST /api/map (also alias /api/location)
 * Updates the address, operating hours, phone, email, or map coordinates.
 */
export async function updateMapLocation(req, res) {
  try {
    const {
      contact,
      map,
      address,
      operatingHours,
      phone,
      email,
      embedUrl,
      latitude,
      longitude,
    } = req.body;

    if (contact && typeof contact === "object") {
      mapLocation.contact = {
        ...mapLocation.contact,
        ...contact,
      };
    }

    if (map && typeof map === "object") {
      mapLocation.map = {
        ...mapLocation.map,
        ...map,
      };
    }

    // Direct convenience field overrides from forms
    if (address) mapLocation.contact.address = address.trim();
    if (operatingHours) mapLocation.contact.operatingHours = operatingHours.trim();
    if (phone) {
      mapLocation.contact.phone = phone.trim();
      mapLocation.contact.phoneDisplay = phone.trim();
    }
    if (email) mapLocation.contact.email = email.trim();

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        mapLocation.map.coordinates = { latitude: lat, longitude: lng };
        mapLocation.map.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      }
    }

    if (embedUrl && typeof embedUrl === "string") {
      mapLocation.map.embedUrl = embedUrl.trim();
      mapLocation.map.iframeHtml = `<iframe src="${embedUrl.trim()}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }

    mapLocation.updatedAt = new Date().toISOString();

    return res.json({
      message: "Map and location details updated successfully",
      location: mapLocation,
    });
  } catch (error) {
    console.error("Error in updateMapLocation:", error);
    return res.status(500).json({ error: "Failed to update map information" });
  }
}

/**
 * GET /api/contact
 * Returns official contact details for the frontend contact page.
 */
export async function getContactInfo(req, res) {
  try {
    return res.json({
      title: "Hawassa City MESOB Center",
      address: mapLocation.contact.address,
      phone: mapLocation.contact.phone,
      phoneDisplay: mapLocation.contact.phoneDisplay,
      email: mapLocation.contact.email,
      website: mapLocation.contact.website,
      operatingHours: mapLocation.contact.operatingHours,
      officeHoursDetailed: mapLocation.contact.officeHoursDetailed,
      googleMapsUrl: mapLocation.map.googleMapsUrl,
      directionsUrl: mapLocation.map.directionsUrl,
    });
  } catch (error) {
    console.error("Error in getContactInfo:", error);
    return res.status(500).json({ error: "Failed to retrieve contact information" });
  }
}

/**
 * POST /api/contact
 * Handles citizen contact message submission (as seen in Contact.jsx).
 */
export async function submitContactMessage(req, res) {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Validation failed: 'name' is required" });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Validation failed: 'email' is required" });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Validation failed: 'message' is required" });
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    contactMessages.unshift(newMessage);

    // Also attempt persisting to db comments if available
    try {
      if (prisma && prisma.comments) {
        await prisma.comments.create({
          data: {
            id: newMessage.id,
            name: newMessage.name,
            phoneOrEmail: newMessage.email,
            message: newMessage.message,
            category: "contact_form",
            isReviewed: false,
          },
        });
      }
    } catch (dbErr) {
      // In-memory fallback is active
    }

    return res.status(201).json({
      success: true,
      message: "Thank you for contacting Hawassa MESOB Center. Your message has been received.",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error in submitContactMessage:", error);
    return res.status(500).json({ error: "Failed to submit contact message" });
  }
}

/**
 * GET /api/contact/messages
 * Retrieves submitted citizen messages (for admin oversight).
 */
export async function listContactMessages(req, res) {
  try {
    return res.json(contactMessages);
  } catch (error) {
    console.error("Error in listContactMessages:", error);
    return res.status(500).json({ error: "Failed to retrieve contact messages" });
  }
}
