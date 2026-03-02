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

// 🛡️ PROTEÇÃO TOTAL CONTRA CRASH
process.on('unhandledRejection', error => {
  console.error('Erro não tratado:', error);
});
process.on('uncaughtException', error => {
  console.error('Erro crítico:', error);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// 📌 COMANDO
const commands = [
  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Revoga todos os convites do servidor')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Comando registrado!');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'reset') {

    await interaction.reply({
      content: '🧹 Revogando convites...',
      ephemeral: true
    });

    try {

      const invites = await interaction.guild.invites.fetch();

      if (!invites.size) {
        return interaction.editReply('⚠️ Não há convites ativos.');
      }

      let apagados = 0;
      let falhas = 0;

      for (const invite of invites.values()) {
        try {
          await invite.delete();
          apagados++;
        } catch (err) {
          falhas++;
          console.log(`Erro ao apagar ${invite.code}`);
        }
      }

      await interaction.editReply(
        `✅ ${apagados} convites apagados.\n❌ ${falhas} falharam.`
      );

    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Erro ao buscar convites.');
    }
  }
});

client.login(TOKEN);
