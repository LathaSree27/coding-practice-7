const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const filePath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const InitializeServerAdbDb = async () => {
  try {
    db = await open({ filename: filePath, driver: sqlite3.Database });
    app.listen(3009);
  } catch (e) {
    process.exit(1);
  }
};

const matchObject = (givObject) => {
  return {
    matchId: givObject.match_id,
    match: givObject.match,
    year: givObject.year,
  };
};

const playerObject = (givObject) => {
  return {
    playerId: givObject.player_id,
    playerName: givObject.player_name,
  };
};
InitializeServerAdbDb();
app.get("/players/", async (request, response) => {
  const query = `select * from player_details;`;
  const details = await db.all(query);
  response.send(details.map((each) => playerObject(each)));
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from player_details where player_id = ${playerId};`;
  const details = await db.get(query);
  response.send(playerObject(details));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const query = `update player_details set player_name = '${playerName}' where player_id = ${playerId} ;`;
  const details = await db.run(query);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `select * from match_details where match_id = ${matchId};`;
  const details = await db.get(query);
  response.send(matchObject(details));
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `select * from match_details where match_id in (select match_id from player_match_score
        where player_id =${playerId});`;
  const details = await db.all(query);
  response.send(details.map((each) => matchObject(each)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT
              *
            FROM player_match_score
              NATURAL JOIN player_details
            WHERE
              match_id = ${matchId};`;
  // `select * from player_details where player_id in (select player_id from player_match_score where match_id =${matchId});`;
  const details = await db.all(query);
  response.send(details.map((each) => playerObject(each)));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `select player_details.player_id as playerId,
            player_details.player_name as playerName,
            sum(score) as totalScore,
            sum(fours) as totalFours,
            sum(sixes) as totalSixes
     from player_details natural join player_match_score
        where player_details.player_id =${playerId}
        group by player_details.player_id;`;
  const details = await db.get(query);
  response.send(details);
});

module.exports = app;
