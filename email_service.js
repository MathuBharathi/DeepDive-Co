// =============================================================
// DeepDive — Email Service Helper (Client Side)
// Sends email notifications for Sign-Up & Booking Details.
// =============================================================

// Smart endpoint resolution: tries local development server endpoint first, then falls back to Netlify functions
function getEmailEndpoints() {
  const isLocal = window.location.protocol === 'file:' ||
                  window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return [
      'http://localhost:3000/send-email',
      'http://127.0.0.1:3000/send-email',
      '/.netlify/functions/send-email'
    ];
  }
  return [
    '/.netlify/functions/send-email'
  ];
}

async function postEmailData(payload) {
  const endpoints = getEmailEndpoints();
  let lastError = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.ok && result.success !== false) {
        console.log(`[EmailService] Emails dispatched via ${url}`);
        return result;
      }
      lastError = result.error || 'Server error';
    } catch (err) {
      lastError = err.message;
    }
  }

  console.warn('[EmailService] Email notification endpoint unreachable:', lastError);
  console.info('💡 [EmailService Tip]: To send emails locally, run "npm start" (or "node server.js") in your terminal!');
  return { success: false, error: lastError };
}

/**
 * Sends welcome & admin alert email upon new user sign up
 */
async function sendSignUpNotification({ user_email, full_name }) {
  return await postEmailData({
    type: 'signup',
    data: { user_email, full_name }
  });
}

/**
 * Sends booking confirmation invoice & admin alert email upon new booking
 */
async function sendBookingNotification(bookingData) {
  return await postEmailData({
    type: 'booking',
    data: bookingData
  });
}
