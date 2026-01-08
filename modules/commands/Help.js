module.exports.config = {
  name: "اوامر",
  version: "1.0.6",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "قائمة الأوامر بشكل منسق وحاد",
  commandCategory: "نظام",
  usages: "[رقم الصفحة]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: false,
    delayUnsend: 20
  }
};

module.exports.languages = {
  "en": {
    "moduleInfo": "┏━━━━━━  📋  ━━━━━━┓\n\n  ▸ الاسم: %1\n  ▸ الوصف: %2\n  ▸ الاستخدام: %3\n  ▸ الفئة: %4\n  ▸ الانتظار: %5 ثانية\n  ▸ الصلاحية: %6\n\n┗━━━━━━  👑  ━━━━━━┛",
    "helpList": '[ يوجد %1 أمر في هذا البوت ]',
    "user": "المستخدم",
    "adminGroup": "مشرف المجموعة",
    "adminBot": "مطور البوت"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const fs = require("fs");
  const axios = require("axios");
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const image = (await axios.get("https://i.ibb.co/Vcsqzf4T/22ed4e077eadba33e9b9f78a64317ab9.jpg", { responseType: "stream" })).data;

  const command = commands.get((args[0] || "").toLowerCase());
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (!command) {
    const categories = {};
    for (let [name, value] of commands) {
      if (value.config.commandCategory?.toLowerCase() === "مطور" || 
          value.config.commandCategory === "المطور" || 
          value.config.hasPermssion == 2) continue;
      
      const cat = value.config.commandCategory || "عام";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    let blocks = [];
    for (let cat in categories) {
      const cmds = categories[cat].sort();
      let block = `  ┌──────────────┐\n`;
      block += `     [ ${cat.toUpperCase()} ]\n`;
      block += `  └──────────────┘\n`;
      block += `   ${cmds.join("  |  ")}\n`;
      blocks.push(block);
    }

    const totalPages = 2;
    const numPerPage = Math.ceil(blocks.length / totalPages);
    const page = parseInt(args[0]) || 1;

    if (page < 1 || page > totalPages)
      return api.sendMessage(`⚠️ القائمة متوفرة في صفحتين فقط (1-2)`, threadID, messageID);

    const start = (page - 1) * numPerPage;
    const finalBlocks = blocks.slice(start, start + numPerPage).join("\n\n");

    const msg = 
`┎━━━━━━━━━━━━━━━━━┒
    𝗞𝗔𝗜𝗥𝗢𝗦 𝗦𝗬𝗦𝗧𝗘𝗠 𝗠𝗘𝗡𝗨
┖━━━━━━━━━━━━━━━━━┚

${finalBlocks}

  ■ إجمالي الأوامر : [ ${commands.size} ]
  ■ رقم الصفحة    : [ ${page} / ${totalPages} ]
  ■ المطور        : ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ

┎━━━━━━━━━━━━━━━━━┒
    ${page === 1 ? "اللهم صلِّ وسلم على نبينا محمد ﷺ" : "اكتب " + prefix + "اوامر [اسم الأمر] للتفاصيل"}
┖━━━━━━━━━━━━━━━━━┚`;

    return api.sendMessage(
      { body: msg, attachment: image },
      threadID
    );
  }

  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      command.config.description,
      `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`,
      command.config.commandCategory,
      command.config.cooldowns,
      (command.config.hasPermssion == 0)
        ? getText("user")
        : (command.config.hasPermssion == 1)
        ? getText("adminGroup")
        : getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};
