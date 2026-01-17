module.exports.config = {
    name: "settings",
    version: "1.0.1",
    hasPermssion: 2,
    credits: "rX / تعريب وتعديل Gemini",
    description: "إعدادات البوت والتحكم في المجموعات",
    commandCategory: "admin",
    usages: "settings",
    cooldowns: 10,
};

const totalPath = __dirname + '/cache/totalChat.json';
const _24hours = 86400000;
const fs = require("fs-extra");

function handleByte(byte) {
    const units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
    let i = 0, usage = parseInt(byte, 10) || 0;
    while(usage >= 1024 && ++i) usage = usage/1024;
    return(usage.toFixed(usage < 10 && i > 0 ? 1 : 0) + ' ' + units[i]);
}

function handleOS(ping) {
    var os = require("os");
    return `📌 سرعة الاستجابة: ${Date.now() - ping} ملي ثانية.\n\n`;
}

module.exports.onLoad = function() {
    const { writeFileSync, existsSync } = require('fs-extra');
    const { resolve } = require("path");
    const path = resolve(__dirname, 'cache', 'data.json');
    if (!existsSync(path)) {
        const obj = { adminbox: {} };
        writeFileSync(path, JSON.stringify(obj, null, 4));
    }
}

module.exports.run = async function({ api, event }) {
    const { threadID, messageID } = event;
    return api.sendMessage({
        body: `======== 🛠️ إعدادات النظام ========\n[1] إعادة تشغيل البوت\n[2] تحديث ملف config.json\n[3] تحديث بيانات المجموعات\n[4] تحديث بيانات المستخدمين\n[5] تسجيل خروج الحساب\n======== 🛡️ حماية وادارة ========\n[6] وضع المسؤول فقط (تشغيل/إيقاف)\n[7] منع دخول الأعضاء الجدد\n[8] تشغيل وضع الحماية (Anti-robbery)\n[9] منع الخروج من المجموعة (Antiout)\n[10] تنظيف الحسابات المحذوفة\n======== 📊 إحصائيات ومعلومات =======\n[11] حالة نظام البوت\n[12] إحصائيات هذه المجموعة\n[13] قائمة مشرفي المجموعة\n[14] قائمة مطوري البوت\n[15] قائمة المجموعات المشتركة\n-----------\n 👉 قم بالرد على هذه الرسالة برقم الخيار المطلوب\n\n`
    }, threadID, (error, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "choosee",
        })
    }, messageID)
}

module.exports.handleReply = async function({ args, event, Users, Threads, api, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    const moment = require("moment-timezone");
    const developerID = "61581906898524"; // المعرف الخاص بك

    if (handleReply.type === "choosee") {
        switch (body) {
            case "1": {
                if (senderID !== developerID) return api.sendMessage("⚠️ هذا الخيار مخصص لمطور البوت فقط.", threadID, messageID);
                return api.sendMessage(`《 جاري إعادة التشغيل الآن... 》`, threadID, () => process.exit(1));
            }
            case "2": {
                if (senderID !== developerID) return api.sendMessage("⚠️ هذا الخيار مخصص للمطور فقط.", threadID, messageID);
                delete require.cache[require.resolve(global.client.configPath)];
                global.config = require(global.client.configPath);
                return api.sendMessage("✅ تم تحديث ملف الإعدادات (config.json) بنجاح.", threadID, messageID);
            }
            case "3": {
                if (senderID !== developerID) return api.sendMessage("⚠️ عذراً، هذا الأمر للمطور فقط.", threadID, messageID);
                var inbox = await api.getThreadList(100, null, ['INBOX']);
                let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
                for (var groupInfo of list) {
                    var threadInfo = await api.getThreadInfo(groupInfo.threadID);
                    await Threads.setData(groupInfo.threadID, { threadInfo });
                }
                return api.sendMessage(`✅ تم تحديث بيانات ${list.length} مجموعة بنجاح.`, threadID);
            }
            case "4": {
                if (senderID !== developerID) return api.sendMessage("⚠️ هذا الأمر للمطور فقط.", threadID, messageID);
                var inbox = await api.getThreadList(100, null, ['INBOX']);
                let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
                for (var groupInfo of list) {
                    var { participantIDs } = await Threads.getInfo(groupInfo.threadID) || await api.getThreadInfo(groupInfo.threadID);
                    for (var id of participantIDs) {
                        let data = await api.getUserInfo(id);
                        await Users.setData(id, { name: data[id].name, data: {} });
                    }
                }
                return api.sendMessage(`✅ تم تحديث بيانات جميع المستخدمين بنجاح.`, threadID);
            }
            case "5": {
                if (senderID !== developerID) return api.sendMessage("⚠️ هذا الأمر للمطور فقط.", threadID, messageID);
                api.sendMessage("جاري تسجيل الخروج من الحساب...", threadID, () => api.logout());
            } break;
            case "6": {
                const { writeFileSync } = require("fs-extra");
                const { resolve } = require("path");
                const pathData = resolve(__dirname, 'cache', 'data.json');
                const database = require(pathData);
                const { adminbox } = database;
                if (adminbox[threadID] == true) {
                    adminbox[threadID] = false;
                    api.sendMessage("🔓 تم إيقاف وضع المسؤول فقط. الآن يمكن للجميع استخدام البوت.", threadID, messageID);
                } else {
                    adminbox[threadID] = true;
                    api.sendMessage("🔒 تم تفعيل وضع المسؤول فقط. الآن لا يستطيع سوى مشرفي المجموعة استخدام البوت.", threadID, messageID);
                }
                writeFileSync(pathData, JSON.stringify(database, null, 4));
            } break;
            case "7": {
                const info = await api.getThreadInfo(threadID);
                if (!info.adminIDs.some(item => item.id == api.getCurrentUserID())) return api.sendMessage('❌ يجب أن يكون البوت مسؤولاً في المجموعة لتفعيل هذا الوضع.', threadID, messageID);
                const data = (await Threads.getData(threadID)).data || {};
                data.newMember = !data.newMember;
                await Threads.setData(threadID, { data });
                return api.sendMessage(`✅ تم ${data.newMember ? "تفعيل" : "إيقاف"} وضع منع الأعضاء الجدد بنجاح.`, threadID);
            } break;
            case "8": {
                const info = await api.getThreadInfo(threadID);
                if (!info.adminIDs.some(item => item.id == api.getCurrentUserID())) return api.sendMessage('❌ البوت يحتاج لصلاحية مسؤول لتشغيل الحماية.', threadID, messageID);
                const data = (await Threads.getData(threadID)).data || {};
                data.guard = !data.guard;
                await Threads.setData(threadID, { data });
                return api.sendMessage(`✅ تم ${data.guard ? "تفعيل" : "إيقاف"} وضع حماية المجموعة.`, threadID);
            } break;
            case "9": {
                let data = (await Threads.getData(threadID)).data || {};
                data.antiout = !data.antiout;
                await Threads.setData(threadID, { data });
                return api.sendMessage(`✅ تم ${data.antiout ? "تشغيل" : "إيقاف"} وضع منع الخروج.`, threadID);
            } break;
            case "10": {
                const info = await api.getThreadInfo(threadID);
                const isAdmin = info.adminIDs.some(e => e.id == api.getCurrentUserID());
                let arr = info.userInfo.filter(e => e.gender == undefined).map(e => e.id);
                if (arr.length == 0) return api.sendMessage("✨ لا يوجد حسابات محذوفة (User Facebook) في المجموعة.", threadID);
                if (!isAdmin) return api.sendMessage("❌ البوت ليس مسؤولاً، لا يمكنني طردهم.", threadID);
                api.sendMessage(`🔍 تم العثور على ${arr.length} حساب محذوف. جاري التنظيف...`, threadID, async () => {
                    let count = 0;
                    for (const id of arr) {
                        await new Promise(r => setTimeout(r, 1000));
                        await api.removeUserFromGroup(id, threadID);
                        count++;
                    }
                    api.sendMessage(`✅ تم طرد ${count} حساب محذوف بنجاح.`, threadID);
                });
            } break;
            case "11": {
                const time = process.uptime();
                const hours = Math.floor(time / 3600);
                const minutes = Math.floor((time % 3600) / 60);
                const seconds = Math.floor(time % 60);
                const now = moment.tz("Africa/Khartoum").format("HH:mm:ss");
                return api.sendMessage(`⏰ الوقت الحالي: ${now}\n⏱️ مدة العمل: ${hours} ساعة، ${minutes} دقيقة\n📊 المجموعات: ${global.data.allThreadID.length}\n👤 المستخدمين: ${global.data.allUserID.length}\n⚙️ الأوامر المتاحة: ${global.client.commands.size}\n📌 سرعة النظام: ${Date.now() - event.timestamp}ms`, threadID);
            } break;
            case "12": {
                let threadInfo = await api.getThreadInfo(threadID);
                let males = threadInfo.userInfo.filter(u => u.gender == "MALE").length;
                let females = threadInfo.userInfo.filter(u => u.gender == "FEMALE").length;
                let msg = `📊 إحصائيات المجموعة:\n🔹 الاسم: ${threadInfo.threadName}\n🔹 الآيدي: ${threadID}\n🔹 الأعضاء: ${threadInfo.participantIDs.length}\n🔹 الذكور: ${males}\n🔹 الإناث: ${females}\n🔹 المسؤولين: ${threadInfo.adminIDs.length}\n🔹 عدد الرسائل: ${threadInfo.messageCount}`;
                return api.sendMessage(msg, threadID);
            } break;
            case "13": {
                let threadInfo = await api.getThreadInfo(threadID);
                let listAdmins = "";
                let i = 1;
                for (const admin of threadInfo.adminIDs) {
                    const info = await api.getUserInfo(admin.id);
                    listAdmins += `${i++}. ${info[admin.id].name}\n`;
                }
                return api.sendMessage(`قائمة مشرفي المجموعة:\n${listAdmins}`, threadID);
            } break;
            case "14": {
                const admins = global.config.ADMINBOT || [];
                let msg = "⭐ مطوري البوت:\n";
                for (const id of admins) {
                    let name = (await Users.getData(id)).name || id;
                    msg += `• ${name} (fb.me/${id})\n`;
                }
                return api.sendMessage(msg, threadID);
            } break;
            case "15": {
                if (senderID !== developerID) return api.sendMessage("⚠️ للمطور فقط.", threadID);
                let inbox = await api.getThreadList(100, null, ["INBOX"]);
                let list = inbox.filter(g => g.isGroup);
                let msg = "💌 المجموعات المشترك بها:\n";
                list.forEach((g, idx) => {
                    msg += `${idx + 1}. ${g.name}\n🆔 ${g.threadID}\n\n`;
                });
                return api.sendMessage(msg, threadID);
            } break;
        }
    }
}
