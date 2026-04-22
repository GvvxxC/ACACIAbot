const { Client, GatewayIntentBits } = require('discord.js');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== DATABASE =====
const adapter = new FileSync('./db.json');
const db = low(adapter);

function initDB() {
  db.defaults({ users: {} }).write();
}

function getUser(id) {
  if (!db.get(`users.${id}`).value()) {
    db.set(`users.${id}`, {
      mm_passes: 0,
      active_trade: false,
      reserved_pass: 0,
      last_play: 0
    }).write();
  }
  return db.get(`users.${id}`).value();
}

function updateUser(id, data) {
  db.set(`users.${id}`, data).write();
}

// ===== LOAD COMMANDS =====
const mines = require('./commands/mines.cjs');
const mmbalance = require('./commands/mmbalance.cjs');
const give = require('./commands/give.cjs');
const commands = [mines, mmbalance, give];

// ===== READY =====
client.once('ready', () => {
  initDB();
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = commands.find(c => c.name === interaction.commandName);
  if (command) await command.execute(interaction, getUser, updateUser);
});

const { token } = require('./config.json');
client.login(token);