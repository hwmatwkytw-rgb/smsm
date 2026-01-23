module.exports.config = {
  name: "joinNoti",
  eventType: ["log:subscribe"],
  version: "1.0.3",
  credits: "Mirai Team | تعديل: ᎠᎯᏁᎢᎬ  ᏚᎮᎯᏒᎠᎯ",
  description: "إشعار انضمام البوت أو عضو - استجابة البوت محصورة للمطور فقط",
  dependencies: {
    "fs-extra": "",
    "moment-timezone": ""
  }
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, author } = event;
  const developerID = "61581906898524"; // معرف المطور الخاص بك

  // ====== 🟦 انضمام البوت (فحص المطور بصمت) ======
  if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
    
    // إذا لم يكن المطور هو من أضاف البوت، يتجاهل الأمر تماماً ولا يرسل شيئاً
    if (author !== developerID) return;

    // التنفيذ فقط إذا كان المضيف هو المطور
    api.changeNickname(
      `[ / ] • ${global.config.BOTNAME || "KYROS BOT"}`,
      threadID,
      api.getCurrentUserID()
    );

    const botMsg = 
`⌯ تم التوصـيل بنجاح ✅
──────────────────
❏ اسـم الـبـوت : ${global.config.BOTNAME || "KYROS BOT"}
❏ الـبـادئ : [ ${global.config.PREFIX} ]
❏ المطور : ᎠᎯᏁᎢᎬ  ᏚᎮᎯᏒᎠᎯ
──────────────────
⌯ اكتب [ ${global.config.PREFIX}اوامر ] لظهور القائمة.`;

    return api.sendMessage(botMsg, threadID);
  }

  // ====== 🟨 انضمام عضو عادي (ترحيب طبيعي) ======
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const { threadName, participantIDs } = threadInfo;

    const nameArray = [];
    const mentions = [];

    for (const user of event.logMessageData.addedParticipants) {
      const id = user.userFbId;
      const userName = user.fullName;

      nameArray.push(userName);
      mentions.push({ tag: userName, id });

      if (!global.data.allUserID.includes(id)) {
        await Users.createData(id, { name: userName, data: {} });
        global.data.userName.set(id, userName);
        global.data.allUserID.push(id);
      }
    }

    const authorData = await Users.getData(author);
    const adderName = authorData?.name || "رابط الدعوة";

    const moment = require("moment-timezone");
    const time = moment.tz("Africa/Khartoum").format("HH:mm • DD/MM/YYYY");

    const memberCount = participantIDs.length;

    const msg =
`◆━━━━━▷ ✦ ◁━━━━━◆
❏ أهلاً بـك يا | ${nameArray.join(", ")}
❏ انضممت الآن إلى | ${threadName}
❏ تمت إضافتك بواسطة | ${adderName}
❏ ترتيبك بيننا | ${memberCount}
❏ وقت الانضمام | ${time}
❏ لا تثـق كثيـراً… فـالقلـوب تتغيّـر 🖤
◆━━━━━▷ ✦ ◁━━━━━◆`;

    return api.sendMessage({ body: msg, mentions }, threadID);

  } catch (e) {
    console.log("Join error:", e);
  }
};
