require('dotenv').config();
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });

async function translateText(text, targetLanguage) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY === 'your_google_translate_api_key_here') {
    return { translatedText: text, detectedLanguage: 'en' };
  }
  try {
    const [translation, metadata] = await translate.translate(text, targetLanguage);
    return {
      translatedText: translation,
      detectedLanguage: metadata.data.translations[0].detectedSourceLanguage || 'unknown',
    };
  } catch (err) {
    console.error('Translation error:', err.message);
    return { translatedText: text, detectedLanguage: 'unknown' };
  }
}

async function detectLanguage(text) {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY === 'your_google_translate_api_key_here') {
    return 'en';
  }
  try {
    const [detection] = await translate.detect(text);
    return detection.language;
  } catch {
    return 'en';
  }
}

module.exports = { translateText, detectLanguage };
