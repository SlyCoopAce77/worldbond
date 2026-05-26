const { v4: uuidv4 } = require('uuid');

const QUESTIONS = [
  "What's one food from your country that everyone in the world should try?",
  "What's a holiday or tradition in your country that you love?",
  "What does a perfect weekend look like where you live?",
  "What's the most beautiful place you've ever been in your country?",
  "What's something people get wrong about your country?",
  "What's a slang word or phrase in your language that has no direct translation?",
  "What's the best street food in your city?",
  "What time do people usually eat dinner in your country?",
  "What's a superstition or belief unique to your culture?",
  "What sport is everyone obsessed with where you live?",
  "What does a typical morning look like for you?",
  "What's the most popular song in your country right now?",
  "What's one thing you wish people from other countries knew about your culture?",
  "What's the funniest cultural misunderstanding you've ever had with someone from another country?",
  "How do people greet each other in your country — hug, handshake, bow, kiss?",
  "What's the biggest festival or celebration in your city?",
  "What app is everyone in your country using that the rest of the world doesn't know about?",
  "If someone visited your city for one day, where would you take them?",
  "What's considered rude in your country that might be normal elsewhere?",
  "What's the most famous landmark near where you live?",
  "What do young people do for fun on weekends in your city?",
  "What's your country's most famous export — food, music, tech, fashion?",
  "What language do you want to learn and why?",
  "What's the weather like where you are right now?",
  "What's a dish your mom or grandma makes that you can't find anywhere else?",
  "What does friendship mean in your culture?",
  "What's the best thing about living where you live?",
  "Is it easy to make friends in your country, or does it take time?",
  "What kind of music do you listen to most?",
  "What's something you do every day that might surprise people from other countries?",

  // Round 2
  "What's the most overrated tourist attraction in your country?",
  "What does a typical school lunch look like where you grew up?",
  "What's the most popular social media app in your country right now?",
  "What's a fashion trend in your country that confuses people from abroad?",
  "What's the best local dish you can get for under $5 in your city?",
  "How do people in your country feel about strangers talking to them in public?",
  "What's the most played song at weddings in your culture?",
  "What's the drinking age in your country and do people actually follow it?",
  "What does your country's national flag mean to you?",
  "What's one word in your language that perfectly describes a feeling English can't?",
  "What's a myth or stereotype about your country that is 100% true?",
  "What do people in your country do to celebrate a birthday?",
  "What's the biggest difference between your city and the capital of your country?",
  "What's the most controversial food debate in your country?",
  "How do you say 'cheers' before a drink where you're from?",
  "What's a job that's really common in your country but rare elsewhere?",
  "What does traffic look like in your city — chaos, calm, or something in between?",
  "What's the weirdest thing sold at a market or shop in your country?",
  "What's your country's relationship with punctuality — always on time or fashionably late?",
  "What's the most popular sport nobody outside your region watches?",
  "What does a night out cost in your city — affordable or expensive?",
  "What's a gesture that means something completely different in your culture?",
  "What's the proudest moment in your country's recent history?",
  "What's the biggest cultural difference between the older and younger generations in your country?",
  "What does 'being rich' look like in your country compared to other places?",
  "What local TV show do you wish the whole world could watch?",
  "What would a tourist never understand about daily life in your city?",
  "What's the unwritten rule everyone in your country knows but never talks about?",
  "What's the most creative insult in your language?",
  "How do people show respect to elders in your culture?",
  "What's the strangest public holiday your country celebrates?",
  "If your country had a smell, what would it be?",
  "What's the best piece of advice your culture passes down through generations?",
  "What's one habit from your country you had to unlearn when traveling abroad?",
  "What does the concept of 'home' mean in your culture?",
  "What kind of weather makes your city come alive?",
  "What's a local brand from your country that deserves global fame?",
  "What's the most beautiful phrase or proverb from your language?",
  "What's the one ingredient that goes in almost every dish from your country?",
  "What does late-night eating look like in your city?",
  "What's something your grandparents taught you about your culture?",
  "What's a skill that's considered essential in your country but optional elsewhere?",
  "What do people in your country think about Americans? Be honest.",
  "What's the most emotional song from your country's music history?",
  "What would you put in a time capsule to represent your country today?",
  "What's the funniest thing a tourist ever did or said in your country?",
  "What does 'success' mean in your culture?",
  "What part of your culture are you most proud to share with the world?",

  // Round 3
  "What's the most common excuse people use in your country to avoid plans?",
  "What do people in your city do when the power goes out?",
  "What's the most dramatic thing your country has ever done over sports?",
  "What's something your country is quietly the best in the world at?",
  "What does the dating scene look like in your city — apps, meetups, through friends?",
  "What's a compliment in your culture that would sound rude to outsiders?",
  "What do people eat for breakfast where you're from?",
  "What's the one thing every household in your country has in common?",
  "What's the best way to make a local friend in your city?",
  "What kind of humor does your country have — dry, slapstick, dark, or something else?",
  "What's the most famous rivalry in your country — cities, sports teams, or regions?",
  "How do people in your country feel about silence in a conversation?",
  "What's a dish from your country that looks bad but tastes incredible?",
  "What's the biggest scam that tourists fall for in your city?",
  "What's something your country invented that the world uses every day?",
  "What does a typical Sunday feel like in your city?",
  "How do people in your country react to strangers taking photos of them?",
  "What's the most iconic sound you associate with your hometown?",
  "What's the fashion rule everyone quietly follows in your country?",
  "What's the loudest your city ever got — a game win, a concert, a celebration?",
  "What does your country's cuisine say about its history?",
  "What word do people in your country use more than any other?",
  "What's a local custom around funerals or death that outsiders might find surprising?",
  "What movie or show perfectly captures life in your country?",
  "What's the street food item your city is famous for that every local defends?",
  "How important is family living together in your culture — do adults live with parents?",
  "What's the most heated dinner table topic in your country?",
  "What does your country's flag colors or symbols actually represent?",
  "What's a neighborhood in your city that tourists skip but locals love?",
  "What's the most creative way people in your country celebrate New Year's?",
  "What's one thing you can only understand about your country if you've lived there?",
  "What does tipping look like in your country — expected, rude, or optional?",
  "What's the biggest urban legend or myth from your region?",
  "What's a daily habit your country has that's actually really healthy?",
  "What's the most uncomfortable truth about your country that people rarely say out loud?",
  "What's a tradition from your culture you hope never disappears?",
  "If your city were a person, what personality would it have?",
  "What's the most common name in your country and what does it mean?",
  "What animal represents your country and do people actually like it?",
  "What's something about your country's history that surprised you when you learned it?",
  "What do locals call your city that outsiders never use?",
  "What's the most expensive and most affordable thing about living in your country?",
  "What's a childhood game from your culture that you still remember?",
  "What's the best time of year to visit your country and why?",
  "What does public transportation feel like in your city — luxury, chaos, or somewhere in between?",
  "What's something your generation does differently from your parents' generation?",
  "What's the proudest your family has ever been of something tied to your culture?",
  "What's a phrase people say in your country when something goes wrong?",
  "What's one food combination from your country that sounds wrong but works perfectly?",
  "If you could export one thing from your culture to every country, what would it be?",
];

// Track responses per question (keyed by question index)
const questionResponses = {};

function getTodaysQuestionIndex() {
  const now = new Date();
  const start = new Date(2024, 0, 1);
  const weeksSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7));
  return weeksSinceStart % QUESTIONS.length;
}

function getTodaysQuestion() {
  const idx = getTodaysQuestionIndex();
  return { index: idx, question: QUESTIONS[idx] };
}

function addResponse(questionIndex, response) {
  if (!questionResponses[questionIndex]) questionResponses[questionIndex] = [];
  // One response per user — update if exists
  const existing = questionResponses[questionIndex].findIndex(r => r.userId === response.userId);
  if (existing !== -1) {
    questionResponses[questionIndex][existing] = { ...questionResponses[questionIndex][existing], ...response, updatedAt: Date.now() };
  } else {
    questionResponses[questionIndex].push({ id: uuidv4(), ...response, createdAt: Date.now() });
  }
}

function getResponses(questionIndex) {
  return (questionResponses[questionIndex] || []).slice().reverse();
}

module.exports = { getTodaysQuestion, addResponse, getResponses };
