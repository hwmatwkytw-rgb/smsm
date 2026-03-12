module.exports.config = {
  name: "المجموعات",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Gemini",
  description: "عرض المجموعات والمغادرة (خاص بالمطور فقط)",
  commandCategory: "المطور",
  usages: "[رقم المجموعة]",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const developerID = "100081948980908";
  if (String(event.senderID) !== developerID) return;

  const { body, threadID, messageID } = event;
  const index = parseInt(body);
  
  if (isNaN(index) || index <= 0 || index > handleReply.groupList.length) {
    return api.sendMessage("❌ يرجى إدخال رقم صحيح من القائمة.", threadID, messageID);
  }

  const groupExit = handleReply.groupList[index - 1];
  
  api.removeUserFromGroup(api.getCurrentUserID(), groupExit.threadID, (err) => {
    if (err) return api.sendMessage(`❌ فشل في مغادرة المجموعة: ${groupExit.name}`, threadID, messageID);
    return api.sendMessage(`✅ تم الخروج بنجاح من المجموعة:\n◈ ${groupExit.name}`, threadID, messageID);
  });
};

module.exports.run = async function({ api, event }) {
  const developerID = "100081948980908";
  if (String(event.senderID) !== developerID) {
    return api.sendMessage("⚠️ هذا الأمر مخصص للمطور فقط.", event.threadID);
  }

  try {
    const list = await api.getThreadList(100, null, ["INBOX"]);
    const groupList = list.filter(group => group.isGroup && group.isSubscribed);
    
    let msg = `╭─── • ◈ • ───╮\n`;
    msg += `   إدارة الـمـجـمـوعـات 🌐\n`;
    msg += `╰─── • ◈ • ───╯\n\n`;
    
    let i = 1;
    for (const group of groupList) {
      msg += `【 ${i++} 】 ◈ ${group.name}\n`;
      msg += `• 🆔: [ ${group.threadID} ]\n`;
      msg += `• 👥: [ ${group.participantIDs.length} ] أعضاء\n`;
      msg += `──────────────\n`;
    }

    msg += `✅ إجمالي المجموعات: ${groupList.length}\n`;
    msg += `⚠️ للـمـغـادرة: رد على هذه الرسالة بـ (رقم المجموعة)`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        groupList: groupList
      });
    }, event.messageID);
    
  } catch (error) {
    return api.sendMessage("❌ حدث خطأ أثناء جلب القائمة.", event.threadID);
  }
};
