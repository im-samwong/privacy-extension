async function analyzePrivacyPolicy(policyText) {
  const apiKey = 'YOUR_OPENAI_API_KEY';
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Summarize privacy policy content and flag privacy risks." },
        { role: "user", content: policyText }
      ]
    })
  });

  const result = await response.json();
  return result.choices[0].message.content;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "analyze") {
    analyzePrivacyPolicy(request.data).then(summary => {
      sendResponse({ summary });
    });
  }
  return true;
});