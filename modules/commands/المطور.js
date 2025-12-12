// ملف: المطور.js
module.exports.config = {
  name: "المطور",
  version: "1.0.8",
  hasPermssion: 0,
  credits: "كــولـو",
  description: "عرض معلومات المطور والبوت",
  commandCategory: "نظام",
  usages: "مطور",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event }) {
  const fs = require("fs");
  const axios = require("axios");
  const path = require("path");

  try {
    // جلب قائمة المجموعات
    const threads = await api.getThreadList(100, null, ["inbox", "other"]);
    const groupCount = threads.filter(thread => thread.isGroup).length;

    const msgText = `
❀━━━━━━━〔 ✦ 〕━━━━━━━❀

👨‍💻 معلومات المطور:
- اسم المطور: كــولـو
- رابط المطور: https://www.facebook.com/share/1712u8LzjE/

══════════ ❍ ══════════

📌 معلومات البوت:
- اسم البوت: كـايࢪوس
- الإصدار: 3.2.7
- عدد المجموعات: ${groupCount}

❀━━━━━━━〔 ✦ 〕━━━━━━━❀
`;

    // تحميل الصورة مؤقتًا
    const imageUrl = "https://i.ibb.co/nMtJz0q8/0dfd43fae004e551aa8046f1b1ac818b.jpg";
    const imagePath = path.join(__dirname, "bot_image.jpg");
    const response = await axios({ url: imageUrl, responseType: "arraybuffer" });
    fs.writeFileSync(imagePath, Buffer.from(response.data, "utf-8"));

    // إرسال الرسالة مع الصورة
    await api.sendMessage(
      { body: msgText, attachment: fs.createReadStream(imagePath) },
      event.threadID,
      () => fs.unlinkSync(imagePath) // حذف الصورة بعد الإرسال
    );

  } catch (error) {
    console.log(error);
    return api.sendMessage("❌ حدث خطأ أثناء جلب المعلومات.", event.threadID);
  }
};
