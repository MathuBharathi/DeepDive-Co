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
        from: `"DeepDive Ocean Adventures" <${emailUser}>`,
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
                <div style="text-align:center; margin:35px 0;">
                  <a href="https://deepdive.co.netlify.app/login_signup.html" style="background:linear-gradient(135deg,#00d4ff,#0099cc); color:#020b18; padding:14px 32px; text-decoration:none; font-weight:bold; border-radius:50px; text-transform:uppercase; font-size:13px; letter-spacing:2px; display:inline-block;">Log In & Explore</a>
                </div>
                <hr style="border:none; border-top:1px solid rgba(0,212,255,0.15); margin:30px 0;" />
                <p style="font-size:12px; color:rgba(232,244,255,0.5); text-align:center; margin:0;">DeepDive Marine Experiences · PADI 5-Star Dive Center</p>
              </div>
            </div>
          </div>
        `
      };

      // 2. Alert email to Admin
      const adminMailOptions = {
        from: `"DeepDive System" <${emailUser}>`,
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
        from: `"DeepDive Reservations" <${emailUser}>`,
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

                <div style="text-align:center; margin:30px 0 10px 0;">
                  <a href="https://deepdive.co.netlify.app/profile.html" style="background:linear-gradient(135deg,#00d4ff,#0099cc); color:#020b18; padding:12px 30px; text-decoration:none; font-weight:bold; border-radius:50px; text-transform:uppercase; font-size:12px; letter-spacing:2px; display:inline-block;">View My Bookings</a>
                </div>
              </div>
            </div>
          </div>
        `
      };

      // 2. Booking Alert Email to Admin
      const adminBookingMailOptions = {
        from: `"DeepDive Booking Alert" <${emailUser}>`,
        to: adminEmail,
        subject: `[NEW BOOKING] ${escapeHtml(customer_name)} - ${escapeHtml(destination)} (${preferred_date})`,
        html: `
          <div style="background-color:#f4f7f6; font-family:sans-serif; padding:30px;">
            <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; padding:25px; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
              <h2 style="color:#036b8a; margin-top:0;">🚤 New Dive Booking Received!</h2>
              <table style="width:100%; border-collapse:collapse; margin-top:15px;">
                <tr><td style="padding:6px 0; color:#666;">Customer Name:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(customer_name)}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Email:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(customer_email)}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Phone:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(phone || 'Not provided')}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Destination:</td><td style="padding:6px 0; font-weight:bold; color:#036b8a;">${escapeHtml(destination)}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Dive Package:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(dive_type)}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Experience Level:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(experience_level)}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Preferred Date:</td><td style="padding:6px 0; font-weight:bold;">${escapeHtml(preferred_date)}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Divers Count:</td><td style="padding:6px 0; font-weight:bold;">${num_divers}</td></tr>
                <tr><td style="padding:6px 0; color:#666;">Total Price:</td><td style="padding:6px 0; font-weight:bold; color:#00a8cc; font-size:16px;">${fmtPrice}</td></tr>
                ${special_requests ? `<tr><td style="padding:6px 0; color:#666;">Special Requests:</td><td style="padding:6px 0; font-style:italic;">${escapeHtml(special_requests)}</td></tr>` : ''}
              </table>
              <div style="margin-top:25px; text-align:center;">
                <a href="https://deepdive.co.netlify.app/admin.html" style="background:#036b8a; color:#ffffff; padding:10px 24px; border-radius:5px; text-decoration:none; font-weight:bold;">Manage in Admin Panel</a>
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
