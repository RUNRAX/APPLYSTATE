const fs = require('fs');
const html = fs.readFileSync('linkedin_dump.html', 'utf8');

const title = html.match(/<title>(.*?)<\/title>/);
console.log('Title:', title ? title[1] : null);

const ogTitle = html.match(/<meta property="og:title" content="(.*?)"/);
console.log('OG Title:', ogTitle ? ogTitle[1] : null);

// Look for json-ld schema
const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
if (schemaMatch) {
  try {
    const data = JSON.parse(schemaMatch[1]);
    console.log("Schema Title:", data.title);
    console.log("Schema Company:", data.hiringOrganization?.name);
    console.log("Schema Desc:", data.description ? data.description.substring(0, 100) + "..." : null);
  } catch(e) {}
}
