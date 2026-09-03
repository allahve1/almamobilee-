const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = process.env.TOKEN;
const ADMIN_ID = 7262941693;
const JSONBIN_KEY = process.env.JSONBIN_KEY; // Bunu indi əlavə edəcəyik
const BIN_ID = '6a993a4a23a2f6593e5a1743'; // Sənin ID-n

const bot = new TelegramBot(TOKEN, {polling: true});
let products = [];

// Məhsulları JSONBIN-dən oxu
async function loadProducts() {
  try {
    const res = await axios.get(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    products = res.data.record || [];
    console.log('Məhsullar yükləndi:', products.length);
  } catch(e) {
    console.log('Xəta:', e.message);
    products = [];
  }
}

// Məhsulları JSONBIN-ə yaz
async function saveProducts() {
  try {
    await axios.put(`https://api.jsonbin.io/v3/b/${BIN_ID}`, products, {
      headers: { 'X-Master-Key': JSONBIN_KEY, 'Content-Type': 'application/json' }
    });
  } catch(e) {
    console.log('Yazma xətası:', e.message);
  }
}

// === UPTIMEROBOT ÜÇÜN SERVER ===
const http = require('http');
http.createServer((req, res) => res.end('OK')).listen(process.env.PORT || 3000);


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

bot.on('message', async (msg) => {
  if(msg.from.id != ADMIN_ID) return;
  if(msg.text === 'Məhsul Əlavə Et') {
    bot.sendMessage(msg.chat.id, 'Format: ad|qiymet|tesvir\nNümunə: iPhone 15|2500|128GB Ağ');
    bot.once('message', async (m) => {
      const [ad, qiymet, tesvir] = m.text.split('|');
      products.push({ad, qiymet, tesvir});
      await saveProducts(); // JSONBIN-ə yazır
      bot.sendMessage(msg.chat.id, '✅ Məhsul əlavə edildi və buluda yadda saxlanıldı!');
    });
  }
  if(msg.text === 'Məhsulları Sil') {
    products = [];
    await saveProducts();
    bot.sendMessage(msg.chat.id, '🗑️ Bütün məhsullar silindi');
  }
});

loadProducts(); // Bot başlayanda məhsulları yüklə
console.log('Bot işləyir. Admin ID:', ADMIN_ID);
