export type TrackingStatus =
  | "none"
  | "info_received"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "expired";

export type TrackingEvent = {
  at: string;
  status: TrackingStatus;
  message: string;
};

export type TrackingLookup = {
  status: TrackingStatus;
  events: TrackingEvent[];
  url: string | null;
  providerId: string | null;
  verified: boolean;
};

export type Carrier = {
  id: string;
  label: string;
  easypost: string;
  aftership: string;
  trackUrl: (number: string) => string;
  valid: (number: string) => boolean;
};

const CODE = /^[A-Z0-9][A-Z0-9\s-]{6,39}$/i;

export const CARRIERS: Carrier[] = [
  {
    id: "royal-mail",
    label: "Royal Mail",
    easypost: "RoyalMail",
    aftership: "royal-mail",
    trackUrl: (n) => `https://www.royalmail.com/track-your-item#/tracking-results/${encodeURIComponent(n)}`,
    valid: (n) =>
      /^[A-Z]{2}\d{9}GB$/i.test(n) ||
      /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(n) ||
      /^\d{13,22}$/.test(n) ||
      /^[A-Z0-9]{11,18}$/i.test(n),
  },
  {
    id: "parcelforce",
    label: "Parcelforce",
    easypost: "ParcelForce",
    aftership: "parcelforce",
    trackUrl: (n) => `https://www.parcelforce.com/track-trace?trackNumber=${encodeURIComponent(n)}`,
    valid: (n) => /^[A-Z]{2}\d{9}GB$/i.test(n) || /^\d{12,16}$/.test(n) || CODE.test(n),
  },
  {
    id: "evri",
    label: "Evri",
    easypost: "Evri",
    aftership: "evri",
    trackUrl: (n) => `https://www.evri.com/track/#/parcel/${encodeURIComponent(n)}/details`,
    valid: (n) => /^(H00)?\d{14,18}$/i.test(n) || /^[A-Z0-9]{14,20}$/i.test(n) || CODE.test(n),
  },
  {
    id: "dpd",
    label: "DPD",
    easypost: "DPD",
    aftership: "dpd-uk",
    trackUrl: (n) => `https://www.dpd.co.uk/service/tracking?parcel=${encodeURIComponent(n)}`,
    valid: (n) => /^\d{10,15}$/.test(n) || /^[A-Z0-9]{12,18}$/i.test(n),
  },
  {
    id: "yodel",
    label: "Yodel",
    easypost: "Yodel",
    aftership: "yodel",
    trackUrl: (n) => `https://www.yodel.co.uk/track/${encodeURIComponent(n)}`,
    valid: (n) => /^JD\d{16,20}$/i.test(n) || /^[A-Z0-9]{12,20}$/i.test(n),
  },
  {
    id: "ups",
    label: "UPS",
    easypost: "UPS",
    aftership: "ups",
    trackUrl: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
    valid: (n) => /^1Z[A-Z0-9]{16}$/i.test(n) || /^\d{9,18}$/.test(n),
  },
  {
    id: "dhl",
    label: "DHL",
    easypost: "DHLExpress",
    aftership: "dhl",
    trackUrl: (n) => `https://www.dhl.com/gb-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
    valid: (n) => /^\d{10}$/.test(n) || /^[A-Z]{3}\d{7}$/i.test(n) || /^[A-Z0-9]{10,20}$/i.test(n),
  },
  {
    id: "fedex",
    label: "FedEx",
    easypost: "FedEx",
    aftership: "fedex",
    trackUrl: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
    valid: (n) => /^\d{12,22}$/.test(n),
  },
  {
    id: "other",
    label: "Other",
    easypost: "",
    aftership: "",
    trackUrl: (n) => `https://www.aftership.com/track/${encodeURIComponent(n)}`,
    valid: (n) => CODE.test(n),
  },
];

export function newTrackToken() {
  return crypto.randomUUID();
}

export function carrierById(id: string | null | undefined) {
  return CARRIERS.find((carrier) => carrier.id === id) ?? null;
}

export function normalizeTrackingNumber(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function validateTracking(carrierId: string, trackingNumber: string) {
  const carrier = carrierById(carrierId);
  const number = normalizeTrackingNumber(trackingNumber);
  if (!carrier) return { ok: false as const, error: "Pick a courier." };
  if (number.length < 8) return { ok: false as const, error: "That tracking number is too short." };
  if (!carrier.valid(number)) {
    return { ok: false as const, error: `That does not look like a ${carrier.label} tracking number.` };
  }
  return { ok: true as const, carrier, number };
}

export function trackingUrl(carrierId: string | null | undefined, trackingNumber: string | null | undefined) {
  if (!trackingNumber) return null;
  const carrier = carrierById(carrierId) ?? carrierById("other");
  return carrier?.trackUrl(normalizeTrackingNumber(trackingNumber)) ?? null;
}

export function isVerifiedTrackingStatus(status: string | null | undefined) {
  return status === "delivered";
}

export function trackerEmbedUrl(carrierId: string | null | undefined, trackingNumber: string | null | undefined) {
  if (!trackingNumber) return null;
  const number = normalizeTrackingNumber(trackingNumber);
  const carrier = carrierById(carrierId);
  if (carrier?.aftership) {
    return `https://www.aftership.com/track/${carrier.aftership}/${encodeURIComponent(number)}`;
  }
  return `https://t.17track.net/en/track?nums=${encodeURIComponent(number)}`;
}

export function trackingStatusLabel(status: string | null | undefined) {
  if (status === "info_received") return "Label created — waiting for the first scan";
  if (status === "in_transit") return "In transit";
  if (status === "out_for_delivery") return "Out for delivery";
  if (status === "delivered") return "Delivered";
  if (status === "exception") return "Courier problem";
  if (status === "expired") return "Tracking expired";
  return "Not shipped yet";
}
