const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

module.exports.config = {
  name: "لوحة", // الاسم الجديد للأمر
  version: "4.0.0",
  hasPermssion: 2,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "لوحة تحكم متكاملة للملفات والنظام",
  commandCategory: "المطور",
  usages: "[رقم / مسار]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  // معرف المطور الخاص بك
  const developerID = "61581906898524";
  if (event.senderID !== developerID) {
    return api.sendMessage("❌ عذراً، هذا الأمر مخصص لصاحب البوت فقط.", event.threadID, event.messageID);
  }

  const rootPath = path.resolve(__dirname, '..', '..');
  return listContent(api, event, rootPath);
};

async function listContent(api, event, currentPath) {
  try {
    const files = fs.readdirSync(currentPath);
    let items = [];
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      items.push({ name: file, path: filePath, isDir: stat.isDirectory() });
    });

    items.sort((a, b) => (b.isDir - a.isDir));

    let msg = `┏━━━━━━━┓\n┃ ⚡ 𝗗𝗘𝗩 𝗣𝗔𝗡𝗘𝗟 ⚡\n┗━━━━━━━┛\n\n`;
    msg += `📂 المسار الحالي:\n» ${path.relative(process.cwd(), currentPath) || "الرئيسي"}\n\n`;

    items.forEach((item, index) => {
      msg += `${index + 1}. ${item.isDir ? "📁" : "📄"} ${item.name}\n`;
    });

    msg += `\n━━━━━━━━━━━━━━\n`;
    msg += `🎮 [التحكم بالرد]:\n`;
    msg += `• [الرقم] ← فتح مجلد\n`;
    msg += `• عرض [الرقم] ← قراءة كود\n`;
    msg += `• تعديل [الرقم] ← استبدال كود\n`;
    msg += `• رفع [الاسم.js] ← ملف جديد\n`;
    msg += `• حذف [الرقم] ← مسح\n`;
    msg += `• امر [الأمر] ← Terminal\n`;
    msg += `━━━━━━━━━━━━━━`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: "لوحة",
        messageID: info.messageID,
        author: event.senderID,
        items: items,
        currentPath: currentPath
      });
    }, event.messageID);
  } catch (e) {
    return api.sendMessage("❌ خطأ: " + e.message, event.threadID);
  }
}

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  if (senderID != handleReply.author) return;

  const input = body.split(" ");
  const action = input[0].toLowerCase();

  if (action === "امر") {
    exec(body.slice(4), (error, stdout, stderr) => {
      if (error) return api.sendMessage(`❌ خطأ:\n${error.message}`, threadID, messageID);
      api.sendMessage(`✅ النتيجة:\n${stdout || stderr}`, threadID, messageID);
    });
    return;
  }

  if (action === "رفع") {
    const fileName = input[1];
    const content = body.split("\n").slice(1).join("\n");
    if (!fileName || !content) return api.sendMessage("⚠️ تنبيه: اكتب (رفع اسم.js) ثم سطر جديد والكود.", threadID, messageID);
    
    return api.sendMessage(`📥 اختر رقم المجلد لحفظ ( ${fileName} ) بداخله:`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: "لوحة",
        messageID: info.messageID,
        author: senderID,
        job: "CHOOSE_FOLDER",
        fileName: fileName,
        content: content,
        items: handleReply.items
      });
    }, messageID);
  }

  if (handleReply.job === "CHOOSE_FOLDER") {
    const folder = handleReply.items[parseInt(body) - 1];
    if (!folder || !folder.isDir) return api.sendMessage("❌ يجب اختيار رقم مجلد!", threadID, messageID);
    fs.writeFileSync(path.join(folder.path, handleReply.fileName), handleReply.content);
    return api.sendMessage(`✅ تم حفظ الملف في: ${folder.name}`, threadID, messageID);
  }

  if (action === "تعديل") {
    const item = handleReply.items[parseInt(input[1]) - 1];
    if (!item || item.isDir) return api.sendMessage("❌ اختر ملفاً صالحاً.", threadID, messageID);
    
    return api.sendMessage(`📝 أرسل الكود الجديد لـ: ${item.name}`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: "لوحة",
        messageID: info.messageID,
        author: senderID,
        job: "UPDATE_FILE",
        filePath: item.path
      });
    }, messageID);
  }

  if (handleReply.job === "UPDATE_FILE") {
    fs.writeFileSync(handleReply.filePath, body);
    return api.sendMessage("✅ تم تحديث الكود بنجاح!", threadID, messageID);
  }

  const index = parseInt(input[1] || input[0]) - 1;
  const item = handleReply.items[index];
  if (!item) return;

  if (action === "عرض") {
    const code = fs.readFileSync(item.path, "utf-8");
    if (code.length > 3000) {
        const tmp = path.join(__dirname, "cache", item.name);
        fs.ensureDirSync(path.join(__dirname, "cache"));
        fs.writeFileSync(tmp, code);
        return api.sendMessage({ body: `📄 الملف كبير:`, attachment: fs.createReadStream(tmp) }, threadID, () => fs.unlinkSync(tmp), messageID);
    }
    return api.sendMessage(`📝 كود: ${item.name}\n\n${code}`, threadID, messageID);
  }

  if (action === "حذف") {
    fs.removeSync(item.path);
    api.sendMessage(`🗑️ تم حذف: ${item.name}`, threadID, messageID);
    return listContent(api, event, handleReply.currentPath);
  }

  if (item.isDir && !isNaN(input[0])) {
    api.unsendMessage(handleReply.messageID);
    return listContent(api, event, item.path);
  }
};
