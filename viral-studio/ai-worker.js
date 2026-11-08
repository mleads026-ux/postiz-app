// AI backend for Viral Title Studio.
// Deploy with Workers AI, RATE_PER_IP, RATE_GLOBAL and ACCESS_PIN bindings.
// No API secrets belong in this repository.
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const ALLOWED_ORIGINS = new Set([
  'https://viral-title-studio.vercel.app',
  'https://viral-title-studio-mleads1.vercel.app',
  'https://viral-title-studio-git-main-mleads1.vercel.app',
]);
const PLATFORMS = ['youtube', 'instagram', 'tiktok', 'facebook'];
// Conservative app-only limit, NOT a guarantee about account-wide Workers AI usage.
const DAILY_GENERATION_LIMIT = 8;
const PROMPT_CHAR_LIMIT = 6000;
const MAX_RESPONSE_TOKENS = 2800;

const SYSTEM_PROMPT = [
  'أنت كاتب محتوى محترف متخصص في التسويق الإبداعي للفيديوهات القصيرة.',
  'المستخدم سيضع برومبت قصة أو سيناريو أو narration طويل. استخلص التفاصيل الأساسية دون طلب تقسيم البرومبت إلى حقول.',
  'اكتب نسخة متكاملة لكل من YouTube Shorts وInstagram Reels وTikTok وFacebook Reels في عملية واحدة.',
  'اكتب بلهجة مصرية طبيعية بسيطة، إلا إذا حدد المستخدم اللغة الإنجليزية.',
  'التزم تمامًا بمعلومات القصة. ممنوع اختراع أسماء أو تواريخ أو وقائع أو نتائج تاريخية، وتجنب تقديم الشك كحقيقة.',
  'العناوين تكون جذابة ومختلفة بين المنصات، من غير clickbait مضلل.',
  'اقرأ البرومبت كاملًا واستخرج الصراع الأساسي والحدث الأكثر غرابة والتحول الدرامي؛ لا تكتف بذكر اسم الشخصية أو نوع الفيديو.',
  'انسخ الأسماء العلم من البرومبت حرفيًا من غير أي تغيير إملائي. على سبيل المثال إذا ورد اسم «عنترة بن شداد» اكتبه «عنترة بن شداد» وليس «أنطرة بن شداد».',
  'كل منصة لازم يكون لها 3 عناوين متنوعة فعلًا: واحد فيه سؤال محدد، وواحد فيه مفارقة/صراع، وواحد فيه غموض مبني على تفاصيل القصة. ضع الأقوى أولًا.',
  'العناوين العربية تكون بين 25 و90 حرفًا قدر الإمكان، ومش مجرد اسم شخص أو جملة عامة. تجنب تمامًا صيغ مثل «قصة عنترة بن شداد»، «البطل عنترة»، «معركة عنترة»، «قصة مش هتصدقها».',
  'الـHook أول 3 ثواني يكون جملة كلام طبيعية مصرية مستمدة من لحظة محددة في القصة، مش «تعالى أقولك القصة» ولا «اسمع اللي حصل».',
  'استخدم تنوعًا حقيقيًا بين المنصات، وخلي الكابشن له تفاصيل حقيقية من البرومبت ومش مكرر بالنص، مع CTA واضح مناسب لكل منصة.',
  'في حالة البرومبت المشهدي الطويل، ركّز على السرد الفعلي والأحداث بدل تعليمات كاميرا/مدة لقطات/مؤثرات.',
  'ممنوع اختلاق أرقام ومعلومات جديدة أو تكرار الصدمة المصطنعة. العنوان المشوّق لازم يبقى صادق مع تفاصيل البرومبت.',
  'أول جملة hook صالحة لأول ثلاث ثوانٍ من الفيديو، قوية وواضحة ومطابقة للفكرة.',
  'Youtube: ثلاثة عناوين قصيرة وSEO-friendly مع #Shorts في العنوان الرئيسي إن أمكن، وصف مناسب وهاشتاجات وYouTube tags.',
  'Instagram: ثلاثة عناوين/افتتاحيات لReels، كابشن جذاب و5 هاشتاجات موضوعية وعامة.',
  'TikTok: ثلاثة عناوين قصيرة بهوك فضولي و5 هاشتاجات مختلطة.',
  'Facebook: ثلاثة عناوين مناسبة ومقدمة قصصية وتفاعل و4 أو 5 هاشتاجات.',
  'لو hideSpoiler=true، لا تفصح عن المفاجأة أو نهاية القصة في العناوين ولا النص المقترح للصورة المصغرة، ومن الأفضل عدم حرق النهاية في الكابشن.',
  'لا تدّعي إن هاشتاج معين viral الآن أو إن عدد المشاهدات مضمون. لا تخترع حقائق عن الجمهور.',
  'أعد JSON صالح فقط بلا Markdown وبالمفاتيح الأربعة من غير أي كلام خارج JSON.',
  'قالب كل منصة: {"titles":["عنوان 1","عنوان 2","عنوان 3"],"hook":"جملة قوية","caption":"وصف أو كابشن 2-4 سطور يحتوي دعوة مناسبة للتفاعل","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"],"thumbnail":"نص الصورة المصغرة 2-6 كلمات","pinnedComment":"تعليق مثبّت يدعو للتفاعل"}',
  'YouTube فقط يضيف "tags":["keyword1","keyword2",...] بحد أقصى 500 حرف عند جمعها بفواصل.',
  'الاستجابة النهائية: {"youtube":{...},"instagram":{...},"tiktok":{...},"facebook":{...}}.',
].join('\n');

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-studio-pin',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) },
  });
}
function text(value, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function normalize(value) {
  let data = value?.response ?? value?.choices?.[0]?.message?.content ?? value;
  if (typeof data === 'string') {
    const clean = data.trim().replace(/^\x60{3}(?:json)?\s*/i, '').replace(/\s*\x60{3}$/, '');
    try {
      data = JSON.parse(clean);
    } catch {
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start < 0 || end < start) throw new Error('Malformed AI response');
      data = JSON.parse(clean.slice(start, end + 1));
    }
  }
  if (!data || typeof data !== 'object') throw new Error('Empty AI response');
  const result = {};
  for (const platform of PLATFORMS) {
    const p = data[platform];
    if (!p || typeof p !== 'object') throw new Error('Missing platform: ' + platform);
    let titles = Array.isArray(p.titles) ? p.titles.map((s) => text(s, 140)).filter(Boolean).slice(0, 3) : [];
    if (titles.length === 0 && text(p.title, 140)) titles = [text(p.title, 140)];
    if (!titles.length) throw new Error('Empty title for ' + platform);
    const hook = text(p.hook, 360);
    const caption = text(p.caption ?? p.description, 1500);
    if (!hook || !caption) throw new Error('Missing content for ' + platform);
    const hashtags = Array.isArray(p.hashtags)
      ? [...new Set(p.hashtags.map((s) => text(s, 64)).filter(Boolean).map((s) => '#' + s.replace(/^#+/, '').replace(/[\s-]+/g, '_')))].slice(0, 6)
      : [];
    const entry = {
      titles,
      hook,
      caption,
      hashtags,
      thumbnail: text(p.thumbnail, 90),
      pinnedComment: text(p.pinnedComment ?? p.pinned_comment, 350),
    };
    if (platform === 'youtube') {
      const items = Array.isArray(p.tags) ? p.tags.map((s) => text(s, 80)).filter(Boolean) : [];
      const packed = [];
      for (const item of [...new Set(items)]) {
        if ([...packed, item].join(', ').length > 500) break;
        packed.push(item);
      }
      entry.tags = packed;
    }
    result[platform] = entry;
  }
  return result;
}

/**
 * One strongly consistent daily counter for this studio, regardless of visitor/device.
 * Reserve before generation and do not refund on AI/provider failure: fail closed.
 * Day boundaries are midnight UTC, matching Cloudflare's daily free allocation.
 */
export class DailyQuota {
  constructor(state) { this.state = state; }
  async fetch(request) {
    const url = new URL(request.url);
    const day = new Date().toISOString().slice(0, 10);
    const resetAt = new Date(Date.parse(day + 'T00:00:00.000Z') + 86400000).toISOString();
    const info = (used, allowed = false) => Response.json({
      allowed, used, limit: DAILY_GENERATION_LIMIT,
      remaining: Math.max(0, DAILY_GENERATION_LIMIT - used), resetAt,
    });

    if (request.method === 'GET' && url.pathname === '/status') {
      const record = await this.state.storage.get('daily');
      const used = record?.day === day ? record.used : 0;
      return info(used);
    }
    if (request.method !== 'POST' || url.pathname !== '/reserve') {
      return new Response('Not found', { status: 404 });
    }
    const outcome = await this.state.storage.transaction(async (transaction) => {
      const record = await transaction.get('daily');
      const used = record?.day === day ? record.used : 0;
      if (used >= DAILY_GENERATION_LIMIT) return { allowed: false, used };
      await transaction.put('daily', { day, used: used + 1 });
      return { allowed: true, used: used + 1 };
    });
    return info(outcome.used, outcome.allowed);
  }
}

async function quotaCall(env, method) {
  // Quota unavailable? Fail closed; never let an AI call bypass the daily ceiling.
  const id = env.DAILY_QUOTA.idFromName('viral-studio-global-daily');
  const stub = env.DAILY_QUOTA.get(id);
  const response = await stub.fetch('https://quota.internal/' + (method === 'POST' ? 'reserve' : 'status'), { method });
  if (!response.ok) throw new Error('Daily quota storage unavailable');
  return response.json();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({ ok: true, service: 'viral-studio-ai', model: MODEL }, 200, request.headers.get('Origin') || '');
    }
    const origin = request.headers.get('Origin') || '';
    if (!ALLOWED_ORIGINS.has(origin)) {
      return json({ error: 'Not an allowed website.' }, 403, origin);
    }
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    const isQuota = request.method === 'GET' && url.pathname === '/quota';
    const isGenerate = request.method === 'POST' && url.pathname === '/generate';
    if (!isGenerate && !isQuota) {
      return json({ error: 'Not found.' }, 404, origin);
    }
    if (!env.ACCESS_PIN || request.headers.get('x-studio-pin') !== env.ACCESS_PIN) {
      return json({ error: 'Access code incorrect. Check your private studio code.' }, 401, origin);
    }
    try {
      if (isQuota) return json({ ok: true, quota: await quotaCall(env, 'GET') }, 200, origin);
      const ip = request.headers.get('cf-connecting-ip') || 'unknown';
      const local = await env.RATE_PER_IP.limit({ key: ip });
      const global = await env.RATE_GLOBAL.limit({ key: 'all' });
      if (!local.success || !global.success) {
        return json({ error: 'فيه طلبات كتير دلوقتي. حاول تاني بعد دقيقة.' }, 429, origin);
      }
      const size = Number(request.headers.get('content-length') || 0);
      if (size > 30000) return json({ error: 'البرومبت أطول من الحد المسموح.' }, 413, origin);
      const payload = await request.json();
      const prompt = text(payload?.prompt, PROMPT_CHAR_LIMIT);
      if (prompt.length < 20) return json({ error: 'اكتب على الأقل 20 حرف من برومبت القصة.' }, 400, origin);
      if (typeof payload?.prompt === 'string' && payload.prompt.trim().length > PROMPT_CHAR_LIMIT) {
        return json({ error: 'البرومبت طويل؛ الحد الأقصى 6000 حرف للحفاظ على الحصة المجانية.' }, 400, origin);
      }
      const language = payload?.language === 'en' ? 'English' : 'العربية العامية المصرية';
      const hideSpoiler = payload?.hideSpoiler !== false;
      const quota = await quotaCall(env, 'POST');
      if (!quota.allowed) {
        return json({ error: 'خلصت حصة الاستوديو النهارده. هتتجدد الساعة 00:00 UTC.', quota }, 429, origin);
      }
      const response = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify({ storyPrompt: prompt, preferredLanguage: language, hideSpoiler }) },
        ],
        temperature: 0.76,
        max_tokens: MAX_RESPONSE_TOKENS,
        response_format: { type: 'json_object' },
      });
      return json({ ok: true, platforms: normalize(response), quota }, 200, origin);
    } catch (err) {
      // Do not log the user's story, model response or access code.
      console.error('Viral Studio AI generation failed:', err?.message || 'unknown');
      return json({ error: 'تعذّر توليد المحتوى دلوقتي. جرّب تاني أو اختصر البرومبت.' }, 502, origin);
    }
  },
};
