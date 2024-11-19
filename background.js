async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["groqcloudApiKey"], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.groqcloudApiKey);
      }
    });
  });
}

function preprocessAndChunkPolicy(policyText, maxChunkLength = 3000) {
  const commonKeywords = [
    "data", "privacy", "rights", "consent", "information", "security",
    "sharing", "retention", "cookies", "transfer", "process", "controller", "third parties"
  ];

  console.log("Starting preprocessing and chunking...");

  // Split the policy into sections based on double line breaks
  const sections = policyText.split(/\n{2,}/);
  console.log(`Total sections identified: ${sections.length}`);

  const scoredSections = sections.map((section, index) => {
    const score = commonKeywords.reduce((count, keyword) => {
      return count + (section.toLowerCase().includes(keyword) ? 1 : 0);
    }, 0);
    console.log(`Section ${index + 1}: Score = ${score}`);
    return { section: section.trim(), score };
  });

  // Sort sections by relevance
  scoredSections.sort((a, b) => b.score - a.score);

  let preprocessedText = "";
  let totalLength = 0;

  const chunks = [];
  const seenSections = new Set(); // Track processed sections to avoid duplication
  const truncatedSections = []; // Track sections that cannot be fully included

  for (const { section, score } of scoredSections) {
    if (seenSections.has(section)) {
      console.warn("Duplicate section detected, skipping...");
      continue; // Skip already processed sections
    }
    seenSections.add(section);

    if (totalLength + section.length > maxChunkLength) {
      const remainingLength = maxChunkLength - totalLength;

      // If the section is too long, split it into smaller parts
      const splitSection = splitLongSection(section, remainingLength);
      preprocessedText += splitSection.trim() + "\n\n";
      totalLength += splitSection.length;

      if (splitSection.length < section.length) {
        truncatedSections.push(section.slice(splitSection.length).trim());
      }
      break;
    }

    preprocessedText += section + "\n\n";
    totalLength += section.length;

    if (totalLength >= maxChunkLength) {
      console.log(`Creating chunk of size: ${preprocessedText.length}`);
      chunks.push(preprocessedText.trim());
      preprocessedText = ""; // Reset for the next chunk
      totalLength = 0;
    }
  }

  // Push any remaining text as the final chunk
  if (preprocessedText.trim().length > 0) {
    console.log(`Creating final chunk of size: ${preprocessedText.length}`);
    chunks.push(preprocessedText.trim());
  }

  // Process truncated sections
  truncatedSections.forEach((truncatedSection) => {
    console.log("Processing truncated section...");
    const truncatedChunks = preprocessAndChunkPolicy(truncatedSection, maxChunkLength);
    chunks.push(...truncatedChunks);
  });

  console.log(`Total chunks created: ${chunks.length}`);
  return chunks;
}

// Handle long sections by splitting them
function splitLongSection(section, maxLength) {
  const sentences = section.split(". ");
  let splitText = "";
  let length = 0;

  for (const sentence of sentences) {
    if (length + sentence.length + 2 > maxLength) {
      break;
    }
    splitText += sentence.trim() + ". ";
    length += sentence.length + 2;
  }

  console.log(`Split long section into: ${splitText.length} characters.`);
  return splitText.trim();
}

// Analyze Privacy Policy with Preprocessing and Chunking
async function analyzePrivacyPolicy(policyText) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("API key not set. Please set it in Chrome Storage.");
  }

  console.log(policyText);

  // Preprocess and chunk the privacy policy
  const chunks = preprocessAndChunkPolicy(policyText);

  console.log(chunks);

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const results = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const prompt = i === 0 
      ? `Summarize the following privacy policy in a clear, direct, and concise manner. Focus only on the key points and flag any major risks or notable details. Be brief:\n\n${chunk}` 
      : `Summarize the continuation of the privacy policy in a clear, direct, and concise manner. Focus only on the key points and flag any major risks or notable details. Be brief:\n\n${chunk}`;
      
    const payload = {
      model: "llama3-8b-8192",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300, // Limit output tokens
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("API call failed:", error);
      throw new Error(error.message || "Failed to analyze the privacy policy.");
    }

    const result = await response.json();

    if (
      result.choices &&
      result.choices[0] &&
      result.choices[0].message &&
      result.choices[0].message.content
    ) {
      results.push(result.choices[0].message.content.trim());
    } else {
      console.error("Unexpected API response structure:", result);
      throw new Error("Invalid API response structure.");
    }
  }

  return results.join("\n\n");
}

// Listener for Messages from the Popup or Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "analyze") {
    analyzePrivacyPolicy(request.data)
      .then((summary) => sendResponse({ summary }))
      .catch((error) => {
        console.error("Error during analysis:", error);
        sendResponse({ error: error.message });
      });
  }
  return true; // Keeps the listener active for async responses
});

