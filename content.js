function isPrivacyPolicyPage() {
  const keywords = ["privacy policy", "terms of service", "data protection"];
  const bodyText = document.body.innerText.toLowerCase();
  
  return keywords.some(keyword => bodyText.includes(keyword));
}

function extractPrivacyPolicy() {
  let content = "";
  const tags = document.querySelectorAll("p, div, section");

  tags.forEach(tag => {
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
