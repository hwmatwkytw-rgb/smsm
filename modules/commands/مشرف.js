// ⚙️ مشرف.js - نظام إدارة المشرفين (Config)
const fs = require("fs");

// 🟢 ملف config بدل admins.json
const configPath = __dirname + "/config.json";

// 🟢 إنشاء config لو غير موجود
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({
        admins: []
    }, null, 2));
}

// 🟢 قراءة config
function getConfig() {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

// 🟢 حفظ config
function saveConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
    name: "مشرف",
    version: "3.1.0",
    hasPermssion: 2,
    credits: "محمد إدريس + GPT-5",
    description: "إدارة المشرفين (حفظ في config)",
    commandCategory: "المطور",
    usages: "add/remove/list/help",
};

// 🎨 استايل خفيف
function style(msg) {
    return `— 👑 المشرفين —
${msg}
— — — — — —`;
}

module.exports.run = async ({ api, event, args }) => {
    const devID = "61581906898524";
    const config = getConfig();
    const admins = config.admins || [];

    // 🛡️ السماح للمطور فقط
    if (event.senderID != devID)
        return api.sendMessage("❌ الأمر للمطور فقط.", event.threadID);

    const cmd = args[0]?.toLowerCase() || "help";

    // ➕ إضافة مشرف
    if (cmd === "add") {
        if (!event.messageReply)
            return api.sendMessage(style("↩️ رد على الشخص لرفعه مشرف."), event.threadID);

        const uid = event.messageReply.senderID;

        if (admins.includes(uid))
            return api.sendMessage(style("⚠️ العضو مشرف مسبقًا."), event.threadID);

        admins.push(uid);
        saveConfig(config);

        return api.sendMessage(
            style(`✅ تمت الإضافة\n🆔 ${uid}`),
            event.threadID
        );
    }

    // 📋 عرض المشرفين
    if (cmd === "list" || cmd === "slait") {
        if (admins.length === 0)
            return api.sendMessage(style("ℹ️ لا يوجد مشرفين."), event.threadID);

        let txt = "📋 المشرفين:\n\n";
        for (let i in admins) {
            let id = admins[i];
            let info = await api.getUserInfo(id);
            let name = info[id]?.name || "غير معروف";
            txt += `${Number(i) + 1}) ${name}\n🆔 ${id}\n\n`;
        }

        return api.sendMessage(style(txt), event.threadID);
    }

    // ➖ إزالة مشرف
    if (cmd === "remove") {
        if (!args[1])
            return api.sendMessage(style("✏️ اكتب رقم المشرف."), event.threadID);

        const index = parseInt(args[1]) - 1;

        if (isNaN(index) || index < 0 || index >= admins.length)
            return api.sendMessage(style("❌ رقم غير صحيح."), event.threadID);

        const removed = admins.splice(index, 1)[0];
        saveConfig(config);

        return api.sendMessage(
            style(`🗑️ تمت الإزالة\n🆔 ${removed}`),
            event.threadID
        );
    }

    // ❓ help
    return api.sendMessage(style(
        "📌 الأوامر:\n\n" +
        "• مشرف add (رد)\n" +
        "• مشرف list\n" +
        "• مشرف remove رقم\n" +
        "• مشرف help"
    ), event.threadID);
};
