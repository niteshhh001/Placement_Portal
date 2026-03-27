const { BrevoClient } = require("@getbrevo/brevo");

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const data = await client.transactionalEmails.sendTransacEmail({
      sender: { name: "Placement Cell", email: process.env.SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    });
    console.log("📧 Email sent:", data.messageId);
    return data;
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
};

module.exports = { sendEmail };
