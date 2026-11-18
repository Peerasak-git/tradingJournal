import { NextRequest, NextResponse } from 'next/server';

interface OnlineQuoteItem {
  id: string;
  author: string;
  role: string;
  category: 'risk' | 'discipline' | 'patience' | 'acceptance' | 'stoic';
  quoteEn: string;
  quoteTh: string;
  reflectionTh: string;
}

// Curated Online Fallback Bank (Rich quotes from trading literature & internet)
const CURATED_ONLINE_QUOTES: OnlineQuoteItem[] = [
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
    const { topic = 'all', count = 5, apiKey: clientApiKey } = body;
    const rawKey = clientApiKey || process.env.GEMINI_API_KEY || '';
    const apiKey = String(rawKey).trim().replace(/^["']|["']$/g, '');

    // Try Gemini API if key is available
    if (apiKey) {
      try {
        const prompt = `
You are a world-class trading psychologist and expert on books like "Trading in the Zone" by Mark Douglas, "Best Loser Wins" by Tom Hougaard, and "The Mental Game of Trading" by Jared Tendler.

Generate exactly ${count} profound, authentic trading psychology quotes found in trading literature or spoken by legendary traders (e.g. Mark Douglas, Tom Hougaard, Jesse Livermore, Paul Tudor Jones, Nassim Taleb, Ray Dalio, Brett Steenbarger, Ed Seykota, Marcus Aurelius, Epictetus).

Topic focus: "${topic === 'all' ? 'Core Trading Psychology, Emotional Discipline & Risk Control' : topic}".

Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "id": "gemini-${Date.now()}-1",
    "author": "Trader/Author Name",
    "role": "Title or book name (in Thai)",
    "category": "risk" | "discipline" | "patience" | "acceptance" | "stoic",
    "quoteEn": "Exact English quote or best known translation",
    "quoteTh": "Natural, punchy, high-impact Thai translation that strikes a chord with a trader",
    "reflectionTh": "Practical 1-2 sentence actionable takeaway or rule of thumb for Thai traders before pressing an order"
  }
]
Do not wrap in markdown tags other than standard json code block if any. Return pure JSON.
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
                  temperature: 0.7,
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

    // Fallback: Pick randomized high quality quotes from curated online pool matching category
    let pool = [...CURATED_ONLINE_QUOTES];
    if (topic && topic !== 'all') {
      const filtered = pool.filter((q) => q.category === topic || q.author.toLowerCase().includes(topic.toLowerCase()));
      if (filtered.length >= 2) {
        pool = filtered;
      }
    }

    // Shuffle pool
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(Number(count) || 5, pool.length));

    return NextResponse.json({
      success: true,
      source: 'Online Trading Psychology Wisdom Cloud',
      quotes: selected,
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
