// backend/controllers/emailController.js
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";
import Rfp from "../models/rfp.js";
import Vendor from "../models/vendor.js";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildRfpHtml(rfp) {
  const itemsHtml = (rfp.lineItems || [])
    .map(
      (li) =>
        `<tr><td style="padding:6px;border:1px solid #ddd">${
          li.name
        }</td><td style="padding:6px;border:1px solid #ddd">${
          li.qty
        }</td><td style="padding:6px;border:1px solid #ddd">${
          li.specs || ""
        }</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111">
      <h2>RFP: ${rfp.title}</h2>
      <p>${rfp.description || ""}</p>
      <p><strong>Budget:</strong> ${rfp.budget ?? "N/A"} ${
    rfp.currency ?? ""
  }</p>
      <p><strong>Delivery (days):</strong> ${rfp.deliveryDays ?? "N/A"}</p>
      <p><strong>Payment terms:</strong> ${rfp.paymentTerms ?? "N/A"}</p>
      <p><strong>Warranty:</strong> ${rfp.warranty ?? "N/A"}</p>

      <h4>Line Items</h4>
      <table style="border-collapse:collapse">
        <thead>
          <tr>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Item</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Qty</th>
            <th style="padding:6px;border:1px solid #ddd;text-align:left">Specs</th>
          </tr>
        </thead>
        <tbody>
          ${
            itemsHtml ||
            "<tr><td colspan='3' style='padding:6px;border:1px solid #ddd'>None</td></tr>"
          }
        </tbody>
      </table>

      <p style="margin-top:16px">Please reply with your proposal or attach your quote.</p>
    </div>
  `;
}

export const sendRfpToVendors = async (req, res) => {
  try {
    const { id: rfpId } = req.params;
    const {
      vendorIds = [],
      subject: customSubject,
      message: customMessage,
    } = req.body;

    const rfp = await Rfp.findById(rfpId);
    if (!rfp) return res.status(404).json({ error: "RFP not found" });

    // decide recipient list
    let vendors = [];
    if (Array.isArray(vendorIds) && vendorIds.length > 0) {
      vendors = await Vendor.find({ _id: { $in: vendorIds } });
    } else if (Array.isArray(rfp.sentTo) && rfp.sentTo.length > 0) {
      vendors = await Vendor.find({ _id: { $in: rfp.sentTo } });
    } else {
      return res.status(400).json({
        error: "No vendors specified (vendorIds or rfp.sentTo must exist)",
      });
    }

    if (!vendors || vendors.length === 0) {
      return res
        .status(400)
        .json({ error: "No vendor records found for given IDs" });
    }

    const transporter = createTransporter();

    const emailsSent = [];
    const errors = [];

    const attachmentsForEmail = [];

    if (Array.isArray(rfp.attachments) && rfp.attachments.length > 0) {
      for (const a of rfp.attachments) {
        const filename = a.split("/").pop();
        const localPath = path.resolve("backend/uploads", filename);
        try {
          await fs.access(localPath);
          attachmentsForEmail.push({ filename, path: localPath });
        } catch (e) {}
      }
    }

    for (const v of vendors) {
      if (!v.email) {
        errors.push({ vendorId: v._id, error: "Vendor missing email" });
        continue;
      }

      const subject = customSubject || `RFP: ${rfp.title}`;
      const htmlBody = `
        ${customMessage ? `<p>${customMessage}</p>` : ""}
        ${buildRfpHtml(rfp)}
        <p>Vendor Contact: ${v.contactPerson || v.name || ""} - ${
        v.phone || ""
      }</p>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: v.email,
        subject: `${subject} (RFP ID: ${rfpId})`,
        html: htmlBody,
        attachments: attachmentsForEmail,
        headers: {
          "X-Mailgun-Variables": JSON.stringify({ rfpId: String(rfpId) }),
          "X-RFP-ID": String(rfpId),
        },
      };

      try {
        await transporter.sendMail(mailOptions);

        await Rfp.findByIdAndUpdate(rfpId, {
          $addToSet: { sentTo: v._id },
          $set: { status: "sent" },
        });

        emailsSent.push({ vendorId: v._id, email: v.email });
      } catch (err) {
        console.error("sendMail error for vendor", v._id, err);
        errors.push({ vendorId: v._id, error: err.message || String(err) });
      }
    }

    return res.json({ message: "Send completed", sent: emailsSent, errors });
  } catch (err) {
    console.error("sendRfpToVendors error:", err);
    return res
      .status(500)
      .json({ error: "Internal Server error", message: err.message });
  }
};
