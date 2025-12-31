module.exports.config = {
  name: "اشعار",
  version: "1.4.0",
  hasPermssion: 2, // للمطور فقط
  credits: "61581906898524",
  description: "إرسال إشعار لجميع القروبات مع ستايل خفيف وتاج للمطور",
  commandCategory: "مطور",
  usages: "اشعار [الرسالة]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args, Threads }) {
  const { senderID } = event;

  if (!args.join(" ")) 
    return api.sendMessage("❌ الرجاء كتابة الرسالة بعد الأمر", event.threadID);

  const message = args.join(" ");
  const allThreads = await Threads.getAll();

  let success = 0;
  let failed = 0;

  for (let thread of allThreads) {
    try {
      const sendMessage = {
        body: 
`--- إشعار من المطور ---

📌 الرسالة:
${message}

👤 المرسل: @${senderID}

----------------------`,
        mentions: [{ tag: `@${senderID}`, id: senderID }]
      };

      await api.sendMessage(sendMessage, thread.threadID);
      success++;
    } catch (e) {
      failed++;
    }
  }

  return api.sendMessage(`✅ تم إرسال الإشعار إلى ${success} قروبات\n❌ فشل في إرسال ${failed} قروبات`, event.threadID);
};
