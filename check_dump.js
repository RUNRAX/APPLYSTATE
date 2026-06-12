const fs = require('fs');
const html = fs.readFileSync('scratch/linkedin_dump.html', 'utf8');

const titleMatch = html.match(/<title>(.*?)<\/title>/i);
console.log('Title:', titleMatch ? titleMatch[1] : 'none');

const classes = html.match(/class=\"([^\"]+)\"/g);
if (classes) {
  const unique = [...new Set(classes.map(c => c.replace('class=\"', '').replace('\"', '')).join(' ').split(' '))];
  console.log('Job/card classes:', unique.filter(c => c.includes('job') || c.includes('scaffold') || c.includes('card')));
}

const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/si);
if (bodyMatch) {
  const bodyText = bodyMatch[1].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log('Body snippet:', bodyText.substring(0, 500));
}
