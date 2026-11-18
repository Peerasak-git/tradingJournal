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

  // Social Media & Twitter/X Viral Wisdom
  {
    id: 'def-tom-dante-1',
    author: 'Tom Dante (@Trader_Dante)',
    role: 'Twitter/X & Prop Trader ชื่อดัง',
    category: 'patience',
    quoteEn: "Finding and taking excellent trades is not the hard part. The hard part is trying not to do anything stupid in between them.",
    quoteTh: "การหาจุดเข้าเทรดที่ดีไม่ใช่เรื่องยาก สิ่งที่ยากที่สุดคือการพยายามไม่ทำเรื่องโง่ๆ ในช่วงเวลาที่ต้องนั่งรอระหว่างนั้น",
    reflectionTh: "เมื่อไม่มี Setup อย่าฝืนหาจุดเข้า นั่งทับมือให้อยู่ นั่นคือทักษะที่ปกป้องพอร์ตได้ดีที่สุด",
  },
  {
    id: 'def-steve-burns-1',
    author: 'Steve Burns (@SteveBurnsFX)',
    role: 'Twitter/X Trader • ผู้ติดตาม 500k+',
    category: 'risk',
    quoteEn: "The bigger the position size the louder your emotions will be.",
    quoteTh: "ยิ่งขนาด Position Size ใหญ่เท่าไหร่ เสียงกรีดร้องของอารมณ์ในหัวคุณจะยิ่งดังขึ้นเท่านั้น",
    reflectionTh: "ถ้าขนาด Lot ทำให้คุณกระวนกระวายจนต้องจ้องกราฟทุกวินาที แปลว่าคุณ Overtrade แล้ว ให้ลดขนาดไม้ลงครึ่งหนึ่ง",
  },
  {
    id: 'def-steve-burns-2',
    author: 'Steve Burns (@SteveBurnsFX)',
    role: 'Twitter/X Trader • ผู้ติดตาม 500k+',
    category: 'acceptance',
    quoteEn: "The faster you admit you were wrong about a trade the smaller the loss will be.",
    quoteTh: "ยิ่งคุณยอมรับว่าตัวเองผิดทางได้เร็วเท่าไหร่ ความเสียหายก็จะยิ่งเล็กน้อยลงเท่านั้น",
    reflectionTh: "Stop Loss ไม่ใช่ความล้มเหลว มันคือค่าเบี้ยประกันคุ้มครองพอร์ต ยอมตัดขาดทุนตามแผนทันที",
  },
  {
    id: 'def-mark-minervini-1',
    author: 'Mark Minervini (@markminervini)',
    role: 'Twitter/X • แชมป์ U.S. Investing Championship',
    category: 'risk',
    quoteEn: "If you can't learn to accept small losses, sooner or later you will take big losses.",
    quoteTh: "ถ้าคุณยังไม่เรียนรู้ที่จะยอมรับการขาดทุนเล็กๆ ไม่ช้าก็เร็วคุณจะต้องเจอกับการขาดทุนมหาศาล",
    reflectionTh: "การยอมเสีย 1-2% ในวันนี้ จะป้องกันไม่ให้คุณต้องเสีย 50% หรือล้างพอร์ตในวันหน้า",
  },
  {
    id: 'def-peter-brandt-1',
    author: 'Peter Brandt (@PeterLBrandt)',
    role: 'Twitter/X • เทรดเดอร์มือเก๋าประสบการณ์ 40+ ปี',
    category: 'risk',
    quoteEn: "Most traders spend 90% of their time looking for trading signals and 10% managing risk. It should be the opposite.",
    quoteTh: "เทรดเดอร์ส่วนใหญ่เสียเวลา 90% ไปกับการมองหาสัญญาณเข้า และใช้แค่ 10% คุมความเสี่ยง ทั้งที่จริงมันควรสลับกันอย่างสิ้นเชิง",
    reflectionTh: "โฟกัสที่การบริหารความเสี่ยงและการปกป้องเงินทุน จุดเข้าเป็นเพียงเรื่องรองลงมา",
  },
  {
    id: 'def-qullamaggie-1',
    author: 'Kristjan Qullamaggie (@Qullamaggie)',
    role: 'Twitter/X • สวิงเทรดเดอร์ที่เปลี่ยน $9k เป็น $80M',
    category: 'patience',
    quoteEn: "Most of the times, a year only has 3-5 months of easy money. The rest is about surviving.",
    quoteTh: "ในรอบ 1 ปี ตลาดมีช่วงเวลาเทรดง่ายและทำเงินก้อนโตแค่ 3-5 เดือนเท่านั้น เวลาที่เหลือคือการนั่งทับมือและรักษาทุนให้อยู่รอด",
    reflectionTh: "เมื่อตลาดไม่เอื้ออำนวย อยู่นิ่งๆ รอกระสุนไว้ยิงในรอบทองที่มีแต้มต่อสูง",
  },
  {
    id: 'def-yvan-byeajee-1',
    author: 'Yvan Byeajee (@YvanByeajee)',
    role: 'Twitter/X & ผู้เขียน Trading Composure',
    category: 'acceptance',
    quoteEn: "Confidence is not 'I will profit on this trade.' Confidence is 'I will be fine if I don't profit from this trade.'",
    quoteTh: "ความมั่นใจไม่ใช่คิดว่า 'ไม้นี้ฉันต้องชนะแน่ๆ' แต่คือ 'ฉันจะยังสงบนิ่งและสบายดี แม้ไม้นี้จะไม่ได้กำไรก็ตาม'",
    reflectionTh: "ความมั่นใจที่แท้จริงเกิดจากการยอมรับผลลัพธ์ทุกรูปแบบได้อย่างสงบ ไม่ใช่การหลอกตัวเองว่าจะไม่แพ้",
  },
  {
    id: 'def-reddit-1',
    author: 'Reddit r/Daytrading Viral Post',
    role: 'บทเรียนยอดนิยมจากคอมมูนิตี้เทรดเดอร์',
    category: 'risk',
    quoteEn: "Never turn a scalp or day trade into an 'investment' just because you are in the red. Cut the loss.",
    quoteTh: "อย่าเปลี่ยน Day Trade ให้กลายเป็น 'การถือยาว' เพียงเพราะไม้นั้นกำลังติดดอย ยอมรับ SL ตามแผนซะ",
    reflectionTh: "ถ้าเข้าด้วยเหตุผลระยะสั้น จงยอมออกด้วยเหตุผลระยะสั้น อย่าหลอกตัวเองด้วยการถือรอปาฏิหาริย์",
  },
  {
    id: 'def-reddit-2',
    author: 'Twitter Mindset Coach (@TradingPsych)',
    role: 'ไวรัลคำเตือนสติในโลกโซเชียล',
    category: 'discipline',
    quoteEn: "Revenge trading is paying the market a heavy fine for getting angry at it.",
    quoteTh: "การเทรดล้างแค้น คือการจ่ายค่าปรับก้อนโตให้ตลาด เพียงเพราะคุณอารมณ์เสียใส่กราฟ",
    reflectionTh: "ถ้าแพ้ 2 ไม้ติด ให้ปิดจอทันที ตลาดไม่ได้ติดหนี้อะไรคุณ ยิ่งแค้นพอร์ตยิ่งพัง",
  },
  {
    id: 'def-reddit-3',
    author: 'Reddit Top Trading Mantra',
    role: 'กฎเหล็กเตือนสติชาว Reddit',
    category: 'risk',
    quoteEn: "Your win rate feeds your ego. Your risk-reward ratio and money management feed your family.",
    quoteTh: "Win Rate ช่วยสนองอีโก้ของคุณ แต่ Risk-Reward Ratio และการคุมความเสี่ยงคือสิ่งที่เลี้ยงดูครอบครัวของคุณ",
    reflectionTh: "Win Rate 40% ก็ทำกำไรได้สม่ำเสมอหากมี RR 1:2 หรือ 1:3 เลิกหมกมุ่นกับการต้องถูกทุกไม้",
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
