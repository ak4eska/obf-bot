const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const formatSize = require('../handlers/formatSize');
const moveToErrorFolder = require('../handlers/moveToErrorFolder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('obfuscator')
    .setDescription('obfuscate your script lua')
    .addAttachmentOption(opt =>
      opt.setName('file')
        .setDescription('input your file here (.lua)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('preset')
        .setDescription('select your preset')
        .setRequired(true)
        .addChoices(
          { name: 'Minify', value: 'Minify' },
          { name: 'Weak', value: 'Weak' },
          { name: 'Medium', value: 'Medium' },
          { name: 'Strong', value: 'Strong' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const file = interaction.options.getAttachment('file');
    const preset = interaction.options.getString('preset');

    if (!file.name.endsWith('.lua')) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription('File must be **.lua** file')
            .setColor('#04588e')
        ]
      });
    }

    const tempId = Date.now();
    const inputPath = path.join(
      process.cwd(),
      'cache',
      `input_${tempId}.lua`
    );

    try {
      const cacheDir = path.join(process.cwd(), 'cache');
      if (!fs.existsSync(cacheDir)) {
         fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      
      // download file
      const res = await axios.get(file.url, {
        responseType: 'arraybuffer'
      });
      fs.writeFileSync(inputPath, res.data);

      const child = spawn('lua', [
        'Prometheus/cli.lua',
        inputPath,
        '--preset',
        preset
      ]);

      let stderr = '';

      child.stderr.on('data', d => {
        stderr += d.toString();
      });

      const killer = setTimeout(() => {
        child.kill('SIGKILL');
      }, 120000);

      child.on('close', async (code) => {
      clearTimeout(killer);
    
      if (code !== 0 || stderr) {
        moveToErrorFolder(inputPath);
    
        let reason = stderr?.trim() || 'Unknown error';
        if (stderr.includes('Unexpected Token "/"')) {
          reason =
            'Lua 5.1 does not support `//` Use math.floor(a / b)';
        }
    
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Obfuscation Failed')
              .setDescription(reason)
              .setColor('#04588e')
          ]
        });
      }
    
      const obfuscatedPath = inputPath.replace(
        /\.lua$/,
        '.obfuscated.lua'
      );
    
      if (!fs.existsSync(obfuscatedPath)) {
        moveToErrorFolder(inputPath);
    
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription('Output file not found')
              .setColor('#04588e')
          ]
        });
      }
    
      const inputSize = fs.statSync(inputPath).size;
      const outputSize = fs.statSync(obfuscatedPath).size;
      const ratio = ((outputSize / inputSize) * 100).toFixed(2);
    
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Obfuscation Success!')
            .setColor('#04588e')
            .addFields(
              { name: 'Input Size', value: formatSize(inputSize), inline: true },
              { name: 'Output Size', value: formatSize(outputSize), inline: true },
              { name: 'Ratio', value: `${ratio}%`, inline: true }
            )
            .setFooter({ text: 'Powered by Prometheus' })
        ],
        files: [obfuscatedPath]
      });
    
      fs.unlinkSync(inputPath);
      fs.unlinkSync(obfuscatedPath);
    });

    } catch (e) {
      console.error(e);
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription('Failed to process file!')
            .setColor('#04588e')
        ]
      });
    }
  }
};