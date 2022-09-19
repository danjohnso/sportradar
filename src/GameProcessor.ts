import axios from "axios";
import { Repository } from "typeorm";
import { GAME_PROCESSOR_MESSAGES, GAME_PROCESSOR_EXIT_CODES } from "./classes/GameProcessorMessages";
import { GameStatus } from "./classes/GameStatus";
import { AppDataSource } from "./db/data-source";
import { Game } from "./db/entity/Game";
import { GamePlayer } from "./db/entity/GamePlayer";
import { Player } from "./db/entity/Player";
import { Team } from "./db/entity/Team";

export default class GameProcessor {
    private readonly _gameRepo: Repository<Game>;
    private readonly _gameId: number;
    private _isRunning: boolean = false;
    private _feedInterval?: NodeJS.Timer;

    constructor(args: string[]) {
        this._gameId = Number.parseInt(args[2]);
        this._gameRepo = AppDataSource.getRepository(Game);

        process.on("message", async (message) => {
            if (message == GAME_PROCESSOR_MESSAGES.START) {
                if (this._isRunning) {
                    console.error("[GP] Game processor is already running, cannot call StartGame again")
                } else {
                    await this.StartGame();
                }
            } else if (message == GAME_PROCESSOR_MESSAGES.STOP) {
                this.CleanAndExit(GAME_PROCESSOR_EXIT_CODES.EXTERNAL_STOP);
            } else {
                //dev mistake in messaging
                console.warn("[GP] Unknown message sent: " + message);
            }
        });
    }

    private async StartGame(): Promise<void> {
        //No idea what the overhead of doing this at the beginning of a game
        //Depending on use cases and other requirements, preloading teams and players into the DB would help improve this startup
        this._isRunning = true;

        console.log(`[GP] Starting game processing of ${this._gameId}`);

        try {
            //see if this game was already started, like this game was started but didn't finish processing
            let game = await this._gameRepo.findOneBy({
                Id: this._gameId,
            });

            //load the game
            let data = await this.LoadData();

            if (game !== null) {
                // in case we are restarting this process for a game we already stored, update the game and let the timer kick back off again
                await this.UpdateGame(data);
            } else {

                const awayTeamId: number = data["gameData"]["teams"]["away"]["id"];
                const homeTeamId: number = data["gameData"]["teams"]["home"]["id"];
        
                game = new Game();
                game.Id = this._gameId;
                game.GameStatus = this.GetGameStatus(data);
                game.AwayTeamId = awayTeamId;
                game.HomeTeamId = homeTeamId;
                game.LastUpdate = this.GetLastUpdate(data);
            
                //Teams
                //I am asssuming name changes would mean a new ID for teams; players could have an updated name but not going to worry about that for this exercise
                const teamRepo = AppDataSource.getRepository(Team);

                let awayTeam = await teamRepo.findOneBy({
                    Id: awayTeamId,
                });

                if (awayTeam === null) {
                    awayTeam = new Team()
                    awayTeam.Id = awayTeamId;
                    awayTeam.Name = data["gameData"]["teams"]["away"]["name"];
                    await teamRepo.save(awayTeam);
                }

                let homeTeam = await teamRepo.findOneBy({
                    Id: homeTeamId,
                });

                if (homeTeam === null) {
                    homeTeam = new Team()
                    homeTeam.Id = homeTeamId;
                    homeTeam.Name = data["gameData"]["teams"]["home"]["name"];
                    await teamRepo.save(homeTeam);
                }
            
                //Players
                const playerRepo = AppDataSource.getRepository(Player); 
                const gamePlayerRepo = AppDataSource.getRepository(GamePlayer);      
                const players: Player[] = [];
                const gamePlayers: GamePlayer[] = [];
                
                const jsonPlayers = this.GetPlayers(data);     
                const playerKeys = Object.keys(jsonPlayers);

                for (let index = 0; index < playerKeys.length; index++) {
                    let player = jsonPlayers[playerKeys[index]];
                    //making assumption we just want players that are active and assigned numbers.  Just extra overhead to record players that won't have stats
                    if (player["active"] && player["primaryNumber"] !== undefined) {
                        const playerId: number = player["id"];

                        let dbPlayer = await playerRepo.findOneBy({
                            Id: playerId,
                        });
                
                        if (dbPlayer === null) {
                            dbPlayer = new Player()
                            dbPlayer.Id = playerId;
                            dbPlayer.FullName = player["fullName"];
                            players.push(dbPlayer);
                        }

                        let gamePlayer = new GamePlayer();
                        gamePlayer.GameId = game.Id;
                        gamePlayer.PlayerId = playerId;
                        gamePlayer.TeamId = player["currentTeam"]["id"];
                        gamePlayer.Age = player["currentAge"];
                        gamePlayer.JerseyNumber = player["primaryNumber"];
                        gamePlayer.PrimaryPosition = player["primaryPosition"]["code"];
                        gamePlayer.Assists = player["assists"] ?? 0;
                        gamePlayer.Goals = player["goals"] ?? 0;
                        gamePlayer.Hits = player["hits"] ?? 0;
                        gamePlayer.Points = gamePlayer.Assists + gamePlayer.Goals;
                        gamePlayer.PenaltyMinutes = player["penaltyMinutes"] ?? 0;

                        gamePlayers.push(gamePlayer);
                    }      
                }       

                await playerRepo.save(players);
                await this._gameRepo.save(game);
                await gamePlayerRepo.save(gamePlayers);
            }

            if (game.GameStatus == GameStatus.FinalFinal || game.GameStatus == GameStatus.FinalFinalAgain) {
                //if we are running against a game that is always finished, we don't need the loop and can just shutdown the process
                this.CleanAndExit(GAME_PROCESSOR_EXIT_CODES.SUCCESS);
            } else {
                // looks like a wait time in seconds since the API isn't key/token driven, I assume IP will get throttled if we don't respect
                const waitTime: number = data["metaData"]["wait"];
                this._feedInterval = setInterval(this.ProcessUpdates, waitTime * 1000);
            }
        } catch (error) {
            console.error("[GP] Unexpected error in StartGame, shutting down game processor: " + error);
            this.CleanAndExit(GAME_PROCESSOR_EXIT_CODES.START_GAME_EXCEPTION);
        }
    }

    private async EndGame(data: JSON): Promise<void> {
        //final stats update
        await this.UpdateGame(data);

        //signal end of process
        this.CleanAndExit(GAME_PROCESSOR_EXIT_CODES.SUCCESS);
    }

    private async UpdateGame(data: JSON): Promise<void> {
        try {
            //update game and player stats
            let game = await this._gameRepo.findOneBy({
                Id: this._gameId,
            });

            game.GameStatus = this.GetGameStatus(data);
            game.LastUpdate = this.GetLastUpdate(data);

            const playerRepo = AppDataSource.getRepository(GamePlayer);

            //GamePlayers
            const players = this.GetPlayers(data);
            const dbPlayers = await playerRepo.findBy({
                GameId: this._gameId
            });

            dbPlayers.forEach((dbPlayer) => {
                let player = players["ID"+dbPlayer.PlayerId];

                dbPlayer.Assists = player["assists"] ?? 0;
                dbPlayer.Goals = player["goals"] ?? 0;
                dbPlayer.Hits = player["hits"] ?? 0;
                dbPlayer.Points = dbPlayer.Assists + dbPlayer.Goals;
                dbPlayer.PenaltyMinutes = player["penaltyMinutes"] ?? 0;
            });

            await playerRepo.save(dbPlayers);
        } catch (error) {
            console.error("[GP] Unknown error in UpdateGame, shutting down game processor: " + error);
            this.CleanAndExit(GAME_PROCESSOR_EXIT_CODES.UPDATE_GAME_EXCEPTION);
        }
    }

    private async ProcessUpdates(): Promise<void> {
        const data = await this.LoadData();
        const gameStatus = this.GetGameStatus(data);

        //bail out, trigger shutdown
        if (gameStatus === GameStatus.FinalFinal || gameStatus === GameStatus.FinalFinalAgain) {
            await this.EndGame(data);
        } else {
            await this.UpdateGame(data);
        }
    }

    private async LoadData(timecode?: string): Promise<JSON> {
        try {
            let requestUrl = `/game/${this._gameId}/feed/live`;
            if (timecode) {
                requestUrl += `/diffPatch?startTimecode=${timecode}`;
            }

            const { data } = await axios.get(requestUrl);
            return data;
        } catch (error) {
            console.error("[GP] Unknown error in game data load, shutting down game processor: " + error);
            this.CleanAndExit(GAME_PROCESSOR_EXIT_CODES.LOAD_DATA_EXCEPTION);
        }
    }

    private GetGameStatus(data: JSON): GameStatus {
        return Number.parseInt(data["gameData"]["status"]["statusCode"]);
    }

    private GetLastUpdate(data: JSON): string {
        // Looks like this field is a combination of last time data was updated and current time
        // I would guess in a live game this would be when the data was current as of
        // Hard without a realtime game to see if this actually is the timestamp of this request or not
        // But that seems likely given 'wait' looks like the interval we need to respect on refresh
        return data["metaData"]["timeStamp"];
    }

    private GetPlayers(data: JSON): Record<string,any> {
        const players = data["gameData"]["players"];

        const awayPlayers = data["liveData"]["boxscore"]["teams"]["away"]["players"];
        const homePlayers = data["liveData"]["boxscore"]["teams"]["home"]["players"];

        const playersStats = Object.assign({}, awayPlayers, homePlayers);

        Object.keys(players).forEach((key) => {
            let player = players[key];
            const playerStats = playersStats[key]["stats"]["skaterStats"];
            player = Object.assign(player, playerStats);
        });

        return players;
    }

    private CleanAndExit(exitCode: GAME_PROCESSOR_EXIT_CODES): void {
        console.log(`[GP] Closing game processing of ${this._gameId} with exit code: ${exitCode}`);
        
        //shutdown the loop if its running
        if (this._feedInterval !== null) {
            clearInterval(this._feedInterval);
        }

        process.exit(exitCode);
    }
                
    //Unknown if needed....
    private GetCurrentTimecode(): string {
        const now = new Date();
        return `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDay()}_${now.getUTCHours()}${now.getUTCMinutes()}${now.getUTCSeconds()}`;
    }
}