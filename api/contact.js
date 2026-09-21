const OWNER_EMAIL = process.env.FORM_TO_EMAIL || "healingritualsaspen@gmail.com";
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

  const subject = formType === "event_rsvp"
    ? "New RSVP · Echoes of the Soul"
    : "New Private Healing Inquiry · Aspen";

  const excluded = new Set(["form_type", "redirect", "website", "_honey"]);
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
            ? "We received your Echoes of the Soul reservation request"
            : "We received your Healing Rituals inquiry",
          html: formType === "event_rsvp"
            ? `<div style="font-family:Arial,sans-serif;color:#2d2025;max-width:620px"><h1 style="font-family:Georgia,serif;color:#6e1733">Your request has been received</h1><p>Hi ${escapeHtml(name)},</p><p>Thank you for requesting a place at <strong>Echoes of the Soul</strong>. The Healing Rituals team will reply personally to confirm your reservation.</p><p>With care,<br>Healing Rituals · Aspen</p></div>`
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
      redirect: data.redirect || (formType === "event_rsvp" ? "/thank-you.html" : "/clarity-call-thank-you.html")
    });
  } catch (error) {
    console.error("Owner notification failed:", error.message);
    return res.status(502).json({
      ok: false,
      message: "We could not send your request. Please call or text 970-989-3333, or email healingritualsaspen@gmail.com."
    });
  }
};