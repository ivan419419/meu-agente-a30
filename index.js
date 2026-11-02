require('dotenv').config();

const { createBot } = require('./bot');

async function main() {
  const bot = await createBot();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  await bot.launch();
  console.log('Meu Agente A30 está rodando em modo local.');
}

if (require.main === module) {
  main().catch((_erro) => {
    console.error(
      'Não consegui iniciar. Confira as dependências, o Node e as variáveis do .env.'
    );
    process.exitCode = 1;
  });
}
