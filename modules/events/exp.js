module.exports.config = {
  name: "exp",
  eventType: ["message"],
  version: "1.0.0",
  credits: "محمد إدريس",
  description: "زيادة نقاط التفاعل لكل رسالة"
};

module.exports.run = async function ({ event, Users }) {
  if (!event.senderID) return;
  if (event.senderID == event.threadID) return; // تجاهل الرسائل النظامية

  const data = await Users.getData(event.senderID);

  data.exp = (data.exp || 0) + 1;

  // حساب المستوى (اختياري)
  data.level = Math.floor(data.exp / 100);

  await Users.setData(event.senderID, data);
};
