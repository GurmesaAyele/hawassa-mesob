/**
 * Hawassa MESOB Center - Map & Location Information
 * Based on authentic location, coordinates, and contact details.
 */

export const INITIAL_MAP_LOCATION = {
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
