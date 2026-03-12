const moment = require("moment");

module.exports.config = {
  name: "جلسات",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "محمد إدريس",
  description: "إدارة جلسات البوت (عرض / فصل / إعادة)",
  commandCategory: "المطور",
  usages: "جلسات | جلسات فصل <رقم> | جلسات اعادة <رقم>",
  cooldowns: 0
};

module.exports.run = async ({ api, event, args }) => {

  const DEV_ID = ["100081948980908"];
  if (!DEV_ID.includes(event.senderID)) {
    return api.sendMessage("⛔ هذا الأمر خاص بالمطور فقط", event.threadID);
  }

  // التأكد من وجود جلسات
  if (!global.client || !global.client.sessions) {
    return api.sendMessage("⚠️ لا توجد جلسات متعددة", event.threadID);
  }

  const sessions = Object.values(global.client.sessions);

  // عرض الجلسات
  if (!args[0]) {
    let msg = `╭─━━━━━━━━━━━━╮\n  📡 جلسات البوت\n╰─━━━━━━━━━━━━╯\n\n`;

    sessions.forEach((s, i) => {
      const uptime = moment
        .duration((Date.now() - (s.startTime || Date.now())) / 1000, "seconds")
        .humanize();

      msg +=
`#${i + 1}
👤 الاسم : ${s.name || "غير معروف"}
🆔 ID : ${s.userID || "؟"}
⏱️ التشغيل : ${uptime}
⚙️ الحالة : نشط ✅

`;
    });

    msg +=
`━━━━━━━━━━━━
📌 أوامر:
• جلسات فصل <رقم>
• جلسات اعادة <رقم>`;

    return api.sendMessage(msg, event.threadID);
  }

  const action = args[0];
  const index = parseInt(args[1]) - 1;

  if (isNaN(index) || !sessions[index]) {
    return api.sendMessage("❌ رقم الجلسة غير صحيح", event.threadID);
  }

  const target = sessions[index];

  // فصل الجلسة
  if (action === "فصل") {
    try {
      await target.api.logout();
      delete global.client.sessions[target.userID];

      return api.sendMessage(
        `🚪 تم فصل الجلسة\n👤 ${target.name}\n🆔 ${target.userID}`,
        event.threadID
      );
    } catch (e) {
      return api.sendMessage("❌ فشل فصل الجلسة", event.threadID);
    }
  }

  // إعادة تشغيل الجلسة
  if (action === "اعادة") {
    try {
      await target.api.logout();
      delete global.client.sessions[target.userID];

      return api.sendMessage(
        `🔄 تم إعادة تشغيل الجلسة\n👤 ${target.name}\n🆔 ${target.userID}\n⚠️ تحتاج تسجيل دخول تلقائي`,
        event.threadID
      );
    } catch (e) {
      return api.sendMessage("❌ فشل إعادة تشغيل الجلسة", event.threadID);
    }
  }

  api.sendMessage("❓ أمر غير معروف", event.threadID);
};
