module.exports.config = {
  name: "اوامر",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "قائمة الأوامر صفحتين فقط مع فلترة الكلمات البذيئة",
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
    "moduleInfo": "「 %1 」\n%2\n\n❯ الاستخدام: %3\n❯ الفئة: %4\n❯ وقت الانتظار: %5 ثانية\n❯ الصلاحية: %6\n\n» كود الأداة بواسطة %7 «",
    "user": "المستخدم",
    "adminGroup": "مشرف المجموعة",
    "adminBot": "مطور البوت"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const axios = require("axios");
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const image = (await axios.get("https://i.ibb.co/Vcsqzf4T/22ed4e077eadba33e9b9f78a64317ab9.jpg", { responseType: "stream" })).data;

  // قائمة الكلمات المحظورة (الأوامر البذيئة)
  const blacklistedWords = ["قحبة", "زب", "كس", "منيوك"]; 

  const commandArg = (args[0] || "").toLowerCase();
  const command = commands.get(commandArg);
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (command) {
    // منع عرض تفاصيل الأوامر البذيئة حتى لو تم كتابة اسمها
    if (blacklistedWords.some(word => command.config.name.includes(word))) {
        return api.sendMessage("⚠️ هذا الأمر غير متوفر أو تم حظره.", threadID, messageID);
    }
    return api.sendMessage(
      getText(
        "moduleInfo",
        command.config.name,
        command.config.description,
        `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`,
        command.config.commandCategory,
        command.config.cooldowns,
        (command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot"),
        command.config.credits
      ),
      threadID,
      messageID
    );
  }

  const categories = {};
  for (let [name, value] of commands) {
    // 1. إخفاء أوامر المطور (صلاحية 2 فأكثر)
    if (value.config.hasPermssion >= 2) continue;
    
    // 2. فلترة الأوامر البذيئة
    if (blacklistedWords.some(word => name.includes(word))) continue;

    const cat = value.config.commandCategory || "عام";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(name);
  }

  const sortedCategories = Object.keys(categories).sort();
  let blocks = [];

  for (let cat of sortedCategories) {
    const cmds = categories[cat].sort();
    let block = `   乂──『 ${cat.toUpperCase()} 』──乂\n\n`;
    block += `${cmds.join("  •  ")}\n\n`;
    block += `   ───────────────`;
    blocks.push(block);
  }

  // إجبار النظام على صفحتين فقط
  const totalPages = 2;
  const itemsPerPage = Math.ceil(blocks.length / totalPages); // تقسيم الفئات على 2 بالتساوي
  
  let page = parseInt(args[0]) || 1;
  if (page < 1 || page > totalPages) page = 1;

  const start = (page - 1) * itemsPerPage;
  const finalBlocks = blocks.slice(start, start + itemsPerPage).join("\n\n");

  const msg = `─⇄〖 ⤹   𝗞𝗔𝗜𝗥𝗢𝗦 𝗕𝗢𝗧 ⇊ 〗⇄─╮\n\n${finalBlocks}\n\n📌 المجموع: [ ${commands.size} ] أمر\n💡 استخدم ${prefix}اوامر [اسم الأمر]\n👑 المطور: ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ\n\n📖 الصفحة [ ${page} / ${totalPages} ]\n╰───────────╯`;

  return api.sendMessage(
    { body: msg, attachment: image },
    threadID,
    messageID
  );
};
