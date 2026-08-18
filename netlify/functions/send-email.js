const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Successful OPTIONS preflight' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { type, data } = payload;

    const smtpHost   = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const smtpPort   = Number(process.env.SMTP_PORT || 465);
    const smtpEmail  = (process.env.SMTP_EMAIL || '').trim();
    const rawPass    = process.env.SMTP_PASSWORD || '';
    const smtpPass   = rawPass.replace(/\s+/g, '');
    const adminEmail = (process.env.ADMIN_EMAIL || smtpEmail).trim();

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpEmail,
        pass: smtpPass
      }
    });

    if (type === 'signup') {
      const { user_email, full_name } = data;
      const customerName = full_name || user_email.split('@')[0];

      // 1. Welcome email to User
      const userMailOptions = {
        from: `"DeepDive Ocean Adventures" <${smtpEmail}>`,
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

      // 2. Alert email to Admin
      const adminMailOptions = {
        from: `"DeepDive System" <${smtpEmail}>`,
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

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Sign up emails sent successfully' }) };

    } else if (type === 'booking') {
      const {
        booking_id, customer_name, customer_email, phone, destination,
        dive_type, experience_level, num_divers, preferred_date,
        total_price, currency, special_requests
      } = data;

      const fmtPrice = `${currency === 'INR' ? '₹' : (currency || 'INR') + ' '} ${Number(total_price || 0).toLocaleString('en-IN')}`;

      // 1. Booking Confirmation Email to Customer
      const customerMailOptions = {
        from: `"DeepDive Reservations" <${smtpEmail}>`,
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

      // 2. Booking Alert Email to Admin
      const adminBookingMailOptions = {
        from: `"DeepDive Booking Alert" <${smtpEmail}>`,
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

      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Booking emails sent successfully' }) };

    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email notification type' }) };
    }

  } catch (error) {
    console.error('[DeepDive Email Error]:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send email', details: error.message })
    };
  }
};

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
