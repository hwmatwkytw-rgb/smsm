const os = require('os');
const fs = require('fs');

module.exports.config = {
  name: "جلسة",
  version: "3.0.0",
  hasPermssion: 2, // للمطور فقط
  credits: "Gemini",
  description: "عرض تفاصيل الجلسة، الحسابات، وسرعة الاستضافة",
  commandCategory: "المطور",
  usages: "جلسة",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, client }) {
  const { threadID, messageID, senderID } = event;
  
  // التحقق من هويتك كمطور
  const devID = "61581906898524";
  if (senderID != devID) return api.sendMessage("⚠️ الوصول مقتصر على المطور الرئيسي.", threadID, messageID);

  // 1. حساب وقت التشغيل (Uptime)
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  // 2. معلومات الاستضافة (Hosting & System)
  const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const platform = os.platform(); // نظام التشغيل (linux, win32, etc)
  const arch = os.arch(); // المعمارية (x64)

  // 3. سرعة الاستجابة (Ping)
  const startPing = Date.now();
  
  // 4. الحسابات والمجموعات
  const botID = api.getCurrentUserID();
  const botInfo = await api.getUserInfo(botID);
  const botName = botInfo[botID].name;

  const msg = `⌈ جـلـسـة الـمـطـور الـشـامـلـة ⌋\n` +
    `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n` +
    `🤖 الـحساب النشط: ${botName}\n` +
    `🔗 عدد الحسابات: 1 (الرئيسي)\n` +
    `⏳ وقت تشغيل الجلسة: ${hours}س ${minutes}د ${seconds}ث\n` +
    `📡 سرعة الاستجابة: جاري الحساب...\n\n` +
    `🖥️ مـعلومات الـمضيف (Host):\n` +
    `• الـنظام: ${platform} (${arch})\n` +
    `• الـرام المستخدم: ${ramUsage}MB / ${totalRam}GB\n` +
    `• الـمعالج: ${os.cpus()[0].model.split(' ')[0]}\n\n` +
    `📈 الإحـصائيات:\n` +
    `• الـمجموعات: ${global.data.allThreadID.length}\n` +
    `• الـمستخدمين: ${global.data.allUserID.length}\n` +
    `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n` +
    `⌈ خـيارات الـتحكم ⌋\n` +
    `1️⃣ فحص السرعة (Ping)\n` +
    `2️⃣ تحديث الجلسة (Restart)\n` +
    `3️⃣ تفاصيل المجموعات\n` +
    `رد بالرقم المطلوب للتنفيذ`;

  return api.sendMessage(msg, threadID, (err, info) => {
    const endPing = Date.now() - startPing;
    // تحديث الرسالة بإضافة البنج الحقيقي
    api.editMessage(info.messageID, msg.replace("جاري الحساب...", `${endPing}ms`));

    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, body, messageID, senderID } = event;
  if (senderID != handleReply.author) return;

  switch (body) {
    case "1":
      const pingStart = Date.now();
      return api.sendMessage("📡 فحص السرعة...", threadID, (err, info) => {
        const pingEnd = Date.now() - pingStart;
        api.editMessage(`🚀 سرعة استجابة الاستضافة: ${pingEnd}ms`, info.messageID);
      });
    case "2":
      await api.sendMessage("⚙️ جاري إعادة تشغيل الجلسة وتحديث المضيف...", threadID);
      process.exit(1);
    case "3":
      return api.sendMessage(`📊 المجموعات المرتبطة حالياً: ${global.data.allThreadID.length} مجموعة.`, threadID);
    default:
      return api.sendMessage("⚠️ خيار غير صحيح.", threadID);
  }
};
