const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;

// Helper to escape HTML characters
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Read credentials from .env file or environment
function getEnvCredentials() {
  let host = process.env.SMTP_HOST || 'smtp.gmail.com';
  let port = Number(process.env.SMTP_PORT || 465);
  let user = process.env.SMTP_EMAIL || '';
  let pass = process.env.SMTP_PASSWORD || '';

  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hostMatch = envContent.match(/SMTP_HOST=(.*)/);
    const portMatch = envContent.match(/SMTP_PORT=(.*)/);
    const userMatch = envContent.match(/SMTP_EMAIL=(.*)/);
    const passMatch = envContent.match(/SMTP_PASSWORD=(.*)/);
    if (hostMatch && hostMatch[1]) host = hostMatch[1].trim();
    if (portMatch && portMatch[1]) port = Number(portMatch[1].trim());
    if (userMatch && userMatch[1]) user = userMatch[1].trim();
    if (passMatch && passMatch[1]) pass = passMatch[1].trim();
  }
  return { host, port, user, pass: pass.replace(/\s+/g, '') };
}

// Automatically sync local env.js from .env if running local server
function syncLocalEnvJs() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envJsPath = path.join(__dirname, 'env.js');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const urlMatch = envContent.match(/SUPABASE_URL=(.*)/);
      const keyMatch = envContent.match(/SUPABASE_ANON_KEY=(.*)/) || envContent.match(/SUPABASE_ANON=(.*)/);
      const adminMatch = envContent.match(/ADMIN_EMAIL=(.*)/);
      const url = urlMatch ? urlMatch[1].trim() : '';
      const key = keyMatch ? keyMatch[1].trim() : '';
      const admin = adminMatch ? adminMatch[1].trim() : '';
      if (url && key) {
        const jsContent = `// Auto-generated runtime environment file (gitignored)\nwindow.__env = {\n  SUPABASE_URL:  '${url}',\n  SUPABASE_ANON: '${key}',\n  ADMIN_EMAIL:   '${admin}'\n};\n`;
        fs.writeFileSync(envJsPath, jsContent);
      }
    }
  } catch(e) {}
}
syncLocalEnvJs();

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

async function sendEmailHandler(bodyJson) {
  const { type, data } = bodyJson;
  const creds = getEnvCredentials();

  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.port === 465,
    auth: {
      user: creds.user,
      pass: creds.pass
    }
  });

  const adminEmail = process.env.ADMIN_EMAIL || creds.user;

  if (type === 'signup') {
    const { user_email, full_name } = data;
    const customerName = full_name || user_email.split('@')[0];

    // 1. Welcome Email to Customer
    const userMailOptions = {
      from: `"DeepDive Ocean Adventures" <${creds.user}>`,
      to: user_email,
      subject: 'Welcome to DeepDive Ocean Adventures! 🌊',
      html: `
        <div style="background-color:#020b18; color:#e8f4ff; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; padding:40px 15px; background-image: radial-gradient(circle at top center, #06284c 0%, #020b18 70%);">
          <div style="max-width:620px; margin:0 auto; background:#04172e; border:1px solid rgba(0,212,255,0.3); border-radius:20px; overflow:hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
            
            <!-- Header Banner -->
            <div style="padding:35px 30px; text-align:center; background:linear-gradient(135deg, #010a17 0%, #05264a 50%, #010e21 100%); border-bottom:1px solid rgba(0,212,255,0.25);">
              <div style="display:inline-block; padding:4px 14px; background:rgba(0,212,255,0.12); border:1px solid rgba(0,212,255,0.3); border-radius:30px; color:#00d4ff; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px;">
                WELCOME TO THE CLUB
              </div>
              <h1 style="font-family:'Playfair Display', Georgia, serif; font-size:34px; color:#00d4ff; margin:0; font-style:italic; font-weight:700; letter-spacing:1px;">DeepDive</h1>
              <p style="color:rgba(232,244,255,0.6); font-size:11px; letter-spacing:3px; text-transform:uppercase; margin:6px 0 0 0;">Explore The Unseen</p>
            </div>

            <!-- Body Content -->
            <div style="padding:35px 30px; line-height:1.7;">
              <h2 style="color:#ffffff; font-size:22px; margin:0 0 15px 0; font-weight:600;">Welcome Aboard, ${escapeHtml(customerName)}! 🥽</h2>
              <p style="color:rgba(232,244,255,0.85); font-size:15px; margin:0 0 20px 0;">
                Thank you for registering with <strong>DeepDive Marine Experiences</strong>. Your journey into the extraordinary world underwater starts right now!
              </p>

              <!-- Highlight Features Card -->
              <div style="background:rgba(0,212,255,0.04); border:1px solid rgba(0,212,255,0.18); border-radius:14px; padding:22px; margin:25px 0;">
                <div style="color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:14px;">
                  WHAT YOU CAN DO NEXT
                </div>
                
                <table style="width:100%; border-collapse:collapse; color:#e8f4ff; font-size:14px;">
                  <tr>
                    <td style="padding:8px 0; width:28px; vertical-align:top; font-size:16px;">🌊</td>
                    <td style="padding:8px 0; color:rgba(232,244,255,0.9);">
                      <strong>Explore World-Class Destinations</strong> — Andaman Islands, Lakshadweep, Goa &amp; Netrani.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; width:28px; vertical-align:top; font-size:16px;">🤿</td>
                    <td style="padding:8px 0; color:rgba(232,244,255,0.9);">
                      <strong>Book Certified Dive Packages</strong> — Scuba intro, fun dives, and PADI certifications.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0; width:28px; vertical-align:top; font-size:16px;">⚡</td>
                    <td style="padding:8px 0; color:rgba(232,244,255,0.9);">
                      <strong>Instant Confirmation</strong> — Reserve your dive dates seamlessly online.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center; margin:35px 0 20px 0;">
                <a href="https://deepdive-co.netlify.app/login_signup.html" style="background:linear-gradient(135deg, #00d4ff 0%, #0088cc 100%); color:#010a17; padding:15px 36px; text-decoration:none; font-weight:800; border-radius:50px; text-transform:uppercase; font-size:13px; letter-spacing:2px; display:inline-block; box-shadow:0 4px 20px rgba(0,212,255,0.35);">
                  Log In &amp; Explore Dive Spots
                </a>
              </div>

              <hr style="border:none; border-top:1px solid rgba(0,212,255,0.15); margin:30px 0 20px 0;" />
              
              <!-- Footer -->
              <div style="text-align:center;">
                <p style="font-size:12px; color:rgba(232,244,255,0.5); margin:0 0 5px 0;">DeepDive Marine Experiences · PADI 5-Star Certified Dive Center</p>
                <p style="font-size:11px; color:rgba(232,244,255,0.35); margin:0;">Need assistance? Reply directly to this email or visit our website.</p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    // 2. Alert Email to Admin
    const adminMailOptions = {
      from: `"DeepDive System" <${creds.user}>`,
      to: adminEmail,
      subject: `[DeepDive Alert] New User Sign-Up: ${escapeHtml(customerName)}`,
      html: `
        <div style="background-color:#020b18; color:#e8f4ff; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; padding:40px 15px; background-image: radial-gradient(circle at top center, #06284c 0%, #020b18 70%);">
          <div style="max-width:580px; margin:0 auto; background:#04172e; border:1px solid rgba(0,212,255,0.3); border-radius:20px; overflow:hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
            
            <!-- Header Banner -->
            <div style="padding:28px 25px; text-align:center; background:linear-gradient(135deg, #010a17 0%, #05264a 50%, #010e21 100%); border-bottom:1px solid rgba(0,212,255,0.25);">
              <div style="display:inline-block; padding:4px 14px; background:rgba(0,212,255,0.12); border:1px solid rgba(0,212,255,0.3); border-radius:30px; color:#00d4ff; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:10px;">
                ADMIN SYSTEM NOTIFICATION
              </div>
              <h1 style="font-family:'Playfair Display', Georgia, serif; font-size:26px; color:#00d4ff; margin:0; font-style:italic; font-weight:700; letter-spacing:1px;">DeepDive Admin</h1>
            </div>

            <!-- Body Content -->
            <div style="padding:30px 25px;">
              <div style="background:rgba(0,212,255,0.06); border-left:4px solid #00d4ff; border-radius:8px; padding:15px 20px; margin-bottom:25px;">
                <h2 style="color:#ffffff; font-size:18px; margin:0; font-weight:600;">🎉 New User Registration</h2>
                <p style="color:rgba(232,244,255,0.7); font-size:13px; margin:4px 0 0 0;">A new user has just registered an account on DeepDive.</p>
              </div>

              <div style="background:rgba(0,212,255,0.04); border:1px solid rgba(0,212,255,0.15); border-radius:14px; padding:20px;">
                <table style="width:100%; border-collapse:collapse; color:#e8f4ff; font-size:14px;">
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; width:35%;">FULL NAME</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; color:#ffffff;">${escapeHtml(customerName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">EMAIL ADDRESS</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; color:#00d4ff;">${escapeHtml(user_email)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">REGISTERED AT</td>
                    <td style="padding:10px 0; color:rgba(232,244,255,0.85);">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td>
                  </tr>
                </table>
              </div>

              <div style="margin-top:25px; text-align:center;">
                <a href="https://deepdive-co.netlify.app/admin.html" style="background:linear-gradient(135deg, #00d4ff 0%, #0088cc 100%); color:#010a17; padding:12px 28px; text-decoration:none; font-weight:800; border-radius:50px; text-transform:uppercase; font-size:12px; letter-spacing:1.5px; display:inline-block; box-shadow:0 4px 15px rgba(0,212,255,0.3);">
                  Manage in Admin Panel
                </a>
              </div>

              <hr style="border:none; border-top:1px solid rgba(0,212,255,0.15); margin:25px 0 15px 0;" />
              <p style="font-size:11px; color:rgba(232,244,255,0.4); text-align:center; margin:0;">DeepDive Automated Admin Notification System</p>
            </div>
          </div>
        </div>
      `
    };

    await Promise.all([
      transporter.sendMail(userMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);

    return { success: true, message: 'Sign-up emails sent successfully' };

  } else if (type === 'booking') {
    const {
      booking_id, customer_name, customer_email, phone, destination,
      dive_type, experience_level, num_divers, preferred_date,
      total_price, currency, special_requests
    } = data;

    const fmtPrice = `${currency === 'INR' ? '₹' : (currency || 'INR') + ' '} ${Number(total_price || 0).toLocaleString('en-IN')}`;

    // 1. Customer Confirmation Email
    const customerMailOptions = {
      from: `"DeepDive Reservations" <${creds.user}>`,
      to: customer_email,
      subject: `Reservation Confirmed - DeepDive #${booking_id ? String(booking_id).substring(0,8).toUpperCase() : 'NEW'}`,
      html: `
        <div style="background-color:#020b18; color:#e8f4ff; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; padding:40px 15px; background-image: radial-gradient(circle at top center, #06284c 0%, #020b18 70%);">
          <div style="max-width:640px; margin:0 auto; background:#04172e; border:1px solid rgba(0,212,255,0.3); border-radius:20px; overflow:hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
            
            <!-- Header Banner -->
            <div style="padding:35px 30px; text-align:center; background:linear-gradient(135deg, #010a17 0%, #05264a 50%, #010e21 100%); border-bottom:1px solid rgba(0,212,255,0.25);">
              <div style="display:inline-block; padding:4px 14px; background:rgba(0,212,255,0.12); border:1px solid rgba(0,212,255,0.3); border-radius:30px; color:#00d4ff; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px;">
                RESERVATION CONFIRMATION INVOICE
              </div>
              <h1 style="font-family:'Playfair Display', Georgia, serif; font-size:34px; color:#00d4ff; margin:0; font-style:italic; font-weight:700; letter-spacing:1px;">DeepDive</h1>
              <p style="color:rgba(232,244,255,0.6); font-size:11px; letter-spacing:3px; text-transform:uppercase; margin:6px 0 0 0;">Ocean Adventures</p>
            </div>

            <!-- Body Content -->
            <div style="padding:35px 30px;">
              <h2 style="color:#ffffff; font-size:22px; margin:0 0 10px 0; font-weight:600;">Dear ${escapeHtml(customer_name)},</h2>
              <p style="color:rgba(232,244,255,0.85); font-size:15px; margin:0 0 25px 0; line-height:1.6;">
                Your dive reservation has been successfully confirmed! We are excited to guide you on your underwater adventure.
              </p>

              <!-- Booking Card -->
              <div style="background:rgba(0,212,255,0.04); border:1px solid rgba(0,212,255,0.2); border-radius:16px; padding:24px; margin-bottom:25px;">
                <table style="width:100%; border-collapse:collapse; color:#e8f4ff; font-size:14px;">
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">BOOKING REF</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:700; text-align:right;">
                      <span style="background:rgba(0,212,255,0.15); color:#00d4ff; padding:4px 10px; border-radius:6px; font-family:monospace; font-size:13px; border:1px solid rgba(0,212,255,0.3);">${booking_id ? String(booking_id).substring(0,12).toUpperCase() : 'CONFIRMED'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">DESTINATION</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:700; text-align:right; color:#ffffff; font-size:15px;">${escapeHtml(destination)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">DIVE PACKAGE</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; text-align:right; color:rgba(232,244,255,0.95);">${escapeHtml(dive_type)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">EXPERIENCE LEVEL</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; text-align:right; color:rgba(232,244,255,0.95);">${escapeHtml(experience_level)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">SCHEDULED DATE</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:700; text-align:right; color:#00d4ff;">${escapeHtml(preferred_date)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">DIVERS COUNT</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; text-align:right; color:rgba(232,244,255,0.95);">${num_divers} ${num_divers == 1 ? 'Diver' : 'Divers'}</td>
                  </tr>
                </table>

                <!-- Price Banner inside card -->
                <div style="margin-top:20px; background:linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,153,204,0.08) 100%); border:1px solid rgba(0,212,255,0.35); border-radius:12px; padding:15px 20px;">
                  <table style="width:100%; border-collapse:collapse;">
                    <tr>
                      <td style="color:#7dd3fc; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">TOTAL AMOUNT</td>
                      <td style="font-size:22px; font-weight:800; text-align:right; color:#00d4ff;">${fmtPrice}</td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- Payment & Arrival Note -->
              <div style="background:rgba(240,165,0,0.08); border:1px solid rgba(240,165,0,0.3); border-radius:12px; padding:18px 20px; margin-bottom:30px;">
                <table style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="width:26px; vertical-align:top; font-size:18px;">💡</td>
                    <td style="font-size:13px; color:#f6c163; line-height:1.6;">
                      <strong style="color:#f0a500;">Payment &amp; Arrival Instructions:</strong><br/>
                      Payment will be collected directly at the dive center on the day of your dive. Please arrive at least 20 minutes prior to your scheduled time slot for safety briefing and gear fitting.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center; margin:30px 0 10px 0;">
                <a href="https://deepdive-co.netlify.app/profile.html" style="background:linear-gradient(135deg, #00d4ff 0%, #0088cc 100%); color:#010a17; padding:15px 36px; text-decoration:none; font-weight:800; border-radius:50px; text-transform:uppercase; font-size:13px; letter-spacing:2px; display:inline-block; box-shadow:0 4px 20px rgba(0,212,255,0.35);">
                  View My Bookings
                </a>
              </div>

              <hr style="border:none; border-top:1px solid rgba(0,212,255,0.15); margin:30px 0 20px 0;" />
              
              <!-- Footer -->
              <div style="text-align:center;">
                <p style="font-size:12px; color:rgba(232,244,255,0.5); margin:0 0 5px 0;">DeepDive Marine Experiences · PADI 5-Star Dive Center</p>
                <p style="font-size:11px; color:rgba(232,244,255,0.35); margin:0;">Have questions? Reply directly to this email or call our dive center support.</p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    // 2. Admin Alert Email
    const adminBookingMailOptions = {
      from: `"DeepDive Booking Alert" <${creds.user}>`,
      to: adminEmail,
      subject: `[NEW BOOKING] ${escapeHtml(customer_name)} - ${escapeHtml(destination)} (${preferred_date})`,
      html: `
        <div style="background-color:#020b18; color:#e8f4ff; font-family:'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; padding:40px 15px; background-image: radial-gradient(circle at top center, #06284c 0%, #020b18 70%);">
          <div style="max-width:640px; margin:0 auto; background:#04172e; border:1px solid rgba(0,212,255,0.35); border-radius:20px; overflow:hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
            
            <!-- Header Banner -->
            <div style="padding:32px 30px; text-align:center; background:linear-gradient(135deg, #010a17 0%, #05264a 50%, #010e21 100%); border-bottom:1px solid rgba(0,212,255,0.25);">
              <div style="display:inline-block; padding:5px 16px; background:rgba(0,212,255,0.12); border:1px solid rgba(0,212,255,0.35); border-radius:30px; color:#00d4ff; font-size:10px; font-weight:800; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px;">
                NEW BOOKING DISPATCH ALERT
              </div>
              <h1 style="font-family:'Playfair Display', Georgia, serif; font-size:32px; color:#00d4ff; margin:0; font-style:italic; font-weight:700; letter-spacing:1px;">DeepDive Admin</h1>
            </div>

            <!-- Body Content -->
            <div style="padding:35px 30px;">
              
              <!-- Top Title Box -->
              <div style="background:rgba(0,212,255,0.06); border-left:4px solid #00d4ff; border-radius:10px; padding:18px 22px; margin-bottom:28px;">
                <h2 style="color:#ffffff; font-size:22px; margin:0 0 6px 0; font-weight:700;">🚤 New Dive Booking Received!</h2>
                <p style="color:rgba(232,244,255,0.75); font-size:14px; margin:0;">
                  A new reservation request has been submitted on <strong>DeepDive</strong>. Details are below:
                </p>
              </div>

              <!-- Quick Metrics Grid -->
              <table style="width:100%; border-collapse:separate; border-spacing:10px; margin-bottom:20px;">
                <tr>
                  <td style="background:rgba(0,212,255,0.05); border:1px solid rgba(0,212,255,0.2); border-radius:12px; padding:14px; text-align:center; width:50%;">
                    <div style="color:#7dd3fc; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px;">DESTINATION</div>
                    <div style="color:#ffffff; font-size:16px; font-weight:700;">${escapeHtml(destination)}</div>
                  </td>
                  <td style="background:rgba(0,212,255,0.05); border:1px solid rgba(0,212,255,0.2); border-radius:12px; padding:14px; text-align:center; width:50%;">
                    <div style="color:#7dd3fc; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:4px;">TOTAL REVENUE</div>
                    <div style="color:#00d4ff; font-size:18px; font-weight:800;">${fmtPrice}</div>
                  </td>
                </tr>
              </table>

              <!-- Complete Details Card -->
              <div style="background:rgba(0,212,255,0.03); border:1px solid rgba(0,212,255,0.18); border-radius:16px; padding:24px; margin-bottom:30px;">
                <div style="color:#00d4ff; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:15px; border-bottom:1px solid rgba(0,212,255,0.15); padding-bottom:8px;">
                  RESERVATION SPECIFICATIONS
                </div>
                <table style="width:100%; border-collapse:collapse; color:#e8f4ff; font-size:14px;">
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; width:40%;">CUSTOMER NAME</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:700; color:#ffffff;">${escapeHtml(customer_name)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">EMAIL ADDRESS</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; color:#00d4ff;">
                      <a href="mailto:${escapeHtml(customer_email)}" style="color:#00d4ff; text-decoration:none;">${escapeHtml(customer_email)}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">PHONE NUMBER</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; color:rgba(232,244,255,0.9);">${escapeHtml(phone || 'Not provided')}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">DIVE PACKAGE</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; color:#ffffff;">${escapeHtml(dive_type)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">EXPERIENCE LEVEL</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:600; color:rgba(232,244,255,0.9);">${escapeHtml(experience_level)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">PREFERRED DATE</td>
                    <td style="padding:10px 0; border-bottom:1px solid rgba(0,212,255,0.1); font-weight:700; color:#00d4ff;">${escapeHtml(preferred_date)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; ${special_requests ? 'border-bottom:1px solid rgba(0,212,255,0.1);' : ''} color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">DIVERS COUNT</td>
                    <td style="padding:10px 0; ${special_requests ? 'border-bottom:1px solid rgba(0,212,255,0.1);' : ''} font-weight:700; color:#ffffff;">${num_divers} ${num_divers == 1 ? 'Diver' : 'Divers'}</td>
                  </tr>
                  ${special_requests ? `
                  <tr>
                    <td style="padding:10px 0; color:#7dd3fc; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; vertical-align:top;">SPECIAL REQUESTS</td>
                    <td style="padding:10px 0; font-style:italic; color:#f0a500;">"${escapeHtml(special_requests)}"</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Action Button -->
              <div style="text-align:center; margin:35px 0 15px 0;">
                <a href="https://deepdive-co.netlify.app/admin.html" style="background:linear-gradient(135deg, #00d4ff 0%, #0088cc 100%); color:#010a17; padding:16px 38px; text-decoration:none; font-weight:800; border-radius:50px; text-transform:uppercase; font-size:13px; letter-spacing:2px; display:inline-block; box-shadow:0 4px 25px rgba(0,212,255,0.4);">
                  Manage in Admin Panel
                </a>
              </div>

              <hr style="border:none; border-top:1px solid rgba(0,212,255,0.15); margin:30px 0 20px 0;" />
              
              <!-- Footer -->
              <div style="text-align:center;">
                <p style="font-size:12px; color:rgba(232,244,255,0.5); margin:0 0 4px 0;">DeepDive Dispatch System · Admin Notification Center</p>
                <p style="font-size:11px; color:rgba(232,244,255,0.35); margin:0;">Automated email notification triggered upon guest checkout.</p>
              </div>
            </div>
          </div>
        </div>
      `
    };

    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(adminBookingMailOptions)
    ]);

    return { success: true, message: 'Booking emails sent successfully' };

  } else {
    throw new Error('Invalid email notification type');
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle email API endpoint
  if ((req.url.includes('/send-email') || req.url.includes('/.netlify/functions/send-email')) && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await sendEmailHandler(payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[DeepDive Email Server Error]:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Serve static files
  let safePath = req.url.split('?')[0];
  if (safePath === '/') safePath = '/index.html';
  let filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  const creds = getEnvCredentials();
  console.log(`\n============================================================`);
  console.log(`🌊 DeepDive Ocean Adventures — Local Development Server`);
  console.log(`============================================================`);
  console.log(`🚀 Website Running at: http://localhost:${PORT}`);
  console.log(`📧 Email Sender Account: ${creds.user}`);
  console.log(`🔔 Notifications Sent To: Customer & ${creds.user}`);
  console.log(`============================================================\n`);
});
