module.exports.config = {
  name: "prefix",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Gemini",
  description: "عرض بادئة النظام وبادئة المجموعة",
  commandCategory: "system",
  usages: "prefix",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID } = event;
  
  // 1. جلب بادئة النظام العامة من ملف Config
  const globalPrefix = global.config.PREFIX;

  // 2. جلب بادئة المجموعة الحالية من قاعدة البيانات
  let threadPrefix = "";
  try {
    const threadData = await Threads.getData(threadID);
    const data = threadData.data || {};
    threadPrefix = data.PREFIX || globalPrefix;
  } catch (error) {
    threadPrefix = globalPrefix;
  }

  const message = `─── [ 𝗣𝗥𝗘𝗙𝗜𝗫 ] ───\n\n` +
                  `💠 بادئة النظام: [ ${globalPrefix} ]\n` +
                  `📍 بادئة المجموعة: [ ${threadPrefix} ]\n\n` +
                  `💡 استخدم البادئة متبوعة بكلمة help لعرض الأوامر.`;

  return api.sendMessage(message, threadID, messageID);
};
