const axios = require("axios");
const fs = require("fs-extra");
const { alldown } = require("rx-dawonload");

module.exports.config = {
    name: "تحميل",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "rX & YUMI",
    description: "تحميل فيديوهات من اليوتيوب، تيك توك، إنستغرام، وفيسبوك عبر الرابط",
    commandCategory: "الخدمات",
    usages: "[الرابط]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    // 1. التحقق من وجود رابط
    const content = args.join(" ");
    if (!content || !content.startsWith("https://")) {
        return api.sendMessage("❌ يرجى وضع رابط صحيح بعد كلمة 'تحميل'\nمثال: تحميل https://tiktok.com/...", event.threadID, event.messageID);
    }

    // 2. إعدادات الملفات والتعريفات
    const requestId = event.messageID || Math.floor(Math.random() * 1000000);
    const cacheDir = __dirname + "/cache/";
    const filePath = `${cacheDir}${requestId}.mp4`;

    try {
        // تحديد المنصة
        let site = "غير معروف";
        const urlLower = content.toLowerCase();
        if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) site = "YouTube 📺";
        else if (urlLower.includes("tiktok.com")) site = "TikTok 🎵";
        else if (urlLower.includes("instagram.com")) site = "Instagram 📸";
        else if (urlLower.includes("facebook.com") || urlLower.includes("fb.watch")) site = "Facebook 💙";

        // تفاعل البحث
        api.setMessageReaction("🔍", event.messageID, () => {}, true);

        // 3. جلب بيانات الفيديو من المكتبة
        const data = await alldown(content);
        
        if (!data || !data.url) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return api.sendMessage("⚠️ عذراً، لم أتمكن من استخراج رابط الفيديو. قد يكون الحساب خاصاً أو الرابط غير مدعوم.", event.threadID, event.messageID);
        }

        const title = data.title || "فيديو بدون عنوان";
        const videoUrl = data.url;

        // تفاعل التحميل
        api.setMessageReaction("⬇️", event.messageID, () => {}, true);

        // 4. تحميل الفيديو وحفظه
        const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
        
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        fs.writeFileSync(filePath, Buffer.from(response.data));

        // 5. إرسال النتيجة بالستايل المطلوب
        const stylishBody = 
            `✅ تم التحميل بنجاح!\n` +
            `━━━━━━━━━━━━━━━\n` +
            `🆔 معرف الطلب: ${requestId}\n` +
            `📍 المنصة: ${site}\n` +
            `🎬 العنوان: ${title}\n` +
            `━━━━━━━━━━━━━━━\n` +
            `『 ⚙︎ ڪايࢪوس  ͡🦋͜  فالخدمة 』`;

        return api.sendMessage({
            body: stylishBody,
            attachment: fs.createReadStream(filePath)
        }, event.threadID, (err) => {
            // تنظيف الملف بعد الإرسال
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (!err) api.setMessageReaction("✅", event.messageID, () => {}, true);
            else api.setMessageReaction("❌", event.messageID, () => {}, true);
        }, event.messageID);

    } catch (err) {
        console.error(err);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(`❌ حدث خطأ تقني:\n${err.message}`, event.threadID, event.messageID);
    }
};
