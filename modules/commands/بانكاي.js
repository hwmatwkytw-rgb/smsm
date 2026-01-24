const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "بانكاي",
  version: "1.5",
  hasPermission: 1,
  credits: "Rako San",
  description: "طرد عضو عبر التاغ أو الرد بكلمة بانكاي",
  commandCategory: "مطور",
  usages: "بانكاي @تاغ | أو رد بكلمة بانكاي",
  cooldowns: 5
};

const DEVELOPER_ID = "61581906898524";

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    
    // 1. التحقق من صلاحية المستخدم (أدمن أو مطور)
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    if (!isAdmin && senderID !== DEVELOPER_ID) {
      return api.sendMessage("ارقص تاني ( 𖠂_𖠂)", threadID, messageID);
    }

    // 2. التحقق من صلاحية البوت (هل هو أدمن؟)
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
    if (!isBotAdmin) {
      return api.sendMessage("ارفع ابوك دا ادمن اول 🐢", threadID, messageID);
    }

    let targetID = null;

    // 3. تحديد الهدف (عبر الرد أو التاغ)
    if (messageReply && messageReply.senderID) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    }

    // 4. إذا لم يتم تحديد هدف
    if (!targetID) {
      return api.sendMessage("اعمل تاق للعب او رد على رسالتو 🐢", threadID, messageID);
    }

    // 5. منع طرد البوت لنفسه
    if (targetID === botID) {
      return api.sendMessage("وزع ي عب مبتقدر تطردني ʕᴗᴥdad҂ʔ", threadID, messageID);
    }

    // تنفيذ الطرد
    await api.removeUserFromGroup(targetID, threadID);

    // إرسال الصورة والرسالة
    const imageUrl = "https://i.ibb.co/dwvYh0Yz/3098e2fb48d8ac91fe240de5ba4ff977.jpg";
    const path = __dirname + `/cache/bankai_${targetID}.jpg`;

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(path, Buffer.from(response.data, "binary"));

    api.sendMessage({
      body: "تم تنفيذ حكم الاعدام 🐸☝🏿",
      attachment: fs.createReadStream(path)
    }, threadID, messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ حدث خطأ، تأكد من إعدادات المجموعة.", threadID, messageID);
  }
};
