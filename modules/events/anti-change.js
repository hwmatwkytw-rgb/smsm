const fs = require("fs-extra");
const path = __dirname + "/cache/groups.json";

module.exports.config = {
    name: "anti-change",
    eventType: ["log:thread-name", "log:thread-image", "log:user-nickname", "log:unsubscribe", "log:subscribe"],
    version: "2.1.0",
    credits: "Gemini",
    description: "نظام حماية متكامل: منع تغيير الاسم، الصورة، الألقاب، المغادرة، والانضمام"
};

module.exports.handleEvent = async function({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    
    // تجاهل العمليات التي يقوم بها البوت نفسه
    if (author == api.getCurrentUserID()) return;

    // التأكد من وجود ملف الإعدادات والبيانات
    if (!fs.existsSync(path)) return;
    let data = JSON.parse(fs.readFileSync(path));
    if (!data[threadID]) return;

    const s = data[threadID];

    try {
        // 1. حماية اسم المجموعة
        if (logMessageType === "log:thread-name" && s.nameProtect) {
            if (logMessageData.name !== s.originalName) {
                await api.setTitle(s.originalName, threadID);
                return api.sendMessage(`[Anti-change] حماية الاسم مفعلة! لا يمكن التغيير.`, threadID);
            }
        }

        // 2. حماية صورة المجموعة
        if (logMessageType === "log:thread-image" && s.imageProtect) {
            if (s.imageLocalPath && fs.existsSync(s.imageLocalPath)) {
                await api.changeGroupImage(fs.createReadStream(s.imageLocalPath), threadID);
                return api.sendMessage(`[Anti-change] حماية الصور مفعلة! تم استعادة الصورة الأصلية.`, threadID);
            }
        }

        // 3. حماية الكنيات (الألقاب)
        if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
            const pID = logMessageData.participantID || logMessageData.participant_id;
            // إزالة الكنية فوراً
            await api.changeNickname("", threadID, pID);
            return api.sendMessage(`[Anti-change] تغيير الألقاب ممنوع هنا، تم حذف الكنية فوراً!`, threadID);
        }

        // 4. منع المغادرة (Anti-Out)
        if (logMessageType === "log:unsubscribe" && s.antiOut) {
            const leftID = logMessageData.leftParticipantFbId;
            if (leftID && leftID != api.getCurrentUserID()) {
                await api.addUserToGroup(leftID, threadID, (err) => {
                    if (err) {
                        return api.sendMessage(`العبد اغبى من انو ينضاف تاني 🐸🐸`, threadID);
                    }
                    return api.sendMessage(`شارد وين يحب🐸؟ خليك هنا`, threadID);
                });
            }
        }

        // 5. منع الانضمام (Anti-Join)
        if (logMessageType === "log:subscribe" && s.antiJoin) {
            const { addedParticipants } = logMessageData;
            for (let participant of addedParticipants) {
                await api.removeUserFromGroup(participant.userFbId, threadID);
            }
            return api.sendMessage(`[Anti-Join] المجموعة مغلقة حالياً، تم طرد الأعضاء الجدد.`, threadID);
        }

    } catch (err) {
        console.error("خطأ في نظام الحماية:", err);
    }
};
