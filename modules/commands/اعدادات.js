const fs = require("fs-extra");
const path = __dirname + "/cache/settings.json";

module.exports.config = {
  name: "اعدادات",
  version: "1.5.0",
  hasPermssion: 1,
  credits: "Gemini",
  description: "ضبط إعدادات حماية المجموعة",
  commandCategory: "الإدارة",
  usages: "اعدادات",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
  if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
  
  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID]) {
    data[threadID] = {
      nameProtect: false,
      imageProtect: false,
      nicknameProtect: false,
      antiOut: false,
      notifyEvents: false,
      originalName: ""
    };
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }

  const s = data[threadID];
  const status = (val) => val ? "✅" : "❌";

  const msg = `⚙️ إعدادات حماية المجموعة:\n\n` +
    `1\nحماية اسم المجموعة [${status(s.nameProtect)}]\n\n` +
    `2\nمكافحة تغير صورة المجموعه [${status(s.imageProtect)}]\n\n` +
    `3\nمكافحة تغير الكنيات [${status(s.nicknameProtect)}]\n\n` +
    `4\nمكافحة الخروج [${status(s.antiOut)}]\n\n` +
    `5\nاخطار احداث المجموعة [${status(s.notifyEvents)}]\n\n` +
    `• رد بالأرقام (مثال: 1 2 5) بشكل عمودي أو أفقي.\n` +
    `• بعد الاختيار تفاعل بـ 👍 للحفظ.`;

  return api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: event.senderID
    });
  }, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  if (senderID != handleReply.author) return;

  // استخراج الأرقام فقط من الرد (يدعم العمودي والأفقي)
  const choices = body.match(/\d+/g);
  if (!choices) return api.sendMessage("❌ يرجى إدخال أرقام الخيارات فقط.", threadID, messageID);

  let data = JSON.parse(fs.readFileSync(path));
  
  choices.forEach(num => {
    if (num == "1") data[threadID].nameProtect = !data[threadID].nameProtect;
    if (num == "2") data[threadID].imageProtect = !data[threadID].imageProtect;
    if (num == "3") data[threadID].nicknameProtect = !data[threadID].nicknameProtect;
    if (num == "4") data[threadID].antiOut = !data[threadID].antiOut;
    if (num == "5") data[threadID].notifyEvents = !data[threadID].notifyEvents;
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  return api.sendMessage("تم تحديد التعديلات بنجاح.\nتفاعل بـ 👍 على هذه الرسالة الآن لحفظ الإعدادات الجديدة.", threadID, (err, info) => {
    global.client.handleReaction.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};

module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  if (event.userID != handleReaction.author || event.reaction != "👍") return;
  
  let data = JSON.parse(fs.readFileSync(path));
  const threadInfo = await api.getThreadInfo(event.threadID);
  
  // حفظ الاسم الحالي ليكون هو المرجع عند الحماية
  data[event.threadID].originalName = threadInfo.threadName;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  api.unsendMessage(handleReaction.messageID); // حذف رسالة الطلب
  return api.sendMessage("✅ تم حفظ الإعدادات وتحديث حالة الحماية.", event.threadID);
};
