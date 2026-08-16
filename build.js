const fs = require('fs');
const path = require('path');

// Extract browser-safe environment variables ONLY
let supabaseUrl = (process.env.SUPABASE_URL || '').trim();
let supabaseAnon = (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON || '').trim();

// Local fallback: read from .env if running locally and process.env is empty
const envPath = path.join(__dirname, '.env');
if ((!supabaseUrl || !supabaseAnon) && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/SUPABASE_URL=(.*)/);
  const keyMatch = envContent.match(/SUPABASE_ANON_KEY=(.*)/) || envContent.match(/SUPABASE_ANON=(.*)/);
  if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1].trim();
  if (keyMatch && keyMatch[1]) supabaseAnon = keyMatch[1].trim();
}

// Generate ONLY browser-safe public variables for env.js
const content = `// Auto-generated browser configuration file during build (gitignored)
window.__env = {
  SUPABASE_URL: "${supabaseUrl}",
  SUPABASE_ANON: "${supabaseAnon}"
};
`;

const targetPath = path.join(__dirname, 'env.js');
fs.writeFileSync(targetPath, content, 'utf8');
console.log('[Build] Successfully generated browser-safe env.js.');
