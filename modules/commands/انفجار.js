module.exports.config = {
  name: "انفجار",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "لعبة تفكيك القنبلة الموقوتة",
  commandCategory: "العاب",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const msg = `تحذير! تم تفعيل قنبلة موقوتة في المجموعة 💣
أمامك 4 أسلاك، واحد منها فقط سيعطل القنبلة والآخرون سيسببون انفجاراً فورياً!

الألوان المتاحة:
🔴 - السلك الأحمر
🔵 - السلك الأزرق
🟢 - السلك الأخضر
🟡 - السلك الأصفر

* رد على هذه الرسالة بكتابة اللون (مثلاً: الاحمر)`;

  return api.sendMessage(msg, threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID,
      correctWire: ["الاحمر", "الازرق", "الاخضر", "الاصفر"][Math.floor(Math.random() * 4)]
    });
  }, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  if (handleReply.author !== senderID) return;

  const userAnswer = body.trim();
  const wires = ["الاحمر", "الازرق", "الاخضر", "الاصفر"];

  if (!wires.includes(userAnswer)) {
    return api.sendMessage("يرجى اختيار لون صحيح من القائمة (الاحمر، الازرق، الاخضر، الاصفر)!", threadID, messageID);
  }

  api.unsendMessage(handleReply.messageID);

  if (userAnswer === handleReply.correctWire) {
    return api.sendMessage(`كفو! لقد قمت بقطع السلك ${userAnswer} بنجاح وتم تعطيل القنبلة. لقد أنقذت المجموعة! 🏆✨`, threadID, messageID);
  } else {
    return api.sendMessage(`بووووم!!! 💥💥\nلقد قطعت السلك الخطأ (${userAnswer}) وانفجرت القنبلة! السلك الصحيح كان ${handleReply.correctWire}. حظاً أوفر المرة القادمة 💀`, threadID, messageID);
  }
};
