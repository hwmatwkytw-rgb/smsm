const { exec } = require("child_process");
const os = require("os");

module.exports.config = {
  name: "شيل",
  version: "1.1.0",
  hasPermssion: 2, 
  credits: "Anas",
  description: "نظام إدارة السيرفر عن بعد للمطور",
  commandCategory: "المطور",
  usages: "[الأمر أو الاختصار]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  // معرف المطور الخاص بك
  const developerID = "61581906898524"; 
  
  // التحقق من الهوية
  if (event.senderID !== developerID) {
    return api.sendMessage("🚫 خطأ: الوصول مرفوض. هذا الأمر مخصص لمالك البوت فقط.", event.threadID, event.messageID);
  }

  let command = args.join(" ");
  
  if (!command) {
    return api.sendMessage("📖 قائمة اختصارات المطور:\n\n1. شيل stats (حالة السيرفر)\n2. شيل ls (عرض الملفات)\n3. شيل git pull (تحديث الكود)\n4. شيل [أي أمر لينكس]", event.threadID, event.messageID);
  }

  // --- أوامر جانبية مدمجة (الاختصارات) ---
  
  if (command.toLowerCase() === "stats") {
    const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const totalMemory = os.totalmem() / 1024 / 1024 / 1024;
    const freeMemory = os.freemem() / 1024 / 1024 / 1024;
    
    return api.sendMessage(
      `🖥️ **إحصائيات السيرفر السريعة:**\n\n` +
      `🔹 استهلاك البوت: ${usedMemory.toFixed(2)} MB\n` +
      `🔹 الرام الكلي: ${totalMemory.toFixed(2)} GB\n` +
      `🔹 الرام المتاح: ${freeMemory.toFixed(2)} GB\n` +
      `🔹 المعالج: ${os.cpus()[0].model}\n` +
      `🔹 النظام: ${os.type()} ${os.release()}`, 
      event.threadID
    );
  }

  if (command.toLowerCase() === "clean") {
    command = "npm cache clean --force";
    api.sendMessage("🧹 جاري تنظيف الكاش...", event.threadID);
  }

  // --- تنفيذ الأوامر العامة ---

  exec(command, (error, stdout, stderr) => {
    if (error) {
      return api.sendMessage(`❌ فشل التنفيذ:\n\`\`\`bash\n${error.message}\n\`\`\``, event.threadID, event.messageID);
    }
    if (stderr) {
      // إرسال التنبيهات إذا وجدت ولكن استكمال العمل
      api.sendMessage(`⚠️ تنبيه جانبي:\n\`\`\`bash\n${stderr}\n\`\`\``, event.threadID);
    }
    
    // معالجة المخرجات الكبيرة
    const output = stdout.length > 1800 ? stdout.substring(0, 1800) + "\n... (المخرجات طويلة جداً)" : stdout;
    
    return api.sendMessage(
      `✅ تم التنفيذ بنجاح:\n\`\`\`bash\n${output || "Done (No output)"}\n\`\`\``, 
      event.threadID, 
      event.messageID
    );
  });
};
