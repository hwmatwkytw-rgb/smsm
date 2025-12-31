const fs = require("fs");
const path = require("path");

const settingsPath = path.join(__dirname, "groupSettings.json");
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, "{}");

function loadSettings() {
    return JSON.parse(fs.readFileSync(settingsPath));
}

function saveSettings(data) {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
    name: "إعدادات",
    version: "1.0.0",
    hasPermssion: 1, // صلاحية الأدمن
    description: "اعدادات حماية المجموعة",
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    let settings = loadSettings();
    if (!settings[threadID]) {
        settings[threadID] = {
            groupName: "❌",
            groupImage: "❌",
            nicknames: "❌",
            antiLeave: "❌",
            eventNotify: "❌"
        };
    }

    if (args.length === 0) {
        // عرض الإعدادات الحالية
        const list = `
1. حماية اسم المجموعة [${settings[threadID].groupName}]
2. حماية صورة المجموعة [${settings[threadID].groupImage}]
3. مكافحة تغير الكنيات [${settings[threadID].nicknames}]
4. مكافحة الخروج [${settings[threadID].antiLeave}]
5. اخطار احداث المجموعة [${settings[threadID].eventNotify}]
            
اكتب أرقام الحماية التي تريد تفعيلها أو تعطيلها، مثال: 1 2 3
        `;
        return api.sendMessage(list, threadID, messageID);
    }

    // تعديل الإعدادات بناءً على الأرقام المدخلة
    const choices = args.map(num => parseInt(num)).filter(num => num >= 1 && num <= 5);
    choices.forEach(num => {
        switch(num) {
            case 1: settings[threadID].groupName = settings[threadID].groupName === "❌" ? "✅" : "❌"; break;
            case 2: settings[threadID].groupImage = settings[threadID].groupImage === "❌" ? "✅" : "❌"; break;
            case 3: settings[threadID].nicknames = settings[threadID].nicknames === "❌" ? "✅" : "❌"; break;
            case 4: settings[threadID].antiLeave = settings[threadID].antiLeave === "❌" ? "✅" : "❌"; break;
            case 5: settings[threadID].eventNotify = settings[threadID].eventNotify === "❌" ? "✅" : "❌"; break;
        }
    });

    saveSettings(settings);

    // رسالة حفظ بعد تفاعل 👍
    return api.sendMessage({
        body: "تفاعل ب 👍لحفظ الإعدادات الجديدة",
        attachment: [],
        mentions: [],
        sticker: null,
        // نستخدم reactionEvent بعدين
    }, threadID, (err, info) => {
        global.reactionEvent = {
            type: "saveSettings",
            messageID: info.messageID,
            threadID,
            senderID
        };
    });
};

// التعامل مع التفاعل
module.exports.handleReaction = async ({ api, event }) => {
    const { reaction, userID, messageID, threadID } = event;
    if (!global.reactionEvent) return;
    if (global.reactionEvent.type === "saveSettings" && messageID === global.reactionEvent.messageID && reaction === "👍") {
        delete global.reactionEvent;
        return api.sendMessage("✅ تم حفظ الإعدادات بنجاح.", threadID);
    }
};
