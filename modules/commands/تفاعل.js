module.exports.config = {
  name: "تفاعل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "محمد إدريس",
  description: "يعرض أكثر أعضاء المجموعة تفاعلاً",
  commandCategory: "المجموعة",
  usages: "/تفاعل",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users }) {
  const threadID = event.threadID;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const members = threadInfo.participantIDs;

    let data = [];

    for (const uid of members) {
      const userData = await Users.getData(uid);
      const points = userData.exp || 0;
      const level = userData.level || 0;
      const name = await Users.getNameUser(uid);

      data.push({ name, points, level });
    }

    data.sort((a, b) => b.points - a.points);
    data = data.slice(0, 5);

    const medals = ["🥇", "🥈", "🥉", "🏅", "🎖"];

    let msg = "🏆 | أعـضـاء المجموعة الأكـثـر تـفـاعـلاً:\n\n";

    data.forEach((u, i) => {
      msg += `${medals[i]} ${u.name}\n`;
      msg += `📊 نقاط: ${u.points} | 📈 مستوى: ${u.level}\n\n`;
    });

    api.sendMessage(msg.trim(), threadID);

  } catch (e) {
    api.sendMessage("❌ حصل خطأ أثناء جلب بيانات التفاعل", threadID);
  }
};
