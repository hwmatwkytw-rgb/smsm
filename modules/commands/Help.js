module.exports.config = {
  name: "اوامر",
  version: "9.5.0",
  hasPermssion: 0,
  credits: "ᎠᎯᏁᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "قائمة أوامر حديثة بنمط هندسي رفيع لبوت ڪايࢪوس",
  commandCategory: "نظام",
  usages: "[رقم الصفحة / اسم الأمر]",
  cooldowns: 5
};

module.exports.languages = {
  "en": {
    "moduleInfo": "─── ◈ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ◈ ───\n\n⋄ الاسم: %1\n⋄ الوصف: %2\n⋄ الاستخدام: %3\n⋄ الفئة: %4\n⋄ الانتظار: %5s\n⋄ الصلاحية: %6\n\n◈ Credits: %7",
    "user": "مستخدم",
    "adminGroup": "مشرف",
    "adminBot": "مطور"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const axios = require("axios");
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const imageUrl = "https://i.ibb.co/Vcsqzf4T/22ed4e077eadba33e9b9f78a64317ab9.jpg";
  const command = commands.get((args[0] || "").toLowerCase());
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (!command) {
    const categories = {};
    for (let [name, value] of commands) {
      if (value.config.hasPermssion == 2 || value.config.commandCategory?.toLowerCase() === "مطور") continue;
      const cat = value.config.commandCategory || "General";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    let sections = [];
    for (let cat in categories) {
      const cmds = categories[cat].sort();
      let section = `⌬ ── [ ${cat.toUpperCase()} ]\n`;
      section += `┊ ➟ ${cmds.join("  •  ")}\n`;
      sections.push(section);
    }

    const totalPages = 3;
    const itemsPerPage = Math.ceil(sections.length / totalPages);
    let page = parseInt(args[0]) || 1;
    if (page < 1 || page > totalPages) page = 1;

    const start = (page - 1) * itemsPerPage;
    const displaySections = sections.slice(start, start + itemsPerPage).join("┊\n");

    const msg = 
`『 ᴋᴀɪʀᴏs ᴄᴏᴍᴍᴀɴᴅs 』
─── · · · ───

${displaySections}

─── · · · ───
◈ الأوامر: ${commands.size}
◈ الصفحة: ${page} / ${totalPages}
◈ الرمز: ${prefix}
─── · · · ───
🤖 اسم البوت: ڪايࢪوس
👑 المطوࢪ: ᎠᎯᏁᎢᎬ ᏚᎮᎯᏒᎠᎯ
✨ اللهم صلِّ وسلم على سيدنا محمد 🤍🍂`;

    try {
      const image = (await axios.get(imageUrl, { responseType: "stream" })).data;
      return api.sendMessage({ body: msg, attachment: image }, threadID);
    } catch (e) {
      return api.sendMessage(msg, threadID);
    }
  }

  return api.sendMessage(
    getText("moduleInfo", command.config.name, command.config.description, `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`, command.config.commandCategory, command.config.cooldowns, (command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot"), command.config.credits),
    threadID,
    messageID
  );
};
