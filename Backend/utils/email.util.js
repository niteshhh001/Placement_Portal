const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const data = await resend.emails.send({
      from: "Placement Cell <onboarding@resend.dev>",
      to,
      subject,
      html,
      text,
    });
    console.log("📧 Email sent:", data.id);
    return data;
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
};

module.exports = { sendEmail };