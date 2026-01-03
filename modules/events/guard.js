const fs = require("fs-extra");
const path = __dirname + "/../commands/cache/groupSettings.json";

module.exports.config = {
    name: "guard",
    eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:user-nickname", "message"],
    version: "1.1.0",
    credits: "Gemini AI",
    description: "مراقب الحماية مع إشعارات التحذير"
};

module.exports.run = async ({ api, event }) => {
    if (!fs.existsSync(path)) return;
    const data = JSON.parse(fs.readFileSync(path));
    const s = data[event.threadID];
    if (!s) return;

    const { logMessageType, logMessageData, senderID, threadID, messageID, body, type } = event;

    // --- 1. فلترة الروابط مع تحذير وطرد ---
    if (s[2] && body && (body.includes("http") || body.includes("www."))) {
        const threadInfo = await api.getThreadInfo(threadID);
        if (!threadInfo.adminIDs.some(admin => admin.id == senderID)) {
            api.setMessageReaction("❌", messageID);
            api.sendMessage("⚠️ [نظام الحماية]: الروابط ممنوعة تماماً! أمامك 5 ثوانٍ للحذف وإلا سيتم طردك.", threadID);
            
            setTimeout(async () => {
                api.unsendMessage(messageID).then(() => {
                    api.removeUserFromGroup(senderID, threadID);
                    api.sendMessage("🚫 تم طرد العضو بسبب مخالفة قوانين الروابط.", threadID);
                }).catch(() => {
                    // إذا لم يجد الرسالة (يعني العضو حذفها) لا يفعل شيئاً
                });
            }, 5000);
        }
    }

    // --- 2. حماية اسم المجموعة مع تحذير ---
    if (s[1] && logMessageType === "log:thread-name") {
        api.sendMessage("⚠️ [نظام الحماية]: عذراً، تغيير اسم المجموعة ممنوع حالياً. سيتم استعادة الاسم الأصلي.", threadID);
        api.setTitle(s.originalTitle, threadID);
    }

    // --- 3. حماية الكنيات مع تحذير ---
    if (s[3] && logMessageType === "log:user-nickname") {
        const targetID = logMessageData.participantID;
        const oldNick = s.originalNicknames[targetID] || "";
        api.sendMessage("⚠️ [نظام الحماية]: تم رصد محاولة لتغيير الكنية، سيتم إلغاء التغيير.", threadID);
        api.changeNickname(oldNick, threadID, targetID);
    }

    // --- 4. منع الخروج (إعادة الإضافة) ---
    if (s[4] && logMessageType === "log:unsubscribe") {
        if (logMessageData.leftParticipantID == senderID) {
            api.sendMessage("⚠️ [نظام الحماية]: تم رصد محاولة خروج، جاري محاولة إعادة العضو...", threadID);
            api.addUserToGroup(senderID, threadID);
        }
    }

    // --- 5. إشعارات الأحداث العامة ---
    if (s[5]) {
        if (type === "log:subscribe") {
            api.sendMessage("🔔 إشعار: عضو جديد انضم إلى المجموعة الآن.", threadID);
        }
        if (logMessageType === "log:thread-icon") {
            api.sendMessage("🔔 إشعار: قام شخص ما بتغيير صورة المجموعة.", threadID);
        }
    }
};
