const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "metahaData.json");

function loadData() {
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
  return JSON.parse(fs.readFileSync(dataPath));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
  name: "متاهة",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "محمد إدريس",
  description: "متاهة الظلال الأزلية – فصول أنمي",
  commandCategory: "ألعاب",
  usages: "متاهة",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const data = loadData();
  const uid = event.senderID;

  if (!data[uid]) {
    data[uid] = {
      hp: 100,
      en: 50,
      stage: 1
    };
    saveData(data);
  }

  const p = data[uid];
  let msg = "";

  /* ===== الفصل الأول ===== */
  if (p.stage === 1) {
    msg =
`🕯️ **متاهة الظلال الأزلية**
📖 الفصل الأول: نداء الظلال

❤️ دمك: ${p.hp}
⚡ طاقتك: ${p.en}

تُغلق المتاهة خلفك…
أمامك قاعة دائرية وثلاثة مسارات:

1️⃣ مسار الظل  
2️⃣ مسار النور المكسور  
3️⃣ الدائرة السحرية

✉️ رد برقم اختيارك.`;
  }

  /* ===== الفصل الثاني ===== */
  else if (p.stage === 2) {
    msg =
`👑 **الفصل الثاني: حارس المتاهة**

يظهر الزعيم:
👁️ فالـكريث – حارس الظلال

❤️ دم الزعيم: 300

خياراتك:
1️⃣ قاتله مباشرة  
2️⃣ استخدم الدائرة السحرية  
3️⃣ عقد صفقة معه

⚠️ قرارك مصيري!
✉️ رد برقم اختيارك.`;
  }

  api.sendMessage(msg, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: uid
    });
  });
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;

  const data = loadData();
  const uid = event.senderID;
  const p = data[uid];
  const choice = event.body.trim();
  let reply = "";

  /* ===== اختيارات الفصل الأول ===== */
  if (p.stage === 1) {
    if (!["1", "2", "3"].includes(choice))
      return api.sendMessage("❌ اختر 1 أو 2 أو 3", event.threadID);

    p.stage = 2;
    p.en -= 5;

    reply =
`🧭 لقد اخترت مسارك…
⚡ -5 طاقة

⚠️ تشعر بكيان يراقبك…
👁️ حارس المتاهة يقترب!`;
  }

  /* ===== اختيارات الفصل الثاني ===== */
  else if (p.stage === 2) {

    if (choice === "1") {
      p.hp -= 30;
      p.en -= 15;
      reply =
`⚔️ هجوم مباشر!
-30 ❤️ دم
-15 ⚡ طاقة

فالـكريث يترنح… لكن لم يُهزم بعد.`;
    }

    else if (choice === "2") {
      p.en -= 25;
      reply =
`🧠 الدائرة السحرية تستجيب لك!
-25 ⚡ طاقة

قوة غامضة تتشكل داخلك…`;
    }

    else if (choice === "3") {
      p.hp -= 10;
      reply =
`👑 عقدت صفقة مظلمة…
-10 ❤️ دم

فالـكريث يبتسم…`;
    }

    else {
      return api.sendMessage("❌ اختر 1 أو 2 أو 3", event.threadID);
    }
  }

  if (p.hp <= 0) {
    p.hp = 100;
    p.en = 50;
    p.stage = 1;
    reply += `\n\n☠️ لقد سقطت!\n🔄 العودة لبداية المتاهة.`;
  }

  saveData(data);
  api.sendMessage(reply, event.threadID);
};
