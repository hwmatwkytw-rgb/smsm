const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "رانك",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "GPT-5",
  description: "Rank card style",
  commandCategory: "الألعاب",
  usages: "رانك",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users, Currencies }) {
  try {
    const userID = event.senderID;
    const userName = await Users.getNameUser(userID);

    const data = await Currencies.getData(userID);
    const exp = data.exp || 30;
    const maxExp = 37;
    const level = Math.floor(exp / 10);
    const rank = 19;

    const progress = exp / maxExp;

    // صورة الحساب
    const avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;
    const avatar = await Jimp.read(avatarURL);
    avatar.resize(170, 170).circle();

    // الخلفية
    const card = await Jimp.read(path.join(__dirname, "rank_bg.png"));
    card.resize(900, 300);

    // الخطوط
    const fontName = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
    const fontMid = await Jimp.loadFont(Jimp.FONT_SANS_24_WHITE);

    // دمج الصورة
    card.composite(avatar, 40, 65);

    // الاسم
    card.print(fontName, 250, 40, userName);

    // Rank & Level
    card.print(fontMid, 250, 95, `Rank ${rank}`);
    card.print(fontSmall, 250, 135, `Lv.${level}`);

    // XP numbers
    card.print(fontSmall, 700, 135, `${exp}/${maxExp}`);

    // XP bar
    const barX = 250;
    const barY = 170;
    const barW = 550;
    const barH = 20;

    // خلفية الشريط
    card.scan(barX, barY, barW, barH, function (x, y, idx) {
      this.bitmap.data[idx + 0] = 220;
      this.bitmap.data[idx + 1] = 220;
      this.bitmap.data[idx + 2] = 220;
      this.bitmap.data[idx + 3] = 255;
    });

    // التقدم
    card.scan(barX, barY, barW * progress, barH, function (x, y, idx) {
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
      this.bitmap.data[idx + 3] = 255;
    });

    const out = path.join(__dirname, "rank.png");
    await card.writeAsync(out);

    api.sendMessage(
      {
        attachment: fs.createReadStream(out)
      },
      event.threadID,
      () => fs.unlinkSync(out)
    );

  } catch (e) {
    console.log(e);
    api.sendMessage("❌ Error creating rank card", event.threadID);
  }
};
