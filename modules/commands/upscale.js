const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "تحسين",
    version: "6.0.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "محرك تحسين صور متكامل (أنماط + دقة + ترميم)",
    commandCategory: "الخدمات الذكية",
    usages: "[رد على صورة] + (4x, وجه, كرتون, واقعي, ضوء)",
    cooldowns: 10
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID, type, messageReply } = event;

    // 1. التحقق من وجود صورة
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ يجب الرد على صورة! الخيارات المتاحة:\n\n✅ 4x : دقة خارقة\n✅ وجه : ترميم ملامح\n✅ كرتون : نمط أنمي\n✅ واقعي : تفاصيل دقيقة\n✅ ضوء : تحسين الإضاءة", threadID, messageID);
    }

    const imgUrl = messageReply.attachments[0].url;
    const apiToken = "R8_WhcPhpUcegl2YUnCbJ9jFn6KtEdyRlS2JWaiq";

    // 2. تحليل الكلمات المفتاحية من المستخدم
    const input = args.join(" ").toLowerCase();
    
    const options = {
        upscale: input.includes("4x") ? 4 : 2,
        face_enhance: input.includes("وجه") || input.includes("face"),
        isAnime: input.includes("كرتون") || input.includes("anime"),
        isRealistic: input.includes("واقعي") || input.includes("ultra"),
        isLight: input.includes("ضوء") || input.includes("light")
    };

    api.sendMessage("🚀 جاري معالجة الصورة بالذكاء الاصطناعي... يرجى الانتظار ثوانٍ.", threadID, messageID);

    try {
        // 3. إرسال الطلب لـ Replicate (نموذج Real-ESRGAN المتطور)
        const response = await axios.post(
            "https://api.replicate.com/v1/predictions",
            {
                version: "42fed1c4974cc6b7d22045e084a7b730b200b2a7f7401994e43f32488f2882a1",
                input: {
                    image: imgUrl,
                    upscale: options.upscale,
                    face_enhance: options.face_enhance,
                    // تعديلات برمجية بناءً على الاستايل المختبر
                    brightness: options.isLight ? 1.3 : 1.0,
                    dynamic_threshold: options.isRealistic ? 2.0 : 1.0,
                    conditioning_scale: options.isAnime ? 0.5 : 1.0
                }
            },
            {
                headers: {
                    "Authorization": `Token ${apiToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const predictionId = response.data.id;
        let resultUrl = null;

        // 4. مراقبة عملية المعالجة
        while (true) {
            const checkStatus = await axios.get(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: { "Authorization": `Token ${apiToken}` }
            });

            if (checkStatus.data.status === "succeeded") {
                resultUrl = checkStatus.data.output;
                break;
            }
            if (checkStatus.data.status === "failed") throw new Error("فشلت المعالجة.");
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 5. تحميل وحفظ الصورة في الكاش
        const cachePath = path.join(__dirname, "cache", `enhanced_${Date.now()}.png`);
        const imgResponse = await axios.get(resultUrl, { responseType: "arraybuffer" });
        fs.ensureDirSync(path.join(__dirname, "cache"));
        fs.writeFileSync(cachePath, Buffer.from(imgResponse.data));

        // 6. إرسال النتيجة النهائية مع تفاصيل الإعدادات المستخدمة
        let successMsg = `✅ تم التحسين بنجاح!\n\n🛠 الإعدادات:\n- التكبير: x${options.upscale}\n`;
        if (options.face_enhance) successMsg += "- ميزة: ترميم الوجوه 👤\n";
        if (options.isAnime) successMsg += "- النمط: كرتون/أنمي 🎨\n";
        if (options.isRealistic) successMsg += "- النمط: واقعية فائقة 📸\n";
        if (options.isLight) successMsg += "- الإضاءة: تم التفتيح ✨";

        return api.sendMessage({
            body: successMsg,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => fs.unlinkSync(cachePath), messageID);

    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ عذراً، حدث خطأ فني أثناء المعالجة. قد يكون الرصيد انتهى أو الصورة غير مدعومة.", threadID, messageID);
    }
};
