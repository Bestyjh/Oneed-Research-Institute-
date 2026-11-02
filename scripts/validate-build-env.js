const fs = require("fs");
const dotenv = require("dotenv");

for (const file of [".env.local", ".env.production"]) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file });
  }
}

const url = process.env.REACT_APP_SUPABASE_URL || "";
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

let validUrl = false;

try {
  const parsed = new URL(url);
  validUrl =
    parsed.protocol === "https:" &&
    /^[a-z0-9-]+\.supabase\.co$/.test(parsed.hostname) &&
    parsed.pathname === "/" &&
    !parsed.search &&
    !parsed.hash;
} catch {
  validUrl = false;
}

const validKey =
  key.startsWith("sb_publishable_") &&
  key.length > "sb_publishable_".length;

if (!validUrl || !validKey) {
  console.error(
    "Build failed: Invalid Supabase frontend configuration."
  );
  process.exit(1);
}

console.log("Supabase frontend build configuration verified.");
