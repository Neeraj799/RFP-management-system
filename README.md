# RFP Management System

A full-stack application for managing Request for Proposals (RFPs), vendor proposals, and AI-powered RFP analysis with email integration.

## Overview

This system enables organizations to:
- Create and manage RFPs with structured details (budget, deliverables, timelines)
- Receive and organize vendor proposals
- Compare vendors using AI-powered analysis
- Extract structured data from RFP documents (PDF, DOCX)
- Send RFPs to vendors via email
- Track proposal submissions and communications

## Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.1
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **File Processing**: Multer, Mammoth (DOCX), PDF-Parse, PDF2JSON
- **Email**: Nodemailer, Mailgun API
- **AI**: Google Gemini 2.0 Flash API (Generative Language)
- **Validation**: Joi
- **Password Hashing**: bcryptjs

### Frontend
- **Framework**: React 19 with Vite
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 4
- **HTTP Client**: Axios
- **Notifications**: React Toastify
- **Linting**: ESLint

## Project Structure

```
backend/
├── config/              # Configuration files
│   ├── db.js           # MongoDB connection
│   └── envConfig.js    # Environment variables
├── controllers/         # Request handlers
│   ├── ai.controller.js
│   ├── email.controller.js
│   ├── proposal.controller.js
│   ├── rfp.controller.js
│   └── vendor.controller.js
├── models/             # Mongoose schemas
│   ├── proposal.js
│   ├── rfp.js
│   └── vendor.js
├── routes/             # API endpoints
├── middleware/         # Custom middleware (Multer config)
├── utils/              # Utility functions
├── validation/         # Request validation schemas
├── uploads/            # File storage directory
└── server.js          # Express app entry point

frontend/
├── src/
│   ├── components/     # Reusable React components
│   │   ├── CompareVendorsModal.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProposalModal.jsx
│   │   ├── SendRfpModal.jsx
│   │   └── VendorModal.jsx
│   ├── pages/         # Page components
│   │   ├── Home.jsx
│   │   ├── CreateRfp.jsx
│   │   ├── RfpDetails.jsx
│   │   └── Vendors.jsx
│   ├── services/      # API client
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── vite.config.js
└── index.html
```

## Setup & Installation

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud — MongoDB Atlas)
- Google Cloud Account (for Gemini API)
- Mailgun Account (for email sending)
- SMTP credentials for outbound email

### Backend Setup

1. **Clone and navigate to backend**:
   ```powershell
   cd backend
   npm install
   ```

2. **Configure environment variables** (`backend/.env`):
   ```env
   PORT=4800
   MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
   SECRET_KEY=your-secret-key-here
   CLIENT_BASE_URL=http://localhost:5173

   # Google Gemini API
   GEMINI_API_KEY=your-gemini-api-key

   # SMTP (Outbound)
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=your-mailgun-smtp-user
   SMTP_PASS=your-mailgun-smtp-password
   EMAIL_FROM=noreply@yourdomain.com

   # Mailgun (Inbound/API)
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=your-mailgun-domain
   MAILGUN_BASE_URL=https://api.mailgun.net/v3
   MAILGUN_WEBHOOK_SIGNING_KEY=your-webhook-key

   # Webhook (for inbound emails)
   WEBHOOK_PUBLIC_URL=https://your-ngrok-or-server/webhooks/mailgun/inbound
   ```

3. **Start the backend**:
   ```powershell
   npm run dev          # Development with nodemon
   # or
   npm start            # Production
   ```

   Backend will run on `http://localhost:4800`

### Frontend Setup

1. **Navigate to frontend**:
   ```powershell
   cd frontend
   npm install
   ```

2. **Update API base URL** in `src/services/api.js` if needed (defaults to `http://localhost:4800`).

3. **Start the frontend**:
   ```powershell
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

4. **Build for production**:
   ```powershell
   npm run build
   ```

## API Endpoints

### RFP Routes
- `POST /api/rfp` — Create a new RFP
- `GET /api/rfp` — Get all RFPs
- `GET /api/rfp/:id` — Get RFP details
- `PUT /api/rfp/:id` — Update RFP
- `DELETE /api/rfp/:id` — Delete RFP

### Vendor Routes
- `POST /api/vendor` — Add a vendor
- `GET /api/vendor` — Get all vendors
- `PUT /api/vendor/:id` — Update vendor
- `DELETE /api/vendor/:id` — Delete vendor

### Proposal Routes
- `POST /api/proposal` — Submit a proposal
- `GET /api/proposal` — Get all proposals
- `GET /api/proposal/:id` — Get proposal details
- `PUT /api/proposal/:id` — Update proposal
- `DELETE /api/proposal/:id` — Delete proposal

### AI Routes
- `POST /api/ai/parse-rfp` — Parse RFP document and extract structured data
- `POST /api/ai/compare-vendors` — AI-powered vendor comparison

### Email Routes
- `POST /api/email/send-rfp` — Send RFP to vendors
- `POST /webhooks/mailgun/inbound` — Mailgun inbound webhook for receiving emails

### File Routes
- `POST /api/files/upload` — Upload RFP document (PDF/DOCX)
- `GET /uploads/:filename` — Retrieve uploaded file

## Key Features

### RFP Management
- Create RFPs with structured fields (title, description, budget, delivery days, payment terms, warranty, line items)
- Upload RFP documents (PDF, DOCX)
- Extract structured RFP details using Google Gemini AI

### Vendor Management
- Add and manage vendor information
- Track vendor contact details and capabilities

### Proposal Workflow
- Vendors submit proposals with cost and delivery details
- Track proposal status and attachments
- Compare multiple vendors side-by-side

### AI-Powered Analysis
- Parse RFP documents and auto-extract key details
- Compare vendors using AI-generated summaries and scores
- Generate insights on vendor capabilities vs. RFP requirements

### Email Integration
- Send RFPs to vendors via SMTP
- Receive inbound emails (via Mailgun webhook) with proposal attachments
- Automatically extract attachments from email responses

## Rate Limiting & Performance Notes

The Gemini API has rate limits. If you encounter 429 errors:
1. Implement request throttling (see `backend/utils/` or add bottleneck)
2. Add retry logic with exponential backoff
3. Request quota increase in Google Cloud Console
4. Consider using a service account with OAuth for higher limits

## Security Considerations

⚠️ **Do not commit `.env` file to version control.**

Add `backend/.env` to `.gitignore`:
```
backend/.env
```

**Rotate these credentials immediately if exposed**:
- Google Gemini API Key
- MongoDB URI
- SMTP credentials
- Mailgun API Key
- JWT Secret Key

## Common Issues & Fixes

### MongoDB Connection Failed
- Verify `MONGO_URL` is correct and accessible
- Check IP whitelist in MongoDB Atlas (add `0.0.0.0/0` for development)

### Gemini API 429 (Too Many Requests)
- Add rate limiting to requests
- Implement retry with exponential backoff
- Check quota in Google Cloud Console and request increase if needed

### Email Not Sending
- Verify SMTP credentials and host
- Check `EMAIL_FROM` matches Mailgun authorized sender
- Ensure Mailgun domain is verified

### CORS Errors
- Verify `CLIENT_BASE_URL` in backend `.env` matches frontend URL
- Check CORS middleware in `server.js`

## Development Workflow

1. **Backend**: Run `npm run dev` in `backend/` for auto-reload
2. **Frontend**: Run `npm run dev` in `frontend/` for hot reload
3. **Monitor logs**: Check backend console for API errors
4. **Test endpoints**: Use Postman or VS Code REST Client

## Deployment

### Backend Deployment (Node.js)
- Set environment variables on hosting platform (Heroku, Railway, Render, etc.)
- Run: `npm install && npm start`
- Ensure MongoDB and email services are accessible

### Frontend Deployment (Static)
- Run `npm run build` to generate `dist/`
- Host on Vercel, Netlify, or static CDN
- Update `CLIENT_BASE_URL` in backend `.env` to point to frontend domain

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

ISC

---

**Questions or Issues?** Check the backend logs and verify all environment variables are set correctly.
