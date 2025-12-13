module.exports.config = {
  name: "autoAddUser",
  eventType: ["log:unsubscribe"],
  version: "1.1.0",
  credits: "محمد إدريس",
  description: "إرجاع العضو إذا غادر بنفسه فقط"
};

module.exports.run = async function ({ api, event }) {
  try {
    const threadID = event.threadID;
    const leftUserID = event.logMessageData.leftParticipantFbId;

    // إذا كان الخروج بسبب طرد من أدمن → لا نرجعه
    if (event.author && event.author !== leftUserID) {
      return; // طرد → تجاهل
    }

    // محاولة إرجاع العضو
    try {
      await api.addUserToGroup(leftUserID, threadID);
      api.sendMessage(
        "الحق الشارد قال مارق بي كرامتو 🐸☝🏿",
        threadID
      );
    } catch (e) {
      api.sendMessage(
        "ضحك العب اغبى من انو ينضاف تاني 🐸☝🏿",
        threadID
      );
    }

  } catch (err) {
    console.log("❌ خطأ autoAddUser:", err.message);
  }
};
