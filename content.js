// Function to extract the main content
function extractPrivacyPolicy() {
    // Search for common tags (e.g., based on heading keywords)
    let content = "";
    const tags = document.querySelectorAll("p, div, section");
  
    tags.forEach(tag => {
      if (/privacy|policy/i.test(tag.textContent)) {
        content += tag.textContent + "\n";
      }
    });
    return content;
  }
  
  // Send extracted content to background.js
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "scrape") {
      const policyText = extractPrivacyPolicy();
      sendResponse({ data: policyText });
    }
  });
  