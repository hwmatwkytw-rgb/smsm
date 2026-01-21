const fs = require("fs-extra");
const path = __dirname + "/cache/groups.json";

module.exports.config = {
    name: "anti-change",
    eventType: ["log:thread-name", "log:thread-image", "log:user-nickname", "log:unsubscribe"],
    version: "1.2.0",
    credits: "Gemini",
    description: "مراقبة التغييرات ومنع الخروج والتنبيه"
};

module.exports.run = async function({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    
    // تجاهل البوت نفسه
    if (author == api.getCurrentUserID()) return;

    // التأكد من وجود ملف الإعدادات
    if (!fs.existsSync(path)) return;
    let data = JSON.parse(fs.readFileSync(path));
    
    // إذا لم تكن المجموعة مسجلة في الإعدادات، يتجاهل البوت كل شيء
    if (!data[threadID]) return;

    const s = data[threadID];

    try {
        // 1. حماية اسم المجموعة
        if (logMessageType === "log:thread-name" && s.nameProtect) {
            await api.setTitle(s.originalName, threadID);
            return api.sendMessage(`[Anti-change] التغيير غير مسموح به! تمت إعادة اسم المجموعة إلى حالته الأصلية.`, threadID);
        }

        // 2. حماية صورة المجموعة
        if (logMessageType === "log:thread-image" && s.imageProtect) {
            if (s.imageLocalPath && fs.existsSync(s.imageLocalPath)) {
                await api.changeGroupImage(fs.createReadStream(s.imageLocalPath), threadID);
                return api.sendMessage(`[Anti-change] التغيير غير مسموح به! تمت إعادة صورة المجموعة إلى حالتها الأصلية.`, threadID);
            }
        }

        // 3. حماية الكنيات (الألقاب)
        if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
            const { participant_id } = logMessageData;
            await api.changeNickname("", threadID, participant_id);
            return api.sendMessage(`[Anti-change] التغيير غير مسموح به! تمت إزالة الكنية فوراً.`, threadID);
        }

        // 4. منع المغادرة (Anti-Out)
        if (logMessageType === "log:unsubscribe" && s.antiOut) {
            const leftID = logMessageData.leftParticipantFbId;
            if (leftID != api.getCurrentUserID()) {
                await api.addUserToGroup(leftID, threadID);
                return api.sendMessage(`مارق وين يا حب؟ خليك هنا🐸`, threadID);
            }
        }

    } catch (err) {
        console.error("Anti-change Error:", err);
    }
};
