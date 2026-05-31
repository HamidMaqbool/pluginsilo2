// ajaxHelper.ts
export async function ajaxRequest({ data = {}, type = '' }) {
  // Use local backend proxy to avoid CORS and fetch failures
  let url = '/api/proxy';

  let formData;
  if (data instanceof FormData) {
    formData = data;

    formData.append('action', 'plugins_silo');

    formData.append('type', type);

  } else {
    formData = new FormData();
    formData.append('action', 'plugins_silo');
    formData.append('type', type);
    
    const appendRecursive = (form: FormData, k: string, v: any) => {
      if (v === null || v === undefined) return;
      if (typeof v === 'object' && !(v instanceof File) && !Array.isArray(v)) {
        Object.entries(v).forEach(([subKey, subVal]) => {
          appendRecursive(form, `${k}[${subKey}]`, subVal);
        });
      } else if (Array.isArray(v)) {
        v.forEach((item, index) => {
          appendRecursive(form, `${k}[${index}]`, item);
        });
      } else {
        form.append(k, v);
      }
    };

    Object.entries(data).forEach(([key, value]) => {
      appendRecursive(formData, key, value);
    });
  }
  try {
    const res = await fetch(url || '', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });
    const text = await res.text();
    return extractJSON(text);
  } catch (err) {
    console.error('Ajax request failed:', err);
    return {
      success: false,
      message: 'Failed to fetch resources from the server. Please check your network connection.'
    };
  }
}

function extractJSON(str: string) {
  const trimmed = str.trim();
  
  // 1. Find the starting point of the JSON object/array
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  
  if (startIdx === -1) {
    throw new Error('No JSON structure found in response: ' + trimmed.substring(0, 100));
  }
  
  let candidate = trimmed.substring(startIdx);
  
  // Try up to 10 iterations of error-position truncation
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      return JSON.parse(candidate);
    } catch (e: any) {
      const msg = e.message || '';
      
      // Parse "at position XXX" out of V8 SyntaxError
      const matchPos = msg.match(/at position (\d+)/i);
      if (matchPos) {
        const pos = parseInt(matchPos[1], 10);
        if (pos > 0 && pos < candidate.length) {
          candidate = candidate.substring(0, pos);
          continue;
        }
      }
      
      // Parse "at index XXX" out of other engine errors
      const matchIdx = msg.match(/at index (\d+)/i);
      if (matchIdx) {
        const pos = parseInt(matchIdx[1], 10);
        if (pos > 0 && pos < candidate.length) {
          candidate = candidate.substring(0, pos);
          continue;
        }
      }
      
      // Fallback: Backward scan from right to left, searching for matching closing delimiter
      const isObject = candidate.startsWith('{');
      const targetChar = isObject ? '}' : ']';
      let searchIdx = candidate.lastIndexOf(targetChar);
      
      while (searchIdx !== -1) {
        try {
          return JSON.parse(candidate.substring(0, searchIdx + 1));
        } catch {
          searchIdx = candidate.lastIndexOf(targetChar, searchIdx - 1);
        }
      }
      
      // If we could not extract any valid prefix, throw the original syntax error
      throw e;
    }
  }
  
  throw new Error('Failed to extract JSON after maximum attempts');
}
