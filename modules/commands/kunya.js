module.exports.config = {
  name: "كنية",
  version: "1.1.0",
  hasPermssion: 1, 
  credits: "Gemini",
  description: "تعيين كنية لعضو أو لنفسك (للأدمن فقط)",
  commandCategory: "الإدارة",
  usages: "[الكنية] أو بالرد على رسالة أو بعمل تاغ",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  // التحقق من صلاحيات الأدمن
  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs.map(admin => admin.id);
  
  if (!adminIDs.includes(senderID)) return;

  let targetID;
  let nickname;

  // تحديد الشخص والكنية
  if (type === "message_reply") {
    targetID = messageReply.senderID;
    nickname = args.join(" ");
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
    nickname = args.join(" ").replace(mentions[targetID], "").trim();
  } else {
    targetID = senderID;
    nickname = args.join(" ");
  }

  if (!nickname && args.length == 0 && type != "message_reply") return;

  // تنفيذ التغيير بدون إرسال رسالة نجاح
  api.changeNickname(nickname || "", threadID, targetID);
};
