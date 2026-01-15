const fs = require("fs-extra");
const moment = require("moment-timezone");
const path = __dirname + "/../commands/cache/groups.json";

module.exports.config = {
  name: "antiChange",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe", "log:subscribe"],
  version: "3.5.0",
  credits: "Gemini",
  description: "نظام حماية متطور (الأسماء، الكنيات، الصور) + منع الخروج + رسالة وداع باحترافية"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();

  // تجاهل أحداث البوت نفسه
  if (author == botID) return;

  // التحقق من وجود ملف البيانات
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  // جلب معلومات المجموعة للتحقق من الأدمن وعدد الأعضاء
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(i => i.id == botID);

  // 1. حماية اسم المجموعة (تتطلب أدمن)
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    if (!isAdmin) return; 
    return api.setTitle(s.originalName, threadID, () => api.sendMessage("م تهبش الاسم 🦧", threadID));
  }

  // 2. حماية الكنيات (إرجاع القديمة أو حذف الجديدة)
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    const targetID = logMessageData.participantFbId;
    const oldNickname = (s.nicknames && s.nicknames[targetID]) ? s.nicknames[targetID] : "";
    
    return api.changeNickname(oldNickname, threadID, targetID, () => {
      api.sendMessage("م تناخس في الكنيات يعب 🦧🤞", threadID);
    });
  }

  // 3. حماية الصورة (تتطلب أدمن)
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
    if (!isAdmin) return;
    // هنا البوت يرسل تحذير، ولإعادة الصورة فعلياً يجب توفر سورس الصورة في الملف
    return api.sendMessage("حماية الصورة مفعلة، م تلعب بي امك 🦧", threadID);
  }

  // 4. منع الدخول (Anti-Join)
  if (logMessageType === "log:subscribe" && s.antiJoin) {
    if (!isAdmin) return;
    const addedUsers = logMessageData.addedParticipants;
    for (let user of addedUsers) {
      if (user.userFbId != botID) {
        api.removeUserFromGroup(user.userFbId, threadID);
      }
    }
    return api.sendMessage("⚠️ منع الدخول مفعل حالياً.", threadID);
  }

  // 5. نظام مكافحة الخروج + رسالة الوداع
  if (logMessageType === "log:unsubscribe") {
    const leftID = logMessageData.leftParticipantFbId;
    if (leftID == botID) return;

    // حالة: مكافحة الخروج مفعلة + البوت أدمن
    if (s.antiOut && isAdmin) {
      return api.addUserToGroup(leftID, threadID, (err) => {
        if (!err) api.sendMessage("الحق العب قال مارق بكرامتو 🐸🤞", threadID);
      });
    } 
    
    // حالة: مكافحة الخروج غير مفعلة (إرسال رسالة الوداع بالستايل المطلوب)
    else {
      const userInfo = await api.getUserInfo(leftID);
      const name = userInfo[leftID].name;
      const type = (author == leftID) ? "غادر المجموعة" : "تم طرده بواسطة المسؤول";
      const time = moment.tz("Africa/Khartoum").format("HH:mm:ss");
      const date = moment.tz("Africa/Khartoum").format("YYYY/MM/DD");
      const membersCount = threadInfo.participantIDs.length;

      const goodbyeMsg = `⌬─────────────⌬
  ⪼ الـمُـغـادر ⌭ ${name}
  ⪼ الـحـالـة ⌭ ${type}
  ⪼ الـمـجـمـوعـة ⌭ ${threadInfo.threadName || "غير محدد"}
  ⪼ عـددنـا الآن ⌭ ( ${membersCount} )
  ⪼ الـتـوقـيـت ⌭ ${time} - ${date}
⌬─────────────⌬`;

      return api.sendMessage(goodbyeMsg, threadID);
    }
  }
};
