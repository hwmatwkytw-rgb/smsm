const fs = require("fs-extra");
const path = __dirname + "/cache/groups.json";

module.exports.config = {
  name: "اعدادات",
  version: "3.5.0",
  hasPermssion: 1, 
  credits: "Gemini",
  description: "لوحة تحكم حماية المجموعة (ستايل حديث)",
  commandCategory: "الإدارة",
  usages: "اعدادات",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const threadInfo = await api.getThreadInfo(threadID);
  if (!threadInfo.adminIDs.some(admin => admin.id == senderID)) {
    return api.sendMessage("⚠️ عذراً، هذا الأمر مخصص للمسؤولين فقط.", threadID, messageID);
  }

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
  const status = (val) => val ? "🔔 مـفـعـل" : "🔕 مـعـطـل";

  const msg = `⌬──────────────⌬
   ⫹⫺ لـوحـة تـحـكـم الـحـمـايـة 🛠️
⌬──────────────⌬
  [ 1 ] مـكـافـحـة الإزعـاج ↬ ${status(s.antiSpam)}
  [ 2 ] مـنـع الـخـروج ↬ ${status(s.antiOut)}
  [ 3 ] حـمـايـة الاسـم ↬ ${status(s.nameProtect)}
  [ 4 ] حـمـايـة الـصـورة ↬ ${status(s.imageProtect)}
  [ 5 ] حـمـايـة الـكـنـيـات ↬ ${status(s.nicknameProtect)}
  [ 6 ] مـنـع الـدخول ↬ ${status(s.antiJoin)}
⌬──────────────⌬
  💌 رد بـرقم الخيار للتبديل.
  ✅ تـفاعل بـ ( 👍 ) للـحفظ.`;

  return api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
    global.client.handleReaction.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, body, senderID, messageID } = event;
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
  const status = (val) => val ? "🔔 مـفـعـل" : "🔕 مـعـطـل";
  
  const updatedMsg = `⌬──────────────⌬
   ⫹⫺ تـم تـحـديث الإعـدادات 🛡️
⌬──────────────⌬
  [ 1 ] مـكـافـحـة الإزعـاج ↬ ${status(s.antiSpam)}
  [ 2 ] مـنـع الـخـروج ↬ ${status(s.antiOut)}
  [ 3 ] حـمـايـة الاسـم ↬ ${status(s.nameProtect)}
  [ 4 ] حـمـايـة الـصـورة ↬ ${status(s.imageProtect)}
  [ 5 ] حـمـايـة الـكـنـيـات ↬ ${status(s.nicknameProtect)}
  [ 6 ] مـنـع الـدخول ↬ ${status(s.antiJoin)}
⌬──────────────⌬
  👍 ضـع تـفاعل للـتأكيد والـحفظ.`;

  api.unsendMessage(handleReply.messageID);
  api.sendMessage(updatedMsg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
    global.client.handleReaction.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID
    });
  }, messageID);
};

module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  const { threadID, userID, reaction, messageID } = event;
  if (userID != handleReaction.author || reaction != "👍") return;
  
  let data = JSON.parse(fs.readFileSync(path));
  const botID = api.getCurrentUserID();
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(i => i.id == botID);
  
  data[threadID].originalName = threadInfo.threadName;
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  api.unsendMessage(handleReaction.messageID);

  if (!isAdmin) {
    return api.sendMessage("⚠️ تم الحفظ، ولكن البوت ليس أدمن في المجموعة! لذلك سيتم تجاهل (حماية الصورة) و (منع الخروج) حتى ترفعني لمسؤول.", threadID);
  } else {
    return api.sendMessage("✅ تم حفظ الإعدادات بنجاح وتفعيل الحماية.", threadID);
  }
};
