const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TOKEN = process.env.DISCORD_TOKEN;

async function revokeAllInvitesInGuild(guild) {
  const me = await guild.members.fetchMe();

  if (!me.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    console.log(`[${guild.name}] Sem permissão ManageGuild.`);
    return;
  }

  const invites = await guild.invites.fetch();
  console.log(`[${guild.name}] Convites encontrados: ${invites.size}`);

  for (const invite of invites.values()) {
    try {
      await invite.delete("Revogação automática de convites");
      console.log(`Revogado: ${invite.code}`);
    } catch (e) {
      console.log(`Falhou ao revogar ${invite.code}: ${e?.message || e}`);
    }
  }
}

client.once("ready", async () => {
  console.log(`Logado como ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await revokeAllInvitesInGuild(guild);
  }

  console.log("Finalizado.");
});

client.login(TOKEN);
