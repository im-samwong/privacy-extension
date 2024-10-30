function extractPrivacyPolicy() {
  let content = "";
  const tags = document.querySelectorAll("p, div, section");

  tags.forEach(tag => {
    if (/privacy|policy|data protection|terms of service/i.test(tag.textContent)) {
      content += tag.textContent + "\n";
    }
  });

  return content.trim();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message:", request);
  if (request.message === "check_policy") {
    const policyText = extractPrivacyPolicy();
    const isPolicyPage = policyText.length > 200; // Basic check based on text length

    sendResponse({ isPolicyPage, policyText });
  }
  return true;
});


console.log("content.js loaded");
