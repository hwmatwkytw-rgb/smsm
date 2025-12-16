const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "groupProtection.json");

function loadData() {
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "{}");
  try {
    return JSON.parse(fs.readFileSync(dataFile));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "اعدادات",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "مطور",
  description: "إعدادات حماية المجموعة",
  commandCategory: "إدارة",
  usages: "اعدادات",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // 🔐 أدمن المجموعة فقط
  try {
    const info = await api.getThreadInfo(threadID);
    if (!info.adminIDs.map(e => e.id).includes(senderID)) return;
  } catch {
    return;
  }

  const data = loadData();

  if (!data[threadID]) {
    data[threadID] = {
      antiSpam: false,
      antiLeave: false,
      antiName: false,
      antiImage: false,
      antiNickname: false,
      notify: false,

      name: "",
      image: "",
      nicknames: {}
    };
    saveData(data);
  }

  const s = data[threadID];

  const msg = `
⌈ اعـدادات الـمـجـموعـة ⌋

1. [${s.antiSpam ? "✅" : "❌"}] مكافحة الازعاج
2. [${s.antiLeave ? "✅" : "❌"}] مكافحة الخروج
3. [${s.antiName ? "✅" : "❌"}] مكافحة تغيير اسم المجموعة
4. [${s.antiImage ? "✅" : "❌"}] مكافحة تغيير صورة المجموعة
5. [${s.antiNickname ? "✅" : "❌"}] مكافحة تغيير الكنية

6. [${s.notify ? "✅" : "❌"}] اخطار احداث المجموعة

⇒ رد بأرقام لاختيار الإعداد الذي تريد تغييره
`;

  api.sendMessage(msg, threadID, (err, info) => {
    if (!err) {
      global.client.handleReply.push({
        name: module.exports.config.name,
        author: senderID,
        messageID: info.messageID
      });
    }
  }, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, senderID, body } = event;
  if (senderID !== handleReply.author) return;

  const data = loadData();
  const s = data[threadID];
  if (!s) return;

  const nums = body.split(/\s+/).map(n => parseInt(n)).filter(n => n >= 1 && n <= 6);
  if (!nums.length) return;

  const info = await api.getThreadInfo(threadID);

  for (const n of nums) {
    if (n === 1) s.antiSpam = !s.antiSpam;
    if (n === 2) s.antiLeave = !s.antiLeave;
    if (n === 3) {
      s.antiName = !s.antiName;
      if (s.antiName) s.name = info.threadName;
    }
    if (n === 4) {
      s.antiImage = !s.antiImage;
      if (s.antiImage) s.image = info.imageSrc;
    }
    if (n === 5) {
      s.antiNickname = !s.antiNickname;
      if (s.antiNickname) s.nicknames = info.nicknames || {};
    }
    if (n === 6) s.notify = !s.notify;
  }

  saveData(data);

  // إعادة إرسال القائمة بعد التعديل
  return module.exports.run({ api, event });
};


/// ==================
/// 🔒 الحمايات الفعلية
/// ==================

module.exports.handleEvent = async function ({ api, event }) {
  const data = loadData();
  const d = data[event.threadID];
  if (!d) return;

  // تغيير اسم القروب
  if (event.logMessageType === "log:thread-name" && d.antiName) {
    await api.setTitle(d.name, event.threadID);
    api.sendMessage("افطر انا قاعد م بخليك تلعب 🐸☝🏿", event.threadID);
  }

  // تغيير صورة القروب
  if (event.logMessageType === "log:thread-image" && d.antiImage && d.image) {
    await api.changeGroupImage(d.image, event.threadID);
    api.sendMessage("افطر انا قاعد م بخليك تلعب 🐸☝🏿", event.threadID);
  }

  // تغيير الكنية
  if (event.logMessageType === "log:user-nickname" && d.antiNickname) {
    const { participant_id, nickname } = event.logMessageData;
    const oldNick = d.nicknames[participant_id];
    if (oldNick && oldNick !== nickname) {
      await api.changeNickname(oldNick, event.threadID, participant_id);
      api.sendMessage("افطر انا قاعد م بخليك تلعب 🐸☝🏿", event.threadID);
    }
  }
};
