const axios = require("axios");

module.exports.config = {
  name: "اوامر",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "انس",
  description: "قائمة الأوامر",
  commandCategory: "نظام",
  usages: "[رقم الصفحة]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: false
  }
};

module.exports.languages = {
  "en": {
    "moduleInfo": "「 %1 」",
    "user": "User",
    "adminGroup": "Admin group",
    "adminBot": "Admin bot"
  }
};

module.exports.handleEvent = function () {};

module.exports.run = async function({ api, event, args }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = (threadSetting.hasOwnProperty("PREFIX"))
    ? threadSetting.PREFIX
    : global.config.PREFIX;

  const imageUrl = "https://i.ibb.co/xWBw1y4/22ed4e077eadba33e9b9f78a64317ab9.jpg";

  // فلترة أوامر المطور
  const allCommands = Array.from(commands.values())
    .filter(cmd => cmd.config.hasPermssion !== 2);

  // تجميع حسب الفئة
  let categories = {};
  for (const cmd of allCommands) {
    const cat = cmd.config.commandCategory || "غير مصنفة";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd.config.name);
  }

  // دمج الفئات الصغيرة
  const merged = {};
  merged["متنوعة"] = [];

  for (const [cat, cmds] of Object.entries(categories)) {
    if (cmds.length < 5) {
      merged["متنوعة"].push(...cmds);
    } else {
      merged[cat] = cmds;
    }
  }

  // بناء كل فئة بشكل جميل مع فواصل
  let blocks = [];
  for (const [cat, cmds] of Object.entries(merged)) {
    let block = `【 ${cat} 】\n`;
    for (let i = 0; i < cmds.length; i += 4) {
      block += "│ " + cmds.slice(i, i + 4).join(" • ") + "\n";
    }
    block += "╰───────────────⋅⋅\n";
    blocks.push(block);
  }

  // تقسيم إلى 3 صفحات
  const pages = [[], [], []];
  blocks.forEach((b, i) => {
    pages[i % 3].push(b);
  });

  const page = Math.max(1, Math.min(3, parseInt(args[0]) || 1));
  const content = pages[page - 1].join("\n");

  let msg = "╭─⋅⋅─☾─⋅⋅─╮\n";
  msg += "  ◆ ◈ قائمة أوامر Kiros ◈ ◆\n";
  msg += "╰─⋅⋅─☾─⋅⋅─╯\n\n";

  msg += content;

  msg += `\n╭─⋅⋅─☾─⋅⋅─╮
 › إجمالي الأوامر: ${allCommands.length}
 › الصفحة: ${page}/3
 › اسم البوت: Kiros
 › المطور: ᎠᎯᏁᎢᎬᏚᎮᎯᏒᎠᎯ
 › استخدم: ${prefix}اوامر [1-3]
╰─⋅⋅─☾─⋅⋅─╯`;

  // جلب الصورة وإرسالها كمرفق
  const imgStream = (await axios.get(imageUrl, { responseType: "stream" })).data;

  return api.sendMessage(
    {
      body: msg,
      attachment: imgStream
    },
    threadID,
    messageID
  );
};
