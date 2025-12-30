const axios = require("axios");

module.exports.config = {
  name: "سؤال",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Kiro | تعديل: محمد إدريس",
  description: "سؤال الذكاء الاصطناعي",
  commandCategory: "Ai",
  usages: "سؤال <سؤالك>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const question = args.join(" ");
  if (!question) {
    return api.sendMessage(
      "❗ الصيغة الصحيحة:\nسؤال <اكتب سؤالك>",
      threadID,
      messageID
    );
  }

  api.sendMessage("🤖 جاري التفكير...", threadID);

  try {
    const res = await axios.get(
      `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(question)}`
    );

    const reply = res.data.response || "لم أستطع إيجاد إجابة حالياً.";

    const style = `
╭─〔 🤖 𝐀𝐈 〕─╮
❓ سؤالك:
${question}

💡 الإجابة:
${reply}

⌁ تم بواسطة الذكاء الاصطناعي
╰────────────╯
    `;

    api.sendMessage(style, threadID, messageID);

  } catch (err) {
    api.sendMessage(
      "⚠️ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.",
      threadID,
      messageID
    );
  }
};
