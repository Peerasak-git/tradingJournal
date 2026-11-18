export interface MindsetQuote {
  id: string;
  author: string;
  role: string;
  category: 'risk' | 'discipline' | 'patience' | 'acceptance' | 'stoic';
  quoteEn: string;
  quoteTh: string;
  reflectionTh: string;
  isCustom?: boolean;
}

export const CATEGORY_LABELS: Record<MindsetQuote['category'], { th: string; en: string; icon: string }> = {
  risk: { th: 'การคุมความเสี่ยง & เอาตัวรอด', en: 'Risk & Capital Preservation', icon: '🛡️' },
  discipline: { th: 'วินัย & การควบคุมอารมณ์', en: 'Discipline & Emotional Control', icon: '⚖️' },
  patience: { th: 'การรอคอย & นั่งทับมือ', en: 'Patience & Waiting for Edge', icon: '🧘' },
  acceptance: { th: 'การยอมรับ Stop Loss & สถิติ', en: 'Accepting Losses & Probabilities', icon: '🧠' },
  stoic: { th: 'ปรัชญา Stoic & จิตวิทยาความนิ่ง', en: 'Stoicism & Inner Peace', icon: '🏛️' },
};

export const DEFAULT_QUOTES: MindsetQuote[] = [
  // Mark Douglas
  {
    id: 'md-1',
    author: 'Mark Douglas',
    role: 'ผู้เขียนหนังสือ Trading in the Zone',
    category: 'acceptance',
    quoteEn: "When you genuinely accept the risks, you will be at peace with any outcome.",
    quoteTh: "เมื่อคุณยอมรับความเสี่ยงได้อย่างแท้จริงจากก้นบึ้งของหัวใจ คุณจะสงบนิ่งกับทุกผลลัพธ์ที่เกิดขึ้น",
    reflectionTh: "อ่านข้อนี้ก่อนเปิดไม้: หากใจยังเต้นแรง แปลว่าคุณยังไม่ยอมรับ Stop Loss นั้นจริงๆ ให้ลดขนาด Lot ลง",
  },
  {
    id: 'md-2',
    author: 'Mark Douglas',
    role: 'ผู้เขียนหนังสือ Trading in the Zone',
    category: 'acceptance',
    quoteEn: "If you can learn to create a state of mind that's not affected by the market's behavior, the struggle will cease to exist.",
    quoteTh: "ถ้าคุณฝึกสร้างสภาวะจิตใจที่ไม่ถูกกระทบกระเทือนจากการเคลื่อนไหวของตลาดได้ การต่อสู้อันเหน็ดเหนื่อยจะสิ้นสุดลงทันที",
    reflectionTh: "ตลาดเป็นเพียงกระจกสะท้อนตัวคุณ ความเครียดไม่ได้มาจากกราฟ แต่มาจากความคาดหวังของคุณเอง",
  },
  {
    id: 'md-3',
    author: 'Mark Douglas',
    role: 'ผู้เขียนหนังสือ Trading in the Zone',
    category: 'acceptance',
    quoteEn: "Anything can happen. You don't need to know what is going to happen next in order to make money.",
    quoteTh: "อะไรก็เกิดขึ้นได้ในตลาด คุณไม่จำเป็นต้องรู้ว่าอะไรจะเกิดขึ้นต่อไป เพื่อที่จะทำกำไร",
    reflectionTh: "หยุดพยายามเป็นหมอดูทำนายกราฟ หน้าที่ของเราคือบริหารความเสี่ยงและปล่อยให้สถิติทำงาน",
  },

  // Paul Tudor Jones
  {
    id: 'ptj-1',
    author: 'Paul Tudor Jones',
    role: 'ตำนานเฮดจ์ฟันด์ระดับโลก & มหาเศรษฐี',
    category: 'risk',
    quoteEn: "The most important rule of trading is to play great defense, not great offense.",
    quoteTh: "กฎเหล็กที่สำคัญที่สุดในการเทรดคือการเล่นเกมรับที่ยอดเยี่ยม ไม่ใช่การบุกอย่างบ้าคลั่ง",
    reflectionTh: "รักษาเงินต้นให้อยู่รอดในตลาด เมื่อโอกาสทองมาถึง คุณจะมีกระสุนพร้อมยิงเสมอ",
  },
  {
    id: 'ptj-2',
    author: 'Paul Tudor Jones',
    role: 'ตำนานเฮดจ์ฟันด์ระดับโลก & มหาเศรษฐี',
    category: 'risk',
    quoteEn: "Don't focus on making money; focus on protecting what you have.",
    quoteTh: "อย่าเพ่งสมาธิไปที่การทำเงิน แต่จงโฟกัสที่การปกป้องเงินทุนที่คุณมีอยู่ให้รอด",
    reflectionTh: "โฟกัสที่การรักษา Process และ Risk Management แล้วกำไรจะตามมาเองเป็นผลพลอยได้",
  },
  {
    id: 'ptj-3',
    author: 'Paul Tudor Jones',
    role: 'ตำนานเฮดจ์ฟันด์ระดับโลก & มหาเศรษฐี',
    category: 'discipline',
    quoteEn: "Never play macho man with the market. Never try to prove anything to it. Always be humble, and take losses.",
    quoteTh: "อย่าทำตัวเป็นฮีโร่อวดเก่งกับตลาด อย่าพยายามพิสูจน์ตัวเองกับมัน จงถ่อมตัวอยู่เสมอ และยอมรับผลขาดทุนอย่างสงบ",
    reflectionTh: "ตลาดไม่มีวันแคร์คุณ การเถียงตลาดคือทางลัดสู่การล้างพอร์ต เมื่อคิดผิดจงคัตทันที",
  },

  // Tom Hougaard
  {
    id: 'th-1',
    author: 'Tom Hougaard',
    role: 'ผู้เขียนหนังสือ Best Loser Wins',
    category: 'discipline',
    quoteEn: "It is not your wins, but your losses that will determine your success.",
    quoteTh: "ไม่ใช่ไม้ที่คุณชนะ แต่เป็นวิธีที่คุณจัดการกับไม้ที่แพ้ต่างหาก ที่จะเป็นตัวกำหนดความสำเร็จในอาชีพเทรดเดอร์",
    reflectionTh: "เทรดเดอร์ทุกคนมีไม้แพ้ แต่คนที่สำเร็จคือคนที่แพ้แล้วเสียหายน้อยที่สุด (Best Loser)",
  },
  {
    id: 'th-2',
    author: 'Tom Hougaard',
    role: 'ผู้เขียนหนังสือ Best Loser Wins',
    category: 'discipline',
    quoteEn: "The amateur trader wants to be right. The professional trader wants to make money, and they don't care how many times they are wrong getting there.",
    quoteTh: "มือสมัครเล่นอยากเป็นฝ่ายถูก แต่มืออาชีพต้องการทำเงิน และพวกเขาไม่สนใจว่าตัวเองจะต้องผิดกี่ครั้งเพื่อไปถึงเป้าหมาย",
    reflectionTh: "ทิ้งอีโก้ลงถังขยะ การยอมรับว่าตัวเองผิดในทันที คือทักษะที่แพงที่สุดในตลาดการเงิน",
  },

  // Jared Tendler
  {
    id: 'jt-1',
    author: 'Jared Tendler',
    role: 'ผู้เขียนหนังสือ The Mental Game of Trading',
    category: 'discipline',
    quoteEn: "Winning doesn't mean you played well.",
    quoteTh: "การชนะหรือได้กำไร ไม่ได้แปลว่าคุณตัดสินใจได้ถูกต้องตามหลักการเสมอไป",
    reflectionTh: "ระวังชัยชนะที่เกิดจากการแหกกฎ (Bad Process, Good Outcome) เพราะมันกำลังเพาะนิสัยที่จะล้างพอร์ตในอนาคต",
  },
  {
    id: 'jt-2',
    author: 'Jared Tendler',
    role: 'ผู้เขียนหนังสือ The Mental Game of Trading',
    category: 'discipline',
    quoteEn: "Emotions aren't random; they are the result of structural issues in your mental game that can be systematically solved.",
    quoteTh: "อารมณ์ไม่ได้เกิดขึ้นลอยๆ แต่มันเป็นผลลัพธ์จากข้อบกพร่องในจิตวิทยาของคุณ ซึ่งสามารถแก้ไขได้อย่างเป็นระบบ",
    reflectionTh: "อย่าโทษว่าตัวเองไม่มีวินัย จงมองหา Root Cause (เช่น กลัวพลาดโอกาส, รับการขาดทุนไม่ได้) แล้วแก้ที่ต้นเหตุ",
  },

  // Ed Seykota
  {
    id: 'es-1',
    author: 'Ed Seykota',
    role: 'ตำนาน Trend Following & Market Wizard',
    category: 'risk',
    quoteEn: "If you can't take a small loss, sooner or later you will take the mother of all losses.",
    quoteTh: "ถ้าคุณไม่สามารถตัดใจยอมรับการขาดทุนก้อนเล็กๆ ได้ ไม่ช้าก็เร็วคุณจะต้องเจอกับการล้างพอร์ตครั้งใหญ่ที่สุดในชีวิต",
    reflectionTh: "Stop Loss คือค่าประกันชีวิตของพอร์ตการลงทุน อย่ารอให้ไฟไหม้บ้านทั้งหลังแล้วค่อยคิดดับ",
  },
  {
    id: 'es-2',
    author: 'Ed Seykota',
    role: 'ตำนาน Trend Following & Market Wizard',
    category: 'discipline',
    quoteEn: "Win or lose, everybody gets what they want out of the market.",
    quoteTh: "ไม่ว่าจะชนะหรือแพ้ ทุกคนต่างได้สิ่งที่ก้นบึ้งของจิตใจพวกเขาต้องการจากตลาดเสมอ",
    reflectionTh: "ถ้าคุณเทรดเพื่อความตื่นเต้น คุณจะได้ความตื่นเต้นแต่เสียเงิน หากคุณเทรดเพื่อความมั่งคั่ง คุณต้องพร้อมรับความน่าเบื่อของวินัย",
  },

  // Jesse Livermore
  {
    id: 'jl-1',
    author: 'Jesse Livermore',
    role: 'ตำนานเทรดเดอร์แห่ง Wall Street',
    category: 'patience',
    quoteEn: "It was never my thinking that made the big money for me. It was always my sitting. Got that? My sitting tight!",
    quoteTh: "ไม่ใช่ความคิดหรือการวิเคราะห์ที่ทำเงินก้อนโตให้ผม แต่มันคือการ 'นั่งทับมือ' รอคอยอย่างอดทนต่างหาก",
    reflectionTh: "กำไรก้อนใหญ่เกิดจากการรอ Setup ที่ใช่ และการถือปล่อยให้ Trend วิ่ง ไม่ใช่การกดเข้าๆ ออกๆ ตลอดวัน",
  },
  {
    id: 'jl-2',
    author: 'Jesse Livermore',
    role: 'ตำนานเทรดเดอร์แห่ง Wall Street',
    category: 'patience',
    quoteEn: "There is a time for all things, but I didn't know it. And that is precisely what beats so many men in Wall Street: the desire to always be in the game.",
    quoteTh: "ทุกสิ่งมีจังหวะเวลาของมัน และสิ่งนี้เองที่ทำลายเทรดเดอร์ส่วนใหญ่: ความกระหายที่อยากจะอยู่ในตลาดตลอดเวลา",
    reflectionTh: "การไม่มีออเดอร์ (Cash Position) ถือเป็น Position การเทรดที่ดีที่สุดอย่างหนึ่ง",
  },

  // Marcus Aurelius & Stoicism
  {
    id: 'ma-1',
    author: 'Marcus Aurelius',
    role: 'จักรพรรดิและนักปรัชญา Stoic (Meditations)',
    category: 'stoic',
    quoteEn: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    quoteTh: "คุณมีอำนาจเหนือจิตใจของตนเอง ไม่ใช่อำนาจเหนือเหตุการณ์ภายนอก ตระหนักถึงสิ่งนี้ แล้วคุณจะพบพลังที่แท้จริง",
    reflectionTh: "คุณสั่งให้แท่งเทียนวิ่งขึ้นลงไม่ได้ แต่คุณสั่งให้ตัวเองรักษาวินัยและคุมอารมณ์ได้ 100%",
  },
  {
    id: 'ma-2',
    author: 'Epictetus',
    role: 'นักปรัชญา Stoic โบราณ',
    category: 'stoic',
    quoteEn: "It's not what happens to you, but how you react to it that matters.",
    quoteTh: "มันไม่ได้สำคัญว่าเกิดอะไรขึ้นกับคุณ แต่สำคัญที่ว่าคุณตอบสนองต่อสิ่งนั้นอย่างไรต่างหาก",
    reflectionTh: "การโดน Stop Loss เป็นเรื่องธรรมชาติ การตอบสนองด้วยสติหรือตอบสนองด้วยความแค้น คือสิ่งที่แยกมือโปรออกจากมือสมัครเล่น",
  },
];

const CUSTOM_QUOTES_KEY = 'trading_custom_mindset_quotes';

export function getCustomQuotes(): MindsetQuote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_QUOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to get custom quotes:', err);
    return [];
  }
}

export function saveCustomQuote(quote: Omit<MindsetQuote, 'id' | 'isCustom'>): MindsetQuote {
  const current = getCustomQuotes();
  const newQuote: MindsetQuote = {
    ...quote,
    id: 'custom_' + Date.now().toString(36),
    isCustom: true,
  };
  const updated = [newQuote, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_QUOTES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('customQuotesUpdated'));
  }
  return newQuote;
}

export function deleteCustomQuote(id: string): void {
  const current = getCustomQuotes();
  const updated = current.filter((q) => q.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOM_QUOTES_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('customQuotesUpdated'));
  }
}
