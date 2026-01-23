module.exports.config = {
  name: "joinNoti",
  eventType: ["log:subscribe", "log:unsubscribe"],
  version: "1.0.6",
  credits: "Mirai Team | تعديل: ᎠᎯᏁᎢᎬ  ᏚᎮᎯᏒᎠᎯ",
  description: "إشعار انضمام ومغادرة - حماية المطور والرد على الطرد والهروب",
  dependencies: {
    "fs-extra": "",
    "moment-timezone": ""
  }
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, author, logMessageType, logMessageData } = event;
  const developerID = "61581906898524"; 

  // ====== 🟦 انضمام (البوت أو الأعضاء) ======
  if (logMessageType === "log:subscribe") {
    if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
      if (author !== developerID) return;
      api.changeNickname(`[ / ] • ${global.config.BOTNAME || "KYROS BOT"}`, threadID, api.getCurrentUserID());
      const botMsg = `⌯ تم التوصـيل بنجاح ✅\n──────────────────\n❏ اسـم الـبـوت : ${global.config.BOTNAME || "KYROS BOT"}\n❏ الـبـادئ : [ ${global.config.PREFIX} ]\n❏ المطور : ᎠᎯᏁᎢᎬ  ᏚᎮᎯᏒᎠᎯ\n──────────────────\n⌯ اكتب [ ${global.config.PREFIX}اوامر ] لظهور القائمة.`;
      return api.sendMessage(botMsg, threadID);
    }

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const nameArray = logMessageData.addedParticipants.map(i => i.fullName);
      const mentions = logMessageData.addedParticipants.map(i => ({ tag: i.fullName, id: i.userFbId }));
      const authorData = await Users.getData(author);
      const adderName = authorData?.name || "رابط الدعوة";
      const time = require("moment-timezone").tz("Africa/Khartoum").format("HH:mm • DD/MM/YYYY");
      const msg = `◆━━━━━▷ ✦ ◁━━━━━◆\n❏ أهلاً بـك يا | ${nameArray.join(", ")}\n❏ انضممت الآن إلى | ${threadInfo.threadName}\n❏ تمت إضافتك بواسطة | ${adderName}\n❏ ترتيبك بيننا | ${threadInfo.participantIDs.length}\n❏ وقت الانضمام | ${time}\n❏ لا تثـق كثيـراً… فـالقلـوب تتغيّـر 🖤\n◆━━━━━▷ ✦ ◁━━━━━◆`;
      return api.sendMessage({ body: msg, mentions }, threadID);
    } catch (e) { console.log(e); }
  }

  // ====== 🟥 مغادرة (هروب أم طرد؟) ======
  if (logMessageType === "log:unsubscribe") {
    const leftID = logMessageData.leftParticipantFbId;
    
    // 1. إذا كان البوت هو الذي غادر، لا يفعل شيئاً
    if (leftID == api.getCurrentUserID()) return;

    // 2. إذا كان الشخص الذي غادر (leftID) ليس هو من قام بالإجراء (author) -> حالة طرد
    if (author != leftID) {
        return api.sendMessage("العب بلع بانكاي في جلحاتو 🐸", threadID);
    }

    // 3. إذا كان الشخص هو من غادر بنفسه (هروب)
    api.addUserToGroup(leftID, threadID, (err) => {
      if (err) {
        // فشل الإرجاع (بسبب الخصوصية)
        return api.sendMessage("احش كرامتك زاتو •-•", threadID);
      } else {
        // نجح الإرجاع
        return api.sendMessage("مارق وين يحب 🐸؟", threadID);
      }
    });
  }
};
