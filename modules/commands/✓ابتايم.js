module.exports.config = {
  name: "ابتايم",
  version: "1.4.0",
  hasPermssion: 0,
  credits: "Mustapha",
  description: "إحصائيات النظام ستايل V6 العربي",
  commandCategory: "النظام",
  usages: "ابتايم",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, Users }) {
  const moment = require("moment-timezone");

  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  const threads = await api.getThreadList(100, null, ["INBOX"]);
  const groupCount = threads.filter(t => t.isGroup).length;
  const allUsers = await Users.getAll();
  const userCount = allUsers.length;

  const time = moment.tz("Africa/Khartoum").format("HH:mm:ss");
  const date = moment.tz("Africa/Khartoum").format("YYYY/MM/DD");

  const message = `
╭─── · · 🛠️ · · ───╮

      الـنـظـام · ─── · · ──╯
     

┌ 📂 الـمـعـلـومـات
│ • الـتـشـغـيـل : ${h}س ${m}د ${s}ث
│ • الـمـسـتـخـدمـيـن : ${userCount.toLocaleString()}
│ • الـمـجـمـوعـات : ${groupCount.toLocaleString()}
└───────────────┈

┌ 🕒 الـتـوقـيـت
│ • الـوقـت : ${time}
│ • الـتـاريـخ : ${date}
└───────────────┈

「 جـلـسـة نـشـطـة 」
`.trim();

  return api.sendMessage(message, event.threadID, event.messageID);
};
