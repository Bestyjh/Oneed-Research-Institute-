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
  const supabaseUrlNames = Object.keys(process.env)
    .filter((name) =>
      /SUPABASE.*URL|URL.*SUPABASE/i.test(name)
    )
    .sort();

  console.error("Supabase URL environment diagnostics:", {
    matchingNames: supabaseUrlNames,
    frontendUrlDefined: Object.prototype.hasOwnProperty.call(
      process.env,
      "REACT_APP_SUPABASE_URL"
    ),
    backendUrlPresent: Boolean(process.env.SUPABASE_URL),
  });
  console.error("Supabase build diagnostics:", {
    urlPresent: Boolean(url),
    urlValid: validUrl,
    keyPresent: Boolean(key),
    keyFormatValid: validKey,
  });
  console.error(
    "Build failed: Invalid Supabase frontend configuration."
  );
  process.exit(1);
}

console.log("Supabase frontend build configuration verified.");
