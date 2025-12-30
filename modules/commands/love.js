module.exports.config = {
  name: "نسبة_الحب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "KIRO",
  description: "حساب نسبة الحب بين عضوين",
  commandCategory: "تفاعل",
  usages: "نسبة_الحب @شخص",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  const { threadID, senderID, mentions } = event;
  const mentionIDs = Object.keys(mentions);

  let user1 = senderID;
  let user2;

  if (mentionIDs.length >= 1) {
    user2 = mentionIDs[0];
  } else {
    return api.sendMessage(
      "❌ لازم تمنشن شخص واحد على الأقل 💔",
      threadID
    );
  }

  const name1 = await Users.getNameUser(user1);
  const name2 = await Users.getNameUser(user2);

  const love = Math.floor(Math.random() * 101);

  let status = "";
  if (love <= 20) status = "😶 صداقة جافة";
  else if (love <= 40) status = "🙂 إعجاب خفيف";
  else if (love <= 60) status = "😊 حب محتمل";
  else if (love <= 80) status = "💖 حب قوي";
  else status = "💍 زواج قريب 😂";

  const msg = `
💞 مقياس الحب 💞

👤 ${name1}  ❤️  👤 ${name2}
━━━━━━━━━━━━
💘 نسبة الحب: ${love}%
💬 الوصف: ${status}
`;

  return api.sendMessage(msg, threadID);
};
