module.exports.config = {
  name: "antiProtection",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe"],
  run: async function ({ api, event, Threads }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    const botID = api.getCurrentUserID();
    
    // جلب الإعدادات
    const thread = await Threads.getData(threadID);
    const anti = thread.data.antiSettings || {};

    switch (logMessageType) {
      case "log:thread-name":
        if (anti.antiChangeGroupName && author !== botID) {
          api.setTitle(thread.data.threadName || "Group", threadID);
          api.sendMessage("🚫 منع تغيير اسم المجموعة مفعل!", threadID);
        }
        break;

      case "log:thread-icon":
        if (anti.antiChangeGroupImage && author !== botID) {
          api.sendMessage("🚫 منع تغيير الصورة مفعل! (سيتم تجاهل التغيير)", threadID);
        }
        break;

      case "log:user-nickname":
        if (anti.antiChangeNickname && author !== botID) {
          api.setUserNickname(logMessageData.oldNickname || "", threadID, logMessageData.participantID);
          api.sendMessage("🚫 منع تغيير الألقاب مفعل!", threadID);
        }
        break;

      case "log:unsubscribe":
        if (anti.antiOut && logMessageData.leftParticipantID !== botID) {
          if (author === logMessageData.leftParticipantID) { // إذا خرج بنفسه
            api.addUserToGroup(logMessageData.leftParticipantID, threadID, (err) => {
              if (!err) api.sendMessage("عاش يا وحش.. ممنوع الخروج هنا! تم إعادتك بنجاح.", threadID);
            });
          }
        }
        break;
    }
  }
};
