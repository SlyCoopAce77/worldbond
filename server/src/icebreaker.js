const { v4: uuidv4 } = require('uuid');
const { query: db } = require('./database/db');

// ─── Question bank ────────────────────────────────────────────────────────────
// Designed to be viral, globally relatable, drama-starting, funny, and adult.
// Rotates daily — new question every midnight UTC.

const QUESTIONS = [

  // ── Relationship drama ──────────────────────────────────────────────────────
  "Would you date someone from a completely different country and culture? What would be your biggest fear?",
  "Be honest — what nationality do people in your country secretly find the most attractive?",
  "At what age does being single start becoming a red flag in your culture?",
  "Would you leave your country for love? Or would you ask them to leave theirs?",
  "What's the most toxic relationship habit that your culture treats as completely normal?",
  "Is cheating more common in your country or do people just hide it better?",
  "What's the biggest dating red flag specific to people from your country?",
  "What do people in your country actually look for in a partner vs what they say they look for?",
  "Do people in your country marry for love, money, family pressure, or all three?",
  "What's the weirdest thing considered romantic in your culture that would confuse outsiders?",
  "Is it socially acceptable to date someone 10+ years older in your country? What about younger?",
  "What's the dating app everyone in your country uses but pretends they don't?",
  "How many situationships is too many before you're officially the problem in your culture?",
  "What are the unspoken rules of who pays on a first date where you're from?",
  "Does your culture pressure people into marriage? What happens to those who refuse?",

  // ── Global hot takes & drama ────────────────────────────────────────────────
  "What's the biggest lie your country tells itself about how good it is?",
  "Which country do people from your country secretly look down on the most — and why?",
  "What country do you think people from your country are most jealous of?",
  "What's the most overrated country in the world and why is everyone obsessed with it?",
  "Do you actually think your country is respected internationally or are you just coping?",
  "What's a global stereotype about your country that is 100% accurate?",
  "What country do you think has the best-looking people on average — be honest?",
  "Which country's people are the rudest tourists when they visit yours?",
  "What's the most embarrassing thing your country has done on the world stage?",
  "Is your country more racist than it admits? Be real.",
  "What does your country's relationship with the USA actually look like from inside?",
  "What country do you think the rest of the world misunderstands the most?",
  "If you could switch your passport for any other country's right now, which one and why?",
  "What's the one thing your country is better at than every other country — no cheating?",
  "Does your country still have a class system? How much does where you're born still decide your life?",

  // ── Money, class & hustle ───────────────────────────────────────────────────
  "What does 'rich' actually look like in your country — what's the flex?",
  "In your country, is it better to be born rich or be self-made? Which gets more respect?",
  "How much money do you need per month to live comfortably in your city right now?",
  "What's the biggest financial scam your government runs that everyone just accepts?",
  "Do people in your country talk openly about money or is it taboo?",
  "What's the job everyone in your country wants but nobody admits to because it sounds lowkey?",
  "Is it possible to buy a house in your city on one salary, or is that dream dead?",
  "What's the hustle everyone in your city does on the side to survive?",
  "What's considered a good salary in your country — and what actually gets you respect?",
  "How bad is wealth inequality where you live — do you see it every day?",

  // ── Funny & absurd ──────────────────────────────────────────────────────────
  "What's the most unhinged thing that's completely normal in your country?",
  "What's the most chaotic food combination from your culture that you'd defend with your life?",
  "What habit do people in your country have that other countries find absolutely disgusting?",
  "What's the funniest misunderstanding you've had because of a language or culture barrier?",
  "What insult from your language sounds hilarious when translated literally to English?",
  "What animal represents your country and is it actually fitting for your people?",
  "What's the most dramatic thing your country has ever done over a sports loss?",
  "What do tourists always do wrong in your country that makes locals cringe?",
  "What's the most unhinged superstition people in your country actually believe?",
  "What's your country's version of a 'Karen' — what's the specific type?",
  "What's the weirdest thing your country exports that people in other countries are obsessed with?",
  "What's the most passive-aggressive thing your culture does instead of saying what it means?",
  "What's a word in your language that has no translation but every culture absolutely needs?",
  "What's the most chaotic thing that's happened at a wedding in your culture?",
  "What's the most extra thing your culture does for a holiday that makes total sense to you but sounds insane to others?",

  // ── Social life, gender & identity ─────────────────────────────────────────
  "How are women actually treated in your country vs how people in your country claim they're treated?",
  "What's the one thing women in your country still aren't allowed to do without judgment?",
  "How does your country treat LGBTQ+ people in real life vs what the law says?",
  "What's the biggest generational divide in your country right now?",
  "How has social media changed relationships in your country — for better or worse?",
  "Are young people in your country optimistic about the future, or have they given up?",
  "What's something men in your country do that they'd be embarrassed to admit to men from other countries?",
  "Is feminism a dirty word in your country or has the culture moved past that drama?",
  "What's the biggest difference in how men and women experience daily life in your city?",
  "Do people in your country actually talk about mental health or is that still taboo?",

  // ── Adult lifestyle & night life ────────────────────────────────────────────
  "Rate your city's nightlife honestly from 1–10 and say what it's actually like.",
  "What's the party drug of choice in your country and do people lie about it?",
  "What's the drinking culture like where you're from — casual, heavy, or non-existent?",
  "What's the most scandalous thing that's just... normal in your city after midnight?",
  "What does a wild night out cost in your city and is it actually worth it?",
  "What's the one thing people in your country do on weekends that surprises foreigners?",
  "What's the hookup culture like in your city — open, secretive, or somewhere in between?",
  "What's a legal thing in your country that would shock people from more conservative places?",
  "What's the most adult conversation your culture refuses to have publicly?",
  "Does your country have a one-night stand culture or is that still a secret people keep?",

  // ── Food fights ─────────────────────────────────────────────────────────────
  "What's the most controversial food debate in your country — the one that splits families?",
  "What food from another country did you try that you thought was disgusting and were right?",
  "What dish from your country do you know objectively looks terrible but tastes like heaven?",
  "What's the one ingredient that goes in almost every dish in your country and would ruin it without?",
  "Be honest — what's the most overrated food from another country that the world is obsessed with?",
  "What does the rest of the world get completely wrong about your country's cuisine?",
  "What's a street food in your city that you'd put against any Michelin star restaurant?",
  "What food from your country has the most unfortunate name in English?",
  "What's your country's comfort food after a terrible day and why does it hit different?",
  "What's the spiciest dish from your country and what happens to people who aren't ready?",

  // ── Power, politics & society ───────────────────────────────────────────────
  "What would actually change in your daily life if your entire government disappeared tomorrow?",
  "What's the most corrupt thing your government does that everyone knows about but nothing changes?",
  "Do young people in your country think voting actually matters, or has that faith already left?",
  "What's the law in your country that makes absolutely no sense but still exists?",
  "What protest or uprising in your country's recent history do you think about the most?",
  "What's the one political topic that will start a fight at any dinner table in your country?",
  "Who does your country's system actually work for — and who does it leave behind?",
  "Is your country closer to collapsing or thriving right now — be real?",
  "What's the biggest propaganda your country puts out that its own people still believe?",
  "What change would make your country 10x better overnight — and why hasn't it happened?",

  // ── Trend-starting / viral potential ───────────────────────────────────────
  "Drop the most brutally honest thing about your country that no tourist guide would ever say.",
  "What's something about your culture you had to literally unlearn to survive in another country?",
  "If your country were a person at a party, what would they be doing right now?",
  "What's a take about your culture that would get you canceled by your own people?",
  "What would you put in a time capsule right now to show what life is really like in your country?",
  "What's the most universally relatable struggle that every country has but won't admit to?",
  "What country has the best work-life balance and why is every other country ignoring what they're doing?",
  "What's something your generation is getting right that your parents' generation completely got wrong?",
  "What's the most honest thing you can say about what people from your country are actually like?",
  "What's your country's 'thing' — the energy, the vibe — that you can't explain but every local just knows?",
  "What moment in your country's recent history made you the most proud? The most ashamed?",
  "What's one thing every human on earth should experience before they die — from your corner of the world?",
  "What's the most universal human experience that somehow looks completely different in every country?",
  "If you could only keep one cultural tradition from your country and had to let everything else go, what stays?",
  "What's the hardest truth about living in your country that you've had to accept?",

  // ── Travel & the world ──────────────────────────────────────────────────────
  "What country did you visit that completely destroyed a stereotype you had about it?",
  "What destination is overrated and what do the people who love it not want to hear?",
  "What country felt the most like home even though it wasn't — and what does that say about you?",
  "What's the most shocking price difference you noticed traveling from your country to another?",
  "What country changed the way you think about life the most after visiting?",
  "What's the most dangerous thing you've done or seen as a tourist that you'd do again?",
  "What country would you move to tomorrow if money wasn't the issue — and what would you miss most?",
  "What's the travel experience that exposed how sheltered you'd been before?",
  "What cultural rule abroad did you break accidentally that caused the biggest scene?",
  "What does 'luxury travel' look like in your country vs what it looks like in others?",

  // ── Body, beauty & standards ────────────────────────────────────────────────
  "What does the 'ideal body type' look like in your country right now — and who decided that?",
  "What beauty standard in your country is slowly dying and good riddance?",
  "What beauty standard from your culture do you genuinely think the rest of the world is sleeping on?",
  "How much does appearance affect how far you go in life in your country — be honest?",
  "What plastic surgery or cosmetic procedure is so normalized in your country that nobody even talks about it anymore?",
  "How do people in your country treat overweight people vs thin people — is there a real difference?",
  "What age does your culture consider 'past your prime' for women? For men? And is that fair?",
  "What does 'taking care of yourself' mean in your country — and does the expectation fall equally on men and women?",
  "What's a beauty routine from your culture that the rest of the world would find extreme?",
  "How much do people in your country spend on looking good and is it worth it?",

  // ── Parenting, family pressure & growing up ─────────────────────────────────
  "What's the most extreme thing parents in your country do to push their kids to succeed?",
  "At what age does your family expect you to move out — and what happens if you don't?",
  "What's the biggest sacrifice your parents made for you that your culture told them was normal but was actually a lot?",
  "How much control do parents in your country have over who their children marry?",
  "What's the most toxic parenting behavior your culture normalizes and calls love?",
  "What's something your parents told you about life that turned out to be completely wrong?",
  "How different is the life your parents planned for you vs the life you're actually living?",
  "What's the biggest pressure your culture puts on the oldest child?",
  "Is 'tough love' a thing in your culture or do people show affection openly?",
  "What's the most embarrassing thing your parents did that was actually just their culture being itself?",

  // ── Social media, clout & internet culture ──────────────────────────────────
  "What social media platform is basically a full-time job in your country?",
  "What's the most cringe thing people in your country do online for attention that everyone pretends isn't cringe?",
  "What's the biggest influencer scandal your country had that the rest of the world completely missed?",
  "Is being an influencer in your country considered a real career or a joke?",
  "What internet trend started in your country that went global — do people know it came from you?",
  "What app is everyone in your country secretly addicted to that they'd never admit?",
  "How different is the way people present themselves online vs who they actually are in your country?",
  "What's the most toxic thing about social media culture specifically in your country?",
  "How has TikTok changed dating, friendships, and beauty standards where you live?",
  "What's a meme or internet moment that your whole country understood but was completely untranslatable to the rest of the world?",

  // ── Religion, spirituality & taboo ─────────────────────────────────────────
  "How much does religion actually control daily life in your country vs what people say?",
  "What's the most hypocritical thing you see religious people do in your country?",
  "What do people in your country really think about religion — follow the rules, believe privately, or done with it?",
  "What's a spiritual or superstitious belief in your country that educated people still hold secretly?",
  "How much did religion shape the laws in your country and do people want that to change?",
  "What's the biggest taboo in your country's dominant religion that young people are pushing back on?",
  "What's a religious tradition in your culture you participate in even if you don't fully believe in it?",
  "How are atheists treated in your country — fully accepted, quietly judged, or genuinely unsafe?",
  "What would shock someone from a deeply religious country about how people in your country actually live?",
  "What's something your culture calls 'sinful' that you think is absolutely fine?",

  // ── Work, ambition & the grind ──────────────────────────────────────────────
  "How many hours do people actually work per week in your country vs what the contract says?",
  "What's the job with the most secret status in your country that nobody admits to wanting?",
  "Is 'hustle culture' admired or mocked where you live right now?",
  "What's the biggest lie employers in your country tell workers and get away with?",
  "How do people in your country actually feel about their jobs — passion, survival, or somewhere in between?",
  "What happens in your country to people who choose rest over ambition?",
  "What's the most respected career in your country and does that match what actually pays?",
  "What's the work habit in your country that kills people slowly but everyone treats as dedication?",
  "How easy is it to start a business in your country — what's the first wall you hit?",
  "What does 'retirement' actually look like for most people where you live — is it even realistic?",

  // ── War, history & collective trauma ────────────────────────────────────────
  "What part of your country's history is never taught in school but everyone should know?",
  "What war or conflict left a wound in your country that still hasn't healed?",
  "What historical enemy does your country still have complicated feelings about today?",
  "What's something your country did that it has never properly apologized for?",
  "What chapter of your country's history are you most conflicted about?",
  "How does the older generation in your country talk about hardship vs how young people experience it?",
  "What trauma is baked into your culture that people just call 'the way things are'?",
  "What moment in your country's history do you wish the world talked about more?",
  "Is your country still dealing with the fallout of colonization — as the colonized or the colonizer?",
  "What national hero from your country would not survive the scrutiny of the internet today?",

  // ── Gen Z vs Millennials vs everyone else ──────────────────────────────────
  "What do older generations in your country completely misunderstand about young people right now?",
  "What habit from your parents' generation are you glad is dying out?",
  "What thing Gen Z does in your country do you think is genuinely better than what came before?",
  "What are young people in your country doing that scares the older generation most?",
  "Is the generation gap in your country getting wider or is it closing?",
  "What does your generation want that your parents' generation never even thought to ask for?",
  "What's the most generational flex in your country — what do boomers brag about that makes no sense now?",
  "What job will exist in your country in 10 years that doesn't exist yet?",
  "Are young people in your country buying houses, renting forever, or just laughing about it?",
  "What's the thing young people in your country are blamed for that is actually the system's fault?",

  // ── Unpopular opinions & hard questions ─────────────────────────────────────
  "What's an opinion about your own country that would get you in trouble if you said it publicly?",
  "What's a global 'progressive' idea that genuinely does not work in your culture's context?",
  "What's something your country is praised for internationally that is actually not that deep?",
  "What's the most uncomfortable truth about human nature that your culture pretends isn't true?",
  "What opinion do you hold that you know is unpopular but you're not changing it?",
  "What's a double standard in your country that everyone sees but nobody addresses?",
  "What topic is so sensitive in your country that even mentioning it publicly is dangerous?",
  "What's a 'sacred cow' in your culture — something people defend passionately that doesn't deserve it?",
  "What would happen to you personally if you said what you really think about your government?",
  "What's a global moral panic that your country decided to sit out — and were they right?",

  // ── Random fire starters ─────────────────────────────────────────────────────
  "What's the most expensive mistake your country keeps making over and over?",
  "If your city had a theme song right now, what would it be and why?",
  "What's the one lie every job interview in your country is built on?",
  "What would it take for you to give up your nationality and start over somewhere else?",
  "What's the pettiest thing two regions or cities in your country fight about constantly?",
  "What's something your country celebrates that the rest of the world finds bizarre?",
  "What do people in your country do when they're depressed that they don't call depression?",
  "What's the most dramatic divorce or breakup your culture has a specific tradition around?",
  "What does your country think about therapy — healing tool, luxury, or sign of weakness?",
  "What's the fastest way to make enemies in your city without even trying?",
  "What food would you eat every day for the rest of your life from your culture and never get tired of?",
  "What's the most addictive thing about your country that makes people who leave still miss it?",
  "What's a conspiracy theory in your country that turned out to actually be true?",
  "What's the wildest thing that's happened in your country's parliament, congress, or government buildings?",
  "What's the most iconic phrase from your country's pop culture that has no real translation?",
  "If your country were a person on a dating app, what would their bio honestly say?",
  "What does your country get more right than anywhere else — the one thing you'd actually brag about?",
  "What's a word in your language for a feeling that everyone in the world clearly has but couldn't name until now?",
  "What's the most surprising thing about your country that you only realized after leaving it?",
  "What's something from your childhood that you now realize was just your country being itself?",

  // ── Love, loyalty & red flags ────────────────────────────────────────────────
  "What's the biggest red flag in dating that your culture considers totally normal?",
  "What does 'being loyal' actually mean in a relationship where you're from — and is the bar different for men vs women?",
  "What's the thing people in your country stay in bad relationships for that the rest of the world would never tolerate?",
  "Is public affection between couples accepted or awkward where you live?",
  "What's the most elaborate way someone in your culture shows love — and is it actually romantic or just tradition?",
  "What does 'starting a family' look like for your generation vs your parents' generation?",
  "How does heartbreak get handled in your culture — is there a ritual for it?",
  "What's the worst dating advice people in your country give that's completely normalized?",
  "What's the difference between how your culture talks about love in movies vs what actually happens in real life?",
  "What's a relationship milestone in your culture that has no equivalent anywhere else?",

  // ── Money, class & the hustle gap ───────────────────────────────────────────
  "What's the fastest way someone in your country signals they have money without saying it?",
  "What's the biggest thing separating the working class from the wealthy in your country that nobody talks about?",
  "How do people in your country treat someone who was rich and lost everything vs someone who was poor and got rich?",
  "What's the most desperate thing people in your country do for money that's considered acceptable?",
  "What's the tax on being poor in your country — what costs more when you have less?",
  "Is it easier to get rich in your country by working hard or by knowing the right people?",
  "What's the most obscene display of wealth you've seen in your country that people just accepted?",
  "What financial decision does your culture pressure young people into that actually holds them back?",
  "What's the thing wealthy people in your country do that they claim is normal but only they can afford?",
  "What does 'making it' look like in your country — what's the dream everyone is chasing?",

  // ── Crime, corruption & the system ──────────────────────────────────────────
  "How corrupt is your government on a scale of 1 to 10 — be honest — and what's the evidence?",
  "What crime is almost never prosecuted in your country that should be?",
  "What do police in your country actually do vs what they're supposed to do?",
  "What's something that's technically illegal in your country that everyone does anyway?",
  "What's the most blatant example of corruption in your country that nobody was surprised by?",
  "How does the justice system in your country treat the wealthy vs the poor — and what's a real example?",
  "What's the most creative scam or hustle that originated from your country?",
  "What would it take for your country to have a real revolution — is it even possible?",
  "What crime do people in your country silently respect because they understand why someone did it?",
  "What's the open secret about how things actually get done in your country that every adult knows?",

  // ── Identity, pride & belonging ─────────────────────────────────────────────
  "What does it mean to be 'really' from your country — who gets to claim that identity and who doesn't?",
  "What's something about your culture you'd defend loudly to outsiders but admit is complicated among yourselves?",
  "How does your country treat its diaspora — the people who left and came back, or never came back?",
  "What's a tradition in your culture you participate in purely for belonging even if you question its meaning?",
  "When does national pride in your country tip into something that makes you uncomfortable?",
  "What group of people in your country gets the least and deserves more?",
  "What's the biggest internal division in your country that outsiders don't know about?",
  "What does 'success' look like in your culture — and does it look the same for different groups within it?",
  "What does your country's passport mean to you — is it freedom, limitation, or something more complicated?",
  "If you could change one thing about the culture you grew up in, what would it be — and would that change really be an improvement?",
];

function getTodaysQuestionIndex() {
  const now = new Date();
  const start = new Date(2024, 0, 1); // Jan 1 2024 = day 0
  const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return daysSinceStart % QUESTIONS.length;
}

function getTodaysQuestion() {
  const idx = getTodaysQuestionIndex();
  return { index: idx, question: QUESTIONS[idx] };
}

async function addResponse(questionIndex, response) {
  const { userId, username, country, language, photo_url, text } = response;
  await db(
    `INSERT INTO icebreaker_responses (id, question_index, user_id, username, country, language, photo_url, text)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (question_index, user_id) DO UPDATE
       SET username = $4, country = $5, language = $6, photo_url = $7, text = $8, updated_at = NOW()`,
    [uuidv4(), questionIndex, userId, username, country, language, photo_url || null, text]
  );
}

async function getResponseOwner(responseId) {
  const { rows } = await db(`SELECT user_id FROM icebreaker_responses WHERE id = $1`, [responseId]);
  return rows[0]?.user_id || null;
}

async function getCommentOwner(commentId) {
  const { rows } = await db(`SELECT user_id FROM icebreaker_comments WHERE id = $1`, [commentId]);
  return rows[0]?.user_id || null;
}

async function likeResponse(questionIndex, responseId, likerId) {
  const existing = await db(`SELECT 1 FROM icebreaker_response_likes WHERE response_id = $1 AND user_id = $2`, [responseId, likerId]);
  if (existing.rows.length) {
    await db(`DELETE FROM icebreaker_response_likes WHERE response_id = $1 AND user_id = $2`, [responseId, likerId]);
  } else {
    await db(`INSERT INTO icebreaker_response_likes (response_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [responseId, likerId]);
  }
}

async function addComment(questionIndex, responseId, comment) {
  const { userId, username, country, language, photo_url, text } = comment;
  await db(
    `INSERT INTO icebreaker_comments (id, response_id, user_id, username, country, language, photo_url, text)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [uuidv4(), responseId, userId, username, country, language, photo_url || null, text]
  );
}

async function likeComment(questionIndex, responseId, commentId, likerId) {
  const existing = await db(`SELECT 1 FROM icebreaker_comment_likes WHERE comment_id = $1 AND user_id = $2`, [commentId, likerId]);
  if (existing.rows.length) {
    await db(`DELETE FROM icebreaker_comment_likes WHERE comment_id = $1 AND user_id = $2`, [commentId, likerId]);
  } else {
    await db(`INSERT INTO icebreaker_comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [commentId, likerId]);
  }
}

async function deleteComment(questionIndex, responseId, commentId, requesterId) {
  const { rowCount } = await db(
    `DELETE FROM icebreaker_comments WHERE id = $1 AND response_id = $2 AND user_id = $3`,
    [commentId, responseId, requesterId]
  );
  return rowCount > 0;
}

async function deleteResponse(questionIndex, responseId, requesterId) {
  const { rowCount } = await db(
    `DELETE FROM icebreaker_responses WHERE id = $1 AND question_index = $2 AND user_id = $3`,
    [responseId, questionIndex, requesterId]
  );
  return rowCount > 0;
}

async function getResponses(questionIndex, viewerId) {
  const { rows } = await db(
    `SELECT r.id, r.user_id AS "userId", r.username, r.country, r.language, r.photo_url, r.text,
            EXTRACT(EPOCH FROM r.created_at) * 1000 AS "createdAt",
            EXTRACT(EPOCH FROM r.updated_at) * 1000 AS "updatedAt",
            COUNT(DISTINCT rl.user_id)::INTEGER AS likes,
            COALESCE(bool_or(rl.user_id = $2), false) AS "likedByMe"
     FROM icebreaker_responses r
     LEFT JOIN icebreaker_response_likes rl ON rl.response_id = r.id
     WHERE r.question_index = $1
     GROUP BY r.id
     ORDER BY r.created_at DESC`,
    [questionIndex, viewerId || null]
  );

  const responseIds = rows.map(r => r.id);
  let commentsByResponse = {};
  if (responseIds.length) {
    const { rows: commentRows } = await db(
      `SELECT c.id, c.response_id AS "responseId", c.user_id AS "userId", c.username, c.country, c.language, c.photo_url, c.text,
              EXTRACT(EPOCH FROM c.created_at) * 1000 AS "createdAt",
              COUNT(DISTINCT cl.user_id)::INTEGER AS likes,
              COALESCE(bool_or(cl.user_id = $2), false) AS "likedByMe"
       FROM icebreaker_comments c
       LEFT JOIN icebreaker_comment_likes cl ON cl.comment_id = c.id
       WHERE c.response_id = ANY($1)
       GROUP BY c.id
       ORDER BY c.created_at ASC`,
      [responseIds, viewerId || null]
    );
    for (const c of commentRows) {
      (commentsByResponse[c.responseId] ||= []).push({ ...c, createdAt: Number(c.createdAt) });
    }
  }

  return rows.map(r => ({
    ...r,
    createdAt: Number(r.createdAt),
    updatedAt: Number(r.updatedAt),
    comments: (commentsByResponse[r.id] || []).map(({ responseId, ...c }) => c),
  }));
}

module.exports = { getTodaysQuestion, addResponse, getResponses, likeResponse, addComment, likeComment, deleteComment, deleteResponse, getResponseOwner, getCommentOwner };
