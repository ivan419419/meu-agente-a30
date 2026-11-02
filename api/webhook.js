const crypto = require('node:crypto');
const { createBot } = require('../bot');

let botPromise;

function segredoValido(recebido, esperado) {
  if (typeof recebido !== 'string' || typeof esperado !== 'string') {
    return false;
  }

  const recebidoBuffer = Buffer.from(recebido, 'utf8');
  const esperadoBuffer = Buffer.from(esperado, 'utf8');

  return (
    recebidoBuffer.length === esperadoBuffer.length &&
    crypto.timingSafeEqual(recebidoBuffer, esperadoBuffer)
  );
}

function obterBot() {
  if (!botPromise) {
    botPromise = createBot().catch((erro) => {
      botPromise = undefined;
      throw erro;
    });
  }

  return botPromise;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const segredoEsperado = process.env.TELEGRAM_WEBHOOK_SECRET;
  const segredoRecebido = req.headers['x-telegram-bot-api-secret-token'];

  if (!segredoEsperado || !segredoValido(segredoRecebido, segredoEsperado)) {
    return res.status(401).send('Unauthorized');
  }

  let update;

  try {
    update = req.body;

    if (typeof update === 'string') {
      update = JSON.parse(update);
    } else if (Buffer.isBuffer(update)) {
      update = JSON.parse(update.toString('utf8'));
    }
  } catch (_erro) {
    return res.status(400).send('Invalid JSON');
  }

  if (!update || typeof update !== 'object' || Array.isArray(update)) {
    return res.status(400).send('Invalid update');
  }

  try {
    const bot = await obterBot();
    await bot.handleUpdate(update);
    return res.status(200).send('OK');
  } catch (_erro) {
    console.error('Webhook update failed.');
    return res.status(500).send('Internal Server Error');
  }
};
