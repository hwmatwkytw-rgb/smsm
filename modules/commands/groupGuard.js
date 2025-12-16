const fs = require("fs");
const path = require("path");
const axios = require("axios");

const dataPath = path.join(__dirname, "groupGuard.json");

function loadData() {
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "اعدادات",
  version: "2.0.0",
  hasPermssion: 1, // أدمن فقط
  credits: "محمد إدريس",
  description: "حماية فعلية للمجموعة",
  commandCategory: "المجموعة",
  usages: "اعدادات",
  cooldowns: 5
};

/* ================== الأمر ================== */
module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;
  const data = loadData();

  if (!data[threadID]) {
    const info = await api.getThreadInfo(threadID);
    data[threadID] = {
      antiName: false,
      antiImage: false,
      antiNickname: false,
      savedName: info.threadName,
      savedImage: null
    };
  }

  saveData(data);
  const s = data[threadID];

  const msg =
`⌈ اعـدادات الـمـجـموعـة ⌋

1. [${s.antiName ? "✅" : "❌"}] مكافحة تغيير اسم المجموعة
2. [${s.antiImage ? "✅" : "❌"}] مكافحة تغيير صورة المجموعة
3. [${s.antiNickname ? "✅" : "❌"}] مكافحة تغيير الكنية

⇒ رد برقم لتغيير الإعداد`;

  return api.sendMessage(msg, threadID);
};

/* ================== الرد ================== */
module.exports.handleReply = async function ({ api, event }) {
  const { threadID, body } = event;
  const data = loadData();
  if (!data[threadID]) return;

  const s = data[threadID];

  if (body === "1") s.antiName = !s.antiName;
  if (body === "2") s.antiImage = !s.antiImage;
  if (body === "3") s.antiNickname = !s.antiNickname;

  // حفظ الاسم والصورة عند التفعيل
  if (s.antiName) {
    const info = await api.getThreadInfo(threadID);
    s.savedName = info.threadName;
  }

  if (s.antiImage && !s.savedImage) {
    const info = await api.getThreadInfo(threadID);
    if (info.imageSrc) {
      const imgPath = path.join(__dirname, `guard_${threadID}.jpg`);
      const res = await axios.get(info.imageSrc, { responseType: "stream" });
      res.data.pipe(fs.createWriteStream(imgPath));
      s.savedImage = imgPath;
    }
  }

  saveData(data);
  return api.sendMessage("✅ تم تحديث الإعداد", threadID);
};

/* ================== الحماية الفعلية ================== */
module.exports.handleEvent = async function ({ api, event }) {
  const threadID = event.threadID;
  const data = loadData();
  if (!data[threadID]) return;

  const s = data[threadID];

  // 🛑 منع تغيير اسم المجموعة
  if (event.logMessageType === "log:thread-name" && s.antiName) {
    await api.setTitle(s.savedName, threadID);
    return api.sendMessage("🚫 تم إرجاع اسم المجموعة", threadID);
  }

  // 🛑 منع تغيير صورة المجموعة
  if (event.logMessageType === "log:thread-image" && s.antiImage && s.savedImage) {
    await api.changeGroupImage(
      fs.createReadStream(s.savedImage),
      threadID
    );
    return api.sendMessage("🚫 تم إرجاع صورة المجموعة", threadID);
  }

  // 🛑 منع تغيير الكنية
  if (event.logMessageType === "log:user-nickname" && s.antiNickname) {
    const userID = event.logMessageData.participant_id;
    await api.changeNickname("", threadID, userID);
    return api.sendMessage("🚫 تم منع تغيير الكنية", threadID);
  }
};
