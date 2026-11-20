const expected = [
  'REACT_APP_SUPABASE_URL',
  'SUPABASE_URL',
  'REACT_APP_SUPABASE_ANON_KEY',
  'ONEED_BUILD_PROBE',
];

const matchingNames = Object.keys(process.env)
  .filter((name) => /SUPABASE|CLOUDFLARE|CF_PAGES/i.test(name))
  .sort();

console.log('Cloudflare Preview environment diagnostic:', {
  expectedPresence: Object.fromEntries(
    expected.map((name) => [
      name,
      Object.prototype.hasOwnProperty.call(process.env, name),
    ])
  ),
  matchingNames,
  ciPresent: Boolean(process.env.CI),
});
