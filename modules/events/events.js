const fs = require("fs");
const path = require("path");

const settingsPath = path.join(__dirname, "groupSettings.json");
if (!fs.existsSync(settingsPath)) fs.writeFileSync(settingsPath, "{}");

function loadSettings() {
    return JSON.parse(fs.readFileSync(settingsPath));
}

function saveSettings(data) {
    fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
}

const groupDataPath = path.join(__dirname, "groupData.json");
if (!fs.existsSync(groupDataPath)) fs.writeFileSync(groupDataPath, "{}");

function loadGroupData() {
    return JSON.parse(fs.readFileSync(groupDataPath));
}

function saveGroupData(data) {
    fs.writeFileSync(groupDataPath, JSON.stringify(data, null, 2));
}

module.exports = async ({ api, event }) => {
    const { threadID } = event;
    let settings = loadSettings();
    if (!settings[threadID]) return;
    let groupData = loadGroupData();
    if (!groupData[threadID]) groupData[threadID] = {};

    // حفظ الاسم والصورة والكنيات لأول مرة
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        if (!groupData[threadID].name) groupData[threadID].name = threadInfo.threadName;
        if (!groupData[threadID].image) groupData[threadID].image = threadInfo.imageSrc;
        groupData[threadID].nicknames = groupData[threadID].nicknames || {};
        threadInfo.userInfo.forEach(u => {
            if (!groupData[threadID].nicknames[u.id]) groupData[threadID].nicknames[u.id] = u.nickname || u.name;
        });
        saveGroupData(groupData);
    } catch(e) {}

    // مراقبة التغييرات
    const threadInfo = await api.getThreadInfo(threadID);
    // اسم المجموعة
    if (settings[threadID].groupName === "✅" && threadInfo.threadName !== groupData[threadID].name) {
        await api.setTitle(groupData[threadID].name, threadID);
        await api.sendMessage("⚠️ التغير غير مسموح به، لذلك تمت إعادة اسم المجموعة إلى حالته الأصلية.", threadID);
    }

    // صورة المجموعة
    if (settings[threadID].groupImage === "✅" && threadInfo.imageSrc !== groupData[threadID].image) {
        await api.changeGroupImage(groupData[threadID].image, threadID);
        await api.sendMessage("⚠️ التغير غير مسموح به، لذلك تمت إعادة صورة المجموعة إلى حالتها الأصلية.", threadID);
    }

    // كنيات الأعضاء
    if (settings[threadID].nicknames === "✅") {
        threadInfo.userInfo.forEach(async u => {
            const oldNick = groupData[threadID].nicknames[u.id];
            if (u.nickname !== oldNick) {
                await api.changeNickname(oldNick, threadID, u.id);
                await api.sendMessage(`⚠️ التغير غير مسموح به، لذلك تمت إعادة كنية ${u.name} إلى حالتها الأصلية.`, threadID);
            }
        });
    }
};
