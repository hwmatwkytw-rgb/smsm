const fs = require("fs-extra");
const path = __dirname + "/../commands/cache/settings.json";

module.exports.config = {
  name: "antiChange",
  eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:thread-icon", "log:user-nickname"],
  version: "1.0.0",
  credits: "Gemini",
  description: "منع التغييرات وحماية المجموعة"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  if (!fs.existsSync(path)) return;
  
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  const botID = api.getCurrentUserID();

  // 1. حماية الاسم
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    if (author == botID) return;
    api.setTitle(s.originalName, threadID, () => {
      api.sendMessage("⚠️ التغيير غير مسموح به! تمت إعادة الاسم الأصلي.", threadID);
    });
  }

  // 2. مكافحة الخروج
  if (logMessageType === "log:unsubscribe" && s.antiOut) {
    const leftID = logMessageData.leftParticipantFbId;
    if (leftID == botID) return;
    api.addUserToGroup(leftID, threadID, (err) => {
      if (!err) api.sendMessage("⚠️ مكافحة الخروج مفعلة، تمت إعادة العضو.", threadID);
    });
  }

  // 3. مكافحة الكنيات
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    if (author == botID) return;
    const oldNickname = logMessageData.oldNickname || "";
    api.changeNickname(oldNickname, threadID, logMessageData.participantFbId, () => {
      api.sendMessage("⚠️ التغيير غير مسموح به! تمت إعادة الكنية الأصلية.", threadID);
    });
  }

  // 4. مكافحة الصورة
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
    if (author == botID) return;
    api.sendMessage("⚠️ التغيير غير مسموح به! (مكافحة تغيير الصورة مفعلة).", threadID);
    // ملاحظة: استعادة الصورة تتطلب رفع ملف جديد، حالياً يكتفي بالتحذير
  }
};
