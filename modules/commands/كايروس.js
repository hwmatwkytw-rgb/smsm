module.exports.config = {
  name: "كاريوس",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "عمر",
  description: "ذكاء اصطناعي متطور باسم كاريوس للرد على استفساراتك",
  commandCategory: "ذكاء اصطناعي",
  usages: "[السؤال]",
  cooldowns: 2,
};

const conversations = new Map();

module.exports.run = async function({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID, senderID } = event;
  const question = args.join(" ").trim();
  
  // أمر مسح الذاكرة
  if (question === "مسح" || question === "reset") {
    conversations.delete(senderID);
    return api.sendMessage("◈ ──『 ❀ كاريوس ❀ 』── ◈\n❁┊✅ تم مسح ذاكرة المحادثة بنجاح\n◈ ──────────── ◈", threadID, messageID);
  }
  
  if (!question) {
    return api.sendMessage("◈ ──『 ❀ كاريوس ❀ 』── ◈\n❁┊⚠️ تفضل يا صديقي، اسألني أي شيء..\n◈ ──────────── ◈", threadID, messageID);
  }

  try {
    if (!conversations.has(senderID)) {
      conversations.set(senderID, []);
    }
    
    const history = conversations.get(senderID);
    history.push({ role: "user", content: question });

    // تحديد عدد الرسائل بـ 15 لتجنب البطء في الرد
    if (history.length > 15) history.splice(0, history.length - 15);

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    let formData = `--${boundary}\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nstandard\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: { 
        "content-type": `multipart/form-data; boundary=${boundary}`, 
        "origin": "https://deepai.org", 
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
      },
      data: formData
    });

    let reply = response.data.output || response.data.text || (typeof response.data === "string" ? response.data : "عذراً، لم أستطع معالجة هذا الطلب.");
    reply = reply.replace(/\\n/g, "\n").trim();

    history.push({ role: "assistant", content: reply });

    return api.sendMessage(`◈ ──『 ❀ كاريوس ❀ 』── ◈\n\n${reply}\n\n◈ ──────────── ◈`, threadID, (err, info) => {
      if (!err && global.client && global.client.handleReply) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: senderID,
          type: "continue"
        });
      }
    }, messageID);

  } catch (error) {
    console.error("Error in Karios Command:", error);
    return api.sendMessage("❌ عذراً، حدث خطأ أثناء محاولة الاتصال بكاريوس.", threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const axios = require("axios");
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author != senderID) return;

  try {
    const history = conversations.get(senderID) || [];
    history.push({ role: "user", content: body });

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    let formData = `--${boundary}\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nstandard\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: { 
        "content-type": `multipart/form-data; boundary=${boundary}`, 
        "origin": "https://deepai.org", 
        "user-agent": "Mozilla/5.0" 
      },
      data: formData
    });

    let reply = response.data.output || response.data.text || "حدث خطأ.";
    reply = reply.replace(/\\n/g, "\n").trim();
    history.push({ role: "assistant", content: reply });

    return api.sendMessage(`◈ ──『 ❀ كاريوس ❀ 』── ◈\n\n${reply}\n\n◈ ──────────── ◈`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        type: "continue"
      });
    }, messageID);
  } catch (e) {
    console.error(e);
  }
};
