const fs = require("fs-extra");
const path = require("path");

const DEV_ID = "61581906898524";
const DEV_NAME = "كيرو"; 
const DATA_PATH = path.join(__dirname, "kiro_v11_pro.json");

if (!fs.existsSync(DATA_PATH)) {
    fs.writeJsonSync(DATA_PATH, {
        smartMode: true, isDevAway: false, awayUntil: 0, activateTime: 0,
        lastReportTime: Date.now(), adminActions: {}, logs: [],
        groupLocked: false, autoReply: true
    });
}

const load = () => fs.readJsonSync(DATA_PATH);
const save = (d) => fs.writeJsonSync(DATA_PATH, d, { spaces: 2 });

module.exports.config = {
    name: "النظام",
    version: "11.6.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "نظام الغياب الذكي مع منع الإلغاء الفوري",
    commandCategory: "النظام المطور",
    usages: "[غياب / اوامر / حالة]",
    cooldowns: 2
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, senderID, messageID } = event;
    let d = load();

    if (senderID !== DEV_ID) return api.sendMessage("❌ هذا الأمر للمطور كيرو فقط.", threadID);

    if (args[0] === "غياب") {
        return api.sendMessage("⏳ سيدي المطور، كم ساعة ستغيب؟ (رد برقم فقط)", threadID, (err, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);
    }

    if (!args[0] || args[0] === "اوامر") {
        const menu = `『 𝗞𝗜𝗥𝗢 𝗦𝗬𝗦𝗧𝗘𝗠 𝗩١١.٦ 』\n━━━━━━━━━━━━━\n⏳ النظام غياب : تفعيل الغياب الذكي\n🔒 النظام قفل [قفل/فتح] : وضع الطوارئ\n📊 النظام حالة : فحص الحماية\n━━━━━━━━━━━━━`;
        return api.sendMessage(menu, threadID);
    }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    if (event.senderID !== handleReply.author) return;
    let d = load();
    const hours = parseInt(event.body);

    if (isNaN(hours)) return api.sendMessage("⚠️ يرجى الرد برقم الساعات فقط.", event.threadID);

    d.isDevAway = true;
    d.awayUntil = Date.now() + (hours * 60 * 60 * 1000);
    d.activateTime = Date.now(); // حفظ وقت التفعيل لمنع الإلغاء الفوري
    save(d);

    api.sendMessage(`✅ تم تفعيل وضع الإدارة الذاتية لمدة (${hours}) ساعة. إعلان عام قيد الإرسال...`, event.threadID);

    const allThreads = await api.getThreadList(70, null, ["INBOX"]);
    const announcement = `📢 【 إعـلان إداري عـام 】\n━━━━━━━━━━━━━\n👤 المطور: ${DEV_NAME}\n🛠️ تم تفعيل "الإدارة الذاتية" لغياب المطور.\n⏳ المدة: ${hours} ساعة.\n🛡️ البوت يحمي المجموعات الآن.\n━━━━━━━━━━━━━`;
    
    for (const thread of allThreads) {
        if (thread.isGroup && thread.threadID !== event.threadID) {
            api.sendMessage(announcement, thread.threadID);
        }
    }
};

module.exports.handleEvent = async ({ api, event }) => {
    const { threadID, senderID, body, mentions, logMessageType, logMessageData } = event;
    let d = load();
    if (!d || !d.smartMode) return;
    const now = Date.now();

    // 1. إلغاء الغياب (مع شرط منع الإلغاء الفوري بسبب رسالة التفعيل)
    // الشرط الجديد: يجب أن يمر أكثر من 10 ثوانٍ على تفعيل الغياب قبل أن تُغلق الرسالة الجديدة الوضع
    if (senderID === DEV_ID && d.isDevAway && (now - d.activateTime > 10000)) {
        d.isDevAway = false;
        d.awayUntil = 0;
        d.activateTime = 0;
        save(d);
        
        const welcomeBack = `✅ 【 عـودة الـمـطور 】\n━━━━━━━━━━━━━\n🟢 المطور ${DEV_NAME} متواجد الآن.\n🛠️ عودة التحكم اليدوي للمطور.\n━━━━━━━━━━━━━`;
        api.sendMessage(`👋 أهلاً بعودتك سيدي المطور! تم إيقاف وضع الغياب.`, threadID);
        
        const allThreads = await api.getThreadList(70, null, ["INBOX"]);
        for (const thread of allThreads) {
            if (thread.isGroup) api.sendMessage(welcomeBack, thread.threadID);
        }
    }

    // 2. الرد عند التاغ أثناء الغياب
    if (d.isDevAway && senderID !== DEV_ID && body) {
        const isMentioned = (mentions && Object.keys(mentions).includes(DEV_ID)) || body.includes(DEV_NAME);
        if (isMentioned) {
            const timeLeft = Math.round((d.awayUntil - now) / 60000);
            api.sendMessage(`🌙 المطور غائب وسيعود بعد ${timeLeft > 0 ? timeLeft : "قليل"} دقيقة.\n🛡️ نظام الحماية الذكي نشط.`, threadID);
        }
    }

    // 3. حماية مكافحة الانقلاب
    if (logMessageType === "log:unsubscribe" && logMessageData.leftParticipantID !== senderID) {
        if (!d.adminActions[senderID]) d.adminActions[senderID] = { count: 0, time: now };
        if (now - d.adminActions[senderID].time < 3600000) d.adminActions[senderID].count++;
        else d.adminActions[senderID] = { count: 1, time: now };

        if (d.adminActions[senderID].count >= 3 && senderID !== DEV_ID) {
            api.changeAdminStatus(threadID, senderID, false);
            api.sendMessage("🚨 كشف محاولة انقلاب! تم سحب صلاحيات الآدمن.", threadID);
        }
        save(d);
    }
};
