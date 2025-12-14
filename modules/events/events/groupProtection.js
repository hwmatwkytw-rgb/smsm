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
  version: "1.0.7",
  hasPermssion: 1,
  credits: "مطور",
  description: "إعدادات حماية المجموعة",
  commandCategory: "إدارة",
  usages: "اعدادات",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const admins = threadInfo.adminIDs.map(a => a.id);
    if (!admins.includes(senderID)) return;
  } catch {
    return;
  }

  const data = loadData();
  if (!data[threadID]) {
    data[threadID] = {
      name: "",
      image: "",
      nicknames: {},
      antiNickname: false,
      antiLeave: false,
      antiName: false,
      antiImage: false,
      notifyEvents: false
    };
    saveData(data);
  }

  const s = data[threadID];

  const msg = `
1. حماية اسم المجموعة        ${s.antiName ? "[✅]" : "[❌]"}
2. حماية صورة المجموعة       ${s.antiImage ? "[✅]" : "[❌]"}
3. مكافحة تغير الكنيات       ${s.antiNickname ? "[✅]" : "[❌]"}
4. مكافحة الخروج            ${s.antiLeave ? "[✅]" : "[❌]"}
5. إخطار أحداث المجموعة     ${s.notifyEvents ? "[✅]" : "[❌]"}

📌 قم بالرد بالأرقام مع مسافة.
📌 بعد الاختيار تفاعل ب 👍 للحفظ.
`;

  api.sendMessage(msg, threadID, (err, info) => {
    if (!err) {
      global.client.handleReply.push({
        name: module.exports.config.name,
        author: senderID,
        messageID: info.messageID,
        type: "settings"
      });
    }
  }, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (senderID !== handleReply.author) return;

  const choices = body.trim().split(/\s+/).map(Number).filter(x => [1,2,3,4,5].includes(x));
  if (!choices.length) return;

  const data = loadData();
  const threadInfo = await api.getThreadInfo(threadID);

  for (let choice of choices) {
    switch (choice) {
      case 1:
        data[threadID].antiName = !data[threadID].antiName;
        if (data[threadID].antiName) data[threadID].name = threadInfo.name;
        break;

      case 2:
        data[threadID].antiImage = !data[threadID].antiImage;
        if (data[threadID].antiImage) {
          const imgPath = path.join(__dirname, `${threadID}_image.jpg`);
          try {
            const stream = await api.getThreadPicture(threadID);
            const fd = fs.createWriteStream(imgPath);
            stream.pipe(fd);
            data[threadID].image = imgPath;
          } catch {}
        }
        break;

      case 3:
        data[threadID].antiNickname = !data[threadID].antiNickname;
        if (data[threadID].antiNickname) data[threadID].nicknames = threadInfo.nicknames;
        break;

      case 4:
        data[threadID].antiLeave = !data[threadID].antiLeave;
        break;

      case 5:
        data[threadID].notifyEvents = !data[threadID].notifyEvents;
        break;
    }
  }

  saveData(data);

  const s = data[threadID];

  const msg = `
1. حماية اسم المجموعة        ${s.antiName ? "[✅]" : "[❌]"}
2. حماية صورة المجموعة       ${s.antiImage ? "[✅]" : "[❌]"}
3. مكافحة تغير الكنيات       ${s.antiNickname ? "[✅]" : "[❌]"}
4. مكافحة الخروج            ${s.antiLeave ? "[✅]" : "[❌]"}
5. إخطار أحداث المجموعة     ${s.notifyEvents ? "[✅]" : "[❌]"}

👍 تفاعل للحفظ.
`;

  api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReaction.push({
      name: module.exports.config.name,
      author: senderID,
      messageID: info.messageID,
      data: data
    });
  }, messageID);
};

module.exports.handleReaction = async function ({ api, event, handleReaction }) {
  if (event.userID !== handleReaction.author) return;
  if (event.reaction !== "👍") return;

  saveData(handleReaction.data);
  api.sendMessage("✔️ تم حفظ الإعدادات بنجاح.", event.threadID);
};


/* ========= حماية الكنيات ========= */
module.exports.onNicknameChange = async function({ api, event }) {
  const data = loadData();
  const s = data[event.threadID];
  if (!s?.antiNickname) return;

  const oldNick = s.nicknames[event.author];
  if (oldNick && oldNick !== event.nickname) {
    await api.changeNickname(oldNick, event.threadID, event.author);
    api.sendMessage("افطر انا قاعد م بخليك تلعب 🐸☝🏿", event.threadID);
  }
};

/* ========= حماية الاسم ========= */
module.exports.onNameChange = async function({ api, event }) {
  const data = loadData();
  const s = data[event.threadID];
  if (!s?.antiName) return;

  if (s.name && s.name !== event.name) {
    await api.setTitle(s.name, event.threadID);
    api.sendMessage("افطر انا قاعد م بخليك تلعب 🐸☝🏿", event.threadID);
  }
};

/* ========= حماية الصورة ========= */
module.exports.onImageChange = async function({ api, event }) {
  const data = loadData();
  const s = data[event.threadID];
  if (!s?.antiImage) return;

  if (s.image && event.imageSrc !== s.image) {
    try {
      await api.setImage(fs.createReadStream(s.image), event.threadID);
      api.sendMessage("افطر انا قاعد م بخليك تلعب 🐸☝🏿", event.threadID);
    } catch {}
  }
};

/* ========= مكافحة الخروج ========= */
module.exports.onLeave = async function({ api, event }) {
  const data = loadData();
  const s = data[event.threadID];
  if (!s?.antiLeave) return;

  try {
    await api.addUserToGroup(event.leftParticipantFbId, event.threadID);
    api.sendMessage("ضحك قال مارق بي كرامتو 🐸☝🏿", event.threadID);
  } catch {}
};
