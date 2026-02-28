# EmailJS Dashboard Setup for Going Green Advocacy

This guide walks you through configuring EmailJS so the advocacy site can send emails to legislators through the form.

## Prerequisites

The site already has the EmailJS SDK integrated and sends these template parameters:

- `to_email` – comma-separated legislator emails (Assembly + Senator)
- `to_name` – legislator names
- `from_name` – sender full name
- `from_email` – sender email
- `message` – full advocacy email body
- `legislator_names` – same as `to_name`
- `reply_to` – sender email (so legislators can reply directly to the constituent)

---

## Step 1: Create an Account and Get Your Public Key

1. Sign up at [dashboard.emailjs.com](https://dashboard.emailjs.com)
2. Go to **Account** > **API Keys**
3. Copy your **Public Key** – this becomes `EMAILJS_PUBLIC_KEY` in `index.html`

---

## Step 2: Add an Email Service

1. Go to [Email Services](https://dashboard.emailjs.com/admin)
2. Click **Add New Service**
3. Choose either:
   - **Personal** (e.g. Gmail, Outlook): fine for testing / low volume
   - **Transactional** (e.g. SendGrid, Mailgun): recommended for production
4. Connect the account (e.g. sign in with Gmail)
5. Set a **Service ID** (e.g. `service_advocacy` or `contact_service`)
6. Click **Create** / **Add Service**
7. Copy the **Service ID** – this becomes `EMAILJS_SERVICE_ID` in `index.html`

---

## Step 3: Create an Email Template

1. Go to [Email Templates](https://dashboard.emailjs.com/admin/templates)
2. Click **Create New Template**
3. Configure the template fields:

| Field | Value |
|-------|-------|
| **Subject** | `Constituent message: Support childhood literacy funding` (or use `{{from_name}}`) |
| **To Email** | `{{to_email}}` |
| **From Name** | `{{from_name}}` |
| **From Email** | Use the "default email" option or `{{from_email}}` |
| **Reply-To** | `{{reply_to}}` |

4. **Content** – set the email body:

```
A constituent has sent you a message via Reach Out and Read advocacy:

{{message}}
```

5. **Remove EmailJS footer** – In the template editor, scroll down and turn off any "Footer" or "Signature" option that adds "Email sent via EmailJS.com". If present, delete that text from the template.

6. **Save** the template
7. Copy the **Template ID** (e.g. `template_xyz789`) – this becomes `EMAILJS_TEMPLATE_ID` in `index.html`

---

## Step 3b (Optional): Admin Email Alert Template

Get an email each time someone successfully sends an advocacy message.

1. Go to [Email Templates](https://dashboard.emailjs.com/admin/templates)
2. Click **Create New Template**
3. **To Email**: Set to your admin email (fixed in template)
4. **Subject**: e.g. `New advocacy email sent: {{sender_name}}`
5. **Content** (or Body):

```
Someone sent an advocacy email via the campaign:

Sender: {{sender_name}} ({{sender_email}})
Sent to: {{legislators}}
Recipient emails: {{recipient_emails}}
Date: {{date}}
```

6. Use the same **Email Service** as your main advocacy template
7. **Save** and copy the **Template ID** → `EMAILJS_ADMIN_TEMPLATE_ID`

Add to `.env` and GitHub Secrets: `EMAILJS_ADMIN_TEMPLATE_ID=template_abc123`

**Important:** If notifications don't arrive, ensure `EMAILJS_ADMIN_TEMPLATE_ID` is set in GitHub Secrets (repo Settings → Secrets). The site sends the main email first, then your notification ~1.2 seconds later to avoid EmailJS rate limits. Check the browser console (F12) for errors if it still fails.

---

## Step 4: Update Your Site's CONFIG

In `index.html`, find the CONFIG object (around line 829) and replace the placeholders with your real values:

```javascript
const CONFIG = {
  EMAILJS_PUBLIC_KEY:  'your_actual_public_key',
  EMAILJS_SERVICE_ID:  'your_service_id',      // e.g. 'service_advocacy'
  EMAILJS_TEMPLATE_ID: 'your_template_id',     // e.g. 'template_xyz789'
  OPEN_STATES_API_KEY: '...',                  // open.pluralpolicy.com – legislator lookup
};
```

**Open States API key** (for legislator lookup): Register at [open.pluralpolicy.com](https://open.pluralpolicy.com/accounts/profile/) to get an API key. Geocoding uses Photon (free); Open States provides legislator data.

---

## Step 5 (Optional): Restrict Domains for Security

1. In the EmailJS dashboard, go to **Account** > **Security**
2. Add your site domains (e.g. `rorgny.goinggreen.earth`) to the allowed list

---

## Summary Checklist

| Step | Where | What to do |
|------|-------|------------|
| 1 | Account > API Keys | Copy **Public Key** |
| 2 | Email Services | Add Gmail/Outlook/transactional service; note **Service ID** |
| 3 | Email Templates | Create template with `{{to_email}}`, `{{message}}`, `{{reply_to}}`, etc.; note **Template ID** |
| 4 | index.html CONFIG | Replace placeholders with the three IDs above |
| 5 | Account > Security | (Optional) Add allowed domains |

---

## Testing the Integration

1. **Set your real credentials** in `index.html` CONFIG (Public Key, Service ID, Template ID).
2. **Add a test email** to CONFIG:
   ```javascript
   TEST_EMAIL: 'your@email.com',
   ```
3. **Open the site** with `?test=1` in the URL (e.g. `https://yoursite.com/?test=1` or `http://localhost:8080/?test=1`).
4. **Fill out the form**, verify your address, and click "Send my message to Albany."
5. **Check your inbox** – the email should arrive at the address in `TEST_EMAIL`, not at legislators.
6. **Verify**: From is `rorgnyadvocacy@goinggreen.earth`, Reply-To is your form email, and the message body looks correct.
7. **Go live**: Remove or comment out `TEST_EMAIL`, and use the site without `?test=1` for real sends.

---

## Notes

- **Rate limit**: EmailJS allows about 1 request per second on the free tier.
- **Multiple recipients**: The site sends `to_email` as a comma-separated string; most providers accept this.
- **Demo mode**: Until you set valid EmailJS values, the site runs in demo mode and simulates success without sending real emails.
