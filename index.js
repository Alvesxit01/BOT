const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.log("❌ ERRO: variável DISCORD_TOKEN não encontrada.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ============================
// COMANDO SLASH /reset
// ============================
const commands = [
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Revoga TODOS os convites do servidor atual (somente deste servidor).")
].map(cmd => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    console.log("🔄 Registrando comandos...");
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.log("❌ Erro ao registrar comandos:", err);
  }
}

// ============================
// FUNÇÃO: REVOGAR CONVITES
// ============================
async function revokeAllInvitesInGuild(guild) {
  const me = await guild.members.fetchMe();

  if (!me.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    return { ok: false, msg: "❌ Eu não tenho permissão **Manage Server** nesse servidor." };
  }

  const invites = await guild.invites.fetch();
  let revoked = 0;

  for (const invite of invites.values()) {
    try {
      await invite.delete("Reset de convites via comando /reset");
      revoked++;
    } catch (e) {
      // ignora convites que falharem
    }
  }

  return { ok: true, revoked };
}

// ============================
// EVENTO READY
// ============================
client.once("ready", async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  // registrar comandos ao iniciar
  // (precisa do CLIENT_ID no Railway)
  if (!process.env.CLIENT_ID) {
    console.log("⚠️ CLIENT_ID não definido. Comandos não serão registrados.");
    console.log("➡️ Adicione CLIENT_ID nas variáveis do Railway.");
  } else {
    await registerCommands();
  }
});

// ============================
// INTERAÇÕES SLASH
// ============================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "reset") {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: "❌ Esse comando só funciona dentro de um servidor.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "🔄 Revogando convites... aguarde.",
      ephemeral: true
    });

    try {
      const result = await revokeAllInvitesInGuild(guild);

      if (!result.ok) {
        return interaction.editReply({
          content: result.msg
        });
      }

      return interaction.editReply({
        content: `✅ Reset concluído! Convites revogados: **${result.revoked}**`
      });
    } catch (err) {
      console.log("Erro /reset:", err);
      return interaction.editReply({
        content: "❌ Erro ao tentar revogar convites."
      });
    }
  }
});

client.login(TOKEN);
