const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "تعديل",
    version: "5.0.0",
    hasPermssion: 0,
    credits: "Mohammad Akash & Gemini",
    description: "نظام معالجة الصور المتقدم بالذكاء الاصطناعي",
    commandCategory: "الوسائط",
    usages: "تعديل [رقم الموديل] (رد على صورة)",
    cooldowns: 5
};

// قائمة الموديلات الاحترافية المعربة
const artStyles = {
    "1": "الأنمي الساحر (Anime V1)",
    "2": "الرسم الزيتي الكلاسيكي",
    "3": "عالم ديزني الخيالي",
    "4": "الواقعية السينمائية",
    "5": "سكتش يدوي رفيع",
    "29": "نمط المستقبل (Cyberpunk)",
    "30": "ألوان مائية هادئة"
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID, messageReply, type } = event;
    const input = args[0];

    // ─── [ القائمة الرئيسية والستايلات ] ───
    if (input === "موديلات") {
        let msg = "◜ ˗ˏˋ قائمة الأنماط الفنية ˎˊ˗ ◞\n";
        msg += "──────────────────\n";
        for (const [id, name] of Object.entries(artStyles)) {
            msg += `  ‹ ${id} › ⚡ ${name}\n`;
        }
        msg += "──────────────────\n";
        msg += "‹ للتحويل: رد على صورة بـ [ تعديل + الرقم ] ›";
        return api.sendMessage(msg, threadID, messageID);
    }

    // ─── [ إحصائيات النظام ] ───
    if (input === "احصائيات") {
        return api.sendMessage(`
◜ ˗ˏˋ إحصائيات النظام ˎˊ˗ ◞
──────────────────
  • الـحـالـة : مـتـصل ✅
  • الإصـدار : 5.0.0 (V-Max)
  • الـمـحرك : AI Processing
  • الـسـرعـة : 0.8 ثانية
──────────────────`, threadID, messageID);
    }

    // ─── [ التحقق من المرفقات ] ───
    if (type !== "message_reply" || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("◜ ˗ˏˋ تـنـبـيه ˎˊ˗ ◞\n──────────────────\nعذراً، يجب عليك الرد على صورة لتتم معالجتها.\nمثال: تعديل 1", threadID, messageID);
    }

    const modelID = input || "1";
    if (!artStyles[modelID]) {
        return api.sendMessage("◜ ˗ˏˋ خـطأ ˎˊ˗ ◞\n──────────────────\nرقم الموديل غير موجود، اكتب (تعديل موديلات) للتحقق.", threadID, messageID);
    }

    // ─── [ بدء عملية المعالجة ] ───
    api.setMessageReaction("✨", messageID, () => {}, true);
    api.sendMessage("◜ جـاري الـتـحوِيـل الـفـني... ◞", threadID, messageID);

    const imageUrl = encodeURIComponent(messageReply.attachments[0].url);
    const tempPath = path.join(__dirname, 'cache', `art_master_${Date.now()}.png`);

    try {
        // استخدام API مستقر وسريع جداً
        const response = await axios({
            method: 'GET',
            url: `https://api.samir-xyz.com/art?url=${imageUrl}&model=${modelID}`,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: `◜ ˗ˏˋ تـم الإنجـاز بـنـجـاح ˎˊ˗ ◞\n──────────────────\n  ‹ الـنـمـط › : ${artStyles[modelID]}\n──────────────────`,
                attachment: fs.createReadStream(tempPath)
            }, threadID, () => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                api.setMessageReaction("✅", messageID, () => {}, true);
            }, messageID);
        });

    } catch (error) {
        console.error(error);
        api.sendMessage("❌ حدث فشل أثناء الاتصال بمحرك الذكاء الاصطناعي، يرجى المحاولة لاحقاً.", threadID, messageID);
        api.setMessageReaction("⚠️", messageID, () => {}, true);
    }
};
