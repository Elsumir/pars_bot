const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const fs = require('fs');
let rawdata = fs.readFileSync('my.json');
let parseddata = JSON.parse(rawdata);

app.get('/', (req, res) => {
  res.send('Bot is alive');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const url =
  'https://1xstavka.ru/LiveFeed/Get1x2_VZip?sports=6&count=50&gr=44&antisports=188&mode=4&country=1&partner=51';

const botToken = process.env.BOT;
const chatId = process.env.CHAT;

const messageForBot = async (messageText) => {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: messageText,
    }),
  });

  console.log('Есть событие!');
};

const sendTelegramMessage = async (result) => {
  if (!result) {
    const messageText = 'Не работаю';
    messageForBot(messageText);
  } else {
    const { id, liga, partyOne, partyTwo, sets } = result;
    const noDubl = parseddata.filter((e) => e.id === id).length;

    if (noDubl) {
      return;
    }
    const messageText = `Лига: ${liga} | К1: ${partyOne} | К2: ${partyTwo} | Счет: ${sets}`;
    messageForBot(messageText);

    await parseddata.push({
      id,
    });
    let data = JSON.stringify(parseddata);
    fs.writeFileSync('my.json', data);
  }
};

const searchEvent = () => {
  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const championship = data.Value.filter((e) => e.L.includes('Женщины'));

      championship.forEach((obj) => {
        const set = obj.SC.PS.map((e) => e.Value).map((e) => e.S1 + e.S2);

        let over = 0;
        set.forEach((e) => {
          e > 44 || over > 1 ? (over += 1) : (over = 0);

          if (over > 1 && set.length < 4) {
            const result = {
              id: obj.I,
              liga: obj.L,
              partyOne: obj.O1,
              partyTwo: obj.O2,
              sets: set,
            };
            sendTelegramMessage(result);
          }
        });
      });
      console.log('Работаю!');
    })
    .catch(() => sendTelegramMessage());
};
// res();
setInterval(searchEvent, 60000);

if (parseddata.length > 100) {
  const newArr = parseddata.pop();
  const data = JSON.stringify(newArr);
  fs.writeFileSync('my.json', data);
}

const bot = new TelegramBot(botToken, { polling: true });

bot.on('message', (msg) => {
  bot.sendMessage(chatId, 'Работаю!');
});

module.exports = app;



