const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, {polling: true});

// ===== AYARLAR =====
const SENIN_ID = 7262941693; // SƏNİN TELEGRAM ID
const QRUP_ID = -5268597323; // SİFARİŞ QRUPUN ID

// Renderdə fayl yadda saxlanmır deyə yaddaşda saxlayırıq
let ADMIN_IDS = [SENIN_ID];
let MEHSULLAR = {};
let adminState = {};

// ===== FUNKSİYALAR =====
function isAdmin(userId) {
    return ADMIN_IDS.includes(userId);
}

function menyuYarat() {
    if(Object.keys(MEHSULLAR).length == 0) return "Hələ məhsul yoxdur";
    let cavab = "📱 MƏHSULLAR\n";
    for (let key in MEHSULLAR) {
        let m = MEHSULLAR[key];
        cavab += `📦 ${m.ad}\nQiymət: ${m.qiymet}₼ · Stok: ${m.stok} ədəd\n\n`;
    }
    cavab += "Məhsul almaq üçün adını tam şəkildə yazın."
    return cavab;
}

// ===== KOMANDALAR =====
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Salam! Alma Mobile 🍎\n/menyu - Məhsullara baxmaq üçün");
});

bot.onText(/\/admin/, (msg) => {
    if(!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "Siz admin deyilsiniz ❌");
    const keyboard = {
        reply_markup: {
            keyboard: [
                [{text: "➕ Məhsul Əlavə Et"}, {text: "📦 Stok Dəyiş"}],
                [{text: "📝 Məhsul Sil"}, {text: "📋 Bütün Məhsullar"}],
                [{text: "👤 Admin Əlavə Et"}, {text: "👥 Adminləri Göstər"}],
                [{text: "❌ Ləğv et"}]
            ],
            resize_keyboard: true
        }
    };
    bot.sendMessage(msg.chat.id, "Admin panel", keyboard);
});

bot.onText(/\/menyu/, (msg) => {
    bot.sendMessage(msg.chat.id, menyuYarat());
});

// ===== MESAJ İDARƏ =====
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const user = msg.from;

    if(text == "❌ Ləğv et") {
        adminState[chatId] = {};
        return bot.sendMessage(chatId, "Ləğv edildi");
    }

    // ADMIN ƏMƏLİYYATLARI
    if(isAdmin(user.id)) {
        if(text == "👤 Admin Əlavə Et") {
            adminState[chatId] = "admin_id_gozle";
            return bot.sendMessage(chatId, "Yeni adminin ID-sini yazın");
        }
        if(text == "👥 Adminləri Göstər") {
            return bot.sendMessage(chatId, `Adminlər:\n${ADMIN_IDS.join('\n')}`);
        }
        if(adminState[chatId] == "admin_id_gozle") {
            let yeniId = parseInt(text);
            if(!ADMIN_IDS.includes(yeniId)) {
                ADMIN_IDS.push(yeniId);
                bot.sendMessage(chatId, `✅ ${yeniId} admin əlavə edildi`);
            } else {
                bot.sendMessage(chatId, "Bu ID artıq admin-dir");
            }
            adminState[chatId] = {};
            return;
        }
        if(text == "➕ Məhsul Əlavə Et") {
            adminState[chatId] = {addim: "ad"};
            return bot.sendMessage(chatId, "1. Məhsulun adını yazın\nMisal: iPhone 17 Pro (Cosmic Orange)");
        }
        if(adminState[chatId]?.addim == "ad") {
            adminState[chatId].ad = text; adminState[chatId].addim = "qiymet";
            return bot.sendMessage(chatId, "2. Qiyməti yazın: 2750");
        }
        if(adminState[chatId]?.addim == "qiymet") {
            adminState[chatId].qiymet = parseInt(text); adminState[chatId].addim = "stok";
            return bot.sendMessage(chatId, "3. Stok sayı yazın: 5");
        }
        if(adminState[chatId]?.addim == "stok") {
            adminState[chatId].stok = parseInt(text); adminState[chatId].addim = "tesvir";
            return bot.sendMessage(chatId, "4. Təsviri yazın:\nXüsusiyyətləri:\nYaddaş: 256 GB\nRAM: 12 GB\nProsessor: Apple A19 Pro");
        }
        if(adminState[chatId]?.addim == "tesvir") {
            let ad = adminState[chatId].ad;
            let key = ad.toLowerCase();
            MEHSULLAR[key] = {
                ad: ad,
                qiymet: adminState[chatId].qiymet,
                stok: adminState[chatId].stok,
                tesvir: text
            };
            adminState[chatId] = {};
            return bot.sendMessage(chatId, `✅ ${ad} əlavə edildi!`);
        }
        if(text == "📝 Məhsul Sil") {
            adminState[chatId] = "sil_gozle";
            return bot.sendMessage(chatId, `Silmək üçün adı tam yazın:\n\n${menyuYarat()}`);
        }
        if(adminState[chatId] == "sil_gozle") {
            delete MEHSULLAR[text.toLowerCase()];
            adminState[chatId] = {};
            return bot.sendMessage(chatId, `🗑️ Silindi`);
        }
        if(text == "📦 Stok Dəyiş") {
            adminState[chatId] = "stok_deyis_ad";
            return bot.sendMessage(chatId, "Stokunu dəyişmək istədiyin məhsulun adını yaz");
        }
        if(adminState[chatId] == "stok_deyis_ad") {
            adminState[chatId] = {ad: text.toLowerCase(), addim: "yeni_stok"};
            return bot.sendMessage(chatId, "Yeni stok sayını yazın");
        }
        if(adminState[chatId]?.addim == "yeni_stok") {
            MEHSULLAR[adminState[chatId].ad].stok = parseInt(text);
            adminState[chatId] = {};
            return bot.sendMessage(chatId, `✅ Stok yeniləndi`);
        }
        if(text == "📋 Bütün Məhsullar") {
            return bot.sendMessage(chatId, menyuYarat());
        }
    }

    // MÜŞTƏRİ ƏMƏLİYYATLARI
    if(chatId == QRUP_ID || text.startsWith('/')) return;
    let key = text.toLowerCase();
    if(MEHSULLAR[key]) {
        let m = MEHSULLAR[key];
        if(m.stok > 0) {
            let link = `https://pos.oderopay.com/odeme?amount=${m.qiymet}&order=${key}_${user.id}`;
            bot.sendMessage(chatId, `${m.ad}\n\n${m.tesvir}\n\nQiymət: ${m.qiymet}₼\nStok: ${m.stok} ədəd\nÖdəniş linki:\n${link}`);
            bot.sendMessage(QRUP_ID, `🛒 YENİ SİFARİŞ\nMəhsul: ${m.ad}\nQiymət: ${m.qiymet}₼\nMüştəri: ${user.first_name} @${user.username}\nID: ${user.id}`);
        } else {
            bot.sendMessage(chatId, "Stokda yoxdur 😔");
        }
    } else if(!text.startsWith('/')) {
        bot.sendMessage(chatId, "Belə məhsul yoxdur. /menyu yazın");
    }
});

console.log("Bot işləyir. Adminlər:", ADMIN_IDS);
