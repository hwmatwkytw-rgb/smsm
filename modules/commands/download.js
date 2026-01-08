const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "تحميل",
    version: "3.1.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "تحميل من TikTok, YouTube, FB, IG مع تحديد نوع المنصة",
    commandCategory: "الخدمات",
    usages: "[رابط الفيديو]",
    cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const url = args[0];

    if (!url) {
        return api.sendMessage("⚠️ يرجى وضع رابط الفيديو.\nمثال: تحميل https://vt.tiktok.com/xxx/", threadID, messageID);
    }

    // تحديد نوع المنصة بشكل يدوي للرسالة
    let platform = "غير معروفة";
    if (url.includes("tiktok")) platform = "تيك توك (TikTok) 📱";
    else if (url.includes("facebook") || url.includes("fb.watch")) platform = "فيسبوك (Facebook) 💙";
    else if (url.includes("instagram") || url.includes("instagr.am")) platform = "إنستغرام (Instagram) 📸";
    else if (url.includes("youtube") || url.includes("youtu.be")) platform = "يوتيوب (YouTube) ❤️";

    api.sendMessage(`⏳ جاري معالجة الرابط من [ ${platform} ]... يرجى الانتظار.`, threadID, (err, info) => {
        setTimeout(() => { api.unsendMessage(info.messageID) }, 10000);
    }, messageID);

    try {
        // استخدام API بديل وأكثر استقراراً
        const res = await axios.get(`https://api.alyachan.pro/api/snapany?url=${encodeURIComponent(url)}&apikey=G7p76L`);
        
        // التحقق من وجود بيانات
        if (!res.data || !res.data.data) {
            throw new Error("لم يتم العثور على محتوى.");
        }

        const videoData = res.data.data.find(item => item.type === "video") || res.data.data[0];
        const videoUrl = videoData.url;
        const title = res.data.metadata ? res.data.metadata.title : "فيديو بدون عنوان";

        if (!videoUrl) throw new Error("لا يوجد رابط فيديو مباشر.");

        const cachePath = path.join(__dirname, 'cache', `vid_${Date.now()}.mp4`);
        if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'));

        // تحميل الفيديو
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(cachePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            // التحقق من حجم الملف
            const stats = fs.statSync(cachePath);
            const fileSizeInBytes = stats.size;
            const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

            if (fileSizeInMegabytes > 45) { // رفع الحد لـ 45 ميجا
                fs.unlinkSync(cachePath);
                return api.sendMessage("⚠️ الفيديو كبير جداً لإرساله عبر ماسنجر.", threadID, messageID);
            }

            return api.sendMessage({
                body: `✅ تـم الـتـحـمـيـل بـنـجـاح\n\n📌 الـمـنـصـة: ${platform}\n📝 الـعـنـوان: ${title}`,
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => fs.unlinkSync(cachePath), messageID);
        });

        writer.on('error', (err) => {
            throw err;
        });

    } catch (error) {
        console.error("Download Error:", error.message);
        return api.sendMessage("❌ عذراً، لم أتمكن من تحميل هذا الفيديو. تأكد من أن الحساب صاحب الفيديو ليس خاصاً (Private).", threadID, messageID);
    }
};
