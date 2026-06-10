const fs = require('fs');
const url = "https://www.linkedin.com/jobs/view/4391531384";
fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  }
}).then(res => res.text()).then(text => {
  fs.writeFileSync('linkedin_dump.html', text);
}).catch(e => console.error(e));
