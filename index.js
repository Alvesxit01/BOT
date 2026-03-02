const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Revoga todos os convites com progresso em tempo real')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log('Comando registrado!');
})();

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'reset') {

    await interaction.reply({
      content: '🔍 Buscando convites...',
      ephemeral: true
    });

    try {
      const invites = await interaction.guild.invites.fetch();
      const total = invites.size;

      if (!total) {
        return interaction.editReply('⚠️ Não há convites ativos.');
      }

      let apagados = 0;
      let falhas = 0;

      const inicio = Date.now();
      const tempoMedioPorConvite = 800; // ms estimado por convite
      const tempoEstimadoTotal = (total * tempoMedioPorConvite) / 1000;

      await interaction.editReply(
        `📊 Total de convites encontrados: ${total}\n` +
        `⏳ Tempo estimado: ~${tempoEstimadoTotal.toFixed(1)} segundos\n\n` +
        `🚀 Iniciando limpeza...`
      );

      for (const invite of invites.values()) {
        try {
          await invite.delete();
          apagados++;
        } catch {
          falhas++;
        }

        // Atualiza a cada 5 convites
        if ((apagados + falhas) % 5 === 0) {
          const progresso = ((apagados + falhas) / total * 100).toFixed(1);
          const tempoDecorrido = (Date.now() - inicio) / 1000;
          const restante = tempoEstimadoTotal - tempoDecorrido;

          await interaction.editReply(
            `📊 Progresso: ${progresso}%\n` +
            `✅ Apagados: ${apagados}\n` +
            `❌ Falhas: ${falhas}\n` +
            `⏱️ Tempo restante estimado: ~${Math.max(0, restante).toFixed(1)}s`
          );
        }

        await sleep(700); // evita rate limit
      }

      const tempoFinal = ((Date.now() - inicio) / 1000).toFixed(1);

      await interaction.editReply(
        `🎉 LIMPEZA FINALIZADA!\n\n` +
        `📊 Total: ${total}\n` +
        `✅ Apagados: ${apagados}\n` +
        `❌ Falhas: ${falhas}\n` +
        `⏱️ Tempo total: ${tempoFinal}s`
      );

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Erro ao buscar convites.');
    }
  }
});

client.login(TOKEN);
