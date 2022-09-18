import axios from "axios";
import { Repository } from "typeorm";
import { GameStatus } from "./classes/GameStatus";
import AppDataSource from "./db/data-source";
import { Game } from "./db/entity/Game";
import { GamePlayer } from "./db/entity/GamePlayer";
import { Player } from "./db/entity/Player";
import { Team } from "./db/entity/Team";

export enum GAME_PROCESSOR_MESSAGES {
    START,
    END
}

export default class GameProcessor {
    private readonly _gameRepo: Repository<Game>;
    private readonly _gameId: number;
    private _feedInterval: NodeJS.Timer;

    constructor(args: string[]) {
        this._gameId = Number.parseInt(args[0]);
        this._gameRepo = AppDataSource.getRepository(Game);

        process.on("message", async (message) => {
            if (message == GAME_PROCESSOR_MESSAGES.START) {
                await this.StartGame();
            }
        });
    }

    async StartGame(): Promise<void> {
        //No idea what the overhead of doing this at the beginning of a game
        //Depending on use cases and other requirements, preloading teams and players into the DB would help improve this startup

        //I am asssuming name changes would mean a new ID for teams; players could have an updated name but not going to worry about that for this exercise
        let data = await this.LoadData();

        //Teams
        const teamRepo = AppDataSource.getRepository(Team);

        const awayTeamId: number = data["gameData"]["teams"]["away"]["id"];
        const homeTeamId: number = data["gameData"]["teams"]["home"]["id"];

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

        //Game
        const game = new Game();
        game.Id = this._gameId;
        game.GameStatus = data["gameData"]["status"]["statusCode"];
        game.AwayTeamId = awayTeam.Id;
        game.HomeTeamId = homeTeam.Id;

        // Looks like this field is a combination of last time data was updated and current time
        // I would guess in a live game this would be when the data was current as of
        // Hard without a realtime game to see if this actually is the timestamp of this request or not
        // But that seems likely given 'wait' looks like the interval we need to respect on refresh
        game.LastUpdate = data["metaData"]["timeStamp"];

        //Players
        const playerRepo = AppDataSource.getRepository(Player);     

        const players = data["gameData"]["players"];
        players.forEach(async (player) => {
            if (player["active"]) {
                const playerId: number = player["id"];

                let dbPlayer = await playerRepo.findOneBy({
                    Id: playerId,
                });
        
                if (dbPlayer === null) {
                    dbPlayer = new Player()
                    awayTeam.Id = playerId;
                    dbPlayer.FullName = player["name"];
                    await playerRepo.save(player);
                }

                let gamePlayer = new GamePlayer();
                gamePlayer.GameId = game.Id;
                gamePlayer.PlayerId = playerId;
                gamePlayer.TeamId = player["currentTeam"]["id"];
                gamePlayer.Age = player["currentAge"];
                gamePlayer.JerseyNumber = player["primaryNumber"];
                gamePlayer.PrimaryPosition = player["primaryPosition"]["code"];

                game.Players.push(gamePlayer);
            }            
        });       

        await this._gameRepo.save(game);

        const waitTime = data["metaData"]["wait"];// ?? Config.api.refreshInterval;
        this._feedInterval = setInterval(this.ProcessUpdates, waitTime * 1000);
    }

    private async ProcessUpdates(): Promise<void> {

        //do stuff since last update


        //bail out, trigger shutdown
        // if (Game.Status === GameStatus.FinalFinal) {
             clearInterval(this._feedInterval);
        // }
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
            if (axios.isAxiosError(error)) {
                //handleAxiosError(error);
            } else {
                //handleUnexpectedError(error);
            }
        }
    }

    //Unknown if needed....
    private GetCurrentTimecode(): string {
        const now = new Date();
        return `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDay()}_${now.getUTCHours()}${now.getUTCMinutes()}${now.getUTCSeconds()}`;
    }
}