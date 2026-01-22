module.exports.config = {
    name: "تحميل",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Kiros",
    description: "تحميل من منصات متعددة باستخدام Nayan Media Downloader",
    commandCategory: "الوسائط",
    usages: "[الرابط]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const axios = require("axios");
    const fs = require("fs-extra");
    const { ndown } = require("nayan-media-downloader"); // استدعاء المكتبة الجديدة
    const { threadID, messageID } = event;

    if (!args[0]) return api.sendMessage("⚠️ يرجى إدراج الرابط المراد تحميله.", threadID, messageID);

    const url = args[0];
    const orderID = Math.floor(Math.random() * 90000) + 10000;

    api.setMessageReaction("📥", messageID, (err) => {}, true);

    try {
        // استخدام المكتبة لجلب البيانات
        const res = await ndown(url);
        
        if (!res || !res.status || !res.data || res.data.length === 0) {
            api.setMessageReaction("❌", messageID, (err) => {}, true);
            return api.sendMessage("❌ لم يتم العثور على وسائط أو الرابط غير مدعوم.", threadID, messageID);
        }

        // اختيار أول رابط تحميل متاح (الفيديو غالباً)
        const mediaData = res.data[0];
        const downloadUrl = mediaData.url;
        const title = mediaData.title || "بدون عنوان";
        
        // تحديد أيقونة المنصة بشكل تلقائي بسيط
        let icon = "🌐";
        let platform = "وسائط";
        if (url.includes("tiktok")) { icon = "🎵"; platform = "TIKTOK"; }
        else if (url.includes("youtube") || url.includes("youtu.be")) { icon = "🎬"; platform = "YOUTUBE"; }
        else if (url.includes("facebook") || url.includes("fb.watch")) { icon = "💙"; platform = "FACEBOOK"; }
        else if (url.includes("instagram")) { icon = "📸"; platform = "INSTAGRAM"; }

        const path = __dirname + `/cache/kiros_${orderID}.mp4`;
        
        // جلب الملف لتحويله إلى Buffer
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'arraybuffer'
        });

        // حساب الحجم
        const fileSizeInMegabytes = (response.data.byteLength / (1024 * 1024)).toFixed(2);

        // التحقق من حجم الملف (فيسبوك بوت لديه ليميت معين، عادة 25MB)
        if (fileSizeInMegabytes > 25) {
             return api.sendMessage(`⚠️ الملف حجمه كبير جداً (${fileSizeInMegabytes} MB). لا يمكن إرساله عبر البوت.`, threadID, messageID);
        }

        fs.writeFileSync(path, Buffer.from(response.data, "binary"));

        api.setMessageReaction("✅", messageID, (err) => {}, true);

        return api.sendMessage({
            body: `「 𝑲𝑰𝑹𝑶𝑺 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑹 」\n` +
                  `━━━━━━━━━━━━━\n` +
                  `🔗 اﻟﻤﻨﺼﺔ : ${icon} ${platform}\n` +
                  `📝 اﻟﻌﻨﻮان : ${title}\n` +
                  `📦 اﻟﺤﺠﻢ : ${fileSizeInMegabytes} MB\n` +
                  `🆔 اﻟﻄﻠﺐ : #${orderID}\n` +
                  `━━━━━━━━━━━━━\n` +
                  `⚡ ʙʏ: 『⇄ 𝑩𝑶𝑻 𝑲𝑰𝑹𝑶𝑺 』`,
            attachment: fs.createReadStream(path)
        }, threadID, () => fs.unlinkSync(path), messageID);

    } catch (err) {
        console.error(err);
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        return api.sendMessage(`❌ فشل في معالجة الرابط.\nتأكد من صحة الرابط أو حاول لاحقاً.`, threadID, messageID);
    }
};
