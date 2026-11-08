'use client';

import { useMemo, useState } from 'react';

type Platform = 'youtube' | 'tiktok' | 'instagram' | 'facebook';
type Style = 'curiosity' | 'surprise' | 'question';

type Candidate = {
  title: string;
  hook: string;
  approach: string;
  score: number;
};

const platforms: Record<
  Platform,
  { label: string; description: string; tags: string[]; tagLimit: number }
> = {
  youtube: {
    label: 'YouTube Shorts',
    description: 'عنوان قصير قابل للبحث مع Hook واضح.',
    tags: ['#Shorts', '#HistoryShorts', '#غرائب_التاريخ'],
    tagLimit: 4,
  },
  tiktok: {
    label: 'TikTok',
    description: 'سؤال سريع ومباشر يلفت الانتباه من أول ثانية.',
    tags: ['#fyp', '#foryou', '#viral', '#قصص_غريبة', '#غرائب_التاريخ'],
    tagLimit: 5,
  },
  instagram: {
    label: 'Instagram Reels',
    description: 'فضول بصري وسؤال يشجع المشاهد على التعليق.',
    tags: ['#reels', '#viral', '#explore', '#trending', '#غرائب_التاريخ'],
    tagLimit: 5,
  },
  facebook: {
    label: 'Facebook Reels',
    description: 'كابشن يحكي بداية القصة ويشجع النقاش والمشاركة.',
    tags: ['#reels', '#viral', '#قصص_تاريخية', '#غرائب_التاريخ'],
    tagLimit: 5,
  },
};

const styles: { id: Style; label: string }[] = [
  { id: 'curiosity', label: 'فضول وغموض' },
  { id: 'surprise', label: 'صدمة ومفاجأة' },
  { id: 'question', label: 'سؤال وتفاعل' },
];

function shorten(value: string, max = 65): string {
  const clean = value.trim().replace(/\s+/g, ' ');
  return clean.length <= max ? clean : clean.slice(0, max - 1).trimEnd() + '…';
}

function safeHashtag(value: string): string {
  return value
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^\p{L}\p{N}_]/gu, '');
}

function createHashtags(platform: Platform, keywords: string): string[] {
  const extra = keywords
    .split(/[,،\n]+/)
    .map(safeHashtag)
    .filter(Boolean)
    .map((keyword) => '#' + keyword);
  const base = platforms[platform].tags;
  const limit = platforms[platform].tagLimit;
  // Keep some broad and some topic-specific tags. No claim of live trending data.
  return Array.from(new Set([...base.slice(0, 3), ...extra, ...base.slice(3)])).slice(0, limit);
}

function editorialScore(title: string, hook: string, topic: string): number {
  // Editorial heuristics only. This is not a prediction of views or reach.
  let score = 48;
  if (title.length >= 28 && title.length <= 95) score += 12;
  if (title.length < 20 || title.length > 110) score -= 12;
  if (/[؟?]/.test(title) || /[؟?]/.test(hook)) score += 8;
  if (/[!！…]/.test(title)) score += 5;
  if (/تخيل|إزاي|ماذا|إيه|مين|سر|مفاجأة|مكنش|تصدق|اللي حصل/.test(title + hook)) score += 12;
  if (hook.length >= 20 && hook.length <= 105) score += 8;
  const firstWord = topic.split(/\s+/)[0] || '';
  if (firstWord.length > 2 && title.includes(firstWord)) score += 5;
  if (title.length > 100) score -= 7;
  return Math.min(94, Math.max(35, score));
}

function generateCandidates(
  topic: string,
  twist: string,
  context: string,
  platform: Platform,
  style: Style,
  hideTwist: boolean
): Candidate[] {
  if (!topic.trim()) return [];
  const subject = shorten(topic, 58);
  const shortSubject = shorten(topic, 43);
  const fact = shorten(twist, 62);
  const setting = shorten(context, 44);

  const ideas = [
    {
      approach: 'صدمة',
      title: '😱 ' + subject + '… واللي حصل بعدها صدم الكل!',
      hook: 'تخيل ' + subject + '… بس استنى لما تعرف اللي حصل بعدها!',
    },
    {
      approach: 'سؤال',
      title: 'إيه اللي حصل بعد ' + shortSubject + '؟ 👀',
      hook: 'لو كنت مكانهم، تفتكر كنت هتتصرف إزاي؟',
    },
    {
      approach: 'غموض',
      title: 'سر أغرب نهاية لحكاية ' + shortSubject + '!',
      hook: 'في تفصيلة في الحكاية دي محدش كان متوقعها.',
    },
    {
      approach: 'تشويق',
      title: 'الكل افتكر إنها النهاية… لكن ' + shortSubject + '!',
      hook: 'كل حاجة كانت ماشية بشكل طبيعي، لحد ما حصلت المفاجأة.',
    },
    {
      approach: 'تحدي',
      title: 'تقدر تتوقع نهاية حكاية ' + shortSubject + '؟',
      hook: 'هحكيلك موقف غريب، وشوف هتعرف تتوقع نهايته ولا لأ.',
    },
    {
      approach: 'قصة',
      title: (setting ? setting + ' | ' : '') + subject + '… وحصلت المفاجأة!',
      hook: (setting ? 'الحكاية بدأت في ' + setting + '. ' : '') + 'اسمع اللي حصل!',
    },
  ];

  if (fact && !hideTwist) {
    ideas.push({
      approach: 'كشف المفاجأة',
      title: '😱 ' + fact + '… والسبب أغرب مما تتخيل!',
      hook: 'المفاجأة إن ' + fact + '! بس إزاي وصلوا لكده؟',
    });
    ideas.push({
      approach: 'مباشر',
      title: fact + '! 👀 حكاية محدش يتوقعها',
      hook: 'عارف إن ' + fact + '؟ تعال أقولك الحكاية.',
    });
  }

  const priority: Record<Style, string[]> = {
    curiosity: ['غموض', 'تشويق', 'سؤال', 'تحدي', 'صدمة', 'قصة'],
    surprise: ['صدمة', 'كشف المفاجأة', 'مباشر', 'تشويق', 'غموض', 'قصة'],
    question: ['سؤال', 'تحدي', 'غموض', 'صدمة', 'قصة', 'تشويق'],
  };

  const final = ideas.map((idea) => {
    const suffix = platform === 'youtube' ? ' #Shorts' : '';
    const maxLength = platform === 'youtube' ? 92 : platform === 'tiktok' ? 100 : 130;
    const title = shorten(idea.title, maxLength) + suffix;
    const base = editorialScore(title, idea.hook, topic);
    const position = priority[style].indexOf(idea.approach);
    const preference = position < 0 ? 0 : Math.max(0, 8 - position * 2);
    return {
      ...idea,
      title,
      score: Math.min(96, base + preference),
    };
  });

  return final.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'ar'));
}

function makeCaption(
  platform: Platform,
  title: string,
  topic: string,
  twist: string,
  context: string,
  hideTwist: boolean,
  hashtags: string[]
): string {
  const cta =
    platform === 'youtube'
      ? 'اشترك عشان تعرف حكايات أغرب من الخيال! 🔔'
      : platform === 'facebook'
        ? '💬 لو كنت مكانهم، كنت هتعمل إيه؟ اكتب رأيك وشارك الحكاية!'
        : '💬 كنت هتتصرف إزاي؟ اكتب رأيك وتابعنا لباقي الحكايات!';
  const story = '🎬 ' + shorten(topic, 180) + '.';
  const reveal = !hideTwist && twist.trim()
    ? '🤯 والمفاجأة: ' + shorten(twist, 180) + '!'
    : '🤯 لكن اللي حصل في النهاية كان أغرب من المتوقع!';
  return [
    title,
    '',
    context.trim() ? '📍 ' + context.trim() : '',
    story,
    reveal,
    '',
    cta,
    '',
    hashtags.join(' '),
  ].filter((line) => line !== '').join('\n');
}

function createYoutubeTags(topic: string, keywords: string): string {
  const terms = [
    'shorts', 'viral shorts', 'youtube shorts', 'history shorts',
    'weird history', 'history facts', 'did you know',
    'storytelling', 'animated history', 'قصص تاريخية',
    'غرائب التاريخ', 'هل تعلم', 'قصص غريبة',
    ...keywords.split(/[,،\n]+/).map((word) => word.trim()).filter(Boolean),
    shorten(topic, 65),
  ];
  const unique = Array.from(new Set(terms.map((term) => term.toLowerCase().trim()).filter(Boolean)));
  let result = '';
  for (const term of unique) {
    const candidate = result ? result + ', ' + term : term;
    if (candidate.length > 500) break;
    result = candidate;
  }
  return result;
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-[14px] text-newTextColor outline-none transition-colors focus:border-violet-400 placeholder:text-textItemBlur';

export function ViralStudio() {
  const [topic, setTopic] = useState('ملك حاصر قلعة وسمح للنساء ياخدوا أغلى حاجة عندهم');
  const [twist, setTwist] = useState('كل واحدة شالت جوزها على ضهرها');
  const [context, setContext] = useState('ألمانيا سنة 1140م');
  const [keywords, setKeywords] = useState('غرائب التاريخ، نساء فاينسبرغ، قصص تاريخية');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [style, setStyle] = useState<Style>('curiosity');
  const [hideTwist, setHideTwist] = useState(true);
  const [chosenIndex, setChosenIndex] = useState(0);
  const [copied, setCopied] = useState('');

  const candidates = useMemo(
    () => generateCandidates(topic, twist, context, platform, style, hideTwist),
    [topic, twist, context, platform, style, hideTwist]
  );
  const hashtags = useMemo(
    () => createHashtags(platform, keywords),
    [platform, keywords]
  );
  const youtubeTags = useMemo(
    () => createYoutubeTags(topic, keywords),
    [topic, keywords]
  );
  const chosen = candidates[Math.min(chosenIndex, Math.max(0, candidates.length - 1))];
  const caption = chosen
    ? makeCaption(platform, chosen.title, topic, twist, context, hideTwist, hashtags)
    : '';

  async function copyText(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
    } catch {
      setCopied('error');
    }
  }

  function selectPlatform(value: Platform) {
    setPlatform(value);
    setChosenIndex(0);
    setCopied('');
  }

  function selectStyle(value: Style) {
    setStyle(value);
    setChosenIndex(0);
    setCopied('');
  }

  return (
    <main dir="rtl" lang="ar" className="min-w-0 flex-1 overflow-y-auto bg-newBgColorInner p-4 text-newTextColor md:p-7">
      <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-6">
        <header className="rounded-2xl border border-violet-500/25 bg-gradient-to-bl from-violet-600/20 to-transparent p-5 md:p-7">
          <div className="mb-2 inline-flex rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200">
            Postiz • Viral Title Studio
          </div>
          <h2 className="text-2xl font-bold md:text-3xl">اصنع عنوان يخطف الانتباه ✨</h2>
          <p className="mt-2 max-w-[760px] text-sm leading-7 text-textItemBlur">
            اختار أقوى Hook، واطلع بعنوان وكابشن وهاشتاجات مختلفة لكل منصة.
            دي نسخة تعمل محليًا بدون مفاتيح API أو إرسال فكرتك لخدمة خارجية.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-newBgLineColor p-4 md:p-5">
            <div>
              <h3 className="text-lg font-bold">1. تفاصيل الفيديو</h3>
              <p className="mt-1 text-xs text-textItemBlur">المثال الموجود قابل للتعديل بالكامل.</p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              فكرة الفيديو *
              <textarea
                className={inputClass + ' min-h-[105px] resize-y'}
                value={topic}
                maxLength={400}
                onChange={(event) => { setTopic(event.target.value); setChosenIndex(0); }}
                placeholder="مثال: ملك حاصر قلعة وسمح للنساء بالخروج…"
                aria-required="true"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              المفاجأة أو نهاية القصة
              <textarea
                className={inputClass + ' min-h-[78px] resize-y'}
                value={twist}
                maxLength={350}
                onChange={(event) => { setTwist(event.target.value); setChosenIndex(0); }}
                placeholder="مثال: كل واحدة شالت جوزها على ضهرها"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              الزمان أو المكان (اختياري)
              <input className={inputClass} value={context} maxLength={120} onChange={(event) => { setContext(event.target.value); setChosenIndex(0); }} placeholder="مصر سنة 1900…" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              كلمات مفتاحية (افصل بينها بفاصلة)
              <input className={inputClass} value={keywords} maxLength={260} onChange={(event) => setKeywords(event.target.value)} placeholder="تاريخ، قصص غريبة، معلومة" />
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/10 p-3 text-sm">
              <input type="checkbox" checked={hideTwist} onChange={(event) => { setHideTwist(event.target.checked); setChosenIndex(0); }} className="h-4 w-4 accent-violet-500" />
              <span>متكشفش المفاجأة في العنوان</span>
            </label>
          </section>

          <section className="flex min-w-0 flex-col gap-4">
            <div className="rounded-2xl border border-white/10 bg-newBgLineColor p-4 md:p-5">
              <h3 className="mb-3 text-lg font-bold">2. اختار المنصة</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(platforms) as Platform[]).map((key) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => selectPlatform(key)}
                    aria-pressed={platform === key}
                    className={'rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ' + (
                      platform === key
                        ? 'border-violet-400 bg-violet-600/25 text-white'
                        : 'border-white/10 bg-black/10 text-textItemBlur hover:border-white/30'
                    )}
                  >
                    {platforms[key].label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-textItemBlur">{platforms[platform].description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {styles.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectStyle(item.id)}
                    aria-pressed={style === item.id}
                    className={'rounded-full px-4 py-2 text-xs font-semibold transition-colors ' + (
                      style === item.id ? 'bg-violet-600 text-white' : 'border border-white/10 bg-black/10 text-textItemBlur'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-newBgLineColor p-4 md:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">3. العناوين والـHooks</h3>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-textItemBlur">
                  تقييم تحريري تقديري، مش توقع للمشاهدات
                </span>
              </div>
              {!candidates.length ? (
                <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-textItemBlur">
                  اكتب فكرة الفيديو في الخانة الأولى عشان تظهر الاقتراحات.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {candidates.map((item, index) => (
                    <button
                      type="button"
                      key={item.approach}
                      onClick={() => setChosenIndex(index)}
                      aria-pressed={chosenIndex === index}
                      className={'w-full rounded-xl border p-4 text-right transition-colors ' + (
                        chosenIndex === index
                          ? 'border-violet-400 bg-violet-600/15'
                          : 'border-white/10 bg-black/10 hover:border-white/30'
                      )}
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-textItemBlur">{item.approach}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-bold">
                          {item.score}/100
                        </span>
                      </div>
                      <div className="text-[15px] font-bold leading-7">{item.title}</div>
                      <div className="mt-2 text-xs leading-6 text-textItemBlur">🎬 أول 3 ثواني: {item.hook}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {chosen && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-newBgLineColor p-4 md:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">العنوان المختار</h3>
                <button type="button" onClick={() => copyText(chosen.title, 'title')} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500">
                  {copied === 'title' ? 'تم النسخ ✓' : 'نسخ العنوان'}
                </button>
              </div>
              <p className="text-base font-bold leading-8">{chosen.title}</p>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-3 text-sm leading-7">
                <span className="text-xs text-textItemBlur">Hook مقترح للصوت في بداية الفيديو:</span>
                <p>{chosen.hook}</p>
              </div>
              <button type="button" onClick={() => copyText(chosen.hook, 'hook')} className="mt-3 rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold">
                {copied === 'hook' ? 'تم النسخ ✓' : 'نسخ الـHook'}
              </button>
            </article>

            <article className="rounded-2xl border border-white/10 bg-newBgLineColor p-4 md:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">الكابشن والهاشتاجات</h3>
                <button type="button" onClick={() => copyText(caption, 'caption')} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500">
                  {copied === 'caption' ? 'تم النسخ ✓' : 'نسخ الكابشن'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7">{caption}</pre>
              {platform === 'youtube' && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-bold">YouTube Tags</span>
                    <button type="button" onClick={() => copyText(youtubeTags, 'tags')} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold">
                      {copied === 'tags' ? 'تم النسخ ✓' : 'نسخ Tags'}
                    </button>
                  </div>
                  <p className="break-words text-xs leading-6 text-textItemBlur">{youtubeTags}</p>
                  <p className="mt-2 text-xs text-textItemBlur">{youtubeTags.length}/500 حرف</p>
                </div>
              )}
            </article>
          </section>
        )}

        {copied === 'error' && (
          <p role="alert" className="text-sm text-red-400">
            المتصفح منع النسخ التلقائي. تقدر تحدد النص وتنسخه يدويًا.
          </p>
        )}

        <footer className="rounded-xl border border-white/10 p-4 text-xs leading-6 text-textItemBlur">
          <strong className="text-newTextColor">مهم:</strong> نتائج التقييم هنا مبنية على قواعد تحريرية مثل الفضول والطول والسؤال
          ووضوح أول 3 ثواني، وليست أرقام vidIQ أو بيانات ترندات حية. للتحقق من الـVirality
          الفعلي لازم نربط بيانات كل منصة ونقيس المشاهدات والاحتفاظ بالجمهور بعد النشر.
          ما فيش نشر تلقائي من الصفحة دي.
        </footer>
      </div>
    </main>
  );
}
