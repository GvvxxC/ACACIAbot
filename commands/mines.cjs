const config = require('../config.json');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');


function generateBoard(winChance) {
  const board = Array(25).fill("mine");

  // If 100% win chance, fill all with gems
  if (winChance >= 100) {
    return Array(25).fill("gem");
  }

  // Calculate gem count based on win chance
  // More gems = higher chance of finding 3
  // Formula: adjust gems to approximate the win chance
  let gemCount = 3; // default
  if (winChance >= 75) gemCount = 18;
  else if (winChance >= 50) gemCount = 13;
  else if (winChance >= 25) gemCount = 8;
  else gemCount = 3;

  let gems = 0;
  while (gems < gemCount) {
    let i = Math.floor(Math.random() * 25);
    if (board[i] === "mine") {
      board[i] = "gem";
      gems++;
    }
  }
  return board;
}

function getRoleConfig(member) {
  for (const role of config.roles) {
    if (member.roles.cache.has(role.id)) {
      return role;
    }
  }
  return {
    winChance: config.defaultWinChance,
    cooldown: config.defaultCooldown
  };
}

module.exports = {
  name: 'mines',
  async execute(interaction, getUser, updateUser) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const roleConfig = getRoleConfig(member);
    const COOLDOWN = roleConfig.cooldown * 6 * 1; //COOLDOWN GEV

    const user = getUser(interaction.user.id);

    if (COOLDOWN > 0 && Date.now() - user.last_play < COOLDOWN) {
      const remaining = COOLDOWN - (Date.now() - user.last_play);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      return interaction.reply({
        content: `⏳ You need to wait **${minutes}m ${seconds}s** before playing again!`,
        ephemeral: true
      });
    }

    const board = generateBoard(roleConfig.winChance);
    let found = 0;
    let buttons = [];

    for (let i = 0; i < 25; i++) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`tile_${i}`)
          .setLabel("⬜")
          .setStyle(ButtonStyle.Secondary)
      );
    }

    let rows = [];
    for (let i = 0; i < 5; i++) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i * 5, i * 5 + 5)));
    }

    await interaction.reply({
      content: `💎 Find 3 gems to win a Middleman Pass! *(Win chance: ${roleConfig.winChance}%)*`,
      components: rows
    });

    const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return;

      let index = parseInt(i.customId.split("_")[1]);
      const freshUser = getUser(interaction.user.id);

      if (board[index] === "mine") {
        freshUser.last_play = Date.now();
        updateUser(interaction.user.id, freshUser);

        let revealedButtons = [];
        for (let r = 0; r < 25; r++) {
          if (r === index) {
            revealedButtons.push(new ButtonBuilder().setCustomId(`dead_${r}`).setLabel("💣").setStyle(ButtonStyle.Danger).setDisabled(true));
          } else if (board[r] === "gem") {
            revealedButtons.push(new ButtonBuilder().setCustomId(`gem_${r}`).setLabel("💎").setStyle(ButtonStyle.Success).setDisabled(true));
          } else {
            revealedButtons.push(new ButtonBuilder().setCustomId(`mine_${r}`).setLabel("💣").setStyle(ButtonStyle.Secondary).setDisabled(true));
          }
        }

        let revealedRows = [];
        for (let r = 0; r < 5; r++) {
          revealedRows.push(new ActionRowBuilder().addComponents(revealedButtons.slice(r * 5, r * 5 + 5)));
        }

        return i.update({ content: "💣 You hit a mine! Game over!", components: revealedRows });
      }

      found++;

      if (found === 3) {
        freshUser.mm_passes++;
        freshUser.last_play = Date.now();
        updateUser(interaction.user.id, freshUser);

        let revealedButtons = [];
        for (let r = 0; r < 25; r++) {
          if (board[r] === "gem") {
          revealedButtons.push(new ButtonBuilder().setCustomId(`gem_${r}`).setLabel("💎").setStyle(ButtonStyle.Success).setDisabled(true));
        } else {
          revealedButtons.push(new ButtonBuilder().setCustomId(`mine_${r}`).setLabel("💣").setStyle(ButtonStyle.Secondary).setDisabled(true));
        }
      }

      let revealedRows = [];
      for (let r = 0; r < 5; r++) {
        revealedRows.push(new ActionRowBuilder().addComponents(revealedButtons.slice(r * 5, r * 5 + 5)));
      }

      return i.update({ content: "💎 You won! +1 Pass added to your balance!", components: revealedRows });
    }
      buttons[index].setLabel("💎").setStyle(ButtonStyle.Success).setDisabled(true);

      let newRows = [];
      for (let j = 0; j < 5; j++) {
        newRows.push(new ActionRowBuilder().addComponents(buttons.slice(j * 5, j * 5 + 5)));
      }

      await i.update({ content: `💎 Found: ${found}/3`, components: newRows });
    });
  }
};