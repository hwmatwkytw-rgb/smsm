const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");
const path = __dirname + "/../commands/cache/groups.json";

module.exports.config = {
  name: "antiChange",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe", "log:subscribe"],
  version: "3.5.0",
  credits: "Gemini",
  description: "نظام استعادة البيانات والحماية من التغيير"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();
  const time = moment.tz("Africa/Khartoum").format("HH:mm • DD/MM/YYYY");

  if (author == botID) return;
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  // 1. حماية الاسم واستعادته
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    return api.setTitle(s.originalName, threadID, () => {
      api.sendMessage("⌈ م تهبش الاسم يعب 🦧 ⌋", threadID);
    });
  }

  // 2. حماية الكنيات واستعادتها
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    const oldNickname = logMessageData.oldNickname || "";
    const victimID = logMessageData.participantFbId;
    return api.changeNickname(oldNickname, threadID, victimID, () => {
      api.sendMessage("⌈ م تناخس في الألقاب 🦧🤞 ⌋", threadID);
    });
  }

  // 3. منع الدخول (Anti-Join)
  if (logMessageType === "log:subscribe" && s.antiJoin) {
    logMessageData.addedParticipants.forEach(user => {
      if (user.userFbId != botID) api.removeUserFromGroup(user.userFbId, threadID);
    });
    return api.sendMessage(`⚠️ المجموعة مغلقة حالياً ممنوع الدخول.`, threadID);
  }

  // 4. منع الخروج + رد الطرد (بلع بانكاي)
  if (logMessageType === "log:unsubscribe") {
    const leftID = logMessageData.leftParticipantFbId;
    if (leftID == botID) return;

    // تم الطرد بواسطة شخص آخر
    if (author !== leftID) {
      return api.sendMessage("بلع بانكاي  <(｀^´)>", threadID);
    }

    // خرج بنفسه
    if (s.antiOut) {
      api.addUserToGroup(leftID, threadID, (err) => {
        if (!err) api.sendMessage("الحق العب قال مارق بكرامتو 🐸🤞", threadID);
      });
    } else {
      try {
        const info = await api.getUserInfo(leftID);
        const threadInfo = await api.getThreadInfo(threadID);
        const msg = `╭─────────────╮\n         ⌈ غـادر أحـد الأعـضـاء ⌋\n╰─────────────╯\n\n  ⪼ الـعـضـو ⌭ ${info[leftID].name}\n  ⪼ الـمـجـمـوعـة ⌭ ${threadInfo.threadName}\n  ⪼ عـددنـا الآن ⌭ ( ${threadInfo.participantIDs.length} )\n  ⪼ الـتـوقـيـت ⌭ ${time}\n\n⌬─────────────⌬`;
        api.sendMessage(msg, threadID);
      } catch (e) { console.log(e) }
    }
  }

  // 5. حماية الصورة واستعادتها
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
    if (s.originalImage) {
      try {
        const imgRes = await axios.get(s.originalImage, { responseType: "stream" });
        api.changeGroupImage(imgRes.data, threadID, () => {
          api.sendMessage("⌈ م تلعب بـ صورة القروب 🦧 ⌋", threadID);
        });
      } catch (e) {
        api.sendMessage("⌈ م تلعب بي امك 🦧 ⌋", threadID);
      }
    }
  }
};
