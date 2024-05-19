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
            } else if (result[0].bait == 10) {
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

export function UpdateBaitAll (amount, con) {
    var values = amount;
    var query = `UPDATE ${playertable} SET bait = LEAST(bait + ?, 10)`;
    con.query(query, values, (error, result) => {
        if (error) {
            console.log('Error executing query: ', error);
        }
    });
};

export async function UpdateBaitOne (amount, id, con) {
    var values = [amount, id];
    var query = `UPDATE ${playertable} SET bait = LEAST(bait + ?, 10) WHERE discord_id = ?`;
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
            let leaderboardString = 'Leaderboard:\n';
            results.forEach((row, index) => {
                leaderboardString += `${index + 1}. ${row.discord_tag}: ${row.score}\n`;
            });
            
            message.reply(leaderboardString);
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
            var res = `Player: ${message.member.user.tag}\nBait: ${result[0].bait}\nCoin: ${result[0].coin}`;
            message.reply(res);
        }
    });
};

