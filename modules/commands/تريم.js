const { exec } = require("child_process");

module.exports.config = {
    name: "تريم",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "Gemini",
    description: "تثبيت المكتبات البرمجية وتحسين أداء البوت",
    commandCategory: "المطور",
    usages: "تريم [اسم_المكتبة]",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    const developerID = "61581906898524";
    if (event.senderID != developerID) {
        return api.sendMessage("❌ صلاحية الوصول مرفوضة. هذا الأمر مخصص للمطور الأساسي فقط.", event.threadID, event.messageID);
    }

    const libName = args.join(" ");
    if (!libName) {
        const usageMsg = `╭───────────────╮\n  ⌈ 🛠️ لوحـة الـتـحـكـم بـالـمـكـتـبـات ⌋\n╰───────────────╯\n\n` +
            `☚ الاستخدام: تريم [اسم المكتبة]\n` +
            `☚ مثال: تريم axios\n\n` +
            `💡 الـتـحـسـيـنـات الـتـلـقـائـيـة:\n` +
            `1. تحديث ملف package.json\n` +
            `2. تنظيف الكاش المؤقت\n` +
            `3. إعادة تشغيل البوت لتفعيل الإضافات`;
        return api.sendMessage(usageMsg, event.threadID, event.messageID);
    }

    const statusMsg = `╭─── [ TERMINAL ] ───╮\n` +
        `📦 جاري تثبيت: ${libName}\n` +
        `⚙️ المعالجة: npm install\n` +
        `⏳ يرجى الانتظار ثواني...\n` +
        `╰──────────────────╯`;

    api.sendMessage(statusMsg, event.threadID, async (err, info) => {
        exec(`npm install ${libName}`, (error, stdout, stderr) => {
            if (error) {
                return api.sendMessage(`❌ فشل التثبيت:\n${error.message}`, event.threadID, event.messageID);
            }

            const successMsg = `╭─── [ SUCCESS ] ───╮\n` +
                `✅ تمت العملية بنجاح\n` +
                `📚 المكتبة: ${libName}\n` +
                `🔄 النظام: تم التحديث\n` +
                `🚀 الإجراء: إعادة تشغيل البوت...\n` +
                `╰──────────────────╯`;

            api.sendMessage(successMsg, event.threadID, () => {
                // إعادة تشغيل البوت (تعمل إذا كنت تستخدم PM2 أو سكريبت تشغيل تلقائي)
                process.exit(1); 
            });
        });
    }, event.messageID);
};
