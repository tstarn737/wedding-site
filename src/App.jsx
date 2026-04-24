import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Heart,
  HouseHeart,
  MapPin,
  Mountain,
  PartyPopper,
  CheckCircle2,
  Home,
  Utensils,
} from "lucide-react";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyMpJy6E2kALozdEwoqKW5wywWHz3oPkKqFPLGsLtSMc_hnT2RgIcaOtO_ei5OypEZs/exec";

const HOME_FUND = {
  venmoUrl: "https://venmo.com/Ashlyn-Trotter",
  cashAppUrl: "https://cash.app/$YOURNAME",
};

const WEDDING = {
  couple: "Ashlyn & Tyler",
  city: "Denver, Colorado",
  venue: "Wedding Weekend",
  heroImage: "/hero.jpg",
  story:
    "We can’t wait to celebrate with you.",
  ceremonyPartyIsoDate: "2026-09-18T15:40:00",
  saturdayPartyIsoDate: "2026-09-19T17:00:00",
  schedule: [
    {
      title: "Wedding Ceremony",
      time: "Friday Sep 18, 3:40 PM",
      description:
        "Please arrive by 3:40PM, Ceremony begins at 4:00 PM, followed by time for photos with family and friends.",
      tag: "full_day",
      venueName: "Yetman Family Farms",
      address: "2995 S. Estes Street, Lakewood, CO 80227",
      website: "https://www.yetmanfarms.com",
      mapLink:
        "https://www.google.com/maps/search/?api=1&query=2995+S+Estes+Street+Lakewood+CO+80227",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSssKEJXF8cNQcKxph78pk8urS4fdzSixVFkA&s",
    },
    {
      title: "Wedding Night Dinner",
      time: "Friday Sep 18, 6:45 PM",
      description:
        "Guests from the ceremony are invited to join us for dinner and drinks at our new home, just about a mile away.",
      tag: "full_day",
      venueName: "Our Home",
      address: "8239 W Baker Ave, Lakewood, CO 80227",
      mapLink:
        "https://www.google.com/maps/search/?api=1&query=8239+W+Baker+Ave+Lakewood+CO+80227",
      image:
        "https://photos.zillowstatic.com/fp/deebd764d4ed0a7cec01e5c94c4f7231-o_a.webp",
    },
    {
      title: "Reception / Party",
      time: "Saturday Sep 19, 5:00 - 10:00 PM",
      description:
        "Food, drinks, golf, music, and a whole lot of fun!",
      tag: "party_only",
      venueName: "Stick & Feather",
      address: "3851 Steele St - Unit 1378, Denver, CO 80205",
      website: "https://www.stickandfeather.com/",
      mapLink: "https://maps.app.goo.gl/3yoALpvSjecRATri8",
      image:
        "https://images.squarespace-cdn.com/content/v1/603bee699959d83fcdc0eaf3/43abd80d-0db9-4e4d-9eab-74b5960362fe/kateivyphotography-147.jpg",
    },
  ],
};

/*
RSVP SHEET HEADERS
------------------
Use these exact headers in your RSVPs tab:

timestamp | inviteCode | partyName | inviteType | invitedEventLabel | attending | guestCount |
guestNames | email | streetAddress | cityStateZip | notes | allowedEvents

Apps Script doPost rowValues should match exactly:
[
  data.timestamp || "",
  normalizedCode,
  data.partyName || "",
  data.inviteType || "",
  data.invitedEventLabel || "",
  data.attending || "",
  data.guestCount || 0,
  Array.isArray(data.guestNames) ? data.guestNames.join(", ") : "",
  data.email || "",
  data.streetAddress || "",
  data.cityStateZip || "",
  data.notes || "",
  Array.isArray(data.allowedEvents) ? data.allowedEvents.join(", ") : "",
]
*/

function getCountdownParts(targetIsoDate) {
  const now = new Date();
  const target = new Date(targetIsoDate);
  const diff = Math.max(0, target - now);

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

function normalizeInviteType(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_")
    .replaceAll("&", "and");

  if (["ceremony_party", "ceremony_and_party", "cnp", "cnp_invite"].includes(normalized)) {
    return "ceremony_party";
  }

  if (["saturday_party", "party_only", "sp", "sp_invite"].includes(normalized)) {
    return "saturday_party";
  }

  return normalized;
}

async function lookupGuest(code) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter an invite code." };

  const response = await fetch(`${APPS_SCRIPT_URL}?code=${encodeURIComponent(normalized)}`);
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "Lookup failed." };
  }
}

async function submitRsvp(payload) {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: response.ok, raw: text };
  }
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#fff",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  bgPhoto: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center 35%",
    transform: "translateZ(0)",
  },
  bgOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
  },
  hero: {
    minHeight: "78vh",
    backgroundColor: "transparent",
    borderBottom: "1px solid rgba(255,255,255,.1)",
    position: "relative",
  },
  shell: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "28px 24px",
    position: "relative",
    zIndex: 2,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr .85fr",
    gap: 32,
    alignItems: "center",
    minHeight: "72vh",
  },
  badge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,.14)",
    border: "1px solid rgba(255,255,255,.22)",
    fontSize: 12,
    letterSpacing: ".18em",
    textTransform: "uppercase",
    backdropFilter: "blur(6px)",
  },
  title: {
    fontSize: "clamp(44px, 8vw, 82px)",
    lineHeight: 1,
    margin: "18px 0 10px",
    fontWeight: 650,
    letterSpacing: "-0.02em",
    color: "#fff",
    textShadow: "0 2px 12px rgba(0,0,0,.28)",
    },
  sub: {
    color: "rgba(255,255,255,.78)",
    fontSize: 18,
    lineHeight: 1.7,
    maxWidth: 560,
  },
  pillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
    justifyContent: "center",
    maxWidth: 420,
    marginLeft: "auto",
    marginRight: "auto",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,.1)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 999,
    padding: "10px 14px",
    color: "rgba(255,255,255,.86)",
    fontSize: 14,
  },
  countdownGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 120px))",
    gap: 12,
    marginTop: 28,
    justifyContent: "center",
    maxWidth: 420,
    marginLeft: "auto",
    marginRight: "auto",
  },
  countdownBox: {
    background: "rgba(255,255,255,.09)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 22,
    padding: "18px 16px",
    backdropFilter: "blur(10px)",
  },
  countdownNum: {
    fontSize: 30,
    fontWeight: 700,
  },
  countdownLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: ".18em",
    color: "rgba(255,255,255,.6)",
    marginTop: 6,
  },
  card: {
    background: "rgba(255,255,255,.96)",
    color: "#111",
    borderRadius: 28,
    padding: 26,
    boxShadow: "0 30px 90px rgba(0,0,0,.35)",
  },
  section: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "56px 24px",
    position: "relative",
    zIndex: 2,
  },
  darkCardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
  },
  darkCard: {
    borderRadius: 24,
    padding: 24,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(15,15,15,.58)",
    backdropFilter: "blur(8px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  scheduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
    marginTop: 22,
  },
  scheduleCard: {
    background: "rgba(255,255,255,.97)",
    color: "#111",
    borderRadius: 26,
    padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,.22)",
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 14,
    border: "1px solid #d4d4d8",
    padding: "0 14px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 96,
    borderRadius: 16,
    border: "1px solid #d4d4d8",
    padding: 12,
    fontSize: 14,
    boxSizing: "border-box",
    resize: "vertical",
  },
  button: {
    height: 48,
    borderRadius: 14,
    border: 0,
    background: "#111",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    padding: "0 18px",
    cursor: "pointer",
  },
  ghostButton: {
    height: 48,
    borderRadius: 14,
    border: "1px solid #d4d4d8",
    background: "#fff",
    color: "#111",
    fontSize: 15,
    fontWeight: 600,
    padding: "0 18px",
    cursor: "pointer",
  },
  fieldLabel: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  muted: {
    color: "#666",
    fontSize: 14,
    lineHeight: 1.6,
  },
};

function EventCard({ item, isMobile }) {
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div style={{ ...styles.scheduleCard, overflow: "hidden", padding: 0 }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.venueName || item.title}
            style={{ width: "100%", height: isMobile ? 220 : 210, objectFit: "cover", display: "block" }}
          />
        ) : null}

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ background: "#f4f4f5", color: "#111", borderRadius: 999, padding: "8px 12px", fontSize: 13, fontWeight: 600, border: "1px solid #e4e4e7" }}>
              {item.time}
            </div>
            {item.tag === "party_only" ? (
              <PartyPopper size={16} color="#666" />
            ) : item.title.toLowerCase().includes("dinner") ? (
              <Utensils size={16} color="#666" />
            ) : (
              <Heart size={16} color="#666" />
            )}
          </div>

          <div style={{ fontSize: 22, fontWeight: 650 }}>{item.title}</div>
          {item.venueName ? <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{item.venueName}</div> : null}
          <div style={{ ...styles.muted, marginTop: 10 }}>{item.description}</div>

          {item.tag === "party_only" ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Itinerary</div>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", rowGap: 6, columnGap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 600 }}>5:00 PM</div>
                <div style={{ ...styles.muted }}>Start</div>
                {/* <div style={{ fontWeight: 600 }}>6–8 PM</div>
                <div style={{ ...styles.muted }}>Food Truck</div> */}
                <div style={{ fontWeight: 600 }}>10:00 PM</div>
                <div style={{ ...styles.muted }}>Wrap Up</div>
              </div>
            </div>
          ) : null}
          {item.title.toLowerCase().includes("ceremony") ? (
            <div style={{ ...styles.muted, marginTop: 14 }}>
              <strong style={{ color: "#111" }}>Attire:</strong> Cocktail / Garden Party
            </div>
          ) : null}

          {item.title.toLowerCase().includes("reception") || item.title.toLowerCase().includes("party") ? (
            <div style={{ ...styles.muted, marginTop: 14 }}>
              <strong style={{ color: "#111" }}>Attire:</strong> Semi-formal / Golf formal
            </div>
          ) : null}

          {item.address ? (
            <div style={{ ...styles.muted, marginTop: 14 }}>
              <strong style={{ color: "#111" }}>Address:</strong> {item.address}
            </div>
          ) : null}

          {item.title.toLowerCase().includes("ceremony") ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                All guests must sign waiver for the venue.
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 10,
              marginTop: 16,
              width: "100%",
            }}
          >
            {item.title.toLowerCase().includes("ceremony") ? (
              <a
                href="https://forms.gle/H2URxeCJo6CujqmQ7"
                target="_blank"
                rel="noreferrer"
                style={{
                  ...styles.button,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  height: 42,
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                Ceremony Waiver
              </a>
            ) : null}

            {item.mapLink ? (
              <a
                href={item.mapLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...styles.button,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  height: 42,
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                Google Maps
              </a>
            ) : null}

            {item.website ? (
              <a
                href={item.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...styles.ghostButton,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  height: 42,
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                Venue Website
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 900 : false;
  const [code, setCode] = useState("");
  const [guest, setGuest] = useState(null);
  const [lookupState, setLookupState] = useState("idle");
  const [guestCount, setGuestCount] = useState("1");
  const [guestNames, setGuestNames] = useState([""]);
  const [email, setEmail] = useState("");
  const [foodRestrictions, setFoodRestrictions] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [cityStateZip, setCityStateZip] = useState("");
  const [notes, setNotes] = useState("");
  const [attending, setAttending] = useState("yes");
  const [attendingCeremony, setAttendingCeremony] = useState(true);
  const [attendingParty, setAttendingParty] = useState(true);
  const [submitState, setSubmitState] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [hasSubmittedForCode, setHasSubmittedForCode] = useState(false);

  const normalizedInviteType = normalizeInviteType(guest?.inviteType);
  const heroDateLabel = normalizedInviteType === "ceremony_party" ? "Sep 18 & 19, 2026" : "Sep 19, 2026";
  const countdownTargetIso = normalizedInviteType === "ceremony_party"
    ? WEDDING.ceremonyPartyIsoDate
    : WEDDING.saturdayPartyIsoDate;
  const [countdown, setCountdown] = useState(getCountdownParts(countdownTargetIso));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code");
    if (!urlCode) return;

    setCode(urlCode);
    (async () => {
      setLookupState("loading");
      try {
        const result = await lookupGuest(urlCode);
        if (!result?.ok || !result.guest) {
          setLookupState("idle");
          setSubmitMessage(result?.error || "Invalid invite link.");
          return;
        }
        setGuest(result.guest);
        setLookupState("done");
        setHasSubmittedForCode(false);
        setAttendingCeremony(true);
        setAttendingParty(true);
        setGuestNames([""]);
        setSubmitMessage("");
      } catch {
        setLookupState("idle");
        setSubmitMessage("Could not load invite.");
      }
    })();
  }, []);

  useEffect(() => {
    setCountdown(getCountdownParts(countdownTargetIso));
    const id = setInterval(() => {
      setCountdown(getCountdownParts(countdownTargetIso));
    }, 60000);
    return () => clearInterval(id);
  }, [countdownTargetIso]);

  // Dynamic tab title
  useEffect(() => {
    document.title = guest?.partyName
      ? `${guest.partyName} | ${WEDDING.couple}`
      : `${WEDDING.couple} Wedding`;
  }, [guest]);

  const visibleSchedule = useMemo(() => {
    return WEDDING.schedule.filter((item) => {
      if (!guest) return true;
      if (normalizedInviteType === "ceremony_party") return true;
      return item.tag === "party_only";
    });
  }, [guest, normalizedInviteType]);

  const hasCodeFromUrl = new URLSearchParams(window.location.search).has("code");

  async function handleLookup() {
    setLookupState("loading");
    setGuest(null);
    setGuestCount("1");
    setGuestNames([""]);
    setSubmitMessage("");

    try {
      const result = await lookupGuest(code);
      if (!result?.ok || !result.guest) {
        setLookupState("idle");
        setSubmitMessage(result?.error || "Invite code not found.");
        return;
      }
      setGuest(result.guest);
      setLookupState("done");
      setHasSubmittedForCode(false);
      setAttendingCeremony(true);
      setAttendingParty(true);
      setSubmitMessage("");
    } catch {
      setLookupState("idle");
      setSubmitMessage("Could not check invite code.");
    }
  }

  function updateGuestCount(value) {
    setGuestCount(value);
    const count = Number(value);
    setGuestNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push("");
      return next.slice(0, count);
    });
  }

  function updateGuestName(index, value) {
    setGuestNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function getAttendingValue() {
    if (attending !== "yes") return "none";

    if (normalizedInviteType === "ceremony_party") {
      if (attendingCeremony && attendingParty) return "party & ceremony";
      if (attendingCeremony) return "ceremony";
      if (attendingParty) return "party";
      return "none";
    }

    return "party";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!guest) {
      setSubmitMessage("Enter a valid invite code first.");
      return;
    }

    setSubmitState("loading");
    setSubmitMessage("");

    const payload = {
      timestamp: new Date().toISOString(),
      inviteCode: guest.code,
      partyName: guest.partyName,
      inviteType: guest.inviteType,
      invitedEventLabel: normalizedInviteType === "ceremony_party" ? "Ceremony & Party" : "Saturday Party",
      attending: getAttendingValue(),
      guestCount: getAttendingValue() !== "none" ? Number(guestCount) : 0,
      guestNames: getAttendingValue() !== "none"
        ? guestNames.slice(0, Number(guestCount)).map((name) => name.trim()).filter(Boolean)
        : [],
      email: email.trim(),
      streetAddress: streetAddress.trim(),
      cityStateZip: cityStateZip.trim(),
      notes: notes.trim(),
      foodRestrictions: foodRestrictions.trim(),
      allowedEvents:
        normalizedInviteType === "ceremony_party"
          ? [
              ...(attendingCeremony ? ["ceremony"] : []),
              ...(attendingParty ? ["party"] : []),
            ]
          : getAttendingValue() === "party"
            ? ["party"]
            : [],
    };

    try {
      const result = await submitRsvp(payload);
      if (!result?.ok) throw new Error("Submission failed");
      setSubmitState("done");
      setHasSubmittedForCode(true);
      setSubmitMessage(result.updated ? "RSVP updated successfully." : "RSVP received. Thank you.");
    } catch {
      setSubmitState("idle");
      setSubmitMessage("Something went wrong while submitting.");
    }
  }

  return (
    <div style={styles.page}>
      <div
        style={{
          ...styles.bgPhoto,
          backgroundImage: `url(${WEDDING.heroImage})`,
          backgroundPosition: isMobile ? "center top" : styles.bgPhoto.backgroundPosition,
        }}
      />
      <div
        style={{
          ...styles.bgOverlay,
          background: isMobile
            ? "linear-gradient(to bottom, rgba(10,10,10,.18) 0%, rgba(10,10,10,.32) 22%, rgba(10,10,10,.55) 48%, rgba(10,10,10,.82) 68%, #0a0a0a 92%)"
            : "linear-gradient(to bottom, rgba(10,10,10,.14) 0%, rgba(10,10,10,.24) 26%, rgba(10,10,10,.48) 54%, rgba(10,10,10,.78) 76%, #0a0a0a 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <section style={styles.hero}>
          <div style={styles.shell}>
            <div
              style={{
                ...styles.heroGrid,
                gridTemplateColumns: isMobile ? "1fr" : styles.heroGrid.gridTemplateColumns,
                alignItems: isMobile ? "start" : styles.heroGrid.alignItems,
                minHeight: isMobile ? "auto" : styles.heroGrid.minHeight,
                gap: isMobile ? 20 : styles.heroGrid.gap,
              }}
            >
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div style={styles.badge}>September 2026 • Denver</div>
                <h1 style={styles.title}>{WEDDING.couple}</h1>
                <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 10, opacity: 0.85 }}>{WEDDING.venue}</div>
                <p style={styles.sub}>{WEDDING.story}</p>

                

                <div style={styles.pillRow}>
                  {guest ? <div style={styles.pill}><CalendarDays size={16} /> {heroDateLabel}</div> : null}
                  <div style={styles.pill}><MapPin size={16} /> {WEDDING.city}</div>
                </div>

                {guest ? (
                  <div style={styles.countdownGrid}>
                    <div style={styles.countdownBox}>
                      <div style={styles.countdownNum}>{countdown.days}</div>
                      <div style={styles.countdownLabel}>Days</div>
                    </div>
                    <div style={styles.countdownBox}>
                      <div style={styles.countdownNum}>{countdown.hours}</div>
                      <div style={styles.countdownLabel}>Hours</div>
                    </div>
                    <div style={styles.countdownBox}>
                      <div style={styles.countdownNum}>{countdown.minutes}</div>
                      <div style={styles.countdownLabel}>Minutes</div>
                    </div>
                  </div>
                ) : null}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }}>
                <div style={styles.card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 28, fontWeight: 700 }}>
                    <Heart size={22} /> RSVP
                  </div>
                  <div style={{ ...styles.muted, marginTop: 8 }}>
                    Please RSVP by July 19, 2026.  We would love to collect your address even if you cannot attend so that we can so we can stay in touch!
                  </div>

                  {submitState !== "done" ? (
                    <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
                      {!hasCodeFromUrl ? (
                        <>
                          <label style={styles.fieldLabel}>Invite code</label>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" style={styles.input} />
                            <button type="button" onClick={handleLookup} style={styles.button}>
                              {lookupState === "loading" ? "Checking..." : "Unlock"}
                            </button>
                          </div>
                        </>
                      ) : lookupState === "loading" ? (
                        <div style={{ marginTop: 12, fontSize: 14, color: "#666" }}>Loading your invitation...</div>
                      ) : null}

                      {guest ? (
                        <div style={{ marginTop: 16, border: "1px solid #e4e4e7", background: "#f8f8f8", borderRadius: 18, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div>
                              <div style={{ color: "#666", fontSize: 13 }}>Invitation for</div>
                              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>{guest.partyName}</div>
                            </div>
                            <div
                              style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                fontSize: 13,
                                fontWeight: 600,
                                background: normalizedInviteType === "ceremony_party" ? "#7C8F6A" : "#C27D5C",
                                color: "#fff",
                              }}
                            >
                              {normalizedInviteType === "ceremony_party" ? "Ceremony & Party" : "Saturday Party"}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div style={{ display: "grid", gridTemplateColumns: attending === "yes" ? "1fr 1fr" : "1fr", gap: 14, marginTop: 18 }}>
                        <div>
                          <label style={styles.fieldLabel}>Will you attend?</label>
                          <select value={attending} onChange={(e) => setAttending(e.target.value)} style={styles.input}>
                            <option value="yes">Joyfully Accept</option>
                            <option value="no">Regretfully Decline</option>
                          </select>
                        </div>
                        {attending === "yes" ? (
                          <div>
                            <label style={styles.fieldLabel}>Guest count</label>
                            <select value={guestCount} onChange={(e) => updateGuestCount(e.target.value)} style={styles.input}>
                              {Array.from({ length: guest?.maxGuests || 1 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={String(n)}>{n}</option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                      </div>

                      {attending === "yes" && normalizedInviteType === "ceremony_party" ? (
                        <div style={{ marginTop: 14 }}>
                          <label style={styles.fieldLabel}>Which events will you attend?</label>
                          <div style={{ display: "grid", gap: 10 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                              <input
                                type="checkbox"
                                checked={attendingCeremony}
                                onChange={(e) => setAttendingCeremony(e.target.checked)}
                              />
                              Ceremony & Friday dinner
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                              <input
                                type="checkbox"
                                checked={attendingParty}
                                onChange={(e) => setAttendingParty(e.target.checked)}
                              />
                              Saturday party
                            </label>
                          </div>
                        </div>
                      ) : null}

                      {attending === "yes" ? (
                        <div style={{ marginTop: 14 }}>
                          <label style={styles.fieldLabel}>Guest names</label>
                          <div style={{ display: "grid", gap: 10 }}>
                            {Array.from({ length: Number(guestCount) }, (_, i) => i).map((idx) => (
                              <input
                                key={idx}
                                value={guestNames[idx] || ""}
                                onChange={(e) => updateGuestName(idx, e.target.value)}
                                placeholder={`Guest ${idx + 1} name`}
                                style={styles.input}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div style={{ marginTop: 14 }}>
                        <label style={styles.fieldLabel}>Food Restrictions / Allergies</label>
                        <input
                          value={foodRestrictions}
                          onChange={(e) => setFoodRestrictions(e.target.value)}
                          placeholder="Let us know about any allergies or dietary restrictions"
                          style={styles.input}
                        />
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <label style={styles.fieldLabel}>Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" style={styles.input} />
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <label style={styles.fieldLabel}>Collecting addresses for future Christmas cards 🎄</label>
                        <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="Street address" style={styles.input} />
                      </div>

                      <div style={{ marginTop: 6 }}>
                        <input value={cityStateZip} onChange={(e) => setCityStateZip(e.target.value)} placeholder="City, State ZIP" style={styles.input} />
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <label style={styles.fieldLabel}>Message to the couple</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Leave us a note" style={styles.textarea} />
                      </div>

                      <button
                        type="submit"
                        disabled={submitState === "loading" || hasSubmittedForCode}
                        style={{
                          ...styles.button,
                          width: "100%",
                          marginTop: 18,
                          opacity: submitState === "loading" || hasSubmittedForCode ? 0.7 : 1,
                          cursor: submitState === "loading" || hasSubmittedForCode ? "not-allowed" : "pointer",
                        }}
                      >
                        {submitState === "loading" ? "Submitting..." : hasSubmittedForCode ? "RSVP Submitted" : "Submit RSVP"}
                      </button>

                      {submitMessage ? <div style={{ ...styles.muted, marginTop: 12 }}>{submitMessage}</div> : null}
                    </form>
                  ) : (
                    <div style={{ textAlign: "center", padding: "32px 0 14px" }}>
                      <div
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 999,
                          background: "#dcfce7",
                          margin: "0 auto",
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <CheckCircle2 size={28} color="#15803d" />
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>
                        {attending === "yes" ? "You’re all set, be sure to review the information below!" : "Thank you for letting us know"}
                      </div>
                      <div style={{ ...styles.muted, marginTop: 8 }}>
                        {attending === "yes"
                          ? `We can’t wait to celebrate with ${guest?.partyName || "you"}.`
                          : `We appreciate the response from ${guest?.partyName || "your party"}.`}
                      </div>
                      <div style={{ ...styles.muted, marginTop: 8 }}>{submitMessage}</div>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitState("idle");
                          setSubmitMessage("");
                          setHasSubmittedForCode(false);
                        }}
                        style={{ ...styles.ghostButton, marginTop: 18 }}
                      >
                        Edit response
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {guest ? (
          <>
            <section id="when-section" style={styles.section}>
              <div
                style={{
                  ...styles.darkCardGrid,
                  gridTemplateColumns: isMobile ? "1fr" : styles.darkCardGrid.gridTemplateColumns,
                }}
              >
                <div style={styles.darkCard}>
                  <CalendarDays size={22} color="rgba(255,255,255,.7)" />
                  <div style={{ fontSize: 22, fontWeight: 650, marginTop: 14 }}>When</div>
                  <div style={{ ...styles.muted, color: "rgba(255,255,255,.72)", marginTop: 8 }}>{heroDateLabel}</div>
                </div>
                <div style={styles.darkCard}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <MapPin size={22} color="rgba(255,255,255,.7)" />
                    <Mountain size={22} color="rgba(255,255,255,.7)" />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 650, marginTop: 14 }}>Where</div>
                  <div style={{ ...styles.muted, color: "rgba(255,255,255,.72)", marginTop: 8 }}>{WEDDING.city}</div>
                </div>
                <div style={styles.darkCard}>
                  <HouseHeart size={22} color="rgba(255,255,255,.7)" />
                  <div style={{ fontSize: 22, fontWeight: 650, marginTop: 14 }}>House Fund</div>
                  <div style={{ ...styles.muted, color: "rgba(255,255,255,.72)", marginTop: 8 }}>
                    We do not have a gift registry, your presence is more than enough. For those who have asked, we are putting together a home fund for projects at our new house.
                  </div>
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    <a
                      href={HOME_FUND.venmoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...styles.ghostButton,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      Contribute via Venmo
                    </a>
                    {/*
                    <a
                      href={HOME_FUND.cashAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...styles.ghostButton,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      Contribute via Cash App
                    </a>
                    */}
                  </div>
                </div>
              </div>
            </section>

            <section style={{ ...styles.section, paddingTop: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "center" : "end",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 16,
                  marginBottom: 22,
                }}
              >
                <div style={{ textAlign: "center", width: "100%" }}>
                  <div style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>
                    Schedule
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, marginTop: 10 }}>Your event flow</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.9)", marginTop: 6 }}>
                    We will be having a small wedding ceremony with family on Friday, so Saturday will be all party!
                  </div>
                </div>
              </div>

              <div
                style={{
                  ...styles.scheduleGrid,
                  gridTemplateColumns: isMobile ? "1fr" : styles.scheduleGrid.gridTemplateColumns,
                }}
              >
                {visibleSchedule.map((item) => (
                  <EventCard key={item.title} item={item} isMobile={isMobile} />
                ))}
              </div>
            </section>

            {normalizedInviteType === "ceremony_party" ? (
              <section style={{ ...styles.section, paddingTop: 0 }}>
                <div style={{ textAlign: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>
                    Explore the Weekend
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 700, marginTop: 10 }}>
                    Locations & Nearby Stays
                  </div>
                  <div style={{ ...styles.muted, color: "rgba(255,255,255,.7)", marginTop: 8 }}>
                    View all venues and explore nearby hotels and Airbnbs.
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  <a
                    href="https://www.google.com/maps/d/edit?mid=1EoH4WyUduNTa7kF_FzoKqtpGrgMZM2E&usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...styles.ghostButton,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "auto",
                      padding: "12px 18px",
                      textDecoration: "none",
                      lineHeight: 1.3,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Open Full Event Map</span>
                    <span style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                      once open click "Legend" if on mobile to view all details
                    </span>
                  </a>
                </div>

                <div style={{ borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
                  <iframe
                    src="https://www.google.com/maps/d/embed?mid=1EoH4WyUduNTa7kF_FzoKqtpGrgMZM2E&ehbc=2E312F"
                    width="100%"
                    height="480"
                    style={{ border: 0 }}
                    loading="lazy"
                  ></iframe>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
