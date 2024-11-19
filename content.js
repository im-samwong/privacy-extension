function isPrivacyPolicyPage() {
  const keywords = ["privacy policy", "terms of service", "data protection", "user privacy", "gdpr", "ccpa"];
  const urlKeywords = ["privacy", "policy", "terms", "data-protection"];
  const tags = document.querySelectorAll("h1, h2, h3, meta[name='description'], title");
  let score = 0;

  // Check the URL for keywords
  const url = window.location.href.toLowerCase();
  urlKeywords.forEach((keyword) => {
    if (url.includes(keyword)) {
      score += 15; // URLs with these keywords are highly indicative
    }
  });

  // Analyze headers and meta description for keywords
  tags.forEach((tag) => {
    const text = (tag.content || tag.textContent || "").toLowerCase();
    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        score += 10;
      }
    });
  });

  // Analyze body text for keyword frequency
  const bodyText = document.body.innerText.toLowerCase();
  const frequency = keywords.reduce((count, keyword) => count + (bodyText.split(keyword).length - 1), 0);
  score += frequency * 2;

  return score > 25; // Adjust threshold based on testing
}

function extractPrivacyPolicy() {
  let content = "";
  const tags = document.querySelectorAll("p, div, section");

  tags.forEach((tag) => {
    if (/privacy|policy/i.test(tag.textContent)) {
      content += tag.textContent + "\n";
    }
  });
  return content;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "check_policy_page") {
    sendResponse({ isPolicyPage: isPrivacyPolicyPage() });
  } else if (request.message === "scrape") {
    const policyText = extractPrivacyPolicy();
    sendResponse({ data: policyText });
  }
});
