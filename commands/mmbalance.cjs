module.exports = {
  name: 'mm-balance',
  async execute(interaction, getUser) {
    const user = getUser(interaction.user.id);
    return interaction.reply({
      content: `💎 You have **${user.mm_passes}** Middleman Pass(es)`,
      ephemeral: true
    });
  }
};