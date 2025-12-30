module.exports.config = {
  name: "ابتايم",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Mustapha",
  description: "عرض وقت تشغيل البوت",
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

  const currentTime = moment
    .tz("Africa/Algiers")
    .format("YYYY-MM-DD | HH:mm:ss");

  const message = `
╭─「 🤖 Bot Uptime 」─╮

⏳ Runtime
• ${hours}h ${minutes}m ${seconds}s

👥 Groups
• ${groupCount}

👤 Users
• ${userCount}

🕒 Time
• ${currentTime}

╰──────────────╯
`;

  api.sendMessage(message, event.threadID, event.messageID);
};
