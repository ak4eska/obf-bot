require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const commands = new Collection();

const eventPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventPath).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(eventPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

const cPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(cPath).filter(f => f.endsWith('.js'));
for (const cmdFile of commandFiles) {
    const cmd = require(path.join(cPath, cmdFile));
    if (cmd.data && cmd.data.name) {
        commands.set(cmd.data.name, cmd);
    } else {
        console.log(`Command ${cmdFile} is invalid`);
    }
}

client.commands = commands;


const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    const commandJSON = client.commands.map(c => c.data.toJSON());
    console.log('Started refreshing (/) commands');
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandJSON }
    );
    console.log(`Reloaded ${data.length} command(s)`);
  } catch (e) {
    console.warn(e.message);
  }
})();

client.login(process.env.TOKEN);