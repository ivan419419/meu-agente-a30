const { Telegraf } = require('telegraf');

async function createBot() {
  const botToken = process.env.BOT_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!botToken || !geminiApiKey) {
    throw new Error('Configure BOT_TOKEN e GEMINI_API_KEY.');
  }

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const bot = new Telegraf(botToken);

  bot.start((ctx) =>
    ctx.reply('Olá! Sou o Meu Agente A30. Envie uma pergunta para conversar comigo.')
  );

  bot.on('text', async (ctx) => {
    const texto = ctx.message.text.trim();
    if (!texto || texto.startsWith('/')) return;

    try {
      await ctx.sendChatAction('typing');

      const respostaGemini = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: texto,
      });

      const resposta = (respostaGemini.text || '').trim();

      if (!resposta) {
        await ctx.reply('Não consegui gerar uma resposta. Tente perguntar de outro jeito.');
        return;
      }

      for (let inicio = 0; inicio < resposta.length; inicio += 3900) {
        await ctx.reply(resposta.slice(inicio, inicio + 3900));
      }
    } catch (_erro) {
      console.error('Falha ao consultar a API Gemini. Confira a conexão e as cotas da API.');
      await ctx.reply(
        'Não consegui responder agora. Confira a conexão e o limite de uso da API e tente novamente.'
      );
    }
  });

  bot.catch(async (_erro, ctx) => {
    console.error('Falha ao processar uma atualização do Telegram.');
    try {
      await ctx.reply('Ocorreu um erro no bot. Tente novamente.');
    } catch (_erroAoResponder) {
      // A conversa pode não estar disponível para receber a mensagem de erro.
    }
  });

  return bot;
}

module.exports = { createBot };
