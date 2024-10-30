document.getElementById("analyze").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { message: "check_policy_page" }, (response) => {
      if (response.isPolicyPage) {
        analyzePage(tabs[0].id);
      } else {
        document.getElementById("status-message").innerText = 
          "This page does not appear to be a privacy policy page. Analyzing anyway...";
        analyzePage(tabs[0].id);
      }
    });
  });
});

function analyzePage(tabId) {
  chrome.tabs.sendMessage(tabId, { message: "scrape" }, (response) => {
    if (response && response.data) {
      chrome.runtime.sendMessage({ message: "analyze", data: response.data }, (result) => {
        document.getElementById("output").innerText = result.summary;
      });
    } else {
      document.getElementById("output").innerText = 
        "Failed to retrieve or analyze content. Please try again.";
    }
  });
}
