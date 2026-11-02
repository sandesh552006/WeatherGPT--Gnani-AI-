/**
 * Utility for sanitizing Markdown-rich weather responses into natural,
 * fluent speech text for Gnani Timbre Text-to-Speech (TTS).
 *
 * Responsibilities:
 * 1. Strips Markdown formatting (headings, bold, italics, bullets, code).
 * 2. Removes non-pronounceable emojis and decorative symbols.
 * 3. Expands weather units (°C, km/h, %, mm) into fluent spoken phrases in English, Hindi, and Marathi.
 * 4. Preserves city names, numerical measurements, and temporal information.
 * 5. Handles negative temperatures and decimals gracefully.
 */

const EMOJI_REGEX =
  /[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uFE00-\uFE0F]|[\u200D\u200C]/g;

const DECORATIVE_SYMBOLS_REGEX = /[•●▪◆★☆→←↓↑]/g;

export function sanitizeTextForSpeech(
  markdownText: string | null | undefined,
  language: string = 'en'
): string {
  if (!markdownText || typeof markdownText !== 'string') return '';

  let text = markdownText.trim();
  if (!text) return '';

  const lang = (language || 'en').toLowerCase().split(/[-_]/)[0];

  // 1. Remove code blocks and inline code
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 2. Remove HTML tags if present
  text = text.replace(/<[^>]+>/g, '');

  // 3. Remove Markdown images and links: [Text](url) -> Text
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 4. Handle "approximately" tilde before numbers: e.g. ~12 mm -> "लगभग 12 मिमी"
  if (lang === 'hi') {
    text = text.replace(/~([0-9]+)/g, 'लगभग $1');
  } else if (lang === 'mr') {
    text = text.replace(/~([0-9]+)/g, 'सुमारे $1');
  } else {
    text = text.replace(/~([0-9]+)/g, 'approximately $1');
  }

  // 5. Expand weather units into natural spoken expressions based on language
  if (lang === 'hi') {
    // Negative temperature: -5°C -> माइनस 5 डिग्री सेल्सियस
    text = text.replace(/-([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi, 'माइनस $1 डिग्री सेल्सियस');
    // Temperature range: 18°C to 32°C / 18°C से 32°C
    text = text.replace(
      /([0-9]+(?:\.[0-9]+)?)\s*°\s*C\s*(?:से|to|-)\s*([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi,
      '$1 से $2 डिग्री सेल्सियस'
    );
    // Single temperature: 28°C -> 28 डिग्री सेल्सियस
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi, '$1 डिग्री सेल्सियस');
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*°/g, '$1 डिग्री');

    // Wind speed: 15 km/h / 15 किमी/घंटा -> 15 किलोमीटर प्रति घंटा
    text = text.replace(
      /([0-9]+(?:\.[0-9]+)?)\s*(?:km\/h|kmph|किमी\/घंटा|किमी\/घं)/gi,
      '$1 किलोमीटर प्रति घंटा'
    );

    // Percentage: 75% -> 75 प्रतिशत
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*%/g, '$1 प्रतिशत');

    // Rainfall: 12 mm / 12 मिमी -> 12 मिलीमीटर
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*(?:mm|मिमी)/gi, '$1 मिलीमीटर');

    // Pressure: 1013 hPa -> 1013 हेक्टोपास्कल
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*hPa/gi, '$1 हेक्टोपास्कल');
  } else if (lang === 'mr') {
    // Negative temperature: -5°C -> उणे 5 अंश सेल्सिअस
    text = text.replace(/-([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi, 'उणे $1 अंश सेल्सिअस');
    // Temperature range: 18°C to 32°C / 18°C ते 32°C
    text = text.replace(
      /([0-9]+(?:\.[0-9]+)?)\s*°\s*C\s*(?:ते|to|-)\s*([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi,
      '$1 ते $2 अंश सेल्सिअस'
    );
    // Single temperature: 28°C -> 28 अंश सेल्सिअस
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi, '$1 अंश सेल्सिअस');
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*°/g, '$1 अंश');

    // Wind speed: 15 km/h / 15 किमी/तास -> 15 किलोमीटर प्रति तास
    text = text.replace(
      /([0-9]+(?:\.[0-9]+)?)\s*(?:km\/h|kmph|किमी\/तास)/gi,
      '$1 किलोमीटर प्रति तास'
    );

    // Percentage: 75% -> 75 टक्के
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*%/g, '$1 टक्के');

    // Rainfall: 12 mm / 12 मिमी -> 12 मिलीमीटर
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*(?:mm|मिमी)/gi, '$1 मिलीमीटर');

    // Pressure: 1013 hPa -> 1013 हेक्टोपास्कल
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*hPa/gi, '$1 हेक्टोपास्कल');
  } else {
    // English (default)
    // Negative temperature: -5°C -> minus 5 degrees Celsius
    text = text.replace(/-([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi, 'minus $1 degrees Celsius');
    // Temperature range: 18°C to 32°C
    text = text.replace(
      /([0-9]+(?:\.[0-9]+)?)\s*°\s*C\s*(?:to|-)\s*([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi,
      '$1 to $2 degrees Celsius'
    );
    // Single temperature: 28°C -> 28 degrees Celsius
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*°\s*C/gi, '$1 degrees Celsius');
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*°/g, '$1 degrees');

    // Wind speed: 15 km/h -> 15 kilometers per hour
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*(?:km\/h|kmph|km\/hr)/gi, '$1 kilometers per hour');

    // Percentage: 75% -> 75 percent
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*%/g, '$1 percent');

    // Rainfall: 12 mm -> 12 millimeters
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*mm\b/gi, '$1 millimeters');

    // Pressure: 1013 hPa -> 1013 hectopascals
    text = text.replace(/([0-9]+(?:\.[0-9]+)?)\s*hPa/gi, '$1 hectopascals');
  }

  // 6. Remove Markdown headings (#, ##, ###)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // 7. Remove Markdown bold and italics (**text**, *text*, __text__, _text_)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // 8. Remove bullet symbols and list prefixes (•, -, *, 1.)
  text = text.replace(/^\s*[•\-\*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // 9. Remove horizontal rules and blockquote markers
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  text = text.replace(/^>\s+/gm, '');

  // 10. Remove emojis and non-pronounceable symbols
  text = text.replace(EMOJI_REGEX, '');
  text = text.replace(DECORATIVE_SYMBOLS_REGEX, '');

  // 11. Normalize newlines to period/space so sentences pause naturally
  text = text.replace(/\r?\n+/g, '. ');

  // 12. Clean up multiple periods, whitespace, and Devanagari purna viram
  text = text.replace(/।\./g, '।');
  text = text.replace(/\.।/g, '।');
  text = text.replace(/।+/g, '।');
  text = text.replace(/\.{2,}/g, '.');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\s+\./g, '.');
  text = text.replace(/\s+।/g, '।');
  text = text.trim();

  // 13. Ensure sentence ends with appropriate punctuation
  if (text && !/[.!?।]$/.test(text)) {
    text += lang === 'hi' || lang === 'mr' ? '।' : '.';
  }

  // 14. If text exceeds maximum speech length, truncate cleanly at a sentence boundary
  const MAX_SPEECH_CHARS = 1200;
  if (text.length > MAX_SPEECH_CHARS) {
    const cut = text.slice(0, MAX_SPEECH_CHARS);
    const lastPunct = Math.max(
      cut.lastIndexOf('.'),
      cut.lastIndexOf('।'),
      cut.lastIndexOf('!'),
      cut.lastIndexOf('?')
    );
    if (lastPunct > 400) {
      text = cut.slice(0, lastPunct + 1);
    } else {
      text = cut.trim() + '...';
    }
  }

  return text;
}

