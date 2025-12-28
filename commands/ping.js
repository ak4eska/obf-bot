const { SlashCommandBuilder } = require('discord.js');

module.exports = {
      data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with pong'),
        
      async execute(interaction) {
          const ws = interaction.client.ws.ping;
          await interaction.reply(`Pong!, ${ws} ms`);
      }
};