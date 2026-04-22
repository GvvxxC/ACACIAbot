
const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

const commands = [
  { name: 'mines', description: 'Play Gem Hunt' },
  { name: 'mm-balance', description: 'Check your Middleman Passes' },
  {
    name: 'give',
    description: 'Give a user free passes (Admin only)',
    options: [
      { name: 'user', description: 'The user to give passes to', type: 6, required: true },
      { name: 'amount', description: 'Number of passes to give', type: 4, required: true }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(Routes.applicationCommands(clientId), { body: [] });
  console.log('Cleared global commands');
  
  await rest.put(
    Routes.applicationGuildCommands(clientId, guildId),
    { body: commands }
  );
  console.log('Commands registered!');
})();
