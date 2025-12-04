// backend/controllers/emailController.js
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs/promises";
import Rfp from "../models/rfp.js";
import Vendor from "../models/vendor.js";

/**
 * Helper: create transporter from env
 */
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

/**
 * Build a simple HTML email for the RFP
 */
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

/**
 * POST /api/rfps/:id/send
 * Body options:
 *  - vendorIds: optional array of vendor IDs to send to. If omitted, will use rfp.sentTo (or require vendorIds).
 *  - subject: optional email subject override
 *  - message: optional extra message text to include at top of email.
 */
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

    // optionally attach an RFP file if you store one under rfp.attachments (strings/URLs)
    // We'll support local uploads stored under backend/uploads (absolute URL or relative)
    const attachmentsForEmail = [];
    // If RFP has attachments (if you store them), attach them.
    if (Array.isArray(rfp.attachments) && rfp.attachments.length > 0) {
      for (const a of rfp.attachments) {
        // a might be an absolute URL like http://host/uploads/x.pdf or a relative "/uploads/x.pdf"
        // try to get filename and local path
        const filename = a.split("/").pop();
        const localPath = path.resolve("backend/uploads", filename);
        try {
          // check file exists
          await fs.access(localPath);
          attachmentsForEmail.push({ filename, path: localPath });
        } catch (e) {
          // ignore missing files — they can still be links in the email body
        }
      }
    }

    // send emails one-by-one (could be parallelized)
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
        subject,
        html: htmlBody,
        attachments: attachmentsForEmail, // if empty, nodemailer ignores
      };

      try {
        await transporter.sendMail(mailOptions);

        // record that vendor was sent (use $addToSet to avoid duplicates)
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
