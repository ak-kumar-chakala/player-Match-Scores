const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const initiliazeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(e.message);
  }
};
initiliazeDBAndServer();

app.get("/players/", async (request, response) => {
  const Query = `
    SELECT *
    FROM player_details
    ORDER BY player_id;`;

  const result = await db.all(Query);
  response.send(
    result.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const QUERY = `
    SELECT *
    FROM player_details
    WHERE player_id=${playerId}`;

  const result = await db.get(QUERY);
  response.send({
    playerId: result.player_id,
    playerName: result.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const Query = `
    UPDATE player_details
    SET
    player_name='${playerName}'
    WHERE player_id=${playerId}
  `;
  await db.run(Query);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const Query = `
    SELECT *
    FROM match_details
    WHERE match_id=${matchId};`;
  const result = await db.get(Query);
  response.send({
    matchId: result.match_id,
    match: result.match,
    year: result.year,
  });
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const Query = `
    SELECT *
    FROM player_match_score left join match_details ON match_details.match_id=player_match_score.match_id
    WHERE player_id=${playerId};`;

  const result = await db.all(Query);
  response.send(
    result.map((eachMatch) => ({
      matchId: eachMatch.match_id,
      match: eachMatch.match,
      year: eachMatch.year,
    }))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const Query = `
    SELECT *
    FROM player_match_score INNER JOIN player_details ON player_details.player_id=player_match_score.player_id
    WHERE player_match_score.match_id=${matchId};`;

  const result = await db.all(Query);
  response.send(
    result.map((eachPlayer) => ({
      playerId: eachPlayer.player_id,
      playerName: eachPlayer.player_name,
    }))
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const Query = `
    SELECT 
            player_details.player_id AS playerId ,
            player_details.player_name AS playerName ,
            SUM(score) AS totalScore ,
            SUM(fours) AS  totalFours,
            SUM(sixes) AS totalSixes
            
    FROM player_details INNER JOIN player_match_score ON 
    player_match_score.player_id=player_details.player_id
    WHERE player_details.player_id=${playerId};
    `;

  const result = await db.get(Query);
  response.send(result);
});

module.exports = app;
