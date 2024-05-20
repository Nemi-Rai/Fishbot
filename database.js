import { EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import mysql from 'mysql';

// Load environment variables
dotenv.config();

const playertable = process.env.PLAYER_TABLE;

// Connect to database and return connection object.
export function DatabaseConnect() {
    // Database connetion
    var con = mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASS,
        database: process.env.DATABASE
    });
    con.connect(function(err) {
        if (err) throw err;
        console.log("Database Connected.");
    });
    return con;
};

export function CheckIfUserInDatabase(message, con) {
    return new Promise((resolve, reject) => {
        var query = `SELECT 1 FROM ${playertable} WHERE discord_id = ?`;
        con.query(query, [message.member.user.id], (error, results) => {
            if (error) {
                console.log('Error executing query: ', error);
                reject(error);
            } else {
                if (results.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

// Adds a user to the database
export function AddUser(message, con) {
    var values = [message.member.user.id,message.member.user.tag];

    // Add user to player table
    var query = `INSERT INTO ${playertable} (discord_id, discord_tag) VALUES (?, ?)`;
    con.query(query, values, (error, results) => {
        if (error) {
            console.log('Error executing query: ', error);
        }
    })
};

// Updates player score and number of casts in the database.
export function UpdateScore(message, score, con, callback) {
    var values = [score, message.member.user.id];
    var newscore = 0;
    var query = `UPDATE ${playertable} SET score = score + ?, casts = casts + 1 WHERE discord_id = ?`;
    con.query(query, values, (error, result) => {
        if (error) {
            console.log('Error executing query: ', error);
        }
    });
}

// Updates player score and number of casts in the database. **Could integrate this into the UpdateScore function.**
export function UpdateCoin(id, coin, con, callback) {
    var values = [coin, id];
    var newcoin = 0;
    var query = `UPDATE ${playertable} SET coin = coin + ? WHERE discord_id = ?`;
    con.query(query, values, (error, result) => {
        if (error) {
            console.log('Error executing query: ', error);
        }
    });
}

export function CheckWallet(cost, id, con) {
    return new Promise((resolve, reject) => {
        var query = `SELECT coin from ${playertable} WHERE discord_id = ?`;
        con.query(query, [id], (error, result) => {
            if (error) {
                reject(error);
            } else if (result[0].coin > cost) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

export function CheckBait(id, con) {
    return new Promise((resolve, reject) => {
        var query = `SELECT bait from ${playertable} WHERE discord_id = ?`;
        con.query(query, [id], (error, result) => {
            if (error) {
                reject(error);
            } else if (result[0].bait == 15) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}


export function CheckPlayerBait (message, con, callback) {
    var values = message.member.user.id;
    var query = `SELECT bait FROM ${playertable} WHERE discord_id = ?`;
    con.query(query, values, (error, result) => {
        if (error) {
            callback(error, false);
        } else {
            if (result.bait > 0) {
                callback(null, result[0].bait);
            } else {
                callback(null, result[0].bait);
            }
        }
    });
};

export function CheckPlayerLure(id, con) {
    return new Promise((resolve, reject) => {
        var query = `SELECT bait from ${playertable} WHERE discord_id = ?`;
        con.query(query, [id], (error, result) => {
            if (error) {
                reject(error);
            } else if (result[0].lure == 5) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

export function CheckLure(id, con) {
    return new Promise((resolve, reject) => {
        var query = `SELECT lure from ${playertable} WHERE discord_id = ?`;
        con.query(query, [id], (error, result) => {
            if (error) {
                reject(error);
            } else if (result[0].lure > 0) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

export function UpdateBaitAll (amount, con) {
    var values = amount;
    var query = `UPDATE ${playertable} SET bait = LEAST(bait + ?, 15)`;
    con.query(query, values, (error, result) => {
        if (error) {
            console.log('Error executing query: ', error);
        }
    });
};

export async function UpdateBaitOne (amount, id, con) {
    var values = [amount, id];
    var query = `UPDATE ${playertable} SET bait = LEAST(bait + ?, 15) WHERE discord_id = ?`;
    con.query(query, values, (error, result) => {
        if (error) {
            console.log('Error executing query: ', error);
        }
    });
};


export async function UpdateLureOne (amount, id, con) {
    var values = [amount, id];
    var query = `UPDATE ${playertable} SET lure = LEAST(lure + ?, 5) WHERE discord_id = ?`;
    con.query(query, values, (error, result) => {
        if (error) {
            console.log('Error executing query: ', error);
        }
    });
};

export function PrintLeaderboard (message, con) {
    var query = `SELECT discord_tag, score FROM ${playertable} ORDER BY score DESC`;
    con.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query: ', error);
        } else {
            let leaderboardString = '';
            results.forEach((row, index) => {
                leaderboardString += `${index + 1}\t\t${row.score}\t\t${row.discord_tag}\n`;
            });
            
            var LeaderboardMessage = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('Fish Game Leaderboard')
                .setDescription(`**CHANGES**\n• Leaderboard reset.\n• Increased chance to not catch a fish.\n• Aesthetic changes\n• Increased store prices.\n• New store item.\n• Increased cap on bait from 10 to 15.\u000A`)
                .addFields( 
                    { name: '------------------------' , value: '\u200B'},
                    { name: 'Position' , value: '\u200B', inline: true},
                    { name: 'Player' , value: '\u200B', inline: true},
                    { name: 'Score' , value: '\u200B', inline: true},
                )
                .setFooter({ text: leaderboardString })
            message.reply ({ embeds: [LeaderboardMessage] });
        }
    });
};

export function PrintTackleBox(message, con) {
    var values = message.member.user.id;
    var query = `SELECT * FROM ${playertable} WHERE discord_id = ?`;
    con.query(query, values, (error, result) => {
        if (error) {
            callback(error, false);
        } else {
            var BoxMessage = new EmbedBuilder()
                .setColor(0x3B270C)
                .setTitle(`${message.member.user}'s tackle box`)
                .addFields(
                    { name: 'Score' , value: `${result[0].score}`, inline: true},
                    { name: 'Coin' , value: `${result[0].coin}`, inline: true},
                    { name: 'Bait' , value: `${result[0].bait}/15`, inline: true},
                    { name: 'Lure' , value: `${result[0].lure}/5`, inline: true},
                );
            message.reply ({ embeds: [BoxMessage] });
        }
    });
};

