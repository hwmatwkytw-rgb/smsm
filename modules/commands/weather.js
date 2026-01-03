const axios = require("axios");

module.exports.config = {
    name: "طقس",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "توقعات الطقس لليوم، غداً، ولمدة 3 أيام بدقة عالية",
    commandCategory: "الخدمات",
    usages: "[اسم المدينة]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const city = args.join(" ");

    if (!city) return api.sendMessage("⚠️ يرجى كتابة اسم المدينة.\nمثال: طقس القاهرة", threadID, messageID);

    api.sendMessage(`🔍 جاري جلب بيانات الطقس لـ ${city}...`, threadID, (err, info) => {
        setTimeout(() => { api.unsendMessage(info.messageID) }, 3000);
    }, messageID);

    try {
        // استخدام API يوفر توقعات دقيقة لعدة أيام
        const res = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=c304d49d944e4a8693d220803241405&q=${encodeURIComponent(city)}&days=4&lang=ar`);
        
        const data = res.data;
        const current = data.current;
        const forecast = data.forecast.forecastday;

        let msg = `🌤️ 『 تـوقـعـات الـطـقـس: ${data.location.name} 』\n`;
        msg += `📍 الـدولـة: ${data.location.country}\n`;
        msg += `━━━━━━━━━━━━━\n\n`;

        // طقس اليوم
        msg += `📅 【 الـيـوم 】\n`;
        msg += `🌡️ الحرارة: ${current.temp_c}°C (المحسوسة: ${current.feelslike_c}°C)\n`;
        msg += `📝 الحالة: ${current.condition.text}\n`;
        msg += `💧 الرطوبة: ${current.humidity}%\n`;
        msg += `💨 الرياح: ${current.wind_kph} كم/س\n\n`;

        // طقس غداً
        const tomorrow = forecast[1].day;
        msg += `📅 【 غـداً 】\n`;
        msg += `🌡️ العظمى: ${tomorrow.maxtemp_c}°C | الصغرى: ${tomorrow.mintemp_c}°C\n`;
        msg += `📝 الحالة: ${tomorrow.condition.text}\n`;
        msg += `🌧️ نسبة الأمطار: ${tomorrow.daily_chance_of_rain}%\n\n`;

        // طقس بعد 3 أيام
        const dayAfter = forecast[3].day;
        const dateAfter = forecast[3].date;
        msg += `📅 【 بـعـد 3 أيـام (${dateAfter}) 】\n`;
        msg += `🌡️ العظمى: ${dayAfter.maxtemp_c}°C | الصغرى: ${dayAfter.mintemp_c}°C\n`;
        msg += `📝 الحالة: ${dayAfter.condition.text}\n`;
        msg += `━━━━━━━━━━━━━`;

        return api.sendMessage(msg, threadID, messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ تعذر العثور على المدينة. تأكد من كتابة الاسم بشكل صحيح (مثلاً: دبي، الرياض، لندن).", threadID, messageID);
    }
};
