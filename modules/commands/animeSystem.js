const { 
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, 
    StringSelectMenuBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const axios = require('axios');

module.exports = {
    // 1. تعريف الأمر مع خاصية الإكمال التلقائي
    data: new SlashCommandBuilder()
        .setName('anime')
        .setDescription('🔍 نظام البحث عن الأنمي المطور V15')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('اكتب اسم الأنمي الذي تبحث عنه...')
                .setRequired(true)
                .setAutocomplete(true)),

    // 2. نظام الإكمال التلقائي الذكي (Autocomplete)
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        if (!focusedValue) return;

        try {
            const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(focusedValue)}&limit=5`);
            const choices = res.data.data.map(anime => ({
                name: `🎬 ${anime.title_english || anime.title}`.slice(0, 100),
                value: anime.mal_id.toString() // نستخدم الـ ID لضمان دقة جلب البيانات لاحقاً
            }));
            await interaction.respond(choices);
        } catch (err) { /* صامت لتجنب إزعاج الكونسول */ }
    },

    // 3. التنفيذ الرئيسي (Execute)
    async execute(interaction) {
        const animeId = interaction.options.getString('search');
        await interaction.deferReply();

        try {
            const res = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
            const anime = res.data.data;

            // بناء الإمبد (الواجهة الأنيقة)
            const mainEmbed = new EmbedBuilder()
                .setTitle(`🌟 ${anime.title_english || anime.title}`)
                .setURL(anime.url)
                .setColor('#2F3136') // لون داكن فخم
                .setImage(anime.images.jpg.large_image_url)
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/1396/1396180.png') // أيقونة أنمي صغيرة
                .addFields(
                    { name: '⭐ التقييم', value: `\`${anime.score || 'N/A'}\``, inline: true },
                    { name: '🎞️ الحلقات', value: `\`${anime.episodes || '?'}\``, inline: true },
                    { name: '📅 الحالة', value: `\`${anime.status}\``, inline: true },
                    { name: '🎭 التصنيف', value: anime.genres.map(g => g.name).join(', ') }
                )
                .setDescription(anime.synopsis ? anime.synopsis.slice(0, 350) + '...' : 'لا يوجد وصف.')
                .setFooter({ text: 'The Otaku Engine V15 | Developer Access', iconURL: interaction.client.user.displayAvatarURL() });

            // إضافة قائمة خيارات (Select Menu) للتقارير الإضافية
            const menu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('anime_extra')
                        .setPlaceholder('📜 عرض تفاصيل إضافية (الاستوديو، الأغاني...)')
                        .addOptions([
                            { label: 'القصة الكاملة', description: 'عرض ملخص الأنمي بالكامل', value: 'synopsis', emoji: '📖' },
                            { label: 'الاستوديو والإنتاج', description: 'من أنتج هذا العمل؟', value: 'production', emoji: '🎥' },
                            { label: 'العرض الدعائي', description: 'رابط Trailer اليوتيوب', value: 'trailer', emoji: '📺' }
                        ])
                );

            await interaction.editReply({ embeds: [mainEmbed], components: [menu] });

        } catch (error) {
            await interaction.editReply('❌ فشل العثور على تفاصيل الأنمي.');
        }
    }
};
