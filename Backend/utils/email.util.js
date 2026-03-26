const nodemailer = require("nodemailer");

// Check env vars at startup
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.error("❌ SMTP_USER or SMTP_PASS is missing!");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,        
  secure: true,     
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});;

// Verify SMTP connection at startup
transporter.verify((error) => {
  if (error) console.error("❌ SMTP connection failed:", error);
  else console.log("✅ SMTP ready to send emails");
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Placement Cell" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ Email send failed:", err);
  }
};

module.exports = { sendEmail };
