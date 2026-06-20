export const formatContent = (text: string, type: string) => {
  let content = text;

  // Remove markdown code fences (``` and ~~~) early to avoid interfering with JSON extraction
  content = content.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');

  // Try to parse embedded JSON first (after removing fences)
  let parsedJson: any = null;
  try {
    const jsonMatch = content.match(/```?json\n?([\s\S]*?)\n?```|({[\s\S]*})/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[2];
      parsedJson = JSON.parse(jsonStr);
      // Extract text content from parsed JSON
      if (parsedJson.content) {
        content = parsedJson.content;
      } else if (typeof parsedJson === 'object') {
        // Try to reconstruct text from JSON structure
        const parts: string[] = [];
        if (parsedJson.title) parts.push(parsedJson.title);
        if (parsedJson.intro) parts.push(parsedJson.intro);
        if (parsedJson.sections && Array.isArray(parsedJson.sections)) {
          parsedJson.sections.forEach((section: any) => {
            if (section.heading) parts.push(section.heading);
            if (section.body) parts.push(section.body);
          });
        }
        if (parsedJson.conclusion) parts.push(parsedJson.conclusion);
        if (parts.length > 0) {
          content = parts.join('\n\n');
        }
      }
    }
  } catch {
    // If JSON parsing fails, continue with text processing
  }

  // Remove leading markdown headers (allow no space after hashes)
  content = content.replace(/^#+\s*(.*)$/gm, '$1');

  // Remove any remaining solitary lines made of hashes
  content = content.replace(/(^|\n)\s*#+\s*(?=\n|$)/g, '$1');

  // Remove inline lone hash tokens (try to avoid removing valid C# mentions by targeting standalone hashes)
  content = content.replace(/(^|\s)#(?=\s|$)/g, '$1');

  // Clean up extra whitespace
  const cleaned = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/g, '')
    .trim();

  const words = cleaned ? cleaned.split(/\s+/).length : 0;
  const sentences = cleaned.split(/[.!?]+/).filter(Boolean).length;

  const avgWordsPerSentence = words / Math.max(sentences, 1);

  // Better heuristic scoring
  let qualityScore = 50;

  if (words > 200) qualityScore += 10;
  if (words > 500) qualityScore += 10;

  if (avgWordsPerSentence < 20) qualityScore += 10; // readability
  if (sentences > 5) qualityScore += 10;
  if (parsedJson) qualityScore += 10; // bonus for structured JSON

  return {
    content: cleaned,
    wordCount: words,
    type,
    qualityScore: Math.min(100, qualityScore)
  };
};