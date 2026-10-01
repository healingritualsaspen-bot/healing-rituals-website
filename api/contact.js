const OWNER_EMAIL = process.env.FORM_TO_EMAIL || "healingritualsaspen@gmail.com";
const EVENT_ID = "melt-into-the-divine-2026-10-26";
const EVENT_CONFIRMATION_URL = "/event-rsvp-thank-you.html";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Healing Rituals Website <onboarding@resend.dev>";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeBody(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  try { return JSON.parse(body); } catch {}
  return Object.fromEntries(new URLSearchParams(body));
}

async function sendEmail(payload) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Email delivery failed");
  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({
      ok: false,
      message: "Email delivery is being configured. Please call, text, or email Healing Rituals directly."
    });
  }

  const data = normalizeBody(req.body);
  if (data.website || data._honey) {
    return res.status(200).json({ ok: true, redirect: data.redirect || "/thank-you.html" });
  }

  const formType = data.form_type === "event_rsvp" ? "event_rsvp" : "private_inquiry";
  const name = String(data.Name || "").trim();
  const email = String(data.email || "").trim();
  const phone = String(data.Phone || "").trim();

  if (!name || (formType === "event_rsvp" && !email) || (formType === "private_inquiry" && !phone)) {
    return res.status(400).json({ ok: false, message: "Please complete the required fields." });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailPattern.test(email)) {
    return res.status(400).json({ ok: false, message: "Please enter a valid email address." });
  }

  if (formType === "event_rsvp") {
    if (data.event_id !== EVENT_ID) {
      return res.status(400).json({ ok: false, message: "This event has changed. Please refresh the events page to RSVP for Melt Into the Divine on October 26." });
    }
    const attending = String(data["Number attending"] || "1");
    if (!["1", "2", "3", "4"].includes(attending)) {
      return res.status(400).json({ ok: false, message: "Please select the number attending." });
    }
    data["Number attending"] = attending;
    data.Event = "Melt Into the Divine — Mindfulness Monday";
    data["Event date"] = "Monday, October 26, 2026 at 6:30 PM Mountain Time";
    data.Location = "The Grove, 315 E Hyman Ave, Aspen, CO";
    data.Price = "$35 per person";
  }

  const subject = formType === "event_rsvp"
    ? "Confirmed RSVP · Melt Into the Divine · October 26"
    : "New Private Healing Inquiry · Aspen";

  const excluded = new Set(["form_type", "event_id", "redirect", "website", "_honey"]);
  const rows = Object.entries(data)
    .filter(([key, value]) => !excluded.has(key) && String(value || "").trim())
    .map(([key, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;vertical-align:top">${escapeHtml(key.replaceAll("_", " "))}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`)
    .join("");

  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL],
      reply_to: email || undefined,
      subject,
      html: `<div style="font-family:Arial,sans-serif;color:#2d2025;max-width:680px"><h1 style="font-family:Georgia,serif;color:#6e1733">${escapeHtml(subject)}</h1><table style="border-collapse:collapse;width:100%">${rows}</table><p style="margin-top:24px;color:#666">Submitted from healingritualsaspen.com</p></div>`
    });

    let confirmationSent = false;
    if (email) {
      try {
        await sendEmail({
          from: FROM_EMAIL,
          to: [email],
          reply_to: OWNER_EMAIL,
          subject: formType === "event_rsvp"
            ? "Your RSVP is confirmed · Melt Into the Divine · October 26"
            : "We received your Healing Rituals inquiry",
          html: formType === "event_rsvp"
            ? `<div style="font-family:Arial,sans-serif;color:#2d2025;max-width:620px"><h1 style="font-family:Georgia,serif;color:#6e1733">Your RSVP is confirmed</h1><p>Hi ${escapeHtml(name)},</p><p>You’re registered for <strong>Melt Into the Divine</strong>, a Sound &amp; Quantum Subconscious Journey with Lauren for Mindfulness Monday.</p><p><strong>Monday, October 26, 2026 · 6:30 PM Mountain Time</strong><br>The Grove · 315 E Hyman Ave, Aspen, CO<br>$35 per person<br>Number attending: ${escapeHtml(data["Number attending"])}</p><p>${data["Journey supports"] ? "Your request for a yoga mat, blanket and eye mask is included in your RSVP." : "Please bring a yoga mat, blanket and eye mask."}</p><p>Your reservation is complete. No additional confirmation is needed.</p><p>Come get comfortable, relax, replenish, and merge with the divine.</p><p><a href="https://www.healingritualsaspen.com/events.html#melt-into-the-divine">View event details</a> · <a href="https://www.healingritualsaspen.com/melt-into-the-divine.ics">Add to calendar</a></p><p>With care,<br>Healing Rituals · Aspen</p></div>`
            : `<div style="font-family:Arial,sans-serif;color:#2d2025;max-width:620px"><h1 style="font-family:Georgia,serif;color:#6e1733">Your private inquiry has been received</h1><p>Hi ${escapeHtml(name)},</p><p>Thank you for reaching out. Lauren or a member of the Healing Rituals intake team will respond personally.</p><p>With care,<br>Healing Rituals · Aspen</p></div>`
        });
        confirmationSent = true;
      } catch (confirmationError) {
        console.error("Confirmation email failed:", confirmationError.message);
      }
    }

    return res.status(200).json({
      ok: true,
      confirmationSent,
      redirect: formType === "event_rsvp" ? EVENT_CONFIRMATION_URL : (data.redirect || "/clarity-call-thank-you.html")
    });
  } catch (error) {
    console.error("Owner notification failed:", error.message);
    return res.status(502).json({
      ok: false,
      message: "We could not send your request. Please call or text 970-989-3333, or email healingritualsaspen@gmail.com."
    });
  }
};
