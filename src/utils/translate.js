export async function translateText(text, sourceLang = 'ja', targetLang = 'en') {
    const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
    
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text'
          }),
        }
      );
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return data.data.translations[0].translatedText;
    } catch (error) {
      throw new Error(`翻訳エラー: ${error.message}`);
    }
  }