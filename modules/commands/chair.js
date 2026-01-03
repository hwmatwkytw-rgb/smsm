module.exports.config = {
    name: "كرسي",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Gemini AI",
    description: "لعبة كرسي الاعتراف - يختار البوت ضحية ويوجه له سؤال",
    commandCategory: "العاب",
    cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
    const { threadID, messageID, participantIDs } = event;
    
    // قائمة أسئلة كرسي الاعتراف
    const questions = [
        "ما هو أكثر شيء تندم عليه في حياتك؟",
        "لو أتيحت لك فرصة لتغيير شيء واحد في ماضيك، ماذا سيكون؟",
        "من هو الشخص الذي تعتبره قدوتك في الحياة؟",
        "ما هي الصفة التي تكرهها في نفسك وتريد تغييرها؟",
        "هل سبق لك وأن كذبت كذبة كبيرة وصدقها الجميع؟",
        "ما هو الحلم الذي تسعى لتحقيقه بكل قوتك؟",
        "من هو الشخص في هذه المجموعة الذي ترتاح للحديث معه؟",
        "ما هو الموقف الذي لن تنساه أبداً طوال حياتك؟",
        "لو خيروك بين المال والسعادة، ماذا تختار بكل صراحة؟",
        "ما هي نقطة ضعفك التي لا يعرفها أحد؟",
        "أكثر شخص تفتقده في الوقت الحالي؟",
        "هل أنت شخص متسامح أم أنك لا تنسى من أخطأ في حقك؟"
    ];

    // جلب معلومات المجموعة للحصول على الأعضاء الفاعلين
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const members = threadInfo.participantIDs;
        
        // اختيار عضو عشوائي (الضحية)
        const victimID = members[Math.floor(Math.random() * members.length)];
        
        // اختيار سؤال عشوائي
        const question = questions[Math.floor(Math.random() * questions.length)];
        
        // جلب اسم العضو المختار
        const userInfo = await api.getUserInfo(victimID);
        const name = userInfo[victimID].name;

        const msg = {
            body: `🔥 تم اختيار الضحية للجلوس على كرسي الاعتراف!\n\n👤 العضو: ${name}\n❓ السؤال: ${question}\n\nننتظر إجابتك بكل صراحة! 😉`,
            mentions: [{
                tag: name,
                id: victimID
            }]
        };

        return api.sendMessage(msg, threadID, messageID);
        
    } catch (error) {
        console.error(error);
        return api.sendMessage("حدث خطأ في اختيار الضحية، حاول مرة أخرى.", threadID, messageID);
    }
};
