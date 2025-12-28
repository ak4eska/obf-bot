const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  
  execute(client) {
    console.log(`Logged in is as ${client.user.tag}`);
    client.user.setPresence({
      activities: [{
        name: 'Spectra Obfuscafor (Powered by Prometheus)',
        type: ActivityType.Listening
      }]
    });
  }
};