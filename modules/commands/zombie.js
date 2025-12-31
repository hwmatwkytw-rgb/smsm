// 🧟‍♂️ أمر زومبي تفاعلي | KIRO BOT
module.exports.config = {
  name: "زومبي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "KIRO BOT",
  description: "قصة زومبي تفاعلية مع اختيارات",
  commandCategory: "🎮 تفاعل",
  usages: "زومبي",
  cooldowns: 5
};

const sessions = new Map();

module.exports.run = async ({ api, event }) => {
  const { threadID, senderID } = event;

  // منع تكرار الجلسة
  if (sessions.has(senderID)) {
    return api.sendMessage(
      "⚠️ لديك مغامرة زومبي جارية!\nاختر سلاحك أولاً 🧟‍♂️",
      threadID
    );
  }

  sessions.set(senderID, { step: 1 });

  const startMsg =
`🧟‍♂️ 【 تحذير طارئ 】  
انتشر فايروس غامض في المدينة…

👤 الناجي: ${event.senderID}

🎒 اختر سلاحك بسرعة:
1️⃣ 🔫 بندقية
2️⃣ 🪓 فأس
3️⃣ 🔪 سكين
4️⃣ 🏃 الهروب بدون سلاح

✍️ اكتب رقم الاختيار`;

  api.sendMessage(startMsg, threadID);
};

module.exports.handleReply = async ({ api, event }) => {
  const { senderID, threadID, body } = event;
  if (!sessions.has(senderID)) return;

  const choice = parseInt(body);
  if (![1,2,3,4].includes(choice)) {
    return api.sendMessage("❌ اختر رقم صحيح (1 - 4)", threadID);
  }

  sessions.delete(senderID);

  const outcomes = {
    1: [
      "🏆 استخدمت البندقية بذكاء!\nنجوت من الهجوم 🧟‍♂️🔥",
      "💀 نفدت الذخيرة!\nأُصبت لكنك هربت 😰"
    ],
    2: [
      "🔥 الفأس كان فعال!\nسحقت الزومبي 💪",
      "☠️ هجوم جماعي!\nتحولت إلى زومبي 😭"
    ],
    3: [
      "😎 سكين + مهارة!\nنجوت بصعوبة",
      "💀 زومبي أسرع منك!\nتمت إصابتك"
    ],
    4: [
      "🏃 الهروب نجح!\nنجوت بدون إصابات",
      "☠️ تعثرت أثناء الهروب!\nتحولت إلى زومبي"
    ]
  };

  const result =
    outcomes[choice][Math.floor(Math.random() * outcomes[choice].length)];

  const endMsg =
`🧟‍♂️ 【 نتيجة الزومبي 】

${result}

📖 تم انتهاء الفصل الأول
⏳ الفصل الثاني قيد التطوير…`;

  api.sendMessage(endMsg, threadID);
};
