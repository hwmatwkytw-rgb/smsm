const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "ملصق",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Anas",
  description: "تحويل الصور إلى ملصقات",
  commandCategory: "خدمات",
  usages: "[قم بالرد على صورة]",
  cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, messageReply } = event;

  // التحقق مما إذا كان المستخدم قد رد على صورة
  if (!messageReply || !messageReply.attachments || messageReply.attachments.length == 0) {
    return api.sendMessage("❌ يرجى الرد على الصورة التي تريد تحويلها إلى ملصق.", threadID, messageID);
  }

  const attachment = messageReply.attachments[0];
  if (attachment.type !== "photo") {
    return api.sendMessage("❌ هذا الأمر يعمل مع الصور فقط.", threadID, messageID);
  }

  api.setMessageReaction("🎨", messageID, () => {}, true);

  try {
    const imageUrl = attachment.url;
    const path = __dirname + `/cache/sticker_${Date.now()}.png`;

    // جلب الصورة وحفظها مؤقتاً
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));

    // إرسال الصورة كملصق
    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage({
      body: "✅ تم تحويل الصورة لملصق، كايروس في الخدمة.",
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ عذراً، فشل تحويل الصورة.", threadID, messageID);
  }
};
