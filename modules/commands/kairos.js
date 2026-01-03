const axios = require("axios");

module.exports.config = {
    name: "كايروس",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Gemini AI",
    description: "ذكاء اصطناعي باسم كايروس يعمل بدون بادئة",
    commandCategory: "الذكاء الاصطناعي",
    usages: "كايروس [السؤال]",
    cooldowns: 2,
};

module.exports.handleEvent = async function ({ api, event }) {
    const { body, threadID, messageID, senderID } = event;
    if (!body) return;

    // تحويل النص للصغير للتحقق من وجود اسم "كايروس" في بداية الرسالة
    const input = body.toLowerCase();
    const botName = "كايروس";

    if (input.startsWith(botName)) {
        const prompt = body.slice(botName.length).trim();

        if (!prompt) {
            return api.sendMessage("نعم! أنا كايروس، كيف يمكنني مساعدتك اليوم؟ 🤖", threadID, messageID);
        }

        try {
            // استخدام API أكثر استقراراً وتقليل نسبة الخطأ
            const res = await axios.get(`https://api.kenliejugarnamas.com/ai/?text=${encodeURIComponent(prompt)}`);
            
            if (res.data && res.data.response) {
                const response = res.data.response;
                return api.sendMessage(`🤖 [ كايروس ]\n\n${response}`, threadID, messageID);
            } else {
                throw new Error("Empty Response");
            }
        } catch (error) {
            console.error("AI Error:", error.message);
            // نظام معالجة الأخطاء الصامت لتقليل الإزعاج
            return api.sendMessage("⚠️ عذراً، عقلي يواجه ضغطاً حالياً، حاول مرة أخرى بعد قليل.", threadID, messageID);
        }
    }
};

module.exports.run = async function ({ api, event, args }) {
    // هذا الجزء لتشغيل الأمر عبر البادئة أيضاً (اختياري)
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("تفضل، أنا كايروس! اسألني أي شيء.", event.threadID, event.messageID);
    
    try {
        const res = await axios.get(`https://api.kenliejugarnamas.com/ai/?text=${encodeURIComponent(prompt)}`);
        api.sendMessage(res.data.response, event.threadID, event.messageID);
    } catch (e) {
        api.sendMessage("حدث خطأ في الاتصال بالخادم.", event.threadID);
    }
};
