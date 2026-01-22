const fs = require("fs-extra");
const axios = require("axios");
const path = __dirname + "/cache/groups.json";
const imagePath = __dirname + "/cache/group_images/";

module.exports.config = {
  name: "اعدادات",
  version: "4.1.0",
  hasPermssion: 1, 
  credits: "Gemini",
  description: "ضبط حماية المجموعة وحفظ البيانات الأصلية",
  commandCategory: "الإدارة",
  usages: "اعدادات",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    // التأكد أن المستخدم أدمن
    if (!threadInfo.adminIDs.some(admin => admin.id == senderID)) {
        return api.sendMessage("❌ هذا الأمر مخصص لمسؤولي المجموعة فقط.", threadID, messageID);
    }

    // إنشاء المجلدات إذا لم تكن موجودة
    if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
    if (!fs.existsSync(imagePath)) fs.mkdirSync(imagePath);
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
    
    let data = JSON.parse(fs.readFileSync(path));

    if (!data[threadID]) {
      data[threadID] = {
        antiSpam: false, antiOut: false, nameProtect: false,
        imageProtect: false, nicknameProtect: false, antiJoin: false,
        originalName: threadInfo.threadName || "",
        imageLocalPath: ""
      };
      fs.writeFileSync(path, JSON.stringify(data, null, 2));
    }

    const s = data[threadID];
    const status = (val) => val ? "✅" : "❌";

    const msg = `╭─────────────╮\n     ⌈ إعـدادات الـحـمـايـة ⌋\n╰─────────────╯\n\n` +
      `1. [${status(s.antiSpam)}] مكافحة الإزعاج\n` +
      `2. [${status(s.antiOut)}] منع الخروج\n` +
      `3. [${status(s.nameProtect)}] حماية اسم المجموعة\n` +
      `4. [${status(s.imageProtect)}] حماية صورة المجموعة\n` +
      `5. [${status(s.nicknameProtect)}] حماية الألقاب\n` +
      `6. [${status(s.antiJoin)}] منع الانضمام\n\n` +
      `☚ رد برقم الإعداد لتغييره\n☚ تفاعل بـ 👍 لحفظ البيانات الحالية كمرجع (الاسم والصورة).`;

    return api.sendMessage(msg, threadID, (err, info) => {
      global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID });
    }, messageID);
  } catch (e) { console.log(e) }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, body, senderID, messageID } = event;
  if (senderID != handleReply.author) return;

  const choices = body.match(/\d+/g);
  if (!choices) return;

  let data = JSON.parse(fs.readFileSync(path));
  choices.forEach(num => {
    const keys = ["", "antiSpam", "antiOut", "nameProtect", "imageProtect", "nicknameProtect", "antiJoin"];
    if (keys[num]) data[threadID][keys[num]] = !data[threadID][keys[num]];
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  const s = data[threadID];
  const status = (val) => val ? "✅" : "❌";
  
  const updatedMsg = `⌈ تـحـديـث الإعـدادات ⌋\n\n1. [${status(s.antiSpam)}] مكافحة الإزعاج\n2. [${status(s.antiOut)}] منع الخروج\n3. [${status(s.nameProtect)}] حماية الاسم\n4. [${status(s.imageProtect)}] حماية الصورة\n5. [${status(s.nicknameProtect)}] حماية الألقاب\n6. [${status(s.antiJoin)}] منع الانضمام\n\n⇒ تفاعل بـ 👍 للاعتماد وتحديث البيانات الأصلية.`;

  api.sendMessage(updatedMsg, threadID, (err, info) => {
    global.client.handleReaction.push({ name: this.config.name, messageID: info.messageID, author: senderID });
  }, messageID);
};

module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  if (event.userID != handleReaction.author || event.reaction != "👍") return;
  const { threadID } = event;
  
  let data = JSON.parse(fs.readFileSync(path));
  const threadInfo = await api.getThreadInfo(threadID);
  
  // حفظ صورة المجموعة الحالية كمرجع للحماية
  if (threadInfo.imageSrc) {
    try {
      const imgRes = await axios.get(threadInfo.imageSrc, { responseType: 'arraybuffer' });
      const imgP = imagePath + `${threadID}.png`;
      fs.writeFileSync(imgP, Buffer.from(imgRes.data, 'utf-8'));
      data[threadID].imageLocalPath = imgP;
    } catch (e) { console.log("خطأ في حفظ الصورة:", e) }
  }

  data[threadID].originalName = threadInfo.threadName || "";
  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  api.unsendMessage(handleReaction.messageID);
  const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == api.getCurrentUserID());
  
  if (!isBotAdmin) {
    api.sendMessage("⚠️ تم الحفظ بنجاح، لكن يرجى رفع البوت مسؤولاً (Admin) لضمان عمل الحماية.", threadID);
  } else {
    api.sendMessage("✅ تم تفعيل أنظمة الحماية وتثبيت البيانات الأصلية بنجاح.", threadID);
  }
};
