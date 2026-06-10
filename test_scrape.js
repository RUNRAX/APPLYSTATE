const url = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/4391531384";
fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
  }
}).then(res => res.text()).then(text => {
  const title = text.match(/<h2[^>]*top-card-layout__title[^>]*>(.*?)<\/h2>/is)?.[1]?.trim() || "Unknown Title";
  const company = text.match(/<a[^>]*topcard__org-name-link[^>]*>(.*?)<\/a>/is)?.[1]?.trim() || "Unknown Company";
  const desc = text.match(/<div[^>]*show-more-less-html__markup[^>]*>(.*?)<\/div>/is)?.[1]?.trim() || "Unknown Description";
  console.log("Title:", title);
  console.log("Company:", company);
  console.log("Description length:", desc.length);
});
