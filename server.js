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
  let user = process.env.EMAIL_USER || '';
  let pass = process.env.EMAIL_PASS || '';

  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const userMatch = envContent.match(/EMAIL_USER=(.*)/);
    const passMatch = envContent.match(/EMAIL_PASS=(.*)/);
    if (userMatch && userMatch[1]) user = userMatch[1].trim();
    if (passMatch && passMatch[1]) pass = passMatch[1].trim();
  }
  return { user, pass: pass.replace(/\s+/g, '') };
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
    service: 'gmail',
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
        <div style="background-color:#020b18; color:#e8f4ff; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding:40px 20px;">
          <div style="max-width:600px; margin:0 auto; background:#041428; border:1px solid rgba(0,212,255,0.3); border-radius:16px; overflow:hidden;">
            <div style="padding:30px; text-align:center; background:linear-gradient(135deg, #020b18, #062040); border-bottom:1px solid rgba(0,212,255,0.2);">
              <h1 style="font-family:'Playfair Display', Georgia, serif; font-size:32px; color:#00d4ff; margin:0; font-style:italic;">DeepDive</h1>
              <p style="color:rgba(232,244,255,0.6); font-size:12px; letter-spacing:3px; text-transform:uppercase; margin-top:5px;">Explore The Unseen</p>
            </div>
            <div style="padding:30px; line-height:1.7;">
              <h2 style="color:#ffffff; font-size:22px; margin-top:0;">Welcome aboard, ${escapeHtml(customerName)}! 🥽</h2>
              <p style="color:rgba(232,244,255,0.8);">Thank you for registering with DeepDive. Your account has been successfully created!</p>
              <p style="color:rgba(232,244,255,0.8);">You can now log in, explore world-class marine destinations, and reserve your scuba diving adventures in the Andaman Islands, Lakshadweep, Goa, and more.</p>
              <hr style="border:none; border-top:1px solid rgba(0,212,255,0.15); margin:30px 0;" />
              <p style="font-size:12px; color:rgba(232,244,255,0.5); text-align:center; margin:0;">DeepDive Marine Experiences · PADI 5-Star Dive Center</p>
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
        <div style="background-color:#f4f7f6; font-family:sans-serif; padding:30px;">
          <div style="max-width:550px; margin:0 auto; background:#ffffff; border-radius:10px; padding:25px; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <h2 style="color:#036b8a; margin-top:0;">🎉 New User Registered</h2>
            <table style="width:100%; border-collapse:collapse; margin-top:15px;">
              <tr><td style="padding:8px 0; color:#666;">Full Name:</td><td style="padding:8px 0; font-weight:bold; color:#111;">${escapeHtml(customerName)}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Email Address:</td><td style="padding:8px 0; font-weight:bold; color:#111;">${escapeHtml(user_email)}</td></tr>
              <tr><td style="padding:8px 0; color:#666;">Registered At:</td><td style="padding:8px 0; color:#111;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
            </table>
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
        <div style="background-color:#020b18; color:#e8f4ff; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding:40px 20px;">
          <div style="max-width:620px; margin:0 auto; background:#041428; border:1px solid rgba(0,212,255,0.3); border-radius:16px; overflow:hidden;">
            <div style="padding:30px; text-align:center; background:linear-gradient(135deg, #020b18, #062040); border-bottom:1px solid rgba(0,212,255,0.2);">
              <h1 style="font-family:'Playfair Display', Georgia, serif; font-size:30px; color:#00d4ff; margin:0; font-style:italic;">DeepDive</h1>
              <p style="color:rgba(232,244,255,0.6); font-size:12px; letter-spacing:3px; text-transform:uppercase; margin-top:5px;">Reservation Confirmation Invoice</p>
            </div>
            <div style="padding:30px;">
              <h2 style="color:#ffffff; font-size:20px; margin-top:0;">Dear ${escapeHtml(customer_name)},</h2>
              <p style="color:rgba(232,244,255,0.85); line-height:1.6;">Your dive reservation has been successfully placed! Below are your booking details:</p>
              
              <div style="background:rgba(0,212,255,0.06); border:1px solid rgba(0,212,255,0.2); border-radius:12px; padding:20px; margin:25px 0;">
                <table style="width:100%; border-collapse:collapse; color:#e8f4ff; font-size:14px;">
                  <tr><td style="padding:6px 0; color:rgba(232,244,255,0.6);">Booking ID:</td><td style="padding:6px 0; font-weight:bold; text-align:right; color:#00d4ff;">${booking_id || 'Pending'}</td></tr>
                  <tr><td style="padding:6px 0; color:rgba(232,244,255,0.6);">Destination:</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(destination)}</td></tr>
                  <tr><td style="padding:6px 0; color:rgba(232,244,255,0.6);">Dive Package:</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(dive_type)}</td></tr>
                  <tr><td style="padding:6px 0; color:rgba(232,244,255,0.6);">Experience Level:</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(experience_level)}</td></tr>
                  <tr><td style="padding:6px 0; color:rgba(232,244,255,0.6);">Scheduled Date:</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${escapeHtml(preferred_date)}</td></tr>
                  <tr><td style="padding:6px 0; color:rgba(232,244,255,0.6);">No. of Divers:</td><td style="padding:6px 0; font-weight:bold; text-align:right;">${num_divers}</td></tr>
                  <tr><td style="padding:10px 0 0 0; color:#00d4ff; font-weight:bold; font-size:16px;">Total Amount:</td><td style="padding:10px 0 0 0; font-weight:bold; font-size:18px; text-align:right; color:#00d4ff;">${fmtPrice}</td></tr>
                </table>
              </div>

              <div style="background:rgba(240,165,0,0.1); border:1px solid rgba(240,165,0,0.3); border-radius:10px; padding:15px; font-size:13px; color:#f0a500; line-height:1.5;">
                <strong>Note:</strong> Payment will be collected directly at the dive center on the day of your dive. Please arrive 20 minutes before your scheduled slot.
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
        <div style="background-color:#f4f7f6; font-family:sans-serif; padding:30px;">
          <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; padding:25px; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <h2 style="color:#036b8a; margin-top:0;">🚤 New Dive Booking Received!</h2>
            <table style="width:100%; border-collapse:collapse; margin-top:15px;">
              <tr><td style="padding:6px 0; color:#666;">Customer Name:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(customer_name)}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Email:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(customer_email)}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Destination:</td><td style="padding:6px 0; font-weight:bold; color:#036b8a;">${escapeHtml(destination)}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Dive Package:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(dive_type)}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Experience Level:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(experience_level)}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Preferred Date:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(preferred_date)}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Divers Count:</td><td style="padding:6px 0; font-weight:bold;">${num_divers}</td></tr>
              <tr><td style="padding:6px 0; color:#666;">Total Price:</td><td style="padding:6px 0; font-weight:bold; color:#00a8cc; font-size:16px;">${fmtPrice}</td></tr>
            </table>
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
