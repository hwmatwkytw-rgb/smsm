module.exports.config = {
    name: "طقس",
    version: "1.0.1",
    hasPermssion: 0,
    credits: "Mirai Team",
    description: "لمعرفة حالة الطقس في مدينة معينة",
    commandCategory: "الأدوات",
    usages: "[اسم المدينة]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const axios = require("axios");
    const { threadID, messageID } = event;
    
    // سحب مفتاح الـ API من ملف الإعدادات
    const { weather } = global.config;
    const apiKey = weather.OPEN_WEATHER;

    if (!args[0]) return api.sendMessage("يرجى كتابة اسم المدينة بعد الأمر.\nمثال: /طقس القاهرة", threadID, messageID);

    const city = args.join(" ");

    try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ar`);
        
        const data = res.data;
        const temp = data.main.temp;
        const feelsLike = data.main.feels_like;
        const description = data.weather[0].description;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const country = data.sys.country;
        const cityName = data.name;

        const message = `🌤️ الطقس في ${cityName}, ${country}:\n` +
                        `----------------------\n` +
                        `🌡️ درجة الحرارة: ${temp}°C\n` +
                        `🌡️ الإحساس الفعلي: ${feelsLike}°C\n` +
                        `☁️ الحالة: ${description}\n` +
                        `💧 الرطوبة: ${humidity}%\n` +
                        `💨 سرعة الرياح: ${windSpeed} م/ث\n` +
                        `----------------------\n` +
                        `نتمنى لك يوماً سعيداً!`;

        return api.sendMessage(message, threadID, messageID);
    } catch (err) {
        if (err.response && err.response.status === 404) {
            return api.sendMessage("❌ لم يتم العثور على المدينة، يرجى التأكد من الاسم الصحيح.", threadID, messageID);
        }
        return api.sendMessage("⚠️ حدث خطأ أثناء جلب البيانات، تأكد من صلاحية مفتاح الـ API.", threadID, messageID);
    }
};
