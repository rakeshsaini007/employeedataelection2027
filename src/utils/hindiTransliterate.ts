const TRANSLITERATION_CACHE = new Map<string, string>();

const COMMON_NAME_MAP: Record<string, string> = {
  singh: 'सिंह',
  kumar: 'कुमार',
  kumari: 'कुमारी',
  devi: 'देवी',
  sharma: 'शर्मा',
  verma: 'वर्मा',
  yadav: 'यादव',
  gupta: 'गुप्ता',
  agrawal: 'अग्रवाल',
  agarwal: 'अग्रवाल',
  tiwari: 'तिवारी',
  mishra: 'मिश्रा',
  pandey: 'पाण्डेय',
  shukla: 'शुक्ला',
  dubey: 'दुबे',
  chaudhary: 'चौधरी',
  choudhary: 'चौधरी',
  patel: 'पटेल',
  saxena: 'सक्सेना',
  srivastava: 'श्रीवास्तव',
  bhardwaj: 'भारद्वाज',
  kaushik: 'कौशिक',
  chauhan: 'चौहान',
  rawat: 'रावत',
  bisht: 'बिष्ट',
  joshi: 'जोशी',
  khan: 'खान',
  ali: 'अली',
  ahmad: 'अहमद',
  ahmed: 'अहमद',
  mohd: 'मोहम्मद',
  mohammad: 'मोहम्मद',
  begum: 'बेगम',
  fatma: 'फातिमा',
  fatima: 'फातिमा',
  ram: 'राम',
  krishna: 'कृष्ण',
  shri: 'श्री',
  sri: 'श्री',
  lal: 'लाल',
  prakash: 'प्रकाश',
  chandra: 'चन्द्र',
  pal: 'पाल',
  raj: 'राज',
  rajeev: 'राजीव',
  prempal: 'प्रेमपाल',
  virendra: 'वीरेंद्र',
  surendra: 'सुरेंद्र',
  mahendra: 'महेंद्र',
  devendra: 'देवेंद्र',
  narendra: 'नरेंद्र',
  rajendra: 'राजेंद्र',
  dharam: 'धरम',
  satyendra: 'सत्येंद्र',
  jitendra: 'जीतेंद्र',
  anita: 'अनीता',
  sunita: 'सुनीता',
  arti: 'आरती',
  pooja: 'पूजा',
  neha: 'नेहा',
  priya: 'प्रिया',
  rekha: 'रेखा',
  seema: 'सीमा',
  meena: 'मीना',
  geeta: 'गीता',
  sita: 'सीता',
  sanju: 'संजू',
  rinku: 'रिंकू',
  ankur: 'अंकुर',
  deepak: 'दीपक',
  vinod: 'विनोद',
  manoj: 'मनोज',
  rakesh: 'राकेश',
  suresh: 'सुरेश',
  ramesh: 'रमेश',
  mahesh: 'महेश',
  naresh: 'नरेश',
  dinesh: 'दिनेश',
  rajesh: 'राजेश',
  mukesh: 'मुकेश',
  sachin: 'सचिन',
  navin: 'नवीन',
  naveen: 'नवीन',
  amit: 'अमित',
  sumit: 'सुमित',
  rohit: 'रोहित',
  mohit: 'मोहित',
  ankit: 'अंकित',
  rahul: 'राहुल',
  vikas: 'विकास',
  ashok: 'अशोक',
  alok: 'आलोक',
  vivek: 'विवेक',
  arun: 'अरुण',
  varun: 'वरुण',
  tarun: 'तरुण',
  pankaj: 'पंकज',
  neeraj: 'नीरज',
  gaurav: 'गौरव',
  saurabh: 'सौरभ',
  rampur: 'रामपुर',
  swar: 'स्वार',
  suar: 'स्वार',
  chamraua: 'चमरौआ',
  bilaspur: 'बिलासपुर',
  milak: 'मिलक',
  moradabad: 'मुरादाबाद',
  bareilly: 'बरेली',
  bijnor: 'बिजनौर',
  amroha: 'अमरोहा',
  sambhal: 'संभल',
  budaun: 'बदायूं',
  lucknow: 'लखनऊ',
  ghaziabad: 'गाजियाबाद',
  meerut: 'मेरठ',
  agra: 'आगरा',
  kanpur: 'कानपुर',
  varanasi: 'वाराणसी',
  prayagraj: 'प्रयागराज',
  noida: 'नोएडा',
};

const CONSONANTS: Array<[string, string]> = [
  ['chh', 'छ'],
  ['ksh', 'क्ष'],
  ['sh', 'श'],
  ['ch', 'च'],
  ['th', 'थ'],
  ['dh', 'ध'],
  ['ph', 'फ'],
  ['bh', 'भ'],
  ['kh', 'ख'],
  ['gh', 'घ'],
  ['jh', 'झ'],
  ['gy', 'ज्ञ'],
  ['tr', 'त्र'],
  ['ng', 'ंग'],
  ['k', 'क'],
  ['g', 'ग'],
  ['c', 'क'],
  ['j', 'ज'],
  ['t', 'त'],
  ['d', 'द'],
  ['n', 'न'],
  ['p', 'प'],
  ['f', 'फ'],
  ['b', 'ब'],
  ['m', 'म'],
  ['y', 'य'],
  ['r', 'र'],
  ['l', 'ल'],
  ['v', 'व'],
  ['w', 'व'],
  ['s', 'स'],
  ['h', 'ह'],
  ['q', 'क'],
  ['z', 'ज़'],
  ['x', 'क्स'],
];

const VOWELS_STANDALONE: Array<[string, string]> = [
  ['aa', 'आ'],
  ['ee', 'ई'],
  ['oo', 'ऊ'],
  ['ai', 'ऐ'],
  ['au', 'औ'],
  ['ou', 'औ'],
  ['ri', 'ऋ'],
  ['a', 'अ'],
  ['i', 'इ'],
  ['u', 'उ'],
  ['e', 'ए'],
  ['o', 'ओ'],
];

const VOWEL_MATRAS: Array<[string, string]> = [
  ['aa', 'ा'],
  ['ee', 'ी'],
  ['oo', 'ू'],
  ['ai', 'ै'],
  ['au', 'ौ'],
  ['ou', 'ौ'],
  ['a', ''],
  ['i', 'ि'],
  ['u', 'ु'],
  ['e', 'े'],
  ['o', 'ो'],
];

export function transliteratePhoneticWord(word: string): string {
  const lower = word.toLowerCase();
  if (!lower) return '';
  if (COMMON_NAME_MAP[lower]) {
    return COMMON_NAME_MAP[lower];
  }

  let i = 0;
  let out = '';
  let afterConsonant = false;

  while (i < lower.length) {
    let matched = false;

    if (afterConsonant) {
      // Check vowel matras first after a consonant
      for (const [latin, matra] of VOWEL_MATRAS) {
        if (lower.startsWith(latin, i)) {
          out += matra;
          i += latin.length;
          afterConsonant = false;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // Double/conjunct consonant -> add halant
      for (const [latin, dev] of CONSONANTS) {
        if (lower.startsWith(latin, i)) {
          out += '्' + dev;
          i += latin.length;
          afterConsonant = true;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    } else {
      for (const [latin, dev] of VOWELS_STANDALONE) {
        if (lower.startsWith(latin, i)) {
          out += dev;
          i += latin.length;
          afterConsonant = false;
          matched = true;
          break;
        }
      }
      if (matched) continue;

      for (const [latin, dev] of CONSONANTS) {
        if (lower.startsWith(latin, i)) {
          out += dev;
          i += latin.length;
          afterConsonant = true;
          matched = true;
          break;
        }
      }
      if (matched) continue;
    }

    out += word[i];
    i += 1;
    afterConsonant = false;
  }

  return out;
}

export async function transliterateWordAsync(word: string): Promise<string> {
  const trimmed = word.trim();
  if (!trimmed || !/[A-Za-z]/.test(trimmed)) return word;

  const cacheKey = trimmed.toLowerCase();
  const cached = TRANSLITERATION_CACHE.get(cacheKey);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1200);

    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
      trimmed.toLowerCase()
    )}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;

    const response = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as [
        string,
        Array<[string, string[]]>,
      ];
      const candidate = data?.[1]?.[0]?.[1]?.[0];
      if (candidate && /[\u0900-\u097F]/.test(candidate)) {
        TRANSLITERATION_CACHE.set(cacheKey, candidate);
        return candidate;
      }
    }
  } catch {
    // Offline or CORS/timeout -> fall back silently to local phonetic transliterator
  }

  const fallback = transliteratePhoneticWord(trimmed);
  TRANSLITERATION_CACHE.set(cacheKey, fallback);
  return fallback;
}

export function transliteratePreviewSync(text: string): string {
  return text.replace(/[A-Za-z]+/g, (segment) => {
    const cached = TRANSLITERATION_CACHE.get(segment.toLowerCase());
    return cached || transliteratePhoneticWord(segment);
  });
}

export async function transliterateEnglishSegments(text: string): Promise<string> {
  const parts = text.split(/([A-Za-z]+)/);
  const converted = await Promise.all(
    parts.map(async (part) => {
      if (/^[A-Za-z]+$/.test(part)) {
        return transliterateWordAsync(part);
      }
      return part;
    })
  );
  return converted.join('');
}
