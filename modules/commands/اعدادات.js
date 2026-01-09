const fs = require("fs-extra");
const path = __dirname + "/cache/groups.json";

module.exports.config = {
  name: "اعدادات",
  version: "2.0.0",
  hasPermssion: 1, // للادمن فقط
  credits: "Gemini",
  description: "ضبط حماية المجموعة",
  commandCategory: "الإدارة",
  usages: "اعدادات",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // تجاهل غير الأدمن تماماً
  const threadInfo = await api.getThreadInfo(threadID);
  if (!threadInfo.adminIDs.some(admin => admin.id == senderID)) return;

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
      originalName: threadInfo.threadName || ""
    };
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }

  const s = data[threadID];
  const status = (val) => val ? "✅" : "❌";

  const msg = `🛡️ قائمة الحماية:\n\n` +
    `1\nحماية اسم المجموعة [${status(s.nameProtect)}]\n\n` +
    `2\nمكافحة تغيير الصورة [${status(s.imageProtect)}]\n\n` +
    `3\nمكافحة تغيير الكنيات [${status(s.nicknameProtect)}]\n\n` +
    `4\nمكافحة الخروج [${status(s.antiOut)}]\n\n` +
    `5\nإخطار أحداث المجموعة [${status(s.notifyEvents)}]\n\n` +
    `• رد بالأرقام عمودياً لتغيير الحالة.\n` +
    `• ثم تفاعل بـ 👍 لحفظ التعديلات.`;

  return api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, body, senderID } = event;
  if (senderID != handleReply.author) return;

  const choices = body.match(/\d+/g);
  if (!choices) return;

  let data = JSON.parse(fs.readFileSync(path));
  
  choices.forEach(num => {
    if (num == "1") data[threadID].nameProtect = !data[threadID].nameProtect;
    if (num == "2") data[threadID].imageProtect = !data[threadID].imageProtect;
    if (num == "3") data[threadID].nicknameProtect = !data[threadID].nicknameProtect;
    if (num == "4") data[threadID].antiOut = !data[threadID].antiOut;
    if (num == "5") data[threadID].notifyEvents = !data[threadID].notifyEvents;
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  api.sendMessage("تفاعل بـ 👍 لحفظ هذه الإعدادات وتحديث بيانات الحماية.", threadID, (err, info) => {
    global.client.handleReaction.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
  });
};

module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  if (event.userID != handleReaction.author || event.reaction != "👍") return;
  
  let data = JSON.parse(fs.readFileSync(path));
  const threadInfo = await api.getThreadInfo(event.threadID);
  
  // تحديث الاسم المرجعي للمجموعة عند الحفظ
  data[event.threadID].originalName = threadInfo.threadName;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  api.unsendMessage(handleReaction.messageID);
  return api.sendMessage("✅ تم الحفظ. الحماية نشطة الآن.", event.threadID);
};
