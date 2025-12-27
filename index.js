require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection
} = require('discord.js');

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
  const fPath = path.join(eventPath, file);
  const event = require(fPath);
  if (event.once) {
    client.once(event.name, (... args) => event.execute(
      ... args, client
    ));
  } else {
    client.on(event.name, (... args) => event.execute(... args, client));
  }
}

const cPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(cPath).filter(f => f.endsWith('.js'));
for (const cmd of commandFiles) {
    const fCmd = path.join(cPath, cmd);
    const commands = require(fCmd);
    if (commands.data && commands.data.name) {
      commands.set(command.data.name, commands);
    } else {
        console.log(`Commands ${commands} is invalid`);
    }
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    const commandJSON = client.commands.map(c => c.data.toJSON());
    console.log('Started refreshing (/) commands');
    const data = await rest.put(
      Routes.applicationCommand(process.env.CLIENT_ID),
      { body: commandJSON}
    );
    console.log(`Reloaded ${data.length} command(s)`);
  } catch (e) {
    console.warn(e.messages);
  }
})();

client.login(process.env.TOKEN);