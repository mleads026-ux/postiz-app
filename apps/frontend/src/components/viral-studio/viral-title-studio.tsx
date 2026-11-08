'use client';

import React, { useMemo, useState } from 'react';

type Platform = 'youtube' | 'instagram' | 'tiktok' | 'facebook';
type Genre = 'history' | 'facts' | 'comedy' | 'mystery' | 'general';

type Idea = {
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  score: number;
  reason: string;
};

const PLATFORMS: { id: Platform; name: string; icon: string }[] = [
  { id: 'youtube', name: 'YouTube Shorts', icon: '▶' },
  { id: 'instagram', name: 'Instagram Reels', icon: '◎' },
  { id: 'tiktok', name: 'TikTok', icon: '♪' },
  { id: 'facebook', name: 'Facebook Reels', icon: 'f' },
];

const TAGS: Record<Genre, string[]> = {
  history: ['غرائب_التاريخ', 'قصص_تاريخية', 'تاريخ', 'حكايات_غريبة'],
  facts: ['هل_تعلم', 'معلومات_غريبة', 'حقائق', 'معلومات'],
  comedy: ['كوميديا', 'ضحك', 'مواقف_مضحكة', 'ترفيه'],
  mystery: ['غموض', 'قصص_غريبة', 'أسرار', 'حكايات'],
  general: ['قصص', 'محتوى_عربي', 'حكايات', 'اكتشف'],
};

const PLATFORM_TAGS: Record<Platform, string[]> = {
  youtube: ['Shorts', 'HistoryShorts', 'Viral', 'Trending'],
  instagram: ['reels', 'explore', 'viral', 'trending'],
  tiktok: ['fyp', 'foryou', 'tiktokarab', 'viral'],
  facebook: ['FacebookReels', 'reels', 'viral', 'قصص'],
};

const PLATFORM_GUIDE: Record<Platform, string> = {
  youtube: 'عنوان فيه فضول وكلمات مفهومة للبحث. هاشتاج Shorts في الوصف.',
  instagram: 'جملة افتتاحية قوية وكابشن يدعو الناس للتعليق أو المشاركة.',
  tiktok: 'سؤال أو مفاجأة من أول ثانية، وكابشن سريع ومباشر.',
  facebook: 'حكاية قصيرة مفهومة وسؤال في النهاية يشجع النقاش.',
};

function normalize(value: string, fallback: string) {
  return value.trim().replace(/\s+/g, ' ') || fallback;
}

function short(value: string, limit: number) {
  const text = value.trim();
  if (text.length <= limit) return text;
  const part = text.slice(0, limit);
  const safeBreak = part.lastIndexOf(' ');
  return (safeBreak > Math.floor(limit * 0.65) ? part.slice(0, safeBreak) : part).trim() + '…';
}

function scoreTitle(title: string, platform: Platform): { value: number; reason: string } {
  const length = title.length;
  let score = 53;
  const reasons: string[] = [];

  if (/[؟?!]/.test(title)) {
    score += 9;
    reasons.push('بيثير سؤالًا');
  }
  if (/لكن|بس|المفاجأة|السر|النهاية|اتصدم|محدش|تتوقع|تصدق|أغرب|تخيل/.test(title)) {
    score += 10;
    reasons.push('فيه عنصر فضول');
  }
  if (/إزاي|ليه|مين|إيه|ماذا|كيف/.test(title)) {
    score += 7;
    reasons.push('مدخل مباشر');
  }
  const target = platform === 'youtube' ? 76 : platform === 'facebook' ? 95 : 82;
  if (length >= 22 && length <= target) {
    score += 13;
    reasons.push('طوله مناسب');
  } else if (length > target) {
    score -= Math.min(19, Math.round((length - target) / 3));
  } else {
    score -= 5;
  }
  if (/(…|\.{3})/.test(title)) score += 4;
  if (/(!!!|\?\?\?|😱😱)/.test(title)) score -= 8;

  return {
    value: Math.max(35, Math.min(95, score)),
    reason: reasons.slice(0, 3).join(' • ') || 'صياغة مباشرة',
  };
}

function makeIdeas(
  topicInput: string,
  setupInput: string,
  revealInput: string,
  genre: Genre,
  platform: Platform
): Idea[] {
  const topic = normalize(topicInput, 'الحكاية دي');
  const setup = normalize(setupInput, 'حصل موقف غريب');
  const reveal = normalize(revealInput, 'والنهاية كانت غير متوقعة');
  const name = short(topic, 48);
  const briefSetup = short(setup, 64);

  const titles = [
    'اللي حصل في ' + name + ' محدش كان يتخيله! 😱',
    'تخيل ' + briefSetup + '… وبعدين حصلت المفاجأة!',
    'ليه كل الناس اتصدمت من حكاية ' + name + '؟',
    'أغرب تفصيلة في ' + name + '… استنى للنهاية!',
    'كانوا فاكرين إن الحكاية خلصت… بس ' + name + ' قلبت الموازين!',
    'تصدق إن ' + name + ' حصلت بالشكل ده؟!',
    'قرار واحد في ' + name + ' غيّر كل حاجة!',
    'إزاي ' + name + ' انتهت بالنهاية الغريبة دي؟',
    'السر اللي ورا ' + name + ' مش اللي في بالك!',
    name + ': لحظة واحدة خلت الكل يتصدم!',
  ];

  const hooks = [
    'تخيل إن ' + briefSetup + '… بس اللي حصل بعدها مش طبيعي!',
    'تفتكر إيه أغرب حاجة ممكن تحصل لما ' + briefSetup + '؟',
    'استنى! الحكاية دي نهايتها عكس اللي أنت متوقعه.',
    'في 3 ثواني هقولك ليه حكاية ' + name + ' غريبة.',
    'كل حاجة كانت ماشية عادي… لحد ما حصلت المفاجأة!',
    'ممكن تصدق إن ' + briefSetup + '؟',
    'شخص واحد خد قرار… والنتيجة صدمت الكل.',
    'اللي هتسمعه عن ' + name + ' أغرب من الخيال.',
    'ناس كتير تعرف البداية… لكن مش النهاية!',
    'بص كويس: اللحظة الجاية هي اللي غيّرت الحكاية.',
  ];

  const baseTags = [...PLATFORM_TAGS[platform], ...TAGS[genre]];
  const maxTags = platform === 'instagram' || platform === 'tiktok' ? 5 : 7;
  const hashtags = [...new Set(baseTags)].slice(0, maxTags).map((tag) => '#' + tag);
  const intro = platform === 'tiktok'
    ? '😱 ' + briefSetup + '!'
    : platform === 'youtube'
      ? '😱 حكاية ' + topic + ' فيها مفاجأة غريبة!'
      : platform === 'instagram'
        ? '😱 كنت تتوقع اللي حصل في ' + topic + '؟'
        : '📖 من أغرب الحكايات: ' + topic + '!';
  const caption =
    intro + '\n\n' +
    setup.trim() + '\n\n' +
    '🔥 ' + reveal.trim() + '\n\n' +
    (platform === 'youtube'
      ? '💬 كنت تتوقع النهاية دي؟ اشترك عشان تشوف حكايات أكتر!'
      : platform === 'facebook'
        ? '💬 لو كنت مكانهم، كنت هتتصرف إزاي؟ تابع الصفحة للمزيد!'
        : '💬 توقعت النهاية؟ اكتب رأيك وتابعنا للمزيد!') +
    '\n\n' + hashtags.join(' ');

  return titles.map((title, index) => {
    const judged = scoreTitle(title, platform);
    return {
      title,
      hook: hooks[index],
      caption,
      hashtags,
      score: judged.value,
      reason: judged.reason,
    };
  }).sort((a, b) => b.score - a.score);
}

export function ViralTitleStudio() {
  const [topic, setTopic] = useState('نساء فاينسبرغ سنة 1140');
  const [setup, setSetup] = useState('الملك سمح للستات يخرجوا من القلعة بأغلى حاجة يقدروا يشيلوها');
  const [reveal, setReveal] = useState('كل واحدة شالت جوزها على ضهرها، والملك احترم وعده حسب الأسطورة');
  const [genre, setGenre] = useState<Genre>('history');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [copied, setCopied] = useState<string>('');
  const [showAll, setShowAll] = useState(false);

  const ideas = useMemo(
    () => makeIdeas(topic, setup, reveal, genre, platform),
    [topic, setup, reveal, genre, platform]
  );
  const best = ideas[0];

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied('تعذر النسخ تلقائيًا. حدّد النص وانسخه يدويًا.');
    }
  }

  function selectedPlatform(next: Platform) {
    setPlatform(next);
    setShowAll(false);
    setCopied('');
  }

  return (
    <main dir="rtl" className="w-full min-h-full overflow-y-auto bg-newBgColorInner text-newTextColor px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1100px] flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-[#a78bfa]">✦ Viral Title Studio</p>
          <h2 className="text-2xl md:text-3xl font-bold">عناوين تشد الانتباه لكل منصة</h2>
          <p className="text-sm text-textItemBlur leading-7">
            اكتب الفكرة والموقف والمفاجأة. هتلاقي 10 عناوين وHooks جاهزة، وكابشن وهاشتاجات منفصلة لكل منصة.
          </p>
        </header>

        <section className="rounded-2xl border border-[#393940] bg-[#1a1a20] p-4 md:p-6 flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-semibold">
              موضوع الفيديو
              <input
                className="w-full rounded-xl border border-[#494950] bg-[#111115] px-4 py-3 text-white outline-none focus:border-[#a78bfa]"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={160}
                placeholder="مثال: أغرب حكاية من العصور الوسطى"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              نوع المحتوى
              <select
                className="w-full rounded-xl border border-[#494950] bg-[#111115] px-4 py-3 text-white outline-none focus:border-[#a78bfa]"
                value={genre}
                onChange={(event) => setGenre(event.target.value as Genre)}
              >
                <option value="history">قصص تاريخية</option>
                <option value="facts">معلومات وحقائق</option>
                <option value="comedy">كوميديا</option>
                <option value="mystery">غموض</option>
                <option value="general">محتوى عام</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            إيه اللي حصل في أول القصة؟
            <textarea
              className="min-h-[92px] w-full resize-y rounded-xl border border-[#494950] bg-[#111115] px-4 py-3 text-white outline-none focus:border-[#a78bfa]"
              value={setup}
              onChange={(event) => setSetup(event.target.value)}
              maxLength={500}
              placeholder="الموقف اللي يخلّي المشاهد يكمل"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold">
            إيه المفاجأة أو نهاية القصة؟
            <textarea
              className="min-h-[92px] w-full resize-y rounded-xl border border-[#494950] bg-[#111115] px-4 py-3 text-white outline-none focus:border-[#a78bfa]"
              value={reveal}
              onChange={(event) => setReveal(event.target.value)}
              maxLength={500}
              placeholder="المفاجأة اللي هنخلي المشاهد مستنيها"
            />
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-lg font-bold">اختار منصة النشر</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {PLATFORMS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={platform === item.id}
                onClick={() => selectedPlatform(item.id)}
                className={
                  'rounded-xl border p-3 text-sm font-semibold transition-colors ' +
                  (platform === item.id
                    ? 'border-[#a78bfa] bg-[#31254a] text-white'
                    : 'border-[#393940] bg-[#1a1a20] hover:bg-[#272730]')
                }
              >
                <span aria-hidden="true" className="me-2">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
          <p className="text-sm text-textItemBlur">{PLATFORM_GUIDE[platform]}</p>
        </section>

        <div className="rounded-xl border border-[#54482b] bg-[#292417] p-3 text-sm leading-6 text-[#f5d89b]">
          <strong>مهم:</strong> الدرجات تقديرية بناءً على صياغة العنوان وطوله والفضول، وليست توقعًا للمشاهدات.
          الأداة لا تجلب ترندات أو أرقام منافسين، ولا تستخدم AI API حاليًا.
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">أفضل عنوان مقترح</h3>
            <span className="rounded-full bg-[#31254a] px-3 py-1 text-sm font-bold text-[#d8c2ff]">
              {best.score}/100 تقديري
            </span>
          </div>

          <article className="rounded-2xl border border-[#6d58a1] bg-[#211b2c] p-4 md:p-6 flex flex-col gap-4">
            <h4 className="text-xl md:text-2xl leading-relaxed font-bold">{best.title}</h4>
            <div className="rounded-xl bg-[#14121b] p-4">
              <p className="text-xs font-semibold text-[#c4a5fa] mb-1">🎬 Hook لأول 3 ثواني</p>
              <p className="leading-7">{best.hook}</p>
            </div>
            <p className="text-xs text-textItemBlur">سبب التقييم: {best.reason}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyText(best.title, 'العنوان')}
                className="rounded-lg bg-[#7856bf] px-4 py-2 text-sm font-semibold text-white"
              >
                نسخ العنوان
              </button>
              <button
                type="button"
                onClick={() => copyText(best.hook, 'الـHook')}
                className="rounded-lg border border-[#6b5a87] px-4 py-2 text-sm font-semibold"
              >
                نسخ الـHook
              </button>
              <button
                type="button"
                onClick={() => copyText(best.title + '\n\n' + best.caption, 'الباقة كاملة')}
                className="rounded-lg border border-[#6b5a87] px-4 py-2 text-sm font-semibold"
              >
                نسخ العنوان والكابشن
              </button>
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-[#393940] bg-[#1a1a20] p-4 md:p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">الكابشن والهاشتاجات — {PLATFORMS.find((item) => item.id === platform)?.name}</h3>
            <button
              type="button"
              onClick={() => copyText(best.caption, 'الكابشن')}
              className="shrink-0 rounded-lg border border-[#55555c] px-3 py-2 text-sm"
            >
              نسخ
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-8 text-[#dfdfe3]">{best.caption}</p>
        </section>

        <section className="flex flex-col gap-3 pb-8">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="w-full rounded-xl border border-[#55555c] py-3 text-sm font-semibold hover:bg-[#24242a]"
          >
            {showAll ? 'إخفاء باقي العناوين' : 'عرض 9 عناوين بديلة'}
          </button>
          {showAll && ideas.slice(1).map((idea, index) => (
            <article key={idea.title} className="rounded-xl border border-[#393940] bg-[#1a1a20] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-textItemBlur">اقتراح {index + 2}</span>
                <span className="text-sm text-[#d8c2ff]">{idea.score}/100 تقديري</span>
              </div>
              <p className="font-semibold leading-7">{idea.title}</p>
              <p className="text-sm leading-6 text-textItemBlur">Hook: {idea.hook}</p>
              <button
                type="button"
                onClick={() => copyText(idea.title + '\n' + idea.hook, 'الاقتراح ' + (index + 2))}
                className="self-start rounded-lg border border-[#55555c] px-3 py-2 text-sm"
              >
                نسخ الاقتراح
              </button>
            </article>
          ))}
        </section>

        {copied && (
          <p role="status" aria-live="polite" className="fixed bottom-5 left-5 z-50 rounded-xl border border-[#6d58a1] bg-[#292137] px-4 py-3 text-sm shadow-lg">
            {copied.startsWith('تعذر') ? copied : 'تم نسخ ' + copied + ' ✓'}
          </p>
        )}
      </div>
    </main>
  );
}
