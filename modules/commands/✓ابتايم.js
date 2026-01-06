module.exports.config = {
  name: "ابتايم",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mustapha",
  description: "عرض إحصائيات النظام",
  commandCategory: "النظام",
  usages: "ابتايم",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, Users }) {
  const moment = require("moment-timezone");

  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const threads = await api.getThreadList(100, null, ["INBOX"]);
  const groupCount = threads.filter(t => t.isGroup).length;
  const allUsers = await Users.getAll();
  const userCount = allUsers.length;

  const currentTime = moment.tz("Africa/Algiers").format("HH:mm:ss");
  const currentDate = moment.tz("Africa/Algiers").format("DD/MM/YYYY");

  const message = `
⦿──────────────⦿
    ✦ نـشـاط الـنـظـام ✦
⦿──────────────⦿

● الـتـشـغـيـل » ${hours}h:${minutes}m:${seconds}s
● الـمـجـموعات » ${groupCount}
● الـمـسـتخدمين » ${userCount}
● الـتـوقـيـت » ${currentTime}
● الـتـاريـخ » ${currentDate}

⦿──────────────⦿
`;

  api.sendMessage(message, event.threadID, event.messageID);
};
