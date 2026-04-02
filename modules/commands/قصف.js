module.exports.config = {
  name: "قصف",
  version: "0.0.4",
  hasPermssion: 0,
  credits: "عمر",
  description: "",
  commandCategory: "ترفيه",
  usages: "قصف/قصف رقم/ايقاف",
  cooldowns: 0,
  dependencies: {
    "fs-extra": "",
    "request": "",
    "axios": ""
  }
};

global.bombData = global.bombData || {};

module.exports.onLoad = async () => {
  return;
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, messageReply, mentions } = event;

  const messages = [
    "💥 يا {name} انضربت 😂",
    "🔥 يا {name} وينك؟",
    "😈 يا {name} انتهيت",
    "💣 يا {name} بوم عليك",
    "🤣 يا {name} ضحكنا عليك",
    "⚡ يا {name} سريع القصف",
    "😜 يا {name} ما تهرب",
    "👀 يا {name} مراقبك",
    "🔥🔥 يا {name} احذر!",
    "💥 يا {name} نهاية اللعبة"
  ];

  // إيقاف القصف
  if (args[0] == "ايقاف") {
    if (!global.bombData[threadID])
      return api.sendMessage("❌ لا يوجد قصف شغال", threadID, messageID);

    clearInterval(global.bombData[threadID].interval);
    delete global.bombData[threadID];

    return api.sendMessage("🛑 تم إيقاف القصف", threadID, messageID);
  }

  // جمع الأهداف
  let targets = [];

  if (messageReply) {
    targets.push(messageReply.senderID);
  }

  if (mentions && Object.keys(mentions).length > 0) {
    targets = targets.concat(Object.keys(mentions));
  }

  if (targets.length == 0) {
    return api.sendMessage("❌ رد أو منشن شخص", threadID, messageID);
  }

  let time = parseInt(args[0]);
  if (isNaN(time) || time <= 0) time = 10;

  if (global.bombData[threadID]) {
    return api.sendMessage("⚠️ فيه قصف شغال بالفعل", threadID, messageID);
  }

  api.sendMessage(`🚀 بدأ القصف لمدة ${time} ثانية...\n💣 كل شخص راح يستقبل رسالة مخصصة باسمه`, threadID, messageID);

  global.bombData[threadID] = {
    interval: setInterval(() => {

      targets.forEach(id => {
        // جلب اسم الشخص (يفترض أن API تدعمها)
        api.getUserName(id, (err, name) => {
          if (err) name = "الشخص"; // لو في مشكلة نستخدم اسم عام

          // اختيار رسالة عشوائية مع اسم الشخص
          const msgTemplate = messages[Math.floor(Math.random() * messages.length)];
          const msg = msgTemplate.replace("{name}", name);

          api.sendMessage({
            body: msg,
            mentions: [{
              tag: name,
              id: id
            }]
          }, threadID);
        });
      });

    }, 1000)
  };

  // إيقاف تلقائي بعد الوقت
  setTimeout(() => {
    if (global.bombData[threadID]) {
      clearInterval(global.bombData[threadID].interval);
      delete global.bombData[threadID];
      api.sendMessage(`⏱️ انتهى القصف (${time} ثانية)`, threadID);
    }
  }, time * 1000);
};
