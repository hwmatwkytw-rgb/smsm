const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const moment = require("moment-timezone");
const { exec } = require("child_process");
const admZip = require("adm-zip");

module.exports.config = {
  name: "shell",
  version: "11.0.0",
  hasPermssion: 2, // للمطور فقط
  credits: "Gemini",
  description: "نظام إدارة السيرفر والترمينال المتكامل V11 - التحكم المطلق",
  commandCategory: "المطور",
  usages: "shell",
  cooldowns: 0
};

// الآيدي الخاص بك الذي زودتني به
const adminID = "61581906898524";

module.exports.run = async function ({ api, event }) {
  // التحقق من الهوية لضمان الأمان المطلق
  if (event.senderID !== adminID) {
    return api.sendMessage("❌ الوصول مرفوض. هذا الأمر مخصص لمطور النظام فقط.", event.threadID);
  }
  // البدء من مجلد البوت الرئيسي
  return listFiles(api, event, process.cwd());
};

async function listFiles(api, event, targetPath) {
  try {
    const files = fs.readdirSync(targetPath);
    const time = moment.tz("Africa/Khartoum").format("HH:mm:ss");
    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    
    let msg = `『 𝐒𝐘𝐒𝐓𝐄𝐌 𝐂𝐎𝐍𝐓𝐑𝐎𝐋 𝐕𝟏𝟏 』\n`;
    msg += `─━━━━━━⊱⚙️⊰━━━━━━─\n`;
    msg += `📊 RAM: ${ram}MB | ⏰ ${time}\n`;
    msg += `📂 المسار: ${targetPath}\n`;
    msg += `─━━━━━━⊱༻⊰━━━━━━─\n\n`;
    
    files.forEach((f, i) => {
      const stats = fs.statSync(path.join(targetPath, f));
      const icon = stats.isDirectory() ? "📁" : (f.endsWith(".zip") ? "📦" : "📄");
      msg += `[${i + 1}] ${icon} ${f}\n`;
    });

    msg += `\n─━━━━━━⊱༻⊰━━━━━━─\n`;
    msg += `⌨️ [تيرم + أمر] لتنفيذ أوامر الترمينال\n`;
    msg += `📦 [فك + رقم] لفك ضغط ZIP\n`;
    msg += `🚀 [تشغيل + رقم] لتشغيل ملف JS\n`;
    msg += `🗑️ [حذف رقم] | 📥 [تحميل رقم]\n`;
    msg += `📤 [رفع] (أرفق ملفاً مع الرد)\n`;
    msg += `📝 [تعديل رقم كود] | ⬅️ [رجوع]\n`;
    msg += `─━━━━━━⊱⚙️⊰━━━━━━─`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
      if (global.client && global.client.handleReply) {
        global.client.handleReply.push({
          name: this.config.name,
          messageID: info.messageID,
          author: event.senderID,
          currentPath: targetPath,
          files: files
        });
      }
    }, event.messageID);
  } catch (e) {
    return api.sendMessage(`❌ خطأ في النظام: ${e.message}`, event.threadID);
  }
}

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { body, threadID, senderID, attachments } = event;
  if (senderID !== adminID) return;

  const { currentPath, files } = handleReply;
  const args = body.split(" ");
  const command = args[0].toLowerCase();

  try {
    // 1. ميزة الترمينال (Terminal Mode)
    if (command === "تيرم" || command === "cmd") {
      const fullCommand = body.slice(command.length).trim();
      exec(fullCommand, { cwd: currentPath }, (err, stdout, stderr) => {
        if (err) return api.sendMessage(`❌ فشل:\n${err.message}`, threadID);
        api.sendMessage(`✅ المخرجات:\n\n${stdout || stderr || "تم التنفيذ بنجاح (بدون مخرجات)"}`, threadID);
      });
      return;
    }

    // 2. فك الضغط (Unzip)
    if (command === "فك") {
      const index = parseInt(args[1]) - 1;
      const file = files[index];
      if (!file || !file.endsWith(".zip")) return api.sendMessage("❌ اختر ملف ZIP.", threadID);
      const zip = new admZip(path.join(currentPath, file));
      zip.extractAllTo(currentPath, true);
      api.sendMessage(`✅ تم فك ${file}.`, threadID);
      return listFiles(api, event, currentPath);
    }

    // 3. التعديل (Edit Content)
    if (command === "تعديل") {
      const index = parseInt(args[1]) - 1;
      const newCode = body.split(" ").slice(2).join(" ");
      fs.writeFileSync(path.join(currentPath, files[index]), newCode);
      api.sendMessage("✅ تم الحفظ بنجاح.", threadID);
      return listFiles(api, event, currentPath);
    }

    // 4. الرفع (Upload)
    if (command === "رفع") {
      if (!attachments || attachments.length === 0) return api.sendMessage("⚠️ أرسل ملفاً مع كلمة رفع.", threadID);
      const res = await axios.get(attachments[0].url, { responseType: "arraybuffer" });
      fs.writeFileSync(path.join(currentPath, attachments[0].filename), Buffer.from(res.data));
      return listFiles(api, event, currentPath);
    }

    // 5. التحميل والحذف والرجوع
    if (command === "تحميل") {
      const target = path.join(currentPath, files[parseInt(args[1]) - 1]);
      return api.sendMessage({ attachment: fs.createReadStream(target) }, threadID);
    }

    if (command === "حذف") {
      fs.removeSync(path.join(currentPath, files[parseInt(args[1]) - 1]));
      return listFiles(api, event, currentPath);
    }
    
    if (command === "رجوع") return listFiles(api, event, path.dirname(currentPath));

    // التنقل والدخول للملفات
    const index = parseInt(body) - 1;
    if (!isNaN(index) && files[index]) {
      const target = path.join(currentPath, files[index]);
      if (fs.statSync(target).isDirectory()) return listFiles(api, event, target);
      const content = fs.readFileSync(target, "utf-8");
      return api.sendMessage(`📄 ${files[index]}:\n\n${content.slice(0, 1800)}`, threadID);
    }

  } catch (e) {
    api.sendMessage(`❌ خطأ: ${e.message}`, threadID);
  }
};
