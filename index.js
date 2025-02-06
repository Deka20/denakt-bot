require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Load auto-response dari file JSON
let responses = {};
const responsesFile = 'responses.json';

if (fs.existsSync(responsesFile)) {
    responses = JSON.parse(fs.readFileSync(responsesFile, 'utf8'));
}

// Fungsi untuk menyimpan auto-response ke file
function saveResponses() {
    fs.writeFileSync(responsesFile, JSON.stringify(responses, null, 2));
}

// Ketika bot sudah online
client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} sudah online!`);
});

// Ketika ada pesan masuk
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const lowerCaseMessage = message.content.toLowerCase();

    // Cek apakah ada auto-response untuk pesan ini
    if (responses[lowerCaseMessage]) {
        const responseData = responses[lowerCaseMessage];

        // Jika respons adalah teks
        if (responseData.type === "text") {
            return message.reply(responseData.content);
        }

        // Jika respons adalah gambar
        if (responseData.type === "image") {
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle("Auto-Response")
                .setImage(responseData.content);

            return message.reply({ embeds: [embed] });
        }
    }

    // Tambah auto-response teks: !addresponse "trigger" "respon"
    if (message.content.startsWith('!addresponse')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Kamu tidak punya izin untuk menambahkan auto-response.");
        }

        const args = message.content.match(/"([^"]+)"/g);
        if (!args || args.length < 2) {
            return message.reply("❌ Format salah! Gunakan: `!addresponse \"trigger\" \"respon\"`");
        }

        const trigger = args[0].replace(/"/g, '').toLowerCase();
        const response = args[1].replace(/"/g, '');

        responses[trigger] = { type: "text", content: response };
        saveResponses();
        message.reply(`✅ Auto-response ditambahkan!\n**Trigger:** \`${trigger}\`\n**Respon:** ${response}`);
    }

    // Tambah auto-response gambar: !addimage "trigger" "url_gambar"
    if (message.content.startsWith('!addimage')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Kamu tidak punya izin untuk menambahkan auto-response.");
        }

        const args = message.content.match(/"([^"]+)"/g);
        if (!args || args.length < 2) {
            return message.reply("❌ Format salah! Gunakan: `!addimage \"trigger\" \"url_gambar\"`");
        }

        const trigger = args[0].replace(/"/g, '').toLowerCase();
        const imageUrl = args[1].replace(/"/g, '');

        if (!imageUrl.startsWith("http")) {
            return message.reply("❌ URL gambar harus berupa link yang valid!");
        }

        responses[trigger] = { type: "image", content: imageUrl };
        saveResponses();
        message.reply(`✅ Auto-response gambar ditambahkan!\n**Trigger:** \`${trigger}\`\n**Gambar:** ${imageUrl}`);
    }

    // Hapus auto-response: !delresponse "trigger"
    if (message.content.startsWith('!delresponse')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Kamu tidak punya izin untuk menghapus auto-response.");
        }

        const args = message.content.match(/"([^"]+)"/g);
        if (!args || args.length < 1) {
            return message.reply("❌ Format salah! Gunakan: `!delresponse \"trigger\"`");
        }

        const trigger = args[0].replace(/"/g, '').toLowerCase();

        if (!responses[trigger]) {
            return message.reply("❌ Trigger tidak ditemukan dalam daftar auto-response.");
        }

        delete responses[trigger];
        saveResponses();
        message.reply(`✅ Auto-response dengan trigger \`${trigger}\` telah dihapus.`);
    }

    // Lihat daftar auto-response: !listresponse
    if (message.content === '!listresponse') {
        if (Object.keys(responses).length === 0) {
            return message.reply("📭 Tidak ada auto-response yang tersimpan.");
        }

        let responseList = "**Daftar Auto-Response:**\n";
        for (const [trigger, responseData] of Object.entries(responses)) {
            responseList += `🔹 **${trigger}** → ${responseData.type === "text" ? responseData.content : "[Gambar]"}\n`;
        }

        message.reply(responseList);
    }
});

// Login dengan token
client.login(process.env.TOKEN);
