import { trackingProviderKeys } from "@/lib/settings";
import {
  carrierById,
  isVerifiedTrackingStatus,
  normalizeTrackingNumber,
  trackingStatusLabel,
  trackingUrl,
  validateTracking,
  type Carrier,
  type TrackingLookup,
  type TrackingStatus,
} from "@/lib/tracking";

const TEST_TRACKERS: Record<string, TrackingStatus> = {
  EZ1000000001: "info_received",
  EZ2000000002: "in_transit",
  EZ3000000003: "out_for_delivery",
  EZ4000000004: "delivered",
  EZ5000000005: "exception",
  EZ6000000006: "exception",
  EZ7000000007: "info_received",
};

export function allowTestTrackers() {
  const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY || "";
  return stripeKey.startsWith("sk_test_");
}

async function easypostKey() {
  return (await trackingProviderKeys()).easypost;
}

async function aftershipKey() {
  return (await trackingProviderKeys()).aftership;
}

function mapEasyPostStatus(status: string | null | undefined): TrackingStatus {
  if (status === "in_transit") return "in_transit";
  if (status === "out_for_delivery" || status === "available_for_pickup") return "out_for_delivery";
  if (status === "delivered") return "delivered";
  if (status === "return_to_sender" || status === "failure" || status === "error" || status === "cancelled") {
    return "exception";
  }
  return "info_received";
}

function mapAftershipStatus(tag: string | null | undefined): TrackingStatus {
  const value = (tag || "").toLowerCase();
  if (value === "intransit") return "in_transit";
  if (value === "outfordelivery" || value === "availableforpickup") return "out_for_delivery";
  if (value === "delivered") return "delivered";
  if (value === "exception" || value === "attemptfail") return "exception";
  if (value === "expired") return "expired";
  return "info_received";
}

function lookupFromTestNumber(number: string, carrierId: string): TrackingLookup | null {
  if (!allowTestTrackers()) return null;
  const status = TEST_TRACKERS[number];
  if (!status) return null;
  const at = new Date().toISOString();
  return {
    status,
    verified: isVerifiedTrackingStatus(status),
    providerId: `test:${number}`,
    url: trackingUrl(carrierId, number),
    events: [
      { at, status: "info_received", message: "Test label created." },
      { at, status, message: `Stripe test tracker ${number}.` },
    ],
  };
}

export type EasyPostTracker = {
  id?: string;
  status?: string;
  tracking_code?: string;
  carrier?: string;
  public_url?: string;
  tracking_details?: { message?: string; status?: string; datetime?: string }[];
};

export function fromEasyPost(tracker: EasyPostTracker, carrierId: string, number: string): TrackingLookup {
  const status = mapEasyPostStatus(tracker.status);
  const events = (tracker.tracking_details ?? []).map((detail) => ({
    at: detail.datetime || new Date().toISOString(),
    status: mapEasyPostStatus(detail.status),
    message: detail.message || mapEasyPostStatus(detail.status),
  }));
  return {
    status,
    verified: isVerifiedTrackingStatus(status),
    providerId: tracker.id ?? null,
    url: tracker.public_url || trackingUrl(carrierId, number),
    events: events.length
      ? events
      : [{ at: new Date().toISOString(), status, message: trackingStatusLabel(status) }],
  };
}

async function lookupEasyPost(number: string, carrier: Carrier): Promise<TrackingLookup | null> {
  const key = await easypostKey();
  if (!key) return null;
  const auth = Buffer.from(`${key}:`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

  const create = async (withCarrier: boolean) =>
    fetch("https://api.easypost.com/v2/trackers", {
      method: "POST",
      headers,
      body: JSON.stringify({
        tracker: {
          tracking_code: number,
          ...(withCarrier && carrier.easypost ? { carrier: carrier.easypost } : {}),
        },
      }),
    });

  let res = await create(true);
  if (!res.ok) res = await create(false);
  if (!res.ok) {
    const listed = await fetch(
      `https://api.easypost.com/v2/trackers?tracking_code=${encodeURIComponent(number)}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    if (!listed.ok) return null;
    const bundle = (await listed.json()) as { trackers?: EasyPostTracker[] };
    const tracker = bundle.trackers?.[0];
    return tracker ? fromEasyPost(tracker, carrier.id, number) : null;
  }
  return fromEasyPost((await res.json()) as EasyPostTracker, carrier.id, number);
}

type AftershipTracking = {
  id?: string;
  tag?: string;
  checkpoints?: { checkpoint_time?: string; tag?: string; message?: string }[];
};

async function lookupAftership(number: string, carrier: Carrier): Promise<TrackingLookup | null> {
  const key = await aftershipKey();
  if (!key) return null;
  const headers = {
    "as-api-key": key,
    "Content-Type": "application/json",
  };
  const slug = carrier.aftership;
  const createBody = {
    tracking_number: number,
    ...(slug ? { slug } : {}),
  };
  let create = await fetch("https://api.aftership.com/tracking/2024-10/trackings", {
    method: "POST",
    headers,
    body: JSON.stringify(createBody),
  });
  if (!create.ok) {
    create = await fetch("https://api.aftership.com/tracking/2024-10/trackings", {
      method: "POST",
      headers,
      body: JSON.stringify({ tracking: createBody }),
    });
  }

  let payload = (await create.json()) as { data?: AftershipTracking };

  if (!create.ok) {
    const path = slug
      ? `https://api.aftership.com/tracking/2024-10/trackings/${encodeURIComponent(slug)}/${encodeURIComponent(number)}`
      : `https://api.aftership.com/tracking/2024-10/trackings/${encodeURIComponent(number)}`;
    const existing = await fetch(path, { headers });
    if (!existing.ok) return null;
    payload = (await existing.json()) as { data?: AftershipTracking };
  }

  const tracking = payload.data;
  if (!tracking) return null;
  const status = mapAftershipStatus(tracking.tag);
  const events = (tracking.checkpoints ?? []).map((point) => ({
    at: point.checkpoint_time || new Date().toISOString(),
    status: mapAftershipStatus(point.tag),
    message: point.message || mapAftershipStatus(point.tag),
  }));
  return {
    status,
    verified: isVerifiedTrackingStatus(status),
    providerId: tracking.id ?? null,
    url: trackingUrl(carrier.id, number),
    events: events.length
      ? events
      : [{ at: new Date().toISOString(), status, message: trackingStatusLabel(status) }],
  };
}

export async function lookupTracking(carrierId: string, trackingNumber: string): Promise<TrackingLookup> {
  const parsed = validateTracking(carrierId, trackingNumber);
  const number = parsed.ok ? parsed.number : normalizeTrackingNumber(trackingNumber);
  const carrier = parsed.ok ? parsed.carrier : carrierById(carrierId) ?? carrierById("other")!;
  const fallbackUrl = trackingUrl(carrier.id, number);

  const test = lookupFromTestNumber(number, carrier.id);
  if (test) return test;

  try {
    const aftership = await lookupAftership(number, carrier);
    if (aftership) return aftership;
  } catch {
    // Fall through to EasyPost / pending.
  }

  try {
    const easypost = await lookupEasyPost(number, carrier);
    if (easypost) return easypost;
  } catch {
    // Stay pending until a provider or the buyer confirms.
  }

  return {
    status: "info_received",
    verified: false,
    providerId: null,
    url: fallbackUrl,
    events: [
      {
        at: new Date().toISOString(),
        status: "info_received",
        message: "Tracking saved. Waiting for the courier to scan the parcel.",
      },
    ],
  };
}

export async function hasTrackingProvider() {
  const keys = await trackingProviderKeys();
  return Boolean(keys.easypost || keys.aftership || allowTestTrackers());
}

export async function aftershipKeyWorks(key: string) {
  const res = await fetch("https://api.aftership.com/tracking/2024-10/couriers", {
    headers: { "as-api-key": key },
  });
  return res.ok;
}

function carrierIdFromEasyPostName(name: string | null | undefined) {
  const value = (name || "").toLowerCase();
  const hit = (
    [
      ["royal", "royal-mail"],
      ["parcel", "parcelforce"],
      ["evri", "evri"],
      ["hermes", "evri"],
      ["dpd", "dpd"],
      ["yodel", "yodel"],
      ["ups", "ups"],
      ["dhl", "dhl"],
      ["fedex", "fedex"],
    ] as const
  ).find(([needle]) => value.includes(needle));
  return hit?.[1] ?? "other";
}

export function parseTrackingWebhook(body: unknown): { number: string; lookup: TrackingLookup } | null {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;

  const easypostResult =
    payload.result && typeof payload.result === "object"
      ? (payload.result as EasyPostTracker)
      : payload.object === "Tracker"
        ? (payload as EasyPostTracker)
        : payload.tracker && typeof payload.tracker === "object"
          ? (payload.tracker as EasyPostTracker)
          : null;
  const easypostNumber = easypostResult?.tracking_code;
  if (easypostNumber) {
    const carrierId = carrierIdFromEasyPostName(easypostResult.carrier);
    return {
      number: normalizeTrackingNumber(easypostNumber),
      lookup: fromEasyPost(easypostResult, carrierId, easypostNumber),
    };
  }

  const aftership =
    payload.msg && typeof payload.msg === "object"
      ? (payload.msg as AftershipTracking & { tracking_number?: string })
      : payload.tracking_number
        ? (payload as AftershipTracking & { tracking_number?: string })
        : null;
  const aftershipNumber = aftership?.tracking_number;
  if (aftershipNumber) {
    const status = mapAftershipStatus(aftership.tag);
    const events = (aftership.checkpoints ?? []).map((point) => ({
      at: point.checkpoint_time || new Date().toISOString(),
      status: mapAftershipStatus(point.tag),
      message: point.message || mapAftershipStatus(point.tag),
    }));
    return {
      number: normalizeTrackingNumber(aftershipNumber),
      lookup: {
        status,
        verified: isVerifiedTrackingStatus(status),
        providerId: aftership.id ?? null,
        url: trackingUrl("other", aftershipNumber),
        events: events.length
          ? events
          : [{ at: new Date().toISOString(), status, message: trackingStatusLabel(status) }],
      },
    };
  }

  return null;
}
