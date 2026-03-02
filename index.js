const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require('discord.js');


// 🔐 KEYS (NÃO MUDE)
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;


// 🤖 Criar bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


// 📌 COMANDO /reset
const commands = [
  new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Apaga TODOS os convites do servidor')
    .toJSON()
];


// 📡 Registrar comando no servidor
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comando...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comando /reset registrado!');
  } catch (error) {
    console.error(error);
  }
});


// 🚀 Quando o bot ligar
client.once('ready', () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});


// ⚡ Executar comando
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'reset') {
    try {
      await interaction.reply('🧹 Limpando todos os convites...');

      const invites = await interaction.guild.invites.fetch();

      let total = 0;

      for (const invite of invites.values()) {
        await invite.delete();
        total++;
      }

      await interaction.editReply(
        `✅ ${total} convites foram revogados com sucesso!`
      );

    } catch (error) {
      console.error(error);
      await interaction.editReply(
        '❌ Não consegui apagar os convites.'
      );
    }
  }
});


// 🔌 Ligar bot
client.login(TOKEN);
