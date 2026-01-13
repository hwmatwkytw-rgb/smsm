const fs = require("fs-extra");
const path = __dirname + "/cache/groups.json";

module.exports.config = {
  name: "اعدادات",
  version: "2.9.0",
  hasPermssion: 1, 
  credits: "Gemini",
  description: "ضبط حماية وإعدادات المجموعة",
  commandCategory: "الإدارة",
  usages: "اعدادات",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const threadInfo = await api.getThreadInfo(threadID);
  if (!threadInfo.adminIDs.some(admin => admin.id == senderID)) return;

  if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
  if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
  
  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID]) {
    data[threadID] = {
      antiSpam: false,
      antiOut: false,
      nameProtect: false,
      imageProtect: false,
      nicknameProtect: false,
      antiJoin: false,
      originalName: threadInfo.threadName || ""
    };
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }

  const s = data[threadID];
  const status = (val) => val ? "✅" : "❌";

  const msg = `⌈ إعـدادات الـمـجـموعـة ⌋\n\n` +
    `1. [${status(s.antiSpam)}] مكافحة الإزعاج\n` +
    `2. [${status(s.antiOut)}] منع الخروج من المجموعة\n` +
    `3. [${status(s.nameProtect)}] منع تغيير اسم المجموعة\n` +
    `4. [${status(s.imageProtect)}] منع تغيير صورة المجموعة\n` +
    `5. [${status(s.nicknameProtect)}] منع تغيير اللقب\n` +
    `6. [${status(s.antiJoin)}] منع دخول أعضاء جدد\n\n` +
    `⇒ رد بالأرقام لاختيار الإعداد الذي تريد تغييره`;

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
    if (num == "1") data[threadID].antiSpam = !data[threadID].antiSpam;
    if (num == "2") data[threadID].antiOut = !data[threadID].antiOut;
    if (num == "3") data[threadID].nameProtect = !data[threadID].nameProtect;
    if (num == "4") data[threadID].imageProtect = !data[threadID].imageProtect;
    if (num == "5") data[threadID].nicknameProtect = !data[threadID].nicknameProtect;
    if (num == "6") data[threadID].antiJoin = !data[threadID].antiJoin;
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  const s = data[threadID];
  const status = (val) => val ? "✅" : "❌";
  const updatedMsg = `⌈ إعـدادات الـمـجـموعـة ⌋\n\n` +
    `1. [${status(s.antiSpam)}] مكافحة الإزعاج\n` +
    `2. [${status(s.antiOut)}] منع الخروج من المجموعة\n` +
    `3. [${status(s.nameProtect)}] منع تغيير اسم المجموعة\n` +
    `4. [${status(s.imageProtect)}] منع تغيير صورة المجموعة\n` +
    `5. [${status(s.nicknameProtect)}] منع تغيير اللقب\n` +
    `6. [${status(s.antiJoin)}] منع دخول أعضاء جدد\n\n` +
    `⇒ تفاعل 👍 لحفظ الإعدادات الجديدة`;

  api.sendMessage(updatedMsg, threadID, (err, info) => {
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
  
  data[event.threadID].originalName = threadInfo.threadName;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  api.unsendMessage(handleReaction.messageID);
  return api.sendMessage("✅ تم الحفظ بنجاح.", event.threadID);
};
