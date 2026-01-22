const { nayanDownloader } = require("nayan-media-downloader");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تحميل",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Kiros",
  description: "تحميل احترافي مع عرض المعلومات",
  commandCategory: "الوسائط",
  usages: "تحميل [الرابط] [720|mp3]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;

  // ✅ لو كتب تحميل فقط
  if (!args[0]) {
    return api.sendMessage({
      body:
`「 𝑲𝑰𝑹𝑶𝑺 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑹 」
━━━━━━━━━━━━━
📥 طريقة الاستخدام:

➊ تحميل فيديو
تحميل + الرابط

➋ تحميل بجودة معينة
تحميل + الرابط + 720

➌ تحميل صوت فقط
تحميل + الرابط + mp3

━━━━━━━━━━━━━
📌 المنصات المدعومة:
🎬 يوتيوب
📘 فيسبوك
📸 إنستغرام
🎵 تيك توك

━━━━━━━━━━━━━
⚡ مثال:
تحميل https://youtu.be/xxxx 720
━━━━━━━━━━━━━
⚡ ʙʏ: 『⇄ 𝑩𝑶𝑻 𝑲𝑰𝑹𝑶𝑺 』`
    }, threadID, messageID);
  }

  const url = args[0];
  const option = args[1] || "auto";
  const orderID = Math.floor(Math.random() * 90000) + 10000;

  api.setMessageReaction("📥", messageID, () => {}, true);

  try {
    const res = await nayanDownloader(url);
    if (!res || !res.data) throw new Error("فشل التحليل");

    const info = res.data;

    // تحديد المنصة
    let platform = "UNKNOWN";
    let icon = "🌐";

    if (url.includes("facebook")) { platform = "FACEBOOK"; icon = "📘"; }
    else if (url.includes("youtube") || url.includes("youtu.be")) { platform = "YOUTUBE"; icon = "🎬"; }
    else if (url.includes("instagram")) { platform = "INSTAGRAM"; icon = "📸"; }
    else if (url.includes("tiktok")) { platform = "TIKTOK"; icon = "🎵"; }

    const title = info.title || "بدون عنوان";
    const channel = info.author || info.channel || "غير معروف";
    const duration = info.duration || "غير محددة";

    let downloadUrl = info.url;

    // خيار mp3
    if (option.toLowerCase() === "mp3" && info.audio) {
      downloadUrl = info.audio;
    }

    const ext = option === "mp3" ? "mp3" : "mp4";
    const filePath = path.join(__dirname, `/cache/kiros_${orderID}.${ext}`);

    const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    const sizeMB = (response.data.byteLength / (1024 * 1024)).toFixed(2);

    fs.writeFileSync(filePath, Buffer.from(response.data));

    api.setMessageReaction("✅", messageID, () => {}, true);

    return api.sendMessage({
      body:
`「 𝑲𝑰𝑹𝑶𝑺 𝑷𝑹𝑶 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑹 」
━━━━━━━━━━━━━
🔗 اﻟﻤﻨﺼﺔ : ${icon} ${platform}
📝 اﻟﻌﻨﻮان : ${title}
👤 اﻟﻘﻨﺎﺓ : ${channel}
⏱ اﻟﻤﺪﺓ : ${duration}
📦 اﻟﺤﺠﻢ : ${sizeMB} MB
⚙️ اﻟﻨﻮﻉ : ${ext.toUpperCase()}
🆔 اﻟﻄﻠﺐ : #${orderID}
━━━━━━━━━━━━━
⚡ ʙʏ: 『⇄ 𝑩𝑶𝑻 𝑲𝑰𝑹𝑶𝑺 』`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (err) {
    console.error(err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(`❌ فشل تحميل الطلب #${orderID}.`, threadID, messageID);
  }
};
