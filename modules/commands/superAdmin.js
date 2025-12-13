// 🦧 superAdmin.js - لوحة المشرف الأنيقة 🦧
const fs = require("fs");

module.exports.config = {
  name: "superAdmin",
  version: "1.0",
  hasPermssion: 2,
  credits: "محمد إدريس",
  description: "لوحة المشرف الأنيقة: إرسال، كنيات، تصفية، عرض القروبات",
  commandCategory: "المشرف",
  usages: "superAdmin",
  cooldowns: 5
};

// 🧑‍💻 ايدي المشرف
const devID = ["100018490916970"];

module.exports.run = async ({ api, event }) => {
  if (!devID.includes(event.senderID))
    return api.sendMessage("⚠️ هذا الأمر مخصص للمشرف فقط 🗿", event.threadID);

  // 📌 استايل قائمة المشرف
  const menu = `
╭━━━━━━━━━━━━━━━╮
│   ⚙️ لوحة المشرف ⚙️   │
├─────────────────┤
│ 1️⃣  🔄 إعادة تشغيل البوت
│ 2️⃣  💬 إرسال رسالة لجميع القروبات
│ 3️⃣  🪄 تغيير كنيات الأعضاء
│ 4️⃣  🧹 تصفية المجموعة من الأعضاء
│ 5️⃣  📜 عرض القروبات + إضافة المشرف
╰━━━━━━━━━━━━━━━╯
💡 أرسل الرقم المطلوب للتنفيذ
`;

  api.sendMessage(menu, event.threadID, (err, info) => {
    if (!global.client.handleReply) global.client.handleReply = [];
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: event.senderID,
      type: "menu"
    });
  });
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
  if (!devID.includes(event.senderID))
    return api.sendMessage("⚠️ فقط المشرف يمكنه استخدام هذا الأمر 🗿", event.threadID);

  const args = event.body.trim().split(" ");
  const choice = args[0];

  if (handleReply.type === "menu") {
    switch (choice) {
      case "1":
        api.sendMessage("🔄 جاري إعادة تشغيل البوت...", event.threadID, () => process.exit(1));
        break;

      case "2":
        api.sendMessage("📝 أرسل الرسالة الآن لتوزيعها على جميع القروبات:", event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "sendWord"
          });
        });
        break;

      case "3":
        api.sendMessage("🪄 أرسل الصيغة الجديدة للكنية (ضع كلمة 'الاسم'):", event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "setNick"
          });
        });
        break;

      case "4":
        const infoThread = await api.getThreadInfo(event.threadID);
        for (let uid of infoThread.participantIDs) {
          if (!devID.includes(uid)) {
            try { await api.removeUserFromGroup(uid, event.threadID); } catch (e) {}
          }
        }
        api.sendMessage("🧹 تم تصفية المجموعة من جميع الأعضاء ما عدا المشرف ✅", event.threadID);
        break;

      case "5":
        const threads = (await api.getThreadList(100, null, ["INBOX"])).filter(t => t.isGroup);
        if (!threads.length)
          return api.sendMessage("🚫 البوت غير موجود في أي مجموعة حالياً.", event.threadID);

        // 📌 استايل عرض القروبات بشكل جميل
        let msg = "╭═══════════ 📜 قائمة القروبات 📜 ═══════════╮\n";
        threads.forEach((t, i) => {
          msg += `│ ${i + 1}️⃣  ${t.name}\n`;
        });
        msg += "╰══════════════════════════════════════╯\n";
        msg += "💡 أرسل (اضف رقم) للانضمام";

        api.sendMessage(msg, event.threadID, (err, info) => {
          global.client.handleReply.push({
            type: "addDev",
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            threads: threads
          });
        });
        break;

      default:
        api.sendMessage("❌ رقم غير صحيح! اختر من 1 إلى 5.", event.threadID);
    }
  }

  // إرسال كلمة لجميع القروبات
  if (handleReply.type === "sendWord") {
    const allThread = (await api.getThreadList(100, null, ["INBOX"])).filter(t => t.isGroup);
    const now = new Date();
    const options = { timeZone: "Africa/Khartoum", hour12: false };
    const date = now.toLocaleDateString("ar-EG", options);
    const time = now.toLocaleTimeString("ar-EG", options);

    const message = `
╭━━━〔 📢 إشعار من المشرف 〕━━━╮
💬 ${event.body}
╰━━━━━━━━━━━━━━━━━━━━╯
📅 التاريخ: ${date}
⏰ الوقت: ${time}
`;

    for (const t of allThread) {
      api.sendMessage(message, t.threadID);
    }

    api.sendMessage("✅ تم إرسال الرسالة لجميع القروبات بنجاح.", event.threadID);
    global.client.handleReply = global.client.handleReply.filter(e => e.messageID !== handleReply.messageID);
  }

  // تغيير الكنيات
  if (handleReply.type === "setNick") {
    const newNick = event.body;
    const threadInfo = await api.getThreadInfo(event.threadID);
    let count = 0;
    for (let user of threadInfo.userInfo) {
      try {
        const firstName = user.firstName || "عضو";
        const nick = newNick.replace("الاسم", firstName);
        await api.changeNickname(nick, event.threadID, user.id);
        count++;
      } catch (e) {}
    }
    api.sendMessage(`✅ تم تحديث ${count} كنية بنجاح.`, event.threadID);
  }

  // إضافة المشرف لمجموعة
  if (handleReply.type === "addDev") {
    if (!args[0].toLowerCase().startsWith("اضف")) return;
    const index = parseInt(args[1]) - 1;
    if (isNaN(index) || index < 0 || index >= handleReply.threads.length)
      return api.sendMessage("❌ الرقم غير صحيح!", event.threadID);

    const thread = handleReply.threads[index];
    try {
      await api.addUserToGroup(devID[0], thread.threadID);
      api.sendMessage("🗿 تم دخول المشرف بنجاح ✨", thread.threadID);
      api.sendMessage(`✅ تمت إضافة المشرف لمجموعة: ${thread.name}`, event.threadID);
    } catch (error) {
      api.sendMessage(`❌ فشل في إضافة المشرف لمجموعة: ${thread.name}\n⚠️ تأكد أن البوت أدمن في المجموعة.`, event.threadID);
    }
  }
};
