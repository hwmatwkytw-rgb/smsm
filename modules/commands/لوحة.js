const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

module.exports.config = {
  name: "لوحة",
  version: "4.5.0",
  hasPermssion: 2,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "لوحة تحكم احترافية للملفات والأوامر",
  commandCategory: "المطور",
  usages: "[تصفح / رفع / تعديل / امر]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const developerID = "61581906898524"; 
  if (event.senderID !== developerID) {
    return api.sendMessage("❌ عذراً، هذا الأمر مخصص للمطور فقط.", event.threadID, event.messageID);
  }

  // البدء من مجلد البوت الرئيسي
  const rootPath = process.cwd();
  return listContent(api, event, rootPath);
};

async function listContent(api, event, currentPath) {
  try {
    const files = fs.readdirSync(currentPath);
    let items = [];
    
    files.forEach(file => {
      try {
        const filePath = path.join(currentPath, file);
        const stat = fs.statSync(filePath);
        items.push({ name: file, path: filePath, isDir: stat.isDirectory() });
      } catch (e) { /* تجاهل الملفات المحمية */ }
    });

    items.sort((a, b) => (b.isDir - a.isDir));

    let msg = `🛠️ [ 𝗗𝗘𝗩 𝗣𝗔𝗡𝗘𝗟 - 𝗩𝟰.𝟱 ]\n`;
    msg += `📂 المسار: /${path.relative(process.cwd(), currentPath) || "الرئيسي"}\n`;
    msg += `━━━━━━━━━━━━━━━\n`;

    items.forEach((item, index) => {
      msg += `${index + 1}. ${item.isDir ? "📁" : "📄"} ${item.name}\n`;
    });

    msg += `━━━━━━━━━━━━━━━\n`;
    msg += `💡 [طريقة الاستخدام]:\n`;
    msg += `• [الرقم] ← دخول مجلد\n`;
    msg += `• عرض [الرقم] ← قراءة ملف\n`;
    msg += `• تعديل [الرقم] ← استبدال محتوى\n`;
    msg += `• رفع [الاسم.js] ← ملف جديد\n`;
    msg += `• حذف [الرقم] ← إزالة\n`;
    msg += `• امر [Command] ← تنفيذ Terminal\n`;
    msg += `• رجوع ← المجلد السابق\n`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        items: items,
        currentPath: currentPath
      });
    }, event.messageID);
  } catch (e) {
    return api.sendMessage("❌ خطأ في الوصول: " + e.message, event.threadID);
  }
}

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  if (senderID != handleReply.author) return;

  const input = body.trim().split(/\s+/);
  const action = input[0].toLowerCase();

  // --- [ 1. تنفيذ أوامر Terminal ] ---
  if (action === "امر") {
    const command = body.slice(4).trim();
    if (!command) return api.sendMessage("⚠️ اكتب الأمر المراد تنفيذه.", threadID, messageID);
    
    // التنفيذ في المسار الحالي الذي يتصفحه المطور
    exec(command, { cwd: handleReply.currentPath }, (error, stdout, stderr) => {
      if (error) return api.sendMessage(`❌ خطأ:\n${error.message}`, threadID, messageID);
      const output = stdout || stderr || "✅ تم التنفيذ بنجاح (بدون مخرجات).";
      api.sendMessage(`💻 المخرجات:\n\n${output}`, threadID, messageID);
    });
    return;
  }

  // --- [ 2. رفع ملف جديد ] ---
  if (action === "رفع") {
    const fileName = input[1];
    const content = body.split("\n").slice(1).join("\n");
    if (!fileName) return api.sendMessage("⚠️ استخدم: رفع [اسم_الملف]\nثم ضع الكود في سطر جديد.", threadID, messageID);
    
    let folderMsg = `📥 حدد رقم المجلد الذي تريد حفظ "${fileName}" بداخله:\n\n`;
    const foldersOnly = handleReply.items.filter(i => i.isDir);
    
    // إضافة خيار "هنا" لحفظه في المسار الحالي
    folderMsg += `0. 📍 [المجلد الحالي]\n`;
    foldersOnly.forEach((f, i) => folderMsg += `${i + 1}. 📁 ${f.name}\n`);

    return api.sendMessage(folderMsg, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        job: "SAVE_FILE_LOCATION",
        fileName: fileName,
        content: content,
        currentPath: handleReply.currentPath,
        folders: foldersOnly
      });
    }, messageID);
  }

  if (handleReply.job === "SAVE_FILE_LOCATION") {
    const choice = parseInt(body);
    let targetPath;

    if (choice === 0) {
      targetPath = path.join(handleReply.currentPath, handleReply.fileName);
    } else {
      const selectedFolder = handleReply.folders[choice - 1];
      if (!selectedFolder) return api.sendMessage("❌ اختيار غير صحيح.", threadID, messageID);
      targetPath = path.join(selectedFolder.path, handleReply.fileName);
    }

    fs.writeFileSync(targetPath, handleReply.content || "// ملف فارغ");
    api.sendMessage(`✅ تم الرفع بنجاح في:\n${targetPath}`, threadID, messageID);
    return listContent(api, event, handleReply.currentPath);
  }

  // --- [ 3. تعديل ملف ] ---
  if (action === "تعديل") {
    const item = handleReply.items[parseInt(input[1]) - 1];
    if (!item || item.isDir) return api.sendMessage("❌ اختر رقم ملف صالح.", threadID, messageID);
    
    return api.sendMessage(`📝 أرسل الكود الجديد لـ: ${item.name}\n(سيتم استبدال المحتوى بالكامل)`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        job: "UPDATE_FILE_CONTENT",
        filePath: item.path,
        currentPath: handleReply.currentPath
      });
    }, messageID);
  }

  if (handleReply.job === "UPDATE_FILE_CONTENT") {
    fs.writeFileSync(handleReply.filePath, body);
    api.sendMessage("✅ تم التعديل بنجاح!", threadID, messageID);
    return listContent(api, event, handleReply.currentPath);
  }

  // --- [ 4. عرض محتوى ملف ] ---
  if (action === "عرض") {
    const item = handleReply.items[parseInt(input[1]) - 1];
    if (!item || item.isDir) return api.sendMessage("❌ اختر ملفاً صالحاً.", threadID, messageID);
    
    const code = fs.readFileSync(item.path, "utf-8");
    if (code.length > 3500) {
        const tmpPath = path.join(__dirname, "cache", `view_${item.name}`);
        fs.ensureDirSync(path.dirname(tmpPath));
        fs.writeFileSync(tmpPath, code);
        return api.sendMessage({ body: `📄 الملف كبير جداً، تم إرساله كملف:`, attachment: fs.createReadStream(tmpPath) }, threadID, () => fs.unlinkSync(tmpPath), messageID);
    }
    return api.sendMessage(`📄 محتوى: ${item.name}\n\n${code}`, threadID, messageID);
  }

  // --- [ 5. حذف ملف/مجلد ] ---
  if (action === "حذف") {
    const item = handleReply.items[parseInt(input[1]) - 1];
    if (!item) return api.sendMessage("❌ رقم غير موجود.", threadID, messageID);
    
    fs.removeSync(item.path);
    api.sendMessage(`🗑️ تم الحذف: ${item.name}`, threadID, messageID);
    return listContent(api, event, handleReply.currentPath);
  }

  // --- [ 6. التنقل بين المجلدات ] ---
  if (body.toLowerCase() === "رجوع") {
    const parentPath = path.dirname(handleReply.currentPath);
    api.unsendMessage(handleReply.messageID);
    return listContent(api, event, parentPath);
  }

  const index = parseInt(body) - 1;
  const selected = handleReply.items[index];
  if (selected && selected.isDir) {
    api.unsendMessage(handleReply.messageID);
    return listContent(api, event, selected.path);
  }
};
