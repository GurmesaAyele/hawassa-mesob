import prisma from "../../config/db.js";

// In-memory fallback
let inMemoryMapLocation = {
  contact: {
    address: "MESOB Center, Hawassa, Ethiopia",
    plusCode: "2FWM+V23, Hawassa, Ethiopia",
    operatingHours: "Monday - Friday: 8:00 AM - 6:00 PM",
    officeHoursDetailed: [
      { days: "Monday - Friday", hours: "8:00 AM - 6:00 PM" },
      { days: "Saturday", hours: "8:30 AM - 12:30 PM" },
      { days: "Sunday", hours: "Closed" },
    ],
    phone: "+251974270600",
    phoneDisplay: "+251 97 427 0600",
    email: "admin@hawassamesobcenter.et",
    website: "https://hawassamesobcenter.et",
  },
  map: {
    placeName: "HAWASSA CITY MESOB CENTER",
    coordinates: {
      latitude: 7.0472875,
      longitude: 38.4830077,
    },
    rating: {
      score: 5.0,
      reviewsCount: 1,
    },
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.4752292494895!2d38.48300768684871!3d7.047287523046484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b145005515512d%3A0xe78217b9f10cede0!2sHAWASSA%20CITY%20MESOB%20CENTER!5e1!3m2!1sen!2set!4v1792568981976!5m2!1sen!2set",
    iframeHtml:
      '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.4752292494895!2d38.48300768684871!3d7.047287523046484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x17b145005515512d%3A0xe78217b9f10cede0!2sHAWASSA%20CITY%20MESOB%20CENTER!5e1!3m2!1sen!2set!4v1792568981976!5m2!1sen!2set" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>',
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=HAWASSA+CITY+MESOB+CENTER",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=7.0472875,38.4830077",
  },
  updatedAt: new Date().toISOString(),
};

let contactMessages = [];

/**
 * Fetch map location from Neon DB with in-memory fallback.
 */
async function fetchMapLocation() {
  try {
    if (prisma && prisma.mapLocation) {
      const dbLocation = await prisma.mapLocation.findUnique({
        where: { id: "default-location" },
      });
      if (dbLocation && dbLocation.contact && dbLocation.map) {
        return {
          contact: dbLocation.contact,
          map: dbLocation.map,
          updatedAt: dbLocation.updatedAt ? dbLocation.updatedAt.toISOString() : inMemoryMapLocation.updatedAt,
        };
      }
    }
  } catch (err) {
    console.warn("DB mapLocation lookup failed, using fallback:", err.message);
  }
  return inMemoryMapLocation;
}

/**
 * GET /api/map (also alias /api/location)
 * Returns the Hawassa MESOB Center map coordinates, embed iframe, address, and operating hours.
 */
export async function getMapLocation(req, res) {
  try {
    const loc = await fetchMapLocation();
    return res.json(loc);
  } catch (error) {
    console.error("Error in getMapLocation:", error);
    return res.status(500).json({ error: "Failed to retrieve map and location information" });
  }
}

/**
 * PUT & POST /api/map (also alias /api/location)
 * Updates the address, operating hours, phone, email, or map coordinates in Neon DB.
 */
export async function updateMapLocation(req, res) {
  try {
    const current = await fetchMapLocation();
    let contact = { ...current.contact };
    let map = { ...current.map };

    const {
      contact: contactBody,
      map: mapBody,
      address,
      operatingHours,
      phone,
      email,
      embedUrl,
      latitude,
      longitude,
    } = req.body;

    if (contactBody && typeof contactBody === "object") {
      contact = { ...contact, ...contactBody };
    }

    if (mapBody && typeof mapBody === "object") {
      map = { ...map, ...mapBody };
    }

    if (address) contact.address = address.trim();
    if (operatingHours) contact.operatingHours = operatingHours.trim();
    if (phone) {
      contact.phone = phone.trim();
      contact.phoneDisplay = phone.trim();
    }
    if (email) contact.email = email.trim();

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        map.coordinates = { latitude: lat, longitude: lng };
        map.directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      }
    }

    if (embedUrl && typeof embedUrl === "string") {
      map.embedUrl = embedUrl.trim();
      map.iframeHtml = `<iframe src="${embedUrl.trim()}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }

    const updated = {
      contact,
      map,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (prisma && prisma.mapLocation) {
        await prisma.mapLocation.upsert({
          where: { id: "default-location" },
          update: { contact, map },
          create: { id: "default-location", contact, map },
        });
      }
    } catch (err) {
      console.warn("DB update mapLocation failed, saving in memory:", err.message);
    }

    inMemoryMapLocation = updated;

    return res.json({
      message: "Map and location details updated successfully",
      contact: updated.contact,
      map: updated.map,
      location: updated,
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
    const loc = await fetchMapLocation();
    return res.json({
      title: "Hawassa City MESOB Center",
      address: loc.contact.address,
      phone: loc.contact.phone,
      phoneDisplay: loc.contact.phoneDisplay,
      email: loc.contact.email,
      website: loc.contact.website,
      operatingHours: loc.contact.operatingHours,
      officeHoursDetailed: loc.contact.officeHoursDetailed,
      googleMapsUrl: loc.map.googleMapsUrl,
      directionsUrl: loc.map.directionsUrl,
    });
  } catch (error) {
    console.error("Error in getContactInfo:", error);
    return res.status(500).json({ error: "Failed to retrieve contact information" });
  }
}

function mapCommentToMessage(c) {
  let email = "";
  let phone = null;
  if (c.phoneOrEmail) {
    if (c.phoneOrEmail.includes("/")) {
      const parts = c.phoneOrEmail.split("/").map((s) => s.trim());
      email = parts[0] || "";
      phone = parts[1] || null;
    } else if (c.phoneOrEmail.includes("@")) {
      email = c.phoneOrEmail;
    } else {
      phone = c.phoneOrEmail;
    }
  }

  return {
    id: c.id,
    name: c.name,
    email: email || c.email || "",
    phone: phone || c.phone || null,
    message: c.message,
    isReviewed: Boolean(c.isReviewed),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  };
}

/**
 * POST /api/contact
 * Handles citizen contact message submission (public).
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
      isReviewed: false,
      createdAt: new Date().toISOString(),
    };

    contactMessages.unshift(newMessage);

    try {
      if (prisma && prisma.comments) {
        await prisma.comments.create({
          data: {
            id: newMessage.id,
            name: newMessage.name,
            phoneOrEmail: phone ? `${newMessage.email} / ${newMessage.phone}` : newMessage.email,
            message: newMessage.message,
            category: "contact_form",
            isReviewed: false,
          },
        });
      }
    } catch {
      // In-memory fallback
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
 * GET /api/contact/messages (and alias /api/messages)
 * Retrieves citizen messages for admin inbox with unread count meta.
 * Restricted to SUPER_ADMIN.
 */
export async function listContactMessages(req, res) {
  try {
    const { filter } = req.query; // 'unread' | 'read' | 'all'

    let dbMessages = [];
    let unreadCount = 0;
    let total = 0;

    try {
      if (prisma && prisma.comments) {
        const whereClause = {};
        if (filter === "unread") whereClause.isReviewed = false;
        if (filter === "read") whereClause.isReviewed = true;

        const [items, unreadTotal, allTotal] = await Promise.all([
          prisma.comments.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
          prisma.comments.count({ where: { isReviewed: false } }),
          prisma.comments.count(),
        ]);

        dbMessages = items;
        unreadCount = unreadTotal;
        total = allTotal;
      }
    } catch (dbErr) {
      console.warn("DB comments lookup failed, using fallback:", dbErr.message);
    }

    if (dbMessages.length === 0 && contactMessages.length > 0) {
      let filtered = contactMessages;
      if (filter === "unread") filtered = contactMessages.filter((m) => !m.isReviewed);
      if (filter === "read") filtered = contactMessages.filter((m) => m.isReviewed);
      unreadCount = contactMessages.filter((m) => !m.isReviewed).length;
      total = contactMessages.length;
      return res.json({
        data: filtered,
        meta: { total, unreadCount },
      });
    }

    const data = dbMessages.map(mapCommentToMessage);
    return res.json({
      data,
      meta: {
        total,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error in listContactMessages:", error);
    return res.status(500).json({ error: "Failed to retrieve contact messages" });
  }
}

/**
 * PATCH /api/contact/messages/:id (and alias /api/messages/:id)
 * Updates the review / read status of a citizen contact message.
 * Restricted to SUPER_ADMIN.
 */
export async function updateContactMessageReviewStatus(req, res) {
  try {
    const { id } = req.params;
    const { isReviewed } = req.body || {};

    const reviewedBool = Boolean(isReviewed);
    let updated = null;

    try {
      if (prisma && prisma.comments) {
        updated = await prisma.comments.update({
          where: { id },
          data: { isReviewed: reviewedBool },
        }).catch(() => null);
      }
    } catch (dbErr) {
      console.warn("DB update comment failed:", dbErr.message);
    }

    const memoryItem = contactMessages.find((m) => m.id === id);
    if (memoryItem) {
      memoryItem.isReviewed = reviewedBool;
      if (!updated) updated = memoryItem;
    }

    if (!updated && !memoryItem) {
      return res.status(404).json({ error: `Message with ID '${id}' not found.` });
    }

    return res.json({
      success: true,
      message: reviewedBool ? "Message marked as read." : "Message marked as unread.",
      data: updated ? mapCommentToMessage(updated) : memoryItem,
    });
  } catch (error) {
    console.error("Error in updateContactMessageReviewStatus:", error);
    return res.status(500).json({ error: "Failed to update message review status" });
  }
}
