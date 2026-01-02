const axios = require("axios");

module.exports.config = {
  name: "سؤال",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Anas",
  description: "الدردشة مع الذكاء الاصطناعي GPT بتنسيق جميل",
  commandCategory: "ذكاء اصطناعي",
  usages: "[سؤالك]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const ques = args.join(" ");

  if (!ques) return api.sendMessage("⚠️ تفضل اسألني أي شيء.. \nمثال: سؤال كيف حالك؟", threadID, messageID);

  // 1. التفاعل مع الرسالة بـ ⌛
  api.setMessageReaction("⌛", messageID, (err) => {}, true);

  // 2. تفعيل مؤشر الكتابة
  api.sendTypingIndicator(threadID);

  try {
    const res = await axios.get(`https://api.sandipbgt.com/shaon?ques=${encodeURIComponent(ques)}`);
    const respond = res.data.answer;

    if (!respond) {
       api.setMessageReaction("❌", messageID, (err) => {}, true);
       return api.sendMessage("😵 لم أستطع إيجاد إجابة حالياً.", threadID, messageID);
    }

    // 3. تنسيق الإجابة بشكل جميل
    const msg = {
      body: `┏━━━━━ 질문 ━━━━━┓\n\n${respond}\n\n┗━━━━━━━━━━━━━━┛`,
      mentions: [{ tag: "질문", id: senderID }] // اختياري: للإشارة للمستخدم في رأس الرسالة
    };

    // 4. تغيير التفاعل إلى ✅ عند الانتهاء
    api.setMessageReaction("✅", messageID, (err) => {}, true);

    return api.sendMessage(msg, threadID, messageID);

  } catch (e) {
    api.setMessageReaction("⚠️", messageID, (err) => {}, true);
    return api.sendMessage("❌ الخادم مشغول، حاول مجدداً لاحقاً.", threadID, messageID);
  }
};
