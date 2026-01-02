module.exports.config = {
    name: "anti-change",
    eventType: ["log:thread-name", "log:thread-image", "log:user-nickname"],
    version: "1.0.0",
    credits: "XaviaTeam",
    description: "اكتشاف وإلغاء التغييرات غير المصرح بها في المجموعة"
};

module.exports.run = async function({ api, event, Threads }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    
    // تجاهل التغييرات التي يقوم بها البوت نفسه
    if (author == api.getCurrentUserID()) return;

    let threadData = await Threads.getData(threadID);
    if (!threadData || !threadData.data || !threadData.data.antiSettings) return;

    const { antiSettings, protectData } = threadData.data;
    if (!protectData) return;

    try {
        // حماية اسم المجموعة
        if (logMessageType === "log:thread-name" && antiSettings.antiChangeGroupName) {
            await api.setTitle(protectData.name, threadID);
        }

        // حماية صورة المجموعة
        if (logMessageType === "log:thread-image" && antiSettings.antiChangeGroupImage) {
            if (protectData.imageSrc) {
                await api.changeGroupImage(protectData.imageSrc, threadID);
            }
        }

        // حماية الكنيات
        if (logMessageType === "log:user-nickname" && antiSettings.antiChangeNickname) {
            const { participant_id } = logMessageData;
            const oldNick = protectData.nicknames[participant_id] || null;
            await api.changeNickname(oldNick, threadID, participant_id);
        }
    } catch (err) {
        console.error("Anti-change Error:", err);
    }
};
