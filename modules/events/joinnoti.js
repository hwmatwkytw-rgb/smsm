module.exports.config = {
  name: "joinNoti",
  eventType: ["log:subscribe"],
  version: "1.0.1",
  credits: "Mirai Team | تعديل: ᎠᎯᏁᎢᎬ  ᏚᎮᎯᏒᎠᎯ",
  description: "إشعار انضمام البوت أو عضو",
  dependencies: {
    "fs-extra": "",
    "moment-timezone": ""
  }
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID } = event;

  // ====== 🟦 انضمام البوت ======
  if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {

    api.changeNickname(
      `[ / ] • ${global.config.BOTNAME || "KYROS BOT"}`,
      threadID,
      api.getCurrentUserID()
    );

    const botMsg =
`╭─▸💠  تم تفعيل البوت بنجاح  💠◂─╮
│
│ ➤ اسم البوت  : ${global.config.BOTNAME || "KYROS BOT"}
│ ➤ الإصدار     : 〘3.7.0〙
│ ➤ عدد الأوامر : 〘${global.client.commands.size}〙
│ ➤ البادئة     : 〘 / 〙
│ ➤ المطور      : ᎠᎯᏁᎢᎬ  ᏚᎮᎯᏒᎠᎯ
│
│ ✦ استمتع باستخدام البوت وتأكد من استكشاف جميع الأوامر!
╰─────────────────────`;

    return api.sendMessage(botMsg, threadID);
  }

  // ====== 🟨 انضمام عضو ======
  try {
    const { threadName, participantIDs } = await api.getThreadInfo(threadID);

    const nameArray = [];
    const mentions = [];
    let i = 0;

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
      i++;
    }

    const authorData = await Users.getData(event.author);
    const adderName = authorData?.name || "رابط الدعوة";

    const moment = require("moment-timezone");
    const time = moment.tz("Africa/Khartoum").format("HH:mm • DD/MM/YYYY");

    const memberCount = participantIDs.length;

    const msg =
`◇───✧ ◈ ✧───◇
❏ أهلاً بك | ${nameArray.join(", ")}
❏ انضممت الآن إلى | ${threadName}
❏ تمت إضافتك بواسطة | ${adderName}
❏ ترتيبك بيننا | ${memberCount}
❏ وقت الانضمام | ${time}
❏ 🤲 بارك الله لك في هذه المجموعة وجعلها مليئة بالخيرات
◇───✧ ◈ ✧───◇`;

    return api.sendMessage({ body: msg, mentions }, threadID);

  } catch (e) {
    console.log("Join error:", e);
  }
};
