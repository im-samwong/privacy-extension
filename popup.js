function initializePopup() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error("No active tabs found.");
      updateStatusMessage("Unable to detect the active tab.", true);
      return;
    }

    const tabId = tabs[0].id;
    checkPolicyPage(tabId); // Call the logic to check the page on popup load
  });
}

function checkPolicyPage(tabId) {
  chrome.tabs.sendMessage(tabId, { message: "check_policy_page" }, (response) => {
    const analyzeButton = document.getElementById("analyze");
    if (chrome.runtime.lastError) {
      console.error("Error checking policy page:", chrome.runtime.lastError.message);
      updateStatusMessage("Error checking the page. Please try again after refreshing the page.", true);
      analyzeButton.disabled = false;
    } else if (response && response.isPolicyPage) {
      updateStatusMessage("Privacy policy detected.", false);
      analyzeButton.disabled = false;
    } else {
      updateStatusMessage(
        "No privacy policy detected. You can analyze the page manually.\nNote: Since privacy policy not detected, the analysis may not be accurate.",
        false
      );
      analyzeButton.disabled = false; // Allow manual analysis
    }
  });
}

function analyzePage(tabId) {
  chrome.tabs.sendMessage(tabId, { message: "scrape" }, (response) => {
    const output = document.getElementById("output");
    const analyzeButton = document.getElementById("analyze");

    if (chrome.runtime.lastError) {
      console.error("Error scraping page:", chrome.runtime.lastError.message);
      updateStatusMessage("Error scraping the page. Please try again.", true);
      return;
    }

    if (response && response.data) {
      updateStatusMessage("Analyzing privacy policy...", false);
      analyzeButton.disabled = true;

      chrome.runtime.sendMessage(
        { message: "analyze", data: response.data },
        (result) => {
          if (chrome.runtime.lastError) {
            console.error("Error during analysis:", chrome.runtime.lastError.message);
            updateStatusMessage("Analysis failed. Please try again.", true);
          } else if (result && result.summary) {
            output.innerText = result.summary;
            updateStatusMessage("Analysis complete.", false);
          } else {
            output.innerText = result.error || "Unknown error occurred.";
            updateStatusMessage("Error during analysis.", true);
          }
          analyzeButton.disabled = false;
        }
      );
    } else {
      updateStatusMessage("Failed to retrieve content. Please try again.", true);
    }
  });
}

function clearOutput() {
  const output = document.getElementById("output");
  output.innerText = "";
  updateStatusMessage("Ready for analysis.", false);
  initializePopup(); // Re-check the page after clearing the output
}

function updateStatusMessage(message, isError) {
  const statusMessage = document.getElementById("status-message");
  statusMessage.innerText = message;
  statusMessage.style.color = isError ? "red" : "#555"; // Set error messages to red
}

// Event listeners
document.getElementById("analyze").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error("No active tabs found for analysis.");
      updateStatusMessage("No active tab detected. Please try again.", true);
      return;
    }
    analyzePage(tabs[0].id);
  });
});

document.getElementById("clear").addEventListener("click", clearOutput);

// Initialize popup
document.addEventListener("DOMContentLoaded", initializePopup);
