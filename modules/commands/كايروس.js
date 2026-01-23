const axios = require("axios");

module.exports.config = {
  name: "كايروس",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "محمد",
  description: "ذكاء اصطناعي سوداني بأسلوب كايروس (OpenAI SDK)",
  commandCategory: "ai",
  usages: "كايروس [سؤالك]",
  cooldowns: 3
};

const conversations = new Map();

// الشخصية المطلوبة
const systemPrompt = {
  role: "system",
  content: `
أنت ذكاء اصطناعي سوداني اسمك "كايروس". 
كلامك سوداني دارجي بحت (بتاع حِلّة)، ممنوع الفصحى تماماً.

شخصيتك:
- زهجان وقرفان وبارد.
- ساخر وقليل أدب بأسلوب مستفز وبدون شتائم نابية.
- ما عندك صبر للأسئلة المكررة أو الغبية.

أسلوبك:
- ردود قصيرة وقاتلة ومباشرة.
- ممنوع الشرح الطويل.
- ممنوع استخدام الإيموجي نهائياً.
- لو السؤال تافه، ورّي السائل قيمتو ببرود.
`
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const userId = String(senderID);
  const question = args.join(" ").trim();
  
  // مفتاح الـ API الخاص بك
  const apiKey = "Sk-proj-ROHzAJxfAA3T9LMc2yHicbT4UchwfjcGsYCTpIdpGHtwyI_LIIUIQ2HDd6M55yO80N4EMvwBCuT3BlbkFJiuHPDx59SaAqzD5ElAFdYtPfhlyYGNIHl0397UcaPJG4OL6Z30WXxHBuOtCDzNucDpKWFgaIgA";

  if (!question || question.length < 2) {
    return api.setMessageReaction("🦧", messageID, () => {}, true);
  }

  if (question === "مسخ" || question === "reset") {
    conversations.delete(userId);
    return api.sendMessage("مسحت الزفت ده. تاني ركز.", threadID);
  }

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, [systemPrompt]);
    }

    const history = conversations.get(userId);
    history.push({ role: "user", content: question });

    // تنظيف الذاكرة لو زادت عن الحد
    if (history.length > 15) {
      history.splice(1, history.length - 15);
    }

    // إرسال الطلب لـ OpenAI
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo", // يمكنك تغييره لـ gpt-4o إذا كان مفتاحك يدعمه
        messages: history,
        temperature: 0.7
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      }
    );

    const reply = response.data.choices[0].message.content.trim();

    history.push({ role: "assistant", content: reply });
    return api.sendMessage(reply, threadID, messageID);

  } catch (err) {
    console.error("KAIROS ERROR:", err.response ? err.response.data : err.message);
    return api.sendMessage(
      "السيستم جلى.. مفتاحك ده شغال؟ ولا السيرفر قفل؟",
      threadID
    );
  }
};
