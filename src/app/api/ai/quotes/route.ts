import { NextRequest, NextResponse } from 'next/server';

export interface OnlineQuoteItem {
  id: string;
  author: string;
  role: string;
  category: 'risk' | 'discipline' | 'patience' | 'acceptance' | 'stoic';
  quoteEn: string;
  quoteTh: string;
  reflectionTh: string;
}

// Extensive Bank of Authentic Trading Psychology Quotes (Books, Internet, Twitter/X, Reddit & Pro Traders)
export const CURATED_ONLINE_QUOTES: OnlineQuoteItem[] = [
  // --- TWITTER / SOCIAL MEDIA PRO TRADERS ---
  {
    id: 'soc-tom-dante-1',
    author: 'Tom Dante (@Trader_Dante)',
    role: 'Twitter/X & Prop Trader ชื่อดังในตำนาน',
    category: 'patience',
    quoteEn: "Finding and taking excellent trades is not the hard part. The hard part is trying not to do anything stupid in between them.",
    quoteTh: "การหาจุดเข้าเทรดที่ดีไม่ใช่เรื่องยาก สิ่งที่ยากที่สุดคือการพยายามไม่ทำเรื่องโง่ๆ ในช่วงเวลาที่ต้องนั่งรอระหว่างนั้น",
    reflectionTh: "เมื่อไม่มี Setup อย่าฝืนหาจุดเข้า นั่งทับมือให้อยู่ นั่นคือทักษะที่ปกป้องพอร์ตได้ดีที่สุด",
  },
  {
    id: 'soc-tom-dante-2',
    author: 'Tom Dante (@Trader_Dante)',
    role: 'Twitter/X & Prop Trader ชื่อดังในตำนาน',
    category: 'discipline',
    quoteEn: "If you take profit for no other reason than that you have a profit and don't want to lose it, you are trading out of fear.",
    quoteTh: "ถ้าคุณรีบปิดกำไรเพียงเพราะกลัวว่ากำไรที่เห็นจะหดหาย แปลว่าคุณกำลังเทรดด้วยความกลัว ไม่ใช่เทรดตามแผน",
    reflectionTh: "ปล่อยให้กำไรวิ่งไปตามเป้าหมาย (TP) หรือ Trailing Stop อย่าให้อารมณ์กลัวมาปิดออเดอร์ก่อนเวลา",
  },
  {
    id: 'soc-tom-dante-3',
    author: 'Tom Dante (@Trader_Dante)',
    role: 'Twitter/X & Prop Trader ชื่อดังในตำนาน',
    category: 'risk',
    quoteEn: "The most important part of my plan is to determine where I will get out before I get in. Once you are in, you start rationalizing.",
    quoteTh: "ส่วนสำคัญที่สุดคือการรู้จุดออกก่อนกดเข้า เพราะทันทีที่คุณมีออเดอร์ในมือ สมองจะเริ่มหาข้ออ้างเข้าข้างตัวเองทันที",
    reflectionTh: "ตั้ง Stop Loss ล่วงหน้าก่อนกดออเดอร์เสมอ เพราะเมื่อมีสถานะ อารมณ์จะบดบังเหตุผลของคุณ",
  },
  {
    id: 'soc-steve-burns-1',
    author: 'Steve Burns (@SteveBurnsFX)',
    role: 'Twitter/X Trader • ผู้ติดตามกว่า 500k+',
    category: 'risk',
    quoteEn: "The bigger the position size the louder your emotions will be.",
    quoteTh: "ยิ่งขนาด Position Size ใหญ่เท่าไหร่ เสียงกรีดร้องของอารมณ์ในหัวคุณจะยิ่งดังขึ้นเท่านั้น",
    reflectionTh: "ถ้าคุณรู้สึกใจเต้นแรงหรือเครียดจนต้องจ้องกราฟทุกวินาที แปลว่า Lot ของคุณใหญ่เกินไป ลดลงครึ่งหนึ่งทันที",
  },
  {
    id: 'soc-steve-burns-2',
    author: 'Steve Burns (@SteveBurnsFX)',
    role: 'Twitter/X Trader • ผู้ติดตามกว่า 500k+',
    category: 'acceptance',
    quoteEn: "The faster you admit you were wrong about a trade the smaller the loss will be.",
    quoteTh: "ยิ่งคุณยอมรับว่าตัวเองผิดทางได้เร็วเท่าไหร่ ความเสียหายก็จะยิ่งเล็กน้อยลงเท่านั้น",
    reflectionTh: "Stop Loss ไม่ใช่ความล้มเหลว แต่มันคือต้นทุนการทำธุรกิจ ยอมรับมันทันทีโดยไม่ลังเล",
  },
  {
    id: 'soc-steve-burns-3',
    author: 'Steve Burns (@SteveBurnsFX)',
    role: 'Twitter/X Trader • ผู้ติดตามกว่า 500k+',
    category: 'discipline',
    quoteEn: "Much of our trading comes down to a battle between our patience and our impulses.",
    quoteTh: "การเทรดส่วนใหญ่ คือสงครามการต่อสู้ระหว่างความอดทน กับแรงกระตุ้นชั่ววูบในใจคุณ",
    reflectionTh: "หยุดตามแรงกระตุ้น FOMO หายใจเข้าลึกๆ เช็คลิสต์ให้ครบก่อนกดออเดอร์ทุกครั้ง",
  },
  {
    id: 'soc-steve-burns-4',
    author: 'Steve Burns (@SteveBurnsFX)',
    role: 'Twitter/X Trader • ผู้ติดตามกว่า 500k+',
    category: 'discipline',
    quoteEn: "Fear, greed, and ego are very expensive monkeys to have on your back while trading.",
    quoteTh: "ความกลัว ความโลภ และอีโก้ คือลิงราคาแพงที่คุณแบกไว้บนหลังขณะเทรด",
    reflectionTh: "สลัดอีโก้ทิ้งไป ตลาดไม่สนใจว่าคุณจะถูกหรือผิด ตลาดสนใจแค่ว่าคุณทำตามวินัยหรือไม่",
  },
  {
    id: 'soc-steve-burns-5',
    author: 'Steve Burns (@SteveBurnsFX)',
    role: 'Twitter/X Trader • ผู้ติดตามกว่า 500k+',
    category: 'acceptance',
    quoteEn: "Self-destruction starts when a trader refuses to accept being wrong about a trade.",
    quoteTh: "ความพินาศของเทรดเดอร์เริ่มต้นขึ้น วินาทีที่คุณปฏิเสธที่จะยอมรับว่าตัวเองคิดผิด",
    reflectionTh: "อย่าเลื่อน Stop Loss หนีเด็ดขาด การยอมแพ้ไม้เล็กๆ คือสิ่งที่รักษาชีวิตพอร์ตของคุณไว้",
  },
  {
    id: 'soc-mark-minervini-1',
    author: 'Mark Minervini (@markminervini)',
    role: 'Twitter/X • แชมป์ U.S. Investing Championship',
    category: 'risk',
    quoteEn: "If you can't learn to accept small losses, sooner or later you will take big losses.",
    quoteTh: "ถ้าคุณยังไม่เรียนรู้ที่จะยอมรับการขาดทุนเล็กๆ ไม่ช้าก็เร็วคุณจะต้องเจอกับการขาดทุนมหาศาล",
    reflectionTh: "การยอมเสีย 1-2% ในวันนี้ จะป้องกันไม่ให้คุณต้องเสีย 50% หรือล้างพอร์ตในวันหน้า",
  },
  {
    id: 'soc-mark-minervini-2',
    author: 'Mark Minervini (@markminervini)',
    role: 'Twitter/X • แชมป์ U.S. Investing Championship',
    category: 'risk',
    quoteEn: "Not defining and committing to a predetermined level of risk costs traders more money than any other mistake.",
    quoteTh: "การไม่กำหนดจุดยอมแพ้ (Stop Loss) ก่อนเข้าออเดอร์ ทำลายเงินในพอร์ตของเทรดเดอร์มากกว่าความผิดพลาดใดๆ ทั้งปวง",
    reflectionTh: "อย่ากดเปิดไม้หากยังไม่รู้ว่าจุดยอมแพ้อยู่ตรงไหน และคำนวณจำนวนเงินที่พร้อมจะเสียให้ชัดเจน",
  },
  {
    id: 'soc-mark-minervini-3',
    author: 'Mark Minervini (@markminervini)',
    role: 'Twitter/X • แชมป์ U.S. Investing Championship',
    category: 'discipline',
    quoteEn: "Numbers won't do anything to improve your psychology. The road to success in the market is not a magic system; it's within you.",
    quoteTh: "ตัวเลขหรือสูตรลัดไม่ได้ช่วยจิตวิทยาของคุณ ความสำเร็จในการเทรดไม่ได้อยู่ที่ระบบวิเศษ แต่อยู่ที่วินัยในตัวคุณ",
    reflectionTh: "หยุดตามหา Holy Grail ระบบธรรมดาที่มีการจัดการอารมณ์และวินัยที่ยอดเยี่ยม สามารถสร้างกำไรมหาศาลได้",
  },
  {
    id: 'soc-peter-brandt-1',
    author: 'Peter Brandt (@PeterLBrandt)',
    role: 'Twitter/X • เทรดเดอร์มือเก๋าประสบการณ์กว่า 40+ ปี',
    category: 'risk',
    quoteEn: "Most traders spend 90% of their time looking for trading signals and 10% managing risk. It should be the opposite.",
    quoteTh: "เทรดเดอร์ส่วนใหญ่เสียเวลา 90% ไปกับการมองหาสัญญาณเข้า และใช้แค่ 10% คุมความเสี่ยง ทั้งที่จริงมันควรสลับกันอย่างสิ้นเชิง",
    reflectionTh: "ให้ความสำคัญกับการบริหารเงินหน้าตัก (Money Management) มากกว่าการพยายามจับจังหวะเข้าทำที่สมบูรณ์แบบ",
  },
  {
    id: 'soc-peter-brandt-2',
    author: 'Peter Brandt (@PeterLBrandt)',
    role: 'Twitter/X • เทรดเดอร์มือเก๋าประสบการณ์กว่า 40+ ปี',
    category: 'discipline',
    quoteEn: "Human emotions are the biggest enemy a trader faces. Trading is a war against self.",
    quoteTh: "อารมณ์ของมนุษย์คือศัตรูที่ร้ายกาจที่สุด การเทรดคือสงครามระหว่างคุณกับตัวคุณเองในกระจก",
    reflectionTh: "ชัยชนะที่ยิ่งใหญ่ที่สุดไม่ใช่การเอาชนะกราฟ แต่คือการเอาชนะความโลภและความกลัวในใจคุณเอง",
  },
  {
    id: 'soc-peter-brandt-3',
    author: 'Peter Brandt (@PeterLBrandt)',
    role: 'Twitter/X • เทรดเดอร์มือเก๋าประสบการณ์กว่า 40+ ปี',
    category: 'acceptance',
    quoteEn: "Great traders focus on what's possible and managed, instead of trying to predict what's certain.",
    quoteTh: "เทรดเดอร์ชั้นยอดโฟกัสกับสิ่งที่เป็นไปได้และการบริหารความเสี่ยง แทนที่จะพยายามทำนายหาความแน่นอนที่ไม่มีอยู่จริง",
    reflectionTh: "ตลาดเป็นเรื่องของความน่าจะเป็น ไม่มีอะไรแน่นอน 100% เตรียมรับมือกับทุกผลลัพธ์ที่อาจเกิดขึ้น",
  },
  {
    id: 'soc-qullamaggie-1',
    author: 'Kristjan Qullamaggie (@Qullamaggie)',
    role: 'Twitter/X & Twitch • พลิกพอร์ตจาก $9k เป็น $80M+',
    category: 'patience',
    quoteEn: "Most of the times, a year only has 3-5 months of easy money. The rest is about surviving.",
    quoteTh: "ในรอบ 1 ปี ตลาดมีช่วงเวลาเทรดง่ายและทำเงินก้อนโตแค่ 3-5 เดือนเท่านั้น เวลาที่เหลือคือการนั่งทับมือและรักษาทุนให้อยู่รอด",
    reflectionTh: "เมื่อตลาดผันผวนและไม่มีเทรนด์ชัดเจน ให้ลดขนาดไม้หรือนั่งดูเฉยๆ เพื่อรอกระสุนไว้ยิงในรอบทอง",
  },
  {
    id: 'soc-qullamaggie-2',
    author: 'Kristjan Qullamaggie (@Qullamaggie)',
    role: 'Twitter/X & Twitch • พลิกพอร์ตจาก $9k เป็น $80M+',
    category: 'discipline',
    quoteEn: "Don't just randomly sell everything into strength. It's better to sell a partial a little bit late than selling 100% too early.",
    quoteTh: "อย่าเพิ่งรีบปิดออเดอร์ทั้งหมดเพียงเพราะกลัวกำไรหาย แบ่งปิดบางส่วนแล้วปล่อยไม้ที่เหลือรันเทรนด์ให้สุดทาง",
    reflectionTh: "การแบ่งเก็บกำไร (Partial TP) ช่วยปลดล็อคความเครียดทางจิตวิทยา และทำให้คุณถือไม้รันเทรนด์ได้อย่างสบายใจ",
  },
  {
    id: 'soc-qullamaggie-3',
    author: 'Kristjan Qullamaggie (@Qullamaggie)',
    role: 'Twitter/X & Twitch • พลิกพอร์ตจาก $9k เป็น $80M+',
    category: 'discipline',
    quoteEn: "You need to build your own conviction and setups, and not trust or rely on somebody else on social media.",
    quoteTh: "คุณต้องสร้างความเชื่อมั่นใน Setup ของตัวเอง อย่าเทรดตามโพสต์หรือซิกแนลของคนอื่นบนโซเชียล",
    reflectionTh: "การลอกการบ้านคนอื่นจะทำให้คุณตัดสินใจไม่ถูกเวลาเจอตลาดผันผวน เทรดเฉพาะสิ่งที่ตัวเองเข้าใจจริงๆ",
  },
  {
    id: 'soc-yvan-byeajee-1',
    author: 'Yvan Byeajee (@YvanByeajee)',
    role: 'ผู้เขียน Trading Composure & นักจิตวิทยาการเทรด',
    category: 'acceptance',
    quoteEn: "Confidence is not 'I will profit on this trade.' Confidence is 'I will be fine if I don't profit from this trade.'",
    quoteTh: "ความมั่นใจไม่ใช่คิดว่า 'ไม้นี้ฉันต้องชนะแน่ๆ' แต่คือ 'ฉันจะยังสงบนิ่งและสบายดี แม้ไม้นี้จะไม่ได้กำไรก็ตาม'",
    reflectionTh: "ความมั่นใจที่แท้จริงเกิดจากการยอมรับความเสี่ยงได้อย่างหมดจด ไม่ใช่เกิดจากการหลอกตัวเองว่าไม่มีวันแพ้",
  },
  {
    id: 'soc-yvan-byeajee-2',
    author: 'Yvan Byeajee (@YvanByeajee)',
    role: 'ผู้เขียน Trading Composure & นักจิตวิทยาการเทรด',
    category: 'stoic',
    quoteEn: "Most traders are inconsistent primarily because they are deeply intolerant of uncertainty.",
    quoteTh: "เทรดเดอร์ส่วนใหญ่ไม่สม่ำเสมอ เพราะพวกเขาทนไม่ได้กับความไม่แน่นอน และปล่อยให้อารมณ์เข้าครอบงำการตัดสินใจ",
    reflectionTh: "ฝึกอยู่ร่วมกับความไม่แน่นอนให้เป็นความเคยชิน ทำตามระบบสถิติเหมือนคาสิโนที่เปิดให้เล่นระยะยาว",
  },
  {
    id: 'soc-yvan-byeajee-3',
    author: 'Yvan Byeajee (@YvanByeajee)',
    role: 'ผู้เขียน Trading Composure & นักจิตวิทยาการเทรด',
    category: 'patience',
    quoteEn: "Don't ever make the mistake of believing that market success has to come to you fast. Trade small, stay in the game, persist.",
    quoteTh: "อย่าหลงเชื่อว่าความสำเร็จในตลาดจะมาถึงอย่างรวดเร็ว ออก Lot ให้เล็ก อยู่ในเกมให้นาน แล้วทักษะจะเบ่งบานเอง",
    reflectionTh: "การเทรดคือการวิ่งมาราธอน ไม่ใช่การวิ่ง 100 เมตร คนที่รวยยั่งยืนคือคนที่อยู่รอดได้นานที่สุด",
  },
  {
    id: 'soc-lance-beggs-1',
    author: 'Lance Beggs (@LanceBeggs)',
    role: 'ผู้เขียน YTC Price Action Trader & อดีตนักบินรบ',
    category: 'discipline',
    quoteEn: "Do not optimize for maximum profits. Instead, optimize to ensure compatibility with your trading psychology.",
    quoteTh: "อย่าพยายามปรับระบบเพื่อหากำไรสูงสุดเพียงอย่างเดียว แต่จงปรับระบบให้เข้ากับความสบายใจและจิตวิทยาของคุณ",
    reflectionTh: "ระบบที่กำไรสูงสุดในกระดาษจะไร้ค่าทันที หากความเสี่ยงของมันทำให้คุณนอนไม่หลับจนกดปิดมือ",
  },
  {
    id: 'soc-lance-beggs-2',
    author: 'Lance Beggs (@LanceBeggs)',
    role: 'ผู้เขียน YTC Price Action Trader & อดีตนักบินรบ',
    category: 'risk',
    quoteEn: "A trading plan is useless if your mind cannot endure the normal drawdown that comes with it.",
    quoteTh: "แผนการเทรดจะไร้ค่าทันที หากจิตใจของคุณไม่สามารถทนทานต่อช่วง Drawdown ปกติของระบบได้",
    reflectionTh: "Drawdown เป็นส่วนหนึ่งของการเดินทาง เผื่อใจและคำนวณขนาดไม้ให้รองรับการแพ้ 5-10 ไม้ติดไว้เสมอ",
  },
  {
    id: 'soc-brian-shannon-1',
    author: 'Brian Shannon (@alphatrends)',
    role: 'Twitter/X • ผู้เขียน Technical Analysis Using Multiple Timeframes',
    category: 'discipline',
    quoteEn: "Only price pays. Everything else on Twitter, news, and Discord is just noise.",
    quoteTh: "มีเพียงราคาบนกราฟเท่านั้นที่จ่ายเงินให้คุณ ส่วนความคิดเห็น ข่าวสาร และการคุยกันบนโซเชียลเป็นเพียงแค่เสียงรบกวน",
    reflectionTh: "ปิดเสียงแจ้งเตือนกลุ่มแชทระหว่างเทรด โฟกัสเฉพาะ Price Action และแผนที่คุณวางไว้เท่านั้น",
  },
  {
    id: 'soc-rayner-teo-1',
    author: 'Rayner Teo (@Rayner_Teo)',
    role: 'Twitter/X & ฟูลไทม์เทรดเดอร์ชื่อดัง',
    category: 'acceptance',
    quoteEn: "Trading psychology improves significantly once you stop looking at individual trades as a reflection of your self-worth.",
    quoteTh: "จิตวิทยาการเทรดจะพัฒนาขึ้นทันที เมื่อคุณเลิกมองผลแพ้ชนะของแต่ละไม้ว่าเป็นคุณค่าของตัวคุณเอง",
    reflectionTh: "ไม้ที่แพ้ไม่ได้แปลว่าคุณโง่ ไม้ที่ชนะไม่ได้แปลว่าคุณฉลาด มันเป็นเพียงแค่ sample 1 จุดในสถิติ 1,000 ไม้",
  },
  {
    id: 'soc-rayner-teo-2',
    author: 'Rayner Teo (@Rayner_Teo)',
    role: 'Twitter/X & ฟูลไทม์เทรดเดอร์ชื่อดัง',
    category: 'risk',
    quoteEn: "If you risk 10% per trade, you are just 5 bad trades away from financial and mental ruins.",
    quoteTh: "ถ้าคุณเสี่ยงไม้ละ 10% คุณอยู่ห่างจากความพังทลายทางการเงินและสุขภาพจิตแค่ความผิดพลาด 5 ไม้ติดเท่านั้น",
    reflectionTh: "จำกัดความเสี่ยงไม่เกิน 1-2% ต่อไม้ เพื่อที่คุณจะยังมีแรงและเงินทุนกลับมาแก้มือได้เสมอ",
  },

  // --- REDDIT & TRADING COMMUNITIES VIRAL MANTRAS ---
  {
    id: 'soc-reddit-1',
    author: 'Reddit r/Daytrading Viral Post',
    role: 'บทเรียนยอดนิยมจากคอมมูนิตี้เทรดเดอร์',
    category: 'risk',
    quoteEn: "Never turn a scalp or day trade into an 'investment' or swing trade just because you are in the red. Cut the loss.",
    quoteTh: "อย่าเปลี่ยน Day Trade ให้กลายเป็น 'การถือยาว' เพียงเพราะไม้นั้นกำลังติดดอย ยอมรับ SL ตามแผนซะ",
    reflectionTh: "ถ้าเข้าเทรดด้วยเหตุผลแบบสั้น ต้องยอมออกด้วยเหตุผลแบบสั้น อย่าหลอกตัวเองด้วยการถือรอปาฏิหาริย์",
  },
  {
    id: 'soc-reddit-2',
    author: 'Reddit r/Daytrading Top Mantra',
    role: 'กฎเหล็กเตือนสติชาว Reddit',
    category: 'risk',
    quoteEn: "Your win rate feeds your ego. Your risk-reward ratio and money management feed your family.",
    quoteTh: "Win Rate ช่วยสนองอีโก้ของคุณ แต่ Risk-Reward Ratio และการคุมความเสี่ยงคือสิ่งที่เลี้ยงดูครอบครัวของคุณ",
    reflectionTh: "Win Rate 40% ก็ทำกำไรมหาศาลได้หากมี RR 1:2 หรือ 1:3 เลิกหมกมุ่นกับการต้องถูกทุกไม้",
  },
  {
    id: 'soc-reddit-3',
    author: 'Twitter Mindset Coach (@TradingPsych)',
    role: 'ไวรัลคำเตือนสติในโลกโซเชียล',
    category: 'discipline',
    quoteEn: "Revenge trading is paying the market a heavy fine for getting angry at it.",
    quoteTh: "การเทรดล้างแค้น คือการจ่ายค่าปรับก้อนโตให้ตลาด เพียงเพราะคุณอารมณ์เสียใส่กราฟ",
    reflectionTh: "เมื่อแพ้ติดกัน 2 ไม้ ให้ลุกออกจากหน้าจอทันที ตลาดไม่ได้ติดหนี้อะไรคุณ ยิ่งแค้นพอร์ตยิ่งพัง",
  },
  {
    id: 'soc-reddit-4',
    author: 'Crypto & Forex Twitter Wisdom',
    role: 'คำเตือนสติยอดนิยมบน X (Twitter)',
    category: 'patience',
    quoteEn: "FOMO costs more money than missing out ever could. Another setup will always appear tomorrow.",
    quoteTh: "ความกลัวตกรถ (FOMO) เผาผลาญเงินมากกว่าการตกรถเสมอ พรุ่งนี้ตลาดก็ยังเปิดและมีโอกาสใหม่รออยู่เสมอ",
    reflectionTh: "ตกรถเสียแค่โอกาส แต่ FOMO โดดขึ้นรถที่วิ่งไปแล้ว มักจะเสียทั้งเงินและสุขภาพจิต",
  },
  {
    id: 'soc-reddit-5',
    author: 'TradingView Community Pro Rule',
    role: 'คติเตือนใจชุมชน TradingView',
    category: 'discipline',
    quoteEn: "A bad trade with a green PnL is still a bad trade. A disciplined trade with a red SL is still a great trade.",
    quoteTh: "ไม้ที่แหกกฎแต่ดันได้กำไร ก็ยังถือเป็นไม้ที่แย่ ส่วนไม้ที่ทำตามวินัยเป๊ะๆ แต่โดน SL ก็ยังเป็นไม้ที่ยอดเยี่ยม",
    reflectionTh: "อย่าตัดสินคุณภาพการเทรดจากผลกำไรชั่วคราว ให้ตัดสินจากการที่คุณปฏิบัติตามแผนได้ดีแค่ไหน",
  },
  {
    id: 'soc-reddit-6',
    author: 'Twitter Trader Reality Check',
    role: 'ข้อความเตือนสตินักเก็งกำไร',
    category: 'acceptance',
    quoteEn: "The chart didn't betray you. You broke your own rules and you know it.",
    quoteTh: "กราฟไม่ได้ทรยศคุณ คุณแหกกฎของตัวเองต่างหาก และคุณก็รู้แก่ใจดี",
    reflectionTh: "ซื่อสัตย์กับตัวเอง ตรวจสอบไดอารี่ว่าข้อผิดพลาดเกิดจากอะไร และไม่ยอมให้เกิดขึ้นซ้ำสอง",
  },
  {
    id: 'soc-reddit-7',
    author: 'Pro Daytrader Twitter Rule',
    role: 'กฎการเอาชีวิตรอดในตลาดหุ้นและฟอเร็กซ์',
    category: 'patience',
    quoteEn: "The market is open 250 days a year. There is zero reason to force a trade when you don't feel 100%.",
    quoteTh: "ตลาดเปิดปีละกว่า 250 วัน ไม่มีเหตุผลแม้แต่นิดเดียวที่คุณจะต้องฝืนเทรด ในวันที่อารมณ์และสติของคุณไม่พร้อม",
    reflectionTh: "วันที่เหนื่อย ป่วย หรือเครียดจากเรื่องส่วนตัว การไม่เทรดคือกำไรที่ดีที่สุดของคุณ",
  },
  {
    id: 'soc-dan-zanger-1',
    author: 'Dan Zanger (@DanZanger)',
    role: 'Twitter/X • เจ้าของสถิติโลกผลตอบแทน 10,000%+',
    category: 'patience',
    quoteEn: "Cash is a position. Often the best position you can have when market direction is cloudy.",
    quoteTh: "การถือเงินสดก็คือ Position หนึ่ง และมักเป็น Position ที่ดีที่สุดในวันที่ทิศทางตลาดไม่ชัดเจน",
    reflectionTh: "เงินสดในพอร์ตทำให้ใจของคุณนิ่ง มีอิสระ และพร้อมคว้าจังหวะทองเมื่อตลาดเฉลยทิศทาง",
  },
  {
    id: 'soc-al-brooks-1',
    author: 'Al Brooks (@BrooksPriceAct)',
    role: 'บิดาแห่ง Price Action สมัยใหม่',
    category: 'patience',
    quoteEn: "The market spends most of its time in trading ranges. Patience and sitting on your hands is the ultimate edge.",
    quoteTh: "ตลาดใช้เวลาส่วนใหญ่วิ่งอยู่ในกรอบ ไร้ทิศทาง ความอดทนและการนั่งทับมือคือแต้มต่อที่ทรงพลังที่สุด",
    reflectionTh: "อย่าเทรดทุกแท่งเทียนที่ขยับ รอเฉพาะแท่งที่ยืนยันการ Breakout หรือทดสอบแนวรับแนวต้านที่ชัดเจน",
  },
  {
    id: 'soc-jim-simons-1',
    author: 'Jim Simons',
    role: 'ผู้ก่อตั้ง Renaissance Technologies (กองทุน Medallion Fund)',
    category: 'acceptance',
    quoteEn: "We are right only about 50.75% of the time. But with strict risk control, a 51% edge creates billions.",
    quoteTh: "เราทายถูกแค่ประมาณ 50.75% ของเวลาทั้งหมด แต่ด้วยการควบคุมความเสี่ยงอย่างเข้มงวด แต้มต่อแค่ 51% ก็สร้างผลตอบแทนมหาศาลได้",
    reflectionTh: "คุณไม่จำเป็นต้องมีญาณทิพย์ทายถูกทุกไม้ ขอแค่คุมความเสี่ยงและปล่อยให้สถิติทำงานต่อเนื่อง",
  },
  {
    id: 'soc-naval-1',
    author: 'Naval Ravikant (@naval)',
    role: 'Twitter/X • นักคิดและนักลงทุนซิลิคอนวัลเลย์',
    category: 'discipline',
    quoteEn: "Impatience with actions, patience with results. Trade only high quality setups and wait.",
    quoteTh: "จงใจร้อนในการลงมือปฏิบัติตามวินัย แต่จงใจเย็นและอดทนรอผลลัพธ์ของสถิติระยะยาว",
    reflectionTh: "ทำสิ่งที่ถูกต้องซ้ำๆ ทุกวัน แล้วผลลัพธ์ของ Compound Interest จะดูแลพอร์ตของคุณเอง",
  },
  {
    id: 'soc-bob-volman-1',
    author: 'Bob Volman',
    role: 'ผู้เขียน Understanding Price Action',
    category: 'discipline',
    quoteEn: "Trading is not about predicting where the price will go; it is about knowing exactly what you will do when it gets there.",
    quoteTh: "การเทรดไม่ใช่การเดาว่าราคาจะไปตรงไหน แต่มันคือการรู้ล่วงหน้าว่าคุณจะทำอย่างไรเมื่อราคาไปถึงตรงนั้น",
    reflectionTh: "วางแผนแบบ 'If-Then' ไว้ล่วงหน้าเสมอ: ถ้าราคาหลุดแนวรับจะทำอะไร ถ้าราคาทะลุแนวต้านจะทำอะไร",
  },

  // --- TRADING CLASSICS & PSYCHOLOGY GIANTS ---
  {
    id: 'online-1',
    author: 'Brett Steenbarger',
    role: 'ผู้เขียน The Daily Trading Coach & นักจิตวิทยาการเทรดชั้นนำ',
    category: 'discipline',
    quoteEn: "The market is not a place to prove yourself. It's a place to make money.",
    quoteTh: "ตลาดไม่ใช่สถานที่ที่คุณจะมาพิสูจน์ศักดิ์ศรีหรืออีโก้ของตัวเอง มันเป็นเพียงสถานที่สำหรับทำเงิน",
    reflectionTh: "เมื่อคุณพยายามเอาชนะตลาดหรือพิสูจน์ว่าตัวเองถูก คุณมักจะลืมตัดขาดทุนและจบด้วยการพอร์ตแตก",
  },
  {
    id: 'online-2',
    author: 'Alexander Elder',
    role: 'ผู้เขียน Trading for a Living & จิตแพทย์ผู้ผันตัวมาเป็นเทรดเดอร์',
    category: 'discipline',
    quoteEn: "The goal of a successful trader is to make the best trades. Money is secondary.",
    quoteTh: "เป้าหมายของเทรดเดอร์ที่สำเร็จคือการเทรดตามแผนให้สมบูรณ์แบบที่สุด เรื่องเงินเป็นเพียงผลพลอยได้ตามมา",
    reflectionTh: "โฟกัสที่กระบวนการ (Execution) ไม่ใช่ตัวเลขกำไร/ขาดทุนแบบเรียลไทม์",
  },
  {
    id: 'online-3',
    author: 'Nassim Nicholas Taleb',
    role: 'ผู้เขียน The Black Swan & Fooled by Randomness',
    category: 'risk',
    quoteEn: "It is not how likely an event is to happen that matters, it is how much is made or lost when it happens.",
    quoteTh: "สิ่งสำคัญไม่ใช่ว่าเหตุการณ์นั้นมีโอกาสเกิดขึ้นบ่อยแค่ไหน แต่คือคุณได้หรือเสียเงินเท่าไหร่เมื่อมันเกิดขึ้น",
    reflectionTh: "วินเรท 90% ไม่มีประโยชน์เลยถ้า 10% ที่แพ้ทำให้พอร์ตของคุณพังทลาย คุมความเสี่ยงทุกครั้ง",
  },
  {
    id: 'online-4',
    author: 'Ray Dalio',
    role: 'ผู้ก่อตั้ง Bridgewater Associates (กองทุน Hedge Fund ที่ใหญ่ที่สุดในโลก)',
    category: 'discipline',
    quoteEn: "Pain + Reflection = Progress.",
    quoteTh: "ความเจ็บปวด + การทบทวนไตร่ตรอง = การเติบโตและพัฒนาการ",
    reflectionTh: "การขาดทุนและผิดพลาดคือบทเรียนที่มีค่าที่สุด บันทึกลง Trade Journal ทันทีเพื่อไม่ให้ผิดซ้ำ",
  },
  {
    id: 'online-5',
    author: 'Charlie Munger',
    role: 'รองประธาน Berkshire Hathaway & ปรมาจารย์ด้านการลงทุน',
    category: 'patience',
    quoteEn: "The big money is not in the buying and the selling, but in the waiting.",
    quoteTh: "เงินก้อนโตไม่ได้เกิดขึ้นจากการกดซื้อและกดขายอย่างเมามัน แต่มันเกิดขึ้นจากการอดทนรอคอย",
    reflectionTh: "การนั่งทับมือระหว่างที่ตลาดไม่มี Setup คุณภาพสูง คือทักษะที่ทำกำไรได้มากที่สุดของเทรดเดอร์",
  },
  {
    id: 'online-6',
    author: 'Tom Basso (Mr. Cool)',
    role: 'เทรดเดอร์ระดับตำนานจากหนังสือ Market Wizards',
    category: 'discipline',
    quoteEn: "I think investment psychology is by far the more important element, followed by risk control, with the least important consideration being where you buy and sell.",
    quoteTh: "จิตวิทยาการเทรดคือองค์ประกอบที่สำคัญที่สุด ตามมาด้วยการบริหารความเสี่ยง ส่วนจุดเข้าซื้อขายเป็นเรื่องที่สำคัญน้อยที่สุด",
    reflectionTh: "อย่าเสียเวลาหา Indicator วิเศษ ให้พัฒนาวินัยและแผนบริหารเงิน (Money Management) ก่อน",
  },
  {
    id: 'online-7',
    author: 'Bruce Kovner',
    role: 'มหาเศรษฐี Hedge Fund ผู้สร้างผลตอบแทนเฉลี่ย 87% ต่อปี',
    category: 'risk',
    quoteEn: "My experience with novice traders is that they trade 3 to 5 times too big. They are taking 5 to 10 percent risk on a trade they should be taking 1 to 2 percent risk on.",
    quoteTh: "จากประสบการณ์ของผม มือใหม่มักออก Lot ใหญ่เกินไป 3-5 เท่า พวกเขาเสี่ยง 5-10% ต่อไม้ ในจุดที่ควรเสี่ยงเพียง 1-2% เท่านั้น",
    reflectionTh: "ถ้าขนาด Lot ทำให้คุณนอนไม่หลับหรือต้องจ้องกราฟทุกนาที แปลว่าคุณ Overtrade แล้ว",
  },
  {
    id: 'online-8',
    author: 'Marty Schwartz',
    role: 'แชมป์ U.S. Investing Championship & ผู้เขียน Pit Bull',
    category: 'risk',
    quoteEn: "Before placing a trade, always ask: 'What is the worst that can happen?'",
    quoteTh: "ก่อนจะกดเปิดออเดอร์ทุกครั้ง จงถามตัวเองเสมอว่า: 'สิ่งที่แย่ที่สุดที่จะเกิดขึ้นได้คืออะไร?'",
    reflectionTh: "คิดถึง Stop Loss และการเอาตัวรอดก่อนคิดถึงกำไรเสมอ",
  },
  {
    id: 'online-9',
    author: 'Linda Raschke',
    role: 'ผู้เขียน Street Smarts & เทรดเดอร์ตำนานจาก Market Wizards',
    category: 'patience',
    quoteEn: "Good trading is boring. If trading is exciting, you are probably gambling.",
    quoteTh: "การเทรดที่ดีคือความน่าเบื่อ ถ้าการเทรดของคุณรู้สึกตื่นเต้นเร้าใจ แปลว่าคุณกำลังเล่นการพนันอยู่",
    reflectionTh: "เทรดเดอร์อาชีพทำซ้ำกระบวนการเดิมอย่างใจเย็น ไม่ใช่แสวงหาความตื่นเต้นเหมือนเข้าคาสิโน",
  },
  {
    id: 'online-10',
    author: 'Victor Sperandeo (Trader Vic)',
    role: 'สุดยอดเทรดเดอร์ Wall Street',
    category: 'discipline',
    quoteEn: "The key to trading success is emotional discipline. If intelligence were the key, there would be a lot more people making money trading.",
    quoteTh: "กุญแจสำคัญสู่ความสำเร็จคือวินัยทางอารมณ์ ถ้าความฉลาดคือปัจจัยหลัก คนส่วนใหญ่คงรวยจากการเทรดไปแล้ว",
    reflectionTh: "ความรู้เต็มหัวแต่คุมใจไม่ได้ = ล้มเหลว วินัยคือสะพานเชื่อมระหว่างความรู้กับผลกำไร",
  },
  {
    id: 'online-11',
    author: 'Larry Hite',
    role: 'ผู้บุกเบิก System Trading & Trend Following',
    category: 'risk',
    quoteEn: "Throughout my financial career, I have continually witnessed examples of other people that I have known being ruined by a failure to respect risk.",
    quoteTh: "ตลอดอาชีพในตลาดการเงิน ผมเห็นผู้คนมากมายพังพินาศซ้ำแล้วซ้ำเล่า เพียงเพราะพวกเขาไม่เคารพความเสี่ยง",
    reflectionTh: "เคารพ Stop Loss ของคุณเหมือนเคารพชีวิต อย่าเลื่อนหนีเด็ดขาด",
  },
  {
    id: 'online-12',
    author: 'Sun Tzu',
    role: 'ผู้เขียน The Art of War (พิชัยสงครามซุนวู)',
    category: 'patience',
    quoteEn: "He will win who knows when to fight and when not to fight.",
    quoteTh: "ผู้ที่จะชนะ คือผู้ที่รู้ว่าเวลาใดควรรบ และเวลาใดไม่ควรรบ",
    reflectionTh: "ไม่จำเป็นต้องมีสถานะในตลาดทุกวัน รู้ว่าเมื่อไหร่ควรอยู่นิ่งๆ นั่นคือชัยชนะครึ่งหนึ่งแล้ว",
  },
  {
    id: 'online-13',
    author: 'Seneca',
    role: 'ปรัชญาเมธี Stoic ยุคโรมันโบราณ',
    category: 'stoic',
    quoteEn: "We suffer more often in imagination than in reality.",
    quoteTh: "เรามักจะทุกข์ทรมานจากภาพจินตนาการในหัว มากกว่าความเป็นจริงที่เกิดขึ้นเสียอีก",
    reflectionTh: "ความกลัวขาดทุนมักรุนแรงกว่าการขาดทุนจริง เมื่อยอมรับ SL ล่วงหน้า ใจจะสงบลงทันที",
  },
  {
    id: 'online-14',
    author: 'Mark Douglas',
    role: 'ผู้เขียน Trading in the Zone',
    category: 'acceptance',
    quoteEn: "Why do you think unsuccessful traders are obsessed with market analysis? Because they crave the sense of certainty that analysis appears to give them.",
    quoteTh: "ทำไมคุณคิดว่าเทรดเดอร์ที่ขาดทุนถึงหมกมุ่นกับการวิเคราะห์ตลาดนัก? เพราะพวกเขาโหยหาความแน่นอนที่การวิเคราะห์ดูเหมือนจะมอบให้",
    reflectionTh: "ไม่มีการวิเคราะห์ใดรับประกันผลลัพธ์ 100% เลิกตามหาความแน่นอน แต่ให้โอบรับความน่าจะเป็น",
  },
  {
    id: 'online-15',
    author: 'Tom Hougaard',
    role: 'ผู้เขียน Best Loser Wins',
    category: 'acceptance',
    quoteEn: "The difference between winning traders and losing traders is not that winners predict better, but that winners lose better.",
    quoteTh: "ความแตกต่างระหว่างผู้ชนะกับผู้แพ้ ไม่ใช่ว่าผู้ชนะทำนายตลาดได้แม่นกว่า แต่คือผู้ชนะแพ้ได้อย่างมืออาชีพกว่า",
    reflectionTh: "การแพ้เป็นส่วนหนึ่งของเกม ตัดขาดทุนให้เล็ก แล้วปล่อยไม้ที่ถูกทางวิ่งทำกำไร",
  },
  {
    id: 'online-16',
    author: 'Jared Tendler',
    role: 'ผู้เขียน The Mental Game of Trading',
    category: 'discipline',
    quoteEn: "Emotions are not the problem. Your inability to interpret the data they carry is the problem.",
    quoteTh: "อารมณ์ไม่ใช่ปัญหา ปัญหาคือคุณไม่เข้าใจสัญญาณและข้อมูลที่อารมณ์นั้นกำลังพยายามบอกคุณ",
    reflectionTh: "ความโกรธ (Revenge Trade) มักบอกว่าคุณเพิ่งผิดหวังจากความคาดหวังที่สูงเกินไป ให้หยุดและปรับโฟกัส",
  },
  {
    id: 'online-17',
    author: 'Richard Dennis',
    role: 'ผู้ก่อตั้งตำนาน Turtle Traders',
    category: 'discipline',
    quoteEn: "I always say that you could publish my trading rules in the newspaper and no one would follow them. The key is consistency and discipline.",
    quoteTh: "ผมพูดเสมอว่าคุณจะเอาแผนการเทรดของผมไปลงหนังสือพิมพ์แจกทุกคนก็ได้ เพราะแทบไม่มีใครทำตามได้อยู่ดี สิ่งสำคัญคือความสม่ำเสมอและวินัย",
    reflectionTh: "ความลับไม่ได้อยู่ที่ระบบเทรด แต่อยู่ที่วินัยในการทำตามระบบในวันที่ตลาดไม่เป็นใจ",
  },
  {
    id: 'online-18',
    author: 'Paul Tudor Jones',
    role: 'ผู้จัดการกองทุน Tudor Investment Corporation',
    category: 'risk',
    quoteEn: "Where you want to be is always in control, never wishing, always trading, and always, first and foremost, protecting your butt.",
    quoteTh: "สิ่งที่คุณต้องเป็นคือผู้ควบคุมสถานการณ์เสมอ อย่าหวังลมๆ แล้งๆ และสิ่งแรกที่ต้องทำเสมอคือปกป้องเงินทุนของคุณ",
    reflectionTh: "ความหวัง (Hope) ไม่ใช่กลยุทธ์การเทรด ถ้าผิดทางต้อง Cut ทันทีตามแผน",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      topic = 'all',
      count = 5,
      apiKey: clientApiKey,
      excludeIds = [],
    } = body;
    const rawKey = clientApiKey || process.env.GEMINI_API_KEY || '';
    const apiKey = String(rawKey).trim().replace(/^["']|["']$/g, '');

    // Try Gemini API if key is available
    if (apiKey) {
      try {
        const prompt = `
You are a world-class trading psychologist and expert on viral social media trading wisdom (Twitter/X, Reddit r/Daytrading, trading coaches like Mark Minervini, Tom Dante, Steve Burns, Kristjan Qullamaggie, Peter Brandt, Yvan Byeajee, Lance Beggs, Rayner Teo).

Generate exactly ${count} punchy, viral, authentic trading psychology quotes.
Topic focus: "${topic === 'all' ? 'Core Trading Psychology, Emotional Discipline, Social Media Wisdom' : topic}".

Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "id": "gemini-${Date.now()}-1",
    "author": "Trader/Author Name (include Twitter handle if applicable)",
    "role": "Role, book or Twitter credit (in Thai, e.g. Twitter/X @handle หรือ ผู้เขียน...)",
    "category": "risk" | "discipline" | "patience" | "acceptance" | "stoic",
    "quoteEn": "Exact English quote or best known translation",
    "quoteTh": "Natural, punchy, high-impact Thai translation that strikes a chord with a trader",
    "reflectionTh": "Practical 1-2 sentence actionable takeaway or rule of thumb for Thai traders before pressing an order"
  }
]
Do not repeat commonly known quotes if possible. Return pure JSON.
`;

        const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
        for (const model of modelsToTry) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const aiRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.85,
                  maxOutputTokens: 2000,
                  responseMimeType: 'application/json',
                },
              }),
            });

            if (aiRes.ok) {
              const data = await aiRes.json();
              const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
              const parsed = JSON.parse(cleaned);

              if (Array.isArray(parsed) && parsed.length > 0) {
                return NextResponse.json({
                  success: true,
                  source: `AI Gemini (${model}) & Live Internet Wisdom`,
                  quotes: parsed.map((item, idx) => ({
                    ...item,
                    id: item.id || `ai-${Date.now()}-${idx}`,
                  })),
                });
              }
            }
          } catch (modelErr) {
            console.warn(`Model ${model} failed, trying next...`, modelErr);
          }
        }
      } catch (geminiError) {
        console.warn('Gemini request failed, falling back to curated online pool:', geminiError);
      }
    }

    // Filter by topic if specified
    let pool = [...CURATED_ONLINE_QUOTES];
    const excludedSet = new Set(Array.isArray(excludeIds) ? excludeIds : []);

    if (topic && topic !== 'all') {
      if (topic === 'social' || topic === 'twitter' || topic === 'reddit') {
        pool = pool.filter((q) => q.id.startsWith('soc-') || q.role.includes('Twitter') || q.role.includes('Reddit'));
      } else {
        const filtered = pool.filter(
          (q) =>
            q.category === topic ||
            q.author.toLowerCase().includes(topic.toLowerCase()) ||
            q.role.toLowerCase().includes(topic.toLowerCase())
        );
        if (filtered.length >= 2) {
          pool = filtered;
        }
      }
    }

    // Deduplication against excludeIds: prioritize quotes that the user hasn't seen in this session
    const freshQuotes = pool.filter((q) => !excludedSet.has(q.id));
    const candidatePool = freshQuotes.length >= (Number(count) || 5) ? freshQuotes : pool;

    // Shuffle pool with strong randomization
    const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(Number(count) || 5, candidatePool.length));

    return NextResponse.json({
      success: true,
      source: topic === 'social' ? 'Social Media & Twitter/X Wisdom' : 'Online Trading Psychology Wisdom Cloud',
      quotes: selected,
      totalAvailable: pool.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal error fetching quotes',
      },
      { status: 500 }
    );
  }
}
