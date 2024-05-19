import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import * as bot from './botcommands.js';
import * as database from './database.js';
import * as cron from 'node-cron';

// Load environment variables
dotenv.config();
console.log("Environment variables loaded.");

// Database connection
var con = database.DatabaseConnect();

// Create an instance of the Discord bot.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});
client.on('ready', (c) => {
    console.log(`${c.user.tag} is online`);
});

// Bot message commands
client.on('messageCreate', async (message) => {
    // Exit on self message.
    if (message.author.bot) return;

    // Check if user is in the database, add user to the database if not
    try {
        const userExists = await database.CheckIfUserInDatabase(message, con);
        if (!userExists) {
             database.AddUser(message, con); // Assuming AddUser is also async
             database.UpdateBaitOne(3, message.member.user.id, con); // Assuming UpdateBaitOne is also async
        }
    } catch (error) {
        console.log('Error handling user check:', error);
    }
    
    // Bot commands. See botcommands.js for logic
    switch (message.content) {
        case "/fish":
            bot.FishCommand(message, con);
            break;
        case "/shop":
            bot.ShopCommand(message, con, client);
            break;
        case "/box":
            bot.BoxCommand(message, con);
            break;
        case "/board":
            bot.LeaderboardCommand(message, con);
            break;
        case "/hello":
            bot.HelloCommand(message);
            break;
        case "/help":
            bot.HelpCommand(message);
            break;
        default:
            message.reply('Unknown command.');
    };
});

// Bot interactions
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) {
        return;
    }
    // Check if the interacction and message user are the same
    const userKeys = interaction.message.mentions.users.keys();
    const key = userKeys.next().value;
    if (interaction.member.user.id !== key)return;

    // Switch on shop commands
    switch (interaction.customId) {
        case "buy-bait":
            bot.BuyBait(interaction, con, interaction.member.user.id);
            break;
        case "buy-lure":
            interaction.reply(`${interaction.user} bought 1 lure`);
            break;
        case "buy-net":
            interaction.reply(`${interaction.user} bought 1 net`);
            break;
        case "buy-map":
            interaction.reply(`${interaction.user} bought 1 map`);
            break;
        default:
            break;
    }
});

// Schedule UpdateBait fucntion to run every hour on the hour
function UpdateBait() {
    console.log("Adding hourly 3 bait to each player.");
    database.UpdateBaitAll(3, con);
};
cron.schedule('0 * * * *', UpdateBait);

// Log the bot into Discord.
client.login(process.env.DISCORD_TOKEN);
