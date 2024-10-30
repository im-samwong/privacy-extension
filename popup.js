document.getElementById("analyze").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      { target: { tabId: tabs[0].id }, files: ["content.js"] },
      () => {
        chrome.tabs.sendMessage(tabs[0].id, { message: "check_policy" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError);
          } else if (response && response.isPolicyPage) {
            console.log("Analyzing privacy policy:", response.policyText);
            chrome.runtime.sendMessage({ message: "analyze", data: response.policyText }, (result) => {
              console.log("Received result:", result);
              document.getElementById("output").innerHTML = `<p>${result.summary}</p>`;
            });
          } else {
            console.log("This page doesn’t appear to contain a privacy policy.");
            document.getElementById("output").innerHTML = `<p class="warning">This page doesn’t appear to contain a privacy policy.</p>`;
          }
        });
      }
    );
  });
});
