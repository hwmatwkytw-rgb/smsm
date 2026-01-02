const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "تحميل",
  version: "1.2.1",
  hasPermssion: 0,
  credits: "Anas",
  description: "تحميل فيديوهات من تيك توك، فيسبوك، إنستغرام",
  commandCategory: "خدمات",
  usages: "[رابط الفيديو]",
  cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const url = args[0];

  if (!url) {
    return api.sendMessage(
      "📖 **دليل استخدام أمر التحميل:**\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "ضع رابط الفيديو بعد الأمر للتحميل.\n\n" +
      "✅ يدعم حالياً: TikTok, Facebook, Instagram\n" +
      "🔗 مثال: `تحميل [الرابط]`\n" +
      "━━━━━━━━━━━━━━━━━━", 
      threadID, messageID
    );
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage("📥 جاري جلب الفيديو وتجهيزه... انتظر قليلاً.", threadID, messageID);

  try {
    const res = await axios.get(`https://api.samirxp.xyz/download?url=${encodeURIComponent(url)}`);
    
    const downloadUrl = res.data.result.url || res.data.result.video_url || res.data.result;

    if (!downloadUrl) throw new Error("لم أتمكن من العثور على رابط التحميل.");

    const path = __dirname + `/cache/video_${Date.now()}.mp4`;

    const videoData = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(videoData.data, "binary"));

    api.setMessageReaction("✅", messageID, () => {}, true);
    
    // إرسال الفيديو مع العبارة التي طلبتها
    return api.sendMessage({
      body: "✅ تم التحميل بنجاح، كايروس في الخدمة.",
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path), messageID);

  } catch (e) {
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage("❌ عذراً، فشل تحميل هذا الفيديو. تأكد أن الرابط يعمل وصحيح.", threadID, messageID);
  }
};
