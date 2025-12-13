module.exports.config = {
  name: "بانكاي",
  version: "1.1",
  hasPermission: 1,
  credits: "Rako San",
  description: "طرد عضو عبر التاغ أو الرد على رسالته",
  commandCategory: "مطور",
  usages: "طرد @تاغ | أو رد على العضو",
  cooldowns: 5
};

const axios = require("axios");
const fs = require("fs");

module.exports.run = async function({ api, event, args, Users, Threads}) {
  const { threadID, messageID, senderID, mentions, messageReply} = event;

  // تحقق من صلاحية الأدمن داخل المجموعة
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  if (!isAdmin && senderID!== DEVELOPER_ID) {
    return api.sendMessage("ارقص تاني ( 𖠂_𖠂)", threadID, messageID);
  }

  let targetID = null;

  if (messageReply?.senderID) {
    targetID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  }

  // لو مافي تاق
  if (!targetID) {
    return api.sendMessage("اعمل تاق للعب عشان يتحشا 🐸💔", threadID, (err, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        author: senderID,
        threadID
      });
    }, messageID);
  }

  // لو الأدمن عمل تاق للبوت نفسه
  if (targetID === api.getCurrentUserID()) {
    return api.sendMessage("وزع ي عب مبتقدر تطردني ʕᴗᴥಡ҂ʔ", threadID, messageID);
  }

  try {
    await api.removeUserFromGroup(targetID, threadID);

    // إرسال الصورة مع الرسالة بعد الطرد مباشرة
    const imageUrl = "https://i.ibb.co/dwvYh0Yz/3098e2fb48d8ac91fe240de5ba4ff977.jpg";
    const path = __dirname + "/temp_ban.jpg";
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

    api.sendMessage({
      body: "تم تنفيذ حكم الاعدام 🐸☝🏿",
      attachment: fs.createReadStream(path)
    }, threadID, messageID);

    // ✅ إزالة حذف الصورة لتبقى موجودة

  } catch (err) {
    console.error("❌ فشل في طرد العضو:", err.message);
    api.sendMessage("⚠️ ما قدرت أطرد العضو، تحقق من صلاحيات البوت.", threadID, messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply}) {
  const { threadID, messageID, senderID, messageReply} = event;

  // تحقق أن الرد من نفس الأدمن
  if (senderID !== handleReply.author || threadID !== handleReply.threadID) return;

  const targetID = messageReply?.senderID;
  if (!targetID) return;

  // لو الأدمن رد على رسالة البوت نفسها (يحاول يطرده)
  if (targetID === api.getCurrentUserID()) {
    return api.sendMessage("وزع يمعاق مبتقدر تطردني ʕᴗᴥಡ҂ʔ", threadID, messageID);
  }

  try {
    await api.removeUserFromGroup(targetID, threadID);

    // إرسال الصورة مع الرسالة بعد الطرد مباشرة
    const imageUrl = "https://i.ibb.co/dwvYh0Yz/3098e2fb48d8ac91fe240de5ba4ff977.jpg";
    const path = __dirname + "/temp_ban.jpg";
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

    api.sendMessage({
      body: "تم تنفيذ حكم الاعدام 🐸☝🏿",
      attachment: fs.createReadStream(path)
    }, threadID, messageID);

    // ✅ الصورة تبقى موجودة ولا نحذفها

  } catch (err) {
    console.error("❌ فشل في طرد العضو:", err.message);
    api.sendMessage("⚠️ ما قدرت أطرد العضو، تحقق من صلاحيات البوت.", threadID, messageID);
  }
};
