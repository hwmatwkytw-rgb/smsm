const axios = require("axios");

module.exports.config = {
  name: "كايروس",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "محمد",
  description: "ذكاء اصطناعي سوداني بأسلوب كايروس المعهود",
  commandCategory: "ai",
  usages: "كايروس [سؤالك]",
  cooldowns: 3
};

const conversations = new Map();

const systemPrompt = {
  role: "system",
  content: `
أنت ذكاء اصطناعي سوداني اسمك "كايروس".
كلامك سوداني دارجي بحت (بتاع حِلّة)، ممنوع الفصحى تماماً.

شخصيتك (كايروس):
- زهجان وقرفان.
- بارد وساخر لأبعد الحدود.
- قليل أدب بأسلوب "مستفز" وبدون شتائم نابية.
- ما عندك صبر للأسئلة المكررة أو الغبية.

أسلوبك في الرد:
- ردود قصيرة وقاتلة.
- رد مباشر بدون مقدمات (ياخي إنت مالك ومالي).
- ممنوع الشرح الطويل.
- ممنوع استخدام الإيموجي نهائياً.
- لو السؤال ما عجبك، حسس السائل إنه غلطان.
`
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const userId = String(senderID);
  const question = args.join(" ").trim();

  // تفاعل بسيط لو الكلام فاضي
  if (!question || question.length < 4) {
    return api.setMessageReaction("🦧", messageID, () => {}, true);
  }

  // إعادة ضبط المحادثة
  if (question === "مسخ" || question === "reset") {
    conversations.delete(userId);
    return api.sendMessage(
      "مسحت الزفت ده. تاني ما تسألني كلام فارغ.",
      threadID
    );
  }

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, [systemPrompt]);
    }

    const history = conversations.get(userId);

    history.push({
      role: "user",
      content: question
    });

    // الحفاظ على سياق المحادثة (آخر 20 رسالة)
    if (history.length > 20) {
      history.splice(1, history.length - 20);
    }

    const boundary =
      "----WebKitFormBoundary" + Math.random().toString(36).substring(2);

    let formData = "";
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="model"\r\n\r\nstandard\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n`;
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n`;
    formData += `--${boundary}--\r\n`;

    const res = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        origin: "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply =
      res?.data?.output ||
      res?.data?.text ||
      "كايروس ما عنده ليك رد هسي، فكنا.";

    reply = reply.replace(/\\n/g, "\n").trim();

    history.push({
      role: "assistant",
      content: reply
    });

    return api.sendMessage(reply, threadID);

  } catch (err) {
    console.error("KAIROS AI ERROR:", err.message);
    return api.sendMessage(
      "كايروس تعب من غباءك. السيستم علّق.",
      threadID
    );
  }
};
