const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN;
const ADMIN_ID = 7262941693;
const bot = new TelegramBot(TOKEN, {polling: true});

const DATA_FILE = path.join(__dirname, 'products.json');

// Məhsulları fayldan oxu
function loadProducts() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Məhsulları fayla yaz
function saveProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
}

let products = loadProducts();

// === BU 2 SƏTİR UPTIMEROBOT ÜÇÜNDÜR. SİLMƏ ===
const http = require('http');
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000);
// ================================================


bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `Salam! Alma Mobile 🍎\n/menyu - Məhsullara baxmaq üçün`);
});

bot.onText(/\/menyu/, (msg) => {
  if(products.length === 0) {
    return bot.sendMessage(msg.chat.id, 'Hələ məhsul yoxdur 😔');
  }
  let text = '🍎 *Məhsullarımız:*\n\n';
  products.forEach((p, i) => {
    text += `${i+1}. *${p.ad}* - ${p.qiymet} AZN\n${p.tesvir}\n\n`;
  });
  bot.sendMessage(msg.chat.id, text, {parse_mode: 'Markdown'});
});

bot.onText(/\/admin/, (msg) => {
  if(msg.from.id != ADMIN_ID) return;
  bot.sendMessage(msg.chat.id, 'Admin Panel', {
    reply_markup: {
      keyboard: [['Məhsul Əlavə Et'], ['Məhsulları Sil']],
      resize_keyboard: true
    }
  });
});

bot.on('message', (msg) => {
  if(msg.from.id != ADMIN_ID) return;
  if(msg.text === 'Məhsul Əlavə Et') {
    bot.sendMessage(msg.chat.id, 'Format: ad|qiymet|tesvir\nNümunə: iPhone 15|2500|128GB Ağ');
    bot.once('message', (m) => {
      const [ad, qiymet, tesvir] = m.text.split('|');
      products.push({ad, qiymet, tesvir});
      saveProducts(products); // Fayla yazır
      bot.sendMessage(msg.chat.id, '✅ Məhsul əlavə edildi və yadda saxlanıldı!');
    });
  }
  if(msg.text === 'Məhsulları Sil') {
    products = [];
    saveProducts(products);
    bot.sendMessage(msg.chat.id, '🗑️ Bütün məhsullar silindi');
  }
});

console.log('Bot işləyir. Admin ID:', ADMIN_ID);
