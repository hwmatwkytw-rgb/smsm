const fs = require("fs-extra");

module.exports.config = {
  name: "protection",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe"],
  version: "1.5.0",
  credits: "Gemini",
  description: "إعادة البيانات الأصلية عند التغيير"
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();

  if (!global.config.protection || !global.config.protection[threadID]) return;
  const settings = global.config.protection[threadID];
  const threadData = (await Threads.getData(threadID)).data || {};

  // 1. إعادة الاسم
  if (logMessageType == "log:thread-name" && settings.name && author != botID) {
    api.setTitle(threadData.lastOriginalName || "", threadID);
    api.sendMessage("🚫 حماية الاسم مفعلة! تمت إعادة الاسم الأصلي.", threadID);
  }

  // 2. إعادة الكنية
  if (logMessageType == "log:user-nickname" && settings.nick && author != botID) {
    const { participant_id } = logMessageData;
    const oldNick = (threadData.lastOriginalNicks || {})[participant_id] || "";
    api.changeNickname(oldNick, threadID, participant_id);
    api.sendMessage("🚫 حماية الكنيات مفعلة! لا يمكن التغيير حالياً.", threadID);
  }

  // 3. إعادة الصورة
  if (logMessageType == "log:thread-icon" && settings.icon && author != botID) {
    const path = __dirname + `/cache/icon_${threadID}.png`;
    if (fs.existsSync(path)) {
      api.changeGroupImage(fs.createReadStream(path), threadID);
      api.sendMessage("🚫 حماية الصورة مفعلة! تمت إعادة الصورة الأصلية.", threadID);
    }
  }

  // 4. منع الخروج (Anti-Out)
  if (logMessageType == "log:unsubscribe" && settings.antiOut) {
    if (author == logMessageData.leftParticipantId && author != botID) {
      api.addUserToGroup(author, threadID, (err) => {
        if (!err) api.sendMessage("🚫 ممنوع الخروج! تمت إعادتك للمجموعة.", threadID);
      });
    }
  }
};
