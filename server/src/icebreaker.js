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
];

// Track responses per question (keyed by question index)
const questionResponses = {};

function getTodaysQuestionIndex() {
  const now = new Date();
  const start = new Date(2024, 0, 1);
  const daysSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return daysSinceStart % QUESTIONS.length;
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
