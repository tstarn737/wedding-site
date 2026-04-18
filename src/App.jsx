import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Heart, MapPin, Users, PartyPopper, CheckCircle2, HouseHeart, MountainIcon, Mountain, MountainSnowIcon, MountainSnow, MapMinusIcon, MapIcon, MapPinCheck, Map, MapPinHouseIcon } from "lucide-react";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyMpJy6E2kALozdEwoqKW5wywWHz3oPkKqFPLGsLtSMc_hnT2RgIcaOtO_ei5OypEZs/exec";

const WEDDING = {
  couple: "Tyler & Ashlyn",
  dateLabel: "September 19, 2026",
  isoDate: "2026-09-19T16:00:00",
  city: "Denver, Colorado",
  venue: "Venue details below",
  heroImage:
    "/hero.jpg",
  story:
    "We’re so excited to celebrate with the people we love most. Thank you for being a part of our lives — we can’t wait to celebrate together.",
  schedule: [
    {
      title: "Wedding Ceremony",
      time: "3:40 PM",
      description: "Ceremony begins at 4:00 PM, followed by time for photos with family and friends.",
      tag: "full_day",
      venueName: "Yetman Family Farms",
      address: "2995 S. Estes Street, Lakewood, CO 80227",
      website: "https://www.yetmanfarms.com/weddings",
      mapLink: "https://www.google.com/maps/search/?api=1&query=2995+S+Estes+Street+Lakewood+CO+80227",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSssKEJXF8cNQcKxph78pk8urS4fdzSixVFkA&s",
    },
    {
      title: "Wedding Night Dinner",
      time: "5:00 PM",
      description: "Guests from the ceremony are invited to join us for dinener and drinks at our new home, just about a mile away.",
      tag: "full_day",
      venueName: "Our Home",
      address: "8239 W Baker Ave, Lakewood, CO 80227",
      mapLink: "https://www.google.com/maps/search/?api=1&query=8239+W+Baker+Ave+Lakewood+CO+80227",
      image: "https://photos.zillowstatic.com/fp/deebd764d4ed0a7cec01e5c94c4f7231-o_a.webp",
    },
    {
      title: "Reception / Party",
      time: "6:00 PM",
      description: "Drinks, golf, music, and a very good time.",
      tag: "party_only",
      venueName: "Stick & Feather",
      address: "3851 Steele St - Unit 1378, Denver, CO 80205",
      website: "https://www.stickandfeather.com/",
      mapLink: "https://goo.gl/maps/9h2jJ4j5mM1N5mM48",
      image: "https://images.squarespace-cdn.com/content/v1/603bee699959d83fcdc0eaf3/43abd80d-0db9-4e4d-9eab-74b5960362fe/kateivyphotography-147.jpg",
    },
  ],
};

/*
RSVP SHEET HEADERS
------------------
Use these exact headers in your RSVPs tab:

timestamp | inviteCode | partyName | inviteType | invitedEventLabel | attending | guestCount |
email | streetAddress | cityStateZip | notes | allowedEvents

Apps Script doPost rowValues should match exactly:
[
  data.timestamp || "",
  normalizedCode,
  data.partyName || "",
  data.inviteType || "",
  data.invitedEventLabel || "",
  data.attending || "",
  data.guestCount || 0,
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

async function lookupGuest(code) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Enter an invite code." };

  const url = `${APPS_SCRIPT_URL}?code=${encodeURIComponent(normalized)}`;
  const response = await fetch(url);
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: "Lookup failed." };
  }
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

async function submitRsvp(payload) {
  if (!APPS_SCRIPT_URL) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { ok: true, demo: true };
  }

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
  },
  hero: {
    minHeight: "78vh",
    backgroundImage: `linear-gradient(to bottom, rgba(10,10,10,.2), rgba(10,10,10,.9)), url(${WEDDING.heroImage})`,
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center top",
    backgroundColor: "#0a0a0a",
    borderBottom: "1px solid rgba(255,255,255,.1)",
    position: "relative",
    overflow: "hidden",
  },
  shell: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "28px 24px",
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
    background: "rgba(255,255,255,.1)",
    border: "1px solid rgba(255,255,255,.14)",
    fontSize: 12,
    letterSpacing: ".18em",
    textTransform: "uppercase",
  },
  title: {
    fontSize: "clamp(44px, 8vw, 82px)",
    lineHeight: 1,
    margin: "18px 0 10px",
    fontWeight: 650,
    letterSpacing: "-0.02em",
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
    background: "rgba(255,255,255,.05)",
  },
  scheduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
    marginTop: 22,
  },
  scheduleCard: {
    background: "#fff",
    color: "#111",
    borderRadius: 26,
    padding: 24,
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
            style={{ width: "100%", height: 210, objectFit: "cover", display: "block" }}
          />
        ) : null}

        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ background: "#f5f5f5", borderRadius: 999, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>
              {item.time}
            </div>
            {item.tag === "full_day" ? <Users size={16} color="#666" /> : <PartyPopper size={16} color="#666" />}
          </div>

          <div style={{ fontSize: 22, fontWeight: 650 }}>{item.title}</div>
          {item.venueName ? <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>{item.venueName}</div> : null}
          <div style={{ ...styles.muted, marginTop: 10 }}>{item.description}</div>

          {item.address ? (
            <div style={{ ...styles.muted, marginTop: 14 }}>
              <strong style={{ color: "#111" }}>Address:</strong> {item.address}
            </div>
          ) : null}

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 10,
            marginTop: 16,
            width: "100%",
          }}>
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
  const [countdown, setCountdown] = useState(getCountdownParts(WEDDING.isoDate));
  const [code, setCode] = useState("");
  const [guest, setGuest] = useState(null);
  const [lookupState, setLookupState] = useState("idle");
  const [guestCount, setGuestCount] = useState("1");
  const [email, setEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [cityStateZip, setCityStateZip] = useState("");
  const [notes, setNotes] = useState("");
  const [attending, setAttending] = useState("yes");
  const [submitState, setSubmitState] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [hasSubmittedForCode, setHasSubmittedForCode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code");

    if (!urlCode) return;

    setCode(urlCode);

    (async () => {
      setLookupState("loading");
      setGuest(null);
      setGuestCount("1");
      setSubmitMessage("");

      try {
        const result = await lookupGuest(urlCode);
        if (!result?.ok || !result.guest) {
          setLookupState("idle");
          setSubmitMessage(result?.error || "Invalid invite link.");
          return;
        }

        setGuest(result.guest);
        setLookupState("done");
        setSubmitState("idle");
        setHasSubmittedForCode(false);
        setSubmitMessage("");
      } catch {
        setLookupState("idle");
        setSubmitMessage("Could not load invite.");
      }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(getCountdownParts(WEDDING.isoDate));
    }, 60000);
    return () => clearInterval(id);
  }, []);

  async function handleLookup() {
    setLookupState("loading");
    setGuest(null);
    setGuestCount("1");
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
      setSubmitState("idle");
      setHasSubmittedForCode(false);
      setSubmitMessage("");
    } catch {
      setLookupState("idle");
      setSubmitMessage("Could not check invite code.");
    }
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
      attending,
      guestCount: attending === "yes" ? Number(guestCount) : 0,
      email: email.trim(),
      streetAddress: streetAddress.trim(),
      cityStateZip: cityStateZip.trim(),
      notes: notes.trim(),
      allowedEvents: normalizedInviteType === "ceremony_party" ? ["ceremony", "party"] : ["party"],
    };

    try {
      const result = await submitRsvp(payload);
      if (!result?.ok) throw new Error("Submission failed");
      setSubmitState("done");
      setHasSubmittedForCode(true);
      setSubmitMessage(
        result.demo
          ? "Demo RSVP submitted. Add your Apps Script URL next."
          : result.updated
            ? "RSVP updated successfully."
            : "RSVP received. Thank you."
      );
    } catch {
      setSubmitState("idle");
      setSubmitMessage("Something went wrong while submitting.");
    }
  }

  const normalizedInviteType = normalizeInviteType(guest?.inviteType);

  const visibleSchedule = WEDDING.schedule.filter((item) => {
    if (!guest) return true;
    if (normalizedInviteType === "ceremony_party") return true;
    return item.tag === "party_only";
  });

  const hasCodeFromUrl = new URLSearchParams(window.location.search).has("code");

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.shell}>
          <div style={{
            ...styles.heroGrid,
            gridTemplateColumns: isMobile ? "1fr" : styles.heroGrid.gridTemplateColumns,
            alignItems: isMobile ? "start" : styles.heroGrid.alignItems,
            minHeight: isMobile ? "auto" : styles.heroGrid.minHeight,
            gap: isMobile ? 20 : styles.heroGrid.gap,
          }}>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={styles.badge}>September 2026 • Denver</div>
              <h1 style={styles.title}>{WEDDING.couple}</h1>
              <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 10, opacity: 0.85 }}>
                {WEDDING.venue}
              </div>
              <p style={styles.sub}>{WEDDING.story}</p>

              <div style={{ marginTop: 22 }}>
                <button style={{
                  padding: "12px 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.12)",
                  border: "1px solid rgba(255,255,255,.2)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600
                }} onClick={() => window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })}>
                  View Details ↓
                </button>
              </div>

              <div style={styles.pillRow}>
                <div style={styles.pill}><CalendarDays size={16} /> {WEDDING.dateLabel}</div>
                <div style={styles.pill}><MapPin size={16} /> {WEDDING.city}</div>
              </div>

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
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }} style={{ maxWidth: isMobile ? "100%" : undefined }}>
              <div style={styles.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 28, fontWeight: 700 }}>
                  <Heart size={22} /> RSVP
                </div>
                <div style={{ ...styles.muted, marginTop: 8 }}>
                  Please reply with your attendance and current mailing address so we can stay in touch.
                </div>

                {submitState !== "done" ? (
                  <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
                    {!hasCodeFromUrl ? (
                      <>
                        <label style={styles.fieldLabel}>Invite code</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" style={styles.input} />
                          <button type="button" onClick={handleLookup} style={styles.button}>{lookupState === "loading" ? "Checking..." : "Unlock"}</button>
                        </div>
                      </>
                    ) : lookupState === "loading" ? (
                      <div style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
                        Loading your invitation...
                      </div>
                    ) : null}

                    {guest ? (
                      <div style={{ marginTop: 16, border: "1px solid #e4e4e7", background: "#f8f8f8", borderRadius: 18, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <div>
                            <div style={{ color: "#666", fontSize: 13 }}>Invitation for</div>
                            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 2 }}>{guest.partyName}</div>
                          </div>
                          <div style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            fontSize: 13,
                            fontWeight: 600,
                            background: normalizedInviteType === "ceremony_party" ? "#7C8F6A" : "#C27D5C",
                            color: "#fff",
                          }}>
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
                          <select value={guestCount} onChange={(e) => setGuestCount(e.target.value)} style={styles.input}>
                            {Array.from({ length: guest?.maxGuests || 1 }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={String(n)}>{n}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}
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

                    <button type="submit" disabled={submitState === "loading" || hasSubmittedForCode} style={{ ...styles.button, width: "100%", marginTop: 18, opacity: submitState === "loading" || hasSubmittedForCode ? 0.7 : 1, cursor: submitState === "loading" || hasSubmittedForCode ? "not-allowed" : "pointer" }}>
                      {submitState === "loading" ? "Submitting..." : hasSubmittedForCode ? "RSVP Submitted" : "Submit RSVP"}
                    </button>

                    {submitMessage ? <div style={{ ...styles.muted, marginTop: 12 }}>{submitMessage}</div> : null}
                  </form>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 0 14px" }}>
                    <div style={{
                      width: 58,
                      height: 58,
                      borderRadius: 999,
                      background: "#dcfce7",
                      margin: "0 auto",
                      display: "grid",
                      placeItems: "center",
                    }}>
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
                    <button type="button" onClick={() => { setSubmitState("idle"); setSubmitMessage(""); setHasSubmittedForCode(false); }} style={{ ...styles.ghostButton, marginTop: 18 }}>
                      Edit response
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
              <>
        {isMobile ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: "clamp(300px, 76vw, 430px)",
              height: 180,
              pointerEvents: "none",
              background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,.32) 28%, rgba(10,10,10,.72) 68%, #0a0a0a 100%)",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: isMobile ? 110 : 180,
            pointerEvents: "none",
            background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, rgba(10,10,10,.22) 32%, rgba(10,10,10,.6) 72%, #0a0a0a 100%)",
          }}
        />
      </>
      </section>

      {guest ? (
      <>
        <section style={styles.section}>
          <div style={{
            ...styles.darkCardGrid,
            gridTemplateColumns: isMobile ? "1fr" : styles.darkCardGrid.gridTemplateColumns,
          }}>
            <div style={styles.darkCard}>
              <CalendarDays size={22} color="rgba(255,255,255,.7)" />
              <div style={{ fontSize: 22, fontWeight: 650, marginTop: 14 }}>When</div>
              <div style={{ ...styles.muted, color: "rgba(255,255,255,.72)", marginTop: 8 }}>{WEDDING.dateLabel}</div>
            </div>
            <div style={styles.darkCard}>
              <MapPin size={22} color="rgba(255,255,255,.7)" />  <Mountain size={22} color="rgba(255,255,255,.7)" />
              <div style={{ fontSize: 22, fontWeight: 650, marginTop: 14 }}>Where</div>
              <div style={{ ...styles.muted, color: "rgba(255,255,255,.72)", marginTop: 8 }}>{WEDDING.city}</div>
              <div style={{ ...styles.muted, color: "rgba(255,255,255,.72)", marginTop: 0 }}>{WEDDING.venue}</div>
              
            </div>
            <div style={styles.darkCard}>
              <HouseHeart size={30} color="rgba(255,255,255,.7)" />
              <div style={{ fontSize: 22, fontWeight: 650, marginTop: 6 }}>House Fund</div>
              <div style={{ ...styles.muted, color: "rgba(255,255,255,.72)", marginTop: 8 }}>
                We are not in need of any gifts, but for those who wish to give something, we do have new house with lots of projects and donations would be greatly appreciated
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...styles.section, paddingTop: 0 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "center" : "end",
            flexDirection: isMobile ? "column" : "row",
            gap: 16,
            marginBottom: 22,
          }}>
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Schedule</div>
              <div style={{ fontSize: 36, fontWeight: 700, marginTop: 10 }}>Your event flow</div>
            </div>
            
          </div>

          <div style={{
            ...styles.scheduleGrid,
            gridTemplateColumns: isMobile ? "1fr" : styles.scheduleGrid.gridTemplateColumns,
          }}>
            {visibleSchedule.map((item) => (
              <EventCard key={item.title} item={item} isMobile={isMobile} />
            ))}
          </div>
        </section>
      </>
    ) : null}
    </div>
  );
}
