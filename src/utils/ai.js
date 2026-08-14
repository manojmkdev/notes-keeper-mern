export const getGeminiApiKey = () => {
  return process.env.REACT_APP_GEMINI_API_KEY || '';
};

export const improveContentWithAI = async (htmlContent, apiKey) => {
  const systemPrompt = `You are a professional assistant built into a Note-taking application.
Your task is to take the user's rough notes, correct all grammatical, spelling, and punctuation errors, and summarize/re-structure them into a clean, professional, and well-organized note.
CRITICAL: The input content is HTML text from a rich-text editor (React Quill). You MUST preserve appropriate HTML tags (like <p>, <ul>, <ol>, <li>, <strong>, <em>, <u>, <a>, <h1>, <h2>, <h3>, <blockquote>, <pre>, etc.) so that the formatting is preserved in the editor.
Clean up the structure, make sure bullet points and paragraphs are correctly represented in HTML format.
Do NOT include any introductory or concluding remarks, explanations, or markdown code blocks (such as \`\`\`html or \`\`\`). Return ONLY the clean, formatted HTML content.`;

  const prompt = `${systemPrompt}\n\nHere is the rough note in HTML format:\n${htmlContent}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        }
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  let resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!resultText) {
    throw new Error('Failed to generate improved note content from Gemini API.');
  }

  resultText = resultText.trim();
  if (resultText.startsWith('```html')) {
    resultText = resultText.substring(7);
  } else if (resultText.startsWith('```')) {
    resultText = resultText.substring(3);
  }
  if (resultText.endsWith('```')) {
    resultText = resultText.substring(0, resultText.length - 3);
  }
  
  return resultText.trim();
};
