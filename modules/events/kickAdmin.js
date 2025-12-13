module.exports.config = {
  name: "kickAdmin",
  eventType: ["log:unsubscribe"], // أو "log:thread_admin_remove" حسب البوت
  version: "1.0.0",
  credits: "GPT-5",
};

module.exports.run = async function({ api, event }) {
  try {
    const kickedUser = event.logMessageData.leftParticipant; // العضو الذي تم طرده
    if(kickedUser) {
      // رسالة مرحة مع ذكر اسم العضو
      const message = `ԅ(¯﹃¯ԅ) ${kickedUser.fullName} بلع بانكاي في جلحتو!`;
      await api.sendMessage(message, event.threadID);
    }
  } catch (err) {
    console.error(err);
  }
};
