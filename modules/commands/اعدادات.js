const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "اعدادات",
  version: "1.5.0",
  hasPermssion: 1,
  credits: "Gemini",
  description: "ضبط حماية المجموعة مع حفظ البيانات الأصلية",
  commandCategory: "إدارة",
  usages: "[أرقام]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, body } = event;

  if (!global.config.protection) global.config.protection = {};
  if (!global.config.protection[threadID]) {
    global.config.protection[threadID] = { name: false, icon: false, nick: false, antiOut: false, notify: false };
  }

  const p = global.config.protection[threadID];
  const check = (val) => val ? "✅" : "❌";

  if (args.length === 0) {
    let msg = `⚙️ ━━━ إعدادات الحماية ━━━ ⚙️\n\n` +
              `1. حماية اسم المجموعة [${check(p.name)}]\n` +
              `2. حماية صورة المجموعة [${check(p.icon)}]\n` +
              `3. منع تغيير الكنيات [${check(p.nick)}]\n` +
              `4. منع الخروج (Anti-Out) [${check(p.antiOut)}]\n` +
              `5. إشعارات الأحداث [${check(p.notify)}]\n\n` +
              `💡 أرسل أرقام الخيارات (مثال: 1 2)\n━━━━━━━━━━━━━━━`;
    return api.sendMessage(msg, threadID, messageID);
  }

  const selectedNumbers = body.match(/\d+/g);
  if (!selectedNumbers) return api.sendMessage("⚠️ يرجى إدخال أرقام صحيحة.", threadID, messageID);

  selectedNumbers.forEach(num => {
    if (num == "1") p.name = !p.name;
    if (num == "2") p.icon = !p.icon;
    if (num == "3") p.nick = !p.nick;
    if (num == "4") p.antiOut = !p.antiOut;
    if (num == "5") p.notify = !p.notify;
  });

  return api.sendMessage("⏳ تم تسجيل التغييرات.. تفاعل بـ 👍 على هذه الرسالة لحفظ الإعدادات وأخذ نسخة احتياطية للبيانات.", threadID, (err, info) => {
    global.client.handleReaction.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID,
      tempSettings: JSON.parse(JSON.stringify(p)) 
    });
  }, messageID);
};

module.exports.handleReaction = async function({ api, event, handleReaction, Threads }) {
  const { threadID, userID, reaction, messageID } = event;
  if (reaction == "👍" && userID == handleReaction.author) {
    try {
      // 1. حفظ الإعدادات في المتغير العام
      global.config.protection[threadID] = handleReaction.tempSettings;

      // 2. أخذ لقطة (Snapshot) للبيانات الأصلية وحفظها
      const threadInfo = await api.getThreadInfo(threadID);
      
      // حفظ الصورة في الكاش إذا كانت حماية الصورة مفعلة
      if (handleReaction.tempSettings.icon && threadInfo.imageSrc) {
        const path = __dirname + `/cache/icon_${threadID}.png`;
        const getImg = (await axios.get(threadInfo.imageSrc, { responseType: 'arraybuffer' })).data;
        fs.writeFileSync(path, Buffer.from(getImg, 'utf-8'));
      }

      // حفظ نسخة من الاسم والكنيات في قاعدة بيانات المجموعات
      await Threads.setData(threadID, { 
        data: { 
          lastOriginalName: threadInfo.threadName,
          lastOriginalNicks: threadInfo.nicknames 
        } 
      });

      api.unsendMessage(handleReaction.messageID);
      return api.sendMessage("✅ تم الحفظ! أخذ البوت نسخة من (الاسم/الصورة/الكنيات) وسيعيدها فوراً عند أي تغيير غير مصرح به.", threadID);
    } catch (e) {
      return api.sendMessage("❌ حدث خطأ أثناء حفظ النسخة الاحتياطية: " + e.message, threadID);
    }
  }
};
