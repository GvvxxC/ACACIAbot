const config = require('../config.json');
const adminRoleId = process.env.ADMIN_ROLE_ID;

module.exports = {
  name: 'give',
  async execute(interaction, getUser, updateUser) {
    // Check if user has admin role
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({
        content: "❌ You don't have permission to use this command!",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (amount <= 0) {
      return interaction.reply({
        content: "❌ Amount must be greater than 0!",
        ephemeral: true
      });
    }

    const targetUser = getUser(target.id);
    targetUser.mm_passes += amount;
    updateUser(target.id, targetUser);

    return interaction.reply({
      content: `✅ Successfully gave **${amount}** Middleman Pass(es) to <@${target.id}>! They now have **${targetUser.mm_passes}** pass(es).`,
    });
  }
};