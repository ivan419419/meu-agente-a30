require('dotenv').config();
const { Telegraf } = require('telegraf');

const botToken = process.env.BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!botToken || !geminiApiKey) {
  console.error('ERRO: configure BOT_TOKEN e GEMINI_API_KEY no arquivo .env.');
  process.exit(1);
}

const bot = new Telegraf(botToken);

async function main() {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  bot.start((ctx) =>
    ctx.reply('Olá! Sou o Meu Agente A30. Envie uma pergunta para conversar comigo.')
  );

  bot.on('text', async (ctx) => {
    const texto = ctx.message.text.trim();
    if (!texto || texto.startsWith('/')) return;

    try {
      await ctx.sendChatAction('typing');
      const respostaGemini = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: texto,
      });
      const resposta = (respostaGemini.text || '').trim();

      if (!resposta) {
        await ctx.reply('Não consegui gerar uma resposta. Tente perguntar de outro jeito.');
        return;
      }

      // O Telegram limita o tamanho de cada mensagem; envia respostas longas em partes.
      for (let inicio = 0; inicio < resposta.length; inicio += 3900) {
        await ctx.reply(resposta.slice(inicio, inicio + 3900));
      }
    } catch (_erro) {
      console.error('Falha ao consultar a API Gemini. Confira a conexão e as cotas da API.');
      await ctx.reply('Não consegui responder agora. Confira a conexão e o limite de uso da API e tente novamente.');
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

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  await bot.launch();
  console.log('Meu Agente A30 está rodando em modo local.');
}

main().catch((_erro) => {
  console.error('Não consegui iniciar. Confira as dependências, o Node e as variáveis do .env.');
  process.exit(1);
});
