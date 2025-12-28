const { Events, MessageFlags } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({
          content: `${interaction.commandName} is not found!`,
          flags: 64
        });
      }

      try {
        await command.execute(interaction);
      } catch (e) {
        console.warn(e);
        if (interaction.replied || interaction.defered) {
          await interaction.followUp({
            content: 'There was an error while executing this command!',
            flags: 64
          });
        } else {
          await interaction.reply({
            content: 'There was an error while executing this command!',
            flags: 64
          });
        }
      }
    }
  }
};
