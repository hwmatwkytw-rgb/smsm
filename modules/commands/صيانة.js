module.exports.config = {
  name: "صيانة",
  version: "1.0.5",
  hasPermssion: 2, // خاص بالمطور فقط
  credits: "Gemini",
  description: "تفعيل أو تعطيل وضع الصيانة (إيقاف البوت عن الجميع)",
  commandCategory: "المطور",
  usages: "[on/off]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const adminID = "61581906898524"; // الأيدي الخاص بك لضمان الحماية

  // التحقق من أن المطور هو من يرسل الأمر للأمان الإضافي
  if (event.senderID !== adminID) {
    return api.sendMessage("⚠️ عذراً، هذا الأمر مخصص لمطور البوت الأساسي فقط.", threadID, messageID);
  }

  // إذا لم يتم إدخال وسيط (on أو off)
  if (!args[0]) {
    return api.sendMessage("⚠️ يرجى تحديد الحالة:\n• صيانة on (لتفعيل وضع الصيانة)\n• صيانة off (لإيقاف وضع الصيانة)", threadID, messageID);
  }

  if (args[0].toLowerCase() === "on") {
    global.config.maintenanceMode = true;
    const msg = 
      "🚧 ━━━ وضـع الـصـيـانـة ━━━ 🚧\n\n" +
      "🔴 الحالة: تـم التـفـعـيـل\n" +
      "📢 النتيجة: البوت سيتجاهل الجميع الآن\n" +
      "👤 المطور: متاح لك فقط التحكم\n\n" +
      "━━━━━━━━━━━━━━━\n" +
      "📡 نظام الحماية يعمل حالياً";
    return api.sendMessage(msg, threadID, messageID);
  } 

  if (args[0].toLowerCase() === "off") {
    global.config.maintenanceMode = false;
    const msg = 
      "✅ ━━━ وضـع الـصـيـانـة ━━━ ✅\n\n" +
      "🟢 الحالة: تـم الإيقـاف\n" +
      "📢 النتيجة: البوت متاح الآن لجميع الأعضاء\n" +
      "🌍 النطاق: جميع المجموعات والخاص\n\n" +
      "━━━━━━━━━━━━━━━\n" +
      "📡 عودة العمل بشكل طبيعي";
    return api.sendMessage(msg, threadID, messageID);
  }
};
