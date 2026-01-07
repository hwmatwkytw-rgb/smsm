const fs = require("fs-extra");
const path = require("path");
const { exec, execSync } = require("child_process");

module.exports.config = {
  name: "system",
  version: "6.5.0",
  hasPermssion: 2, // للمطور فقط
  credits: "Gemini AI",
  description: "لوحة تحكم كاملة للمطور: تصفح، رفع ملفات، تثبيت مكتبات، وتنفيذ أوامر ترمينال",
  commandCategory: "المطور",
  usages: "[تصفح / رفع / تثبيت / امر]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  const devID = "61581906898524"; // معرف المطور
  if (event.senderID !== devID) return api.sendMessage("❌ هذا الأمر مخصص للمطور فقط.", event.threadID);

  const body = event.body || "";
  const input = body.trim().split(/\s+/);
  const action = input[1] ? input[1].toLowerCase() : "";

  // --- [ 1. ميزة تثبيت المكتبات NPM ] ---
  if (action === "تثبيت") {
    const libName = args.join(" ");
    if (!libName) return api.sendMessage("⚠️ يرجى كتابة اسم المكتبة. مثال: system تثبيت axios", event.threadID);
    
    api.sendMessage(`⏳ جاري تثبيت المكتبة [ ${libName} ]...`, event.threadID);
    exec(`npm install ${libName}`, (error, stdout, stderr) => {
      if (error) return api.sendMessage(`❌ خطأ أثناء التثبيت:\n${error.message}`, event.threadID);
      return api.sendMessage(`✅ تم التثبيت بنجاح!\n\nالمخرجات:\n${stdout || stderr}`, event.threadID);
    });
    return;
  }

  // --- [ 2. ميزة الرفع الذكي مع اختيار المجلد ] ---
  if (action === "رفع") {
    const fileName = args[0];
    const content = body.split("\n").slice(1).join("\n");

    if (!fileName || !content) {
      return api.sendMessage("⚠️ طريقة الرفع:\nsystem [اسم_الملف.js] رفع\nثم ضع الكود في سطر جديد.", event.threadID);
    }

    const rootPath = process.cwd();
    const allFolders = getDirectories(rootPath).filter(d => !d.includes('node_modules') && !d.includes('.git'));
    allFolders.unshift(rootPath); 

    let folderList = `📥 اختر المجلد لحفظ "${fileName}":\n━━━━━━━━━━━━━━━\n`;
    allFolders.forEach((dir, index) => {
      const displayPath = path.relative(rootPath, dir) || "الرئيسي (Root)";
      folderList += `${index + 1}. 📁 /${displayPath}\n`;
    });
    folderList += `━━━━━━━━━━━━━━━\n💡 أرسل رقم المجلد المختار.`;

    return api.sendMessage(folderList, event.threadID, (err, info) => {
      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: "system",
        messageID: info.messageID,
        author: event.senderID,
        job: "SAVE_FILE_CHOICE",
        fileName: fileName,
        content: content,
        folders: allFolders
      });
    }, event.messageID);
  }

  // --- [ 3. لوحة التحكم الافتراضية (التصفح) ] ---
  return displayPanel(api, event, process.cwd());
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { body, senderID, threadID, messageID } = event;
  if (senderID != handleReply.author) return;

  if (handleReply.job === "SAVE_FILE_CHOICE") {
    const choice = parseInt(body) - 1;
    const targetPath = handleReply.folders[choice];

    if (!targetPath) return api.sendMessage("❌ اختيار غير صحيح.", threadID);

    try {
      const fullPath = path.join(targetPath, handleReply.fileName);
      fs.writeFileSync(fullPath, handleReply.content);
      api.sendMessage(`✅ تم الحفظ بنجاح!\n📍 المسار: ${path.relative(process.cwd(), fullPath)}`, threadID);
      return displayPanel(api, event, path.dirname(fullPath));
    } catch (e) {
      return api.sendMessage(`❌ فشل في الكتابة: ${e.message}`, threadID);
    }
  }

  const input = body.trim().split(/\s+/);
  const action = input[0].toLowerCase();

  try {
    if (action === "امر") {
      const cmd = body.slice(4).trim();
      const output = execSync(cmd, { encoding: 'utf-8', cwd: handleReply.dir });
      return api.sendMessage(`💻 المخرجات:\n\n${output || "✅ تم التنفيذ"}`, threadID);
    }

    if (action === "عرض") {
      const index = parseInt(input[1]) - 1;
      const file = handleReply.files[index];
      if (!file || file.isDir) return api.sendMessage("❌ اختر رقم ملف صالح.", threadID);
      const code = fs.readFileSync(path.join(handleReply.dir, file.name), "utf-8");
      return api.sendMessage(code.length > 4000 ? "⚠️ الملف كبير جداً." : `📄 محتوى ${file.name}:\n\n${code}`, threadID);
    }

    if (action === "حذف") {
      const index = parseInt(input[1]) - 1;
      const target = handleReply.files[index];
      fs.removeSync(path.join(handleReply.dir, target.name));
      api.sendMessage(`🗑️ تم الحذف: ${target.name}`, threadID);
      return displayPanel(api, event, handleReply.dir);
    }

    if (body.toLowerCase() === "رجوع") {
      return displayPanel(api, event, path.dirname(handleReply.dir));
    }

    const idx = parseInt(body) - 1;
    if (!isNaN(idx) && handleReply.files[idx] && handleReply.files[idx].isDir) {
      return displayPanel(api, event, path.join(handleReply.dir, handleReply.files[idx].name));
    }
  } catch (err) {
    api.sendMessage(`❌ حدث خطأ: ${err.message}`, threadID);
  }
};

async function displayPanel(api, event, dir) {
  try {
    const files = fs.readdirSync(dir);
    let fileDetails = files.map(f => {
      const s = fs.statSync(path.join(dir, f));
      return { name: f, isDir: s.isDirectory() };
    });
    fileDetails.sort((a, b) => b.isDir - a.isDir);

    let menu = `📂 المسار: /${path.relative(process.cwd(), dir) || "الرئيسي"}\n━━━━━━━━━━━━━━━\n`;
    fileDetails.slice(0, 40).forEach((f, i) => {
      menu += `${i + 1}. ${f.isDir ? "📁" : "📄"} ${f.name}\n`;
    });
    
    menu += `━━━━━━━━━━━━━━━\n🛠️ [الخيارات]:\n• رقم المجلد ← دخول\n• عرض [رقم]\n• حذف [رقم]\n• امر [أمر]\n• رجوع`;

    api.sendMessage(menu, event.threadID, (err, info) => {
      if (!global.client.handleReply) global.client.handleReply = [];
      global.client.handleReply.push({
        name: "system",
        messageID: info.messageID,
        author: event.senderID,
        dir: dir,
        files: fileDetails
      });
    }, event.messageID);
  } catch (e) {
    api.sendMessage("❌ خطأ: " + e.message, event.threadID);
  }
}

function getDirectories(src) {
  let list = [];
  try {
    const items = fs.readdirSync(src);
    for (let item of items) {
      const full = path.join(src, item);
      if (fs.statSync(full).isDirectory()) {
        list.push(full);
        list = list.concat(getDirectories(full));
      }
    }
  } catch (e) {}
  return list;
}
