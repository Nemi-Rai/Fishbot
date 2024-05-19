import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import * as database from './database.js';

const fishTypes = [
    { name: 'None', probability: 0.1, minWeight: 100, maxWeight: 200, score: 15, baseCoin: 20},
    { name: 'Mackerel', probability: 0.18, minWeight: 100, maxWeight: 200, score: 15, baseCoin: 20},
    { name: 'Sole', probability: 0.16, minWeight: 100, maxWeight: 200, score: 25, baseCoin: 40},
    { name: 'Salmon', probability: 0.14, minWeight: 200, maxWeight: 300, score: 20, baseCoin: 60},
    { name: 'Halibut', probability: 0.12, minWeight: 200, maxWeight: 300, score: 30, baseCoin: 80},
    { name: 'Eel', probability: 0.10, minWeight: 150, maxWeight: 250, score: 50, baseCoin: 100},
    { name: 'Tuna', probability: 0.10, minWeight: 200, maxWeight: 300, score: 40, baseCoin: 120},
    { name: 'Pufferfish', probability: 0.07, minWeight: 200, maxWeight: 300, score: 50, baseCoin: 140},
    { name: 'Swordfish', probability: 0.03, minWeight: 200, maxWeight: 500, score: 60, baseCoin: 160}
];

// Bot help command, replies to player with help message.
export function HelpCommand(message){
    var general = "Welcome to the fishgame! Catch fish to get points. Game commands:";
    var help = "/help: Display this help message.";
    var fish = "/fish: Cast a bait to catch a fish.";
    var box = "/box: Display your bait count and score.";
    var board = "/board: Show the leaderboard.";
    message.reply(`${general}\n${help}\n${fish}\n${box}\n${board}\n`);
};

// Bot Fish command, casts for the player, removes a bait, updates score, and replies with fish caught.
export function FishCommand(message, con){
    database.CheckPlayerBait(message, con, async(error, result) => {
        if (error) {
            // Handle error.
        } else {
            if (result > 0) {
                await database.UpdateBaitOne(-1, message.member.user.id, con);
                var caughtfish = CatchFish();
                var weight, score, coin;
                if (caughtfish.name == "None") {
                    [weight, score, coin] = FishScore(caughtfish);
                    var res = database.UpdateCoin (message.member.user.id, coin, con, (error, newscore) => {
                        if (error) {
                            console.async('Error updating coin: '+ error);
                        }
                    });
                    message.reply (`${message.member.user.tag} did not catch anything! They scored 0 points and earned 25 coins!`);
                    return;
                }
                var [weight, score, coin] = FishScore(caughtfish);
                var res = database.UpdateScore (message, score, con, (error, newscore) => {
                    if (error) {
                        console.log('Error updating score: '+ error);
                    }
                });
                var res = database.UpdateCoin (message.member.user.id, coin, con, (error, newscore) => {
                    if (error) {
                        console.log('Error updating coin: '+ error);
                    }
                });
                // aysnc issues minus 1 from result for a quick fix.
                var msg = message.member.user.tag + " caught a **" + caughtfish.name + "** weighing " + weight + "KG worth " + score + " points and earned " + coin + "¢! " + (result - 1) + " casts remaining.";
                var imgpath = "./img/" + caughtfish.name.toLowerCase() + ".jpeg"; 
                message.reply({
                    content: msg,
                    files: [{
                        attachment: imgpath
                    }]
                });
            } else {
                message.reply(message.member.user.tag + " does not have any bait!");
            };
        }
    });
};

// Helper for the FishCommand function, gets name of fish caught.
function CatchFish() {
    const randomNumber = Math.random();
    let accumulatedProbability = 0;
    for (const fishType of fishTypes) {
        accumulatedProbability += fishType.probability;
        if (randomNumber <= accumulatedProbability) {
            return fishType;
        }
    }
}

// Helper for the FishCommand function, calculates weight, score, and coins of the fish caught.
function FishScore(caughtfish) {
    if (caughtfish.name == "None") {
        return [0, 0, 25];
    }
    var weight = Math.floor(Math.random() * (caughtfish.maxWeight - caughtfish.minWeight + 1)) + caughtfish.minWeight;
    weight = weight / 100;
    var score = weight * caughtfish.score;
    
    // Calculate coin based on score, with weight adjustment
    var coinMultiplier = 1 + (score / 1000); // Adjust this multiplier based on the desired balance
    var coin = coinMultiplier * caughtfish.baseCoin;

    // Set minimum coin value based on minimum score or weight
    var minCoin = caughtfish.minWeight * caughtfish.baseCoin / 1000; // or caughtfish.minScore * caughtfish.baseCoinValue / 1000

    coin = Math.max(coin, minCoin);

    return [weight.toFixed(1), score.toFixed(0), coin.toFixed()];
}


export function ShopCommand(message, con){
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();
    row1.addComponents(
        new ButtonBuilder()
            .setCustomId("buy-bait")
            .setLabel("Bait 100¢")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("buy-lure")
            .setLabel("Lure 200¢")
            .setStyle(ButtonStyle.Primary),
    );
    row2.addComponents(
        new ButtonBuilder()
            .setCustomId("buy-net")
            .setLabel("Net 350¢")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("buy-map")
            .setLabel("Map 750¢")
            .setStyle(ButtonStyle.Primary)
    );
    row1.components[1].setDisabled(true);
    row2.components[0].setDisabled(true);
    row2.components[1].setDisabled(true);
    const messageObject = {
        // Take a gander at our wares, click on an item you would like
        content: `Welcome to the Shop ${message.member.user}! We are currently under construction.`,
        components: [row1, row2]
    };
    message.reply(messageObject);
};

export async function BuyBait (interaction, con, id) {
    const wallet = await database.CheckWallet(100, id, con);
    const bait = await database.CheckBait(id, con);
    if (wallet == false) {
        interaction.reply("You do not have enough coins.");
        return;
    } else if (bait == false){
        interaction.reply("Your inventory is full. Go fish before buying more bait.");
        return;
    }
    database.UpdateCoin(id, -100, con);
    database.UpdateBaitOne(1, id, con);
    interaction.reply(`${interaction.user} bought 1 bait`);
}


export function BoxCommand(message, con){
    database.PrintTackleBox(message, con);
};
export function LeaderboardCommand(message, con){
    database.PrintLeaderboard(message, con);
};

export function HelloCommand(message){
    message.reply('Hello ' + message.member.user.tag);
};