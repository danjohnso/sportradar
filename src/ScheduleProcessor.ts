import axios from "axios";
import * as config from "config";
import { GameStatus } from "./classes/GameStatus";
import GameManager from "./GameManager";

export class ScheduleProcessor {
    private _processInterval?: NodeJS.Timer;
    private _refreshInterval: number = 0;
    private _isLongPolling = false;
    private _gamesStarted: number[] = [];
    private _apiConfig: APIConfig;

    async Start() {
        console.log("[SP] Starting schedule processing");

        const data = await this.LoadData();
        if (data !== null) {
            this._apiConfig = config.get("api");
            const apiWait = data["wait"] * 1000;
            this._refreshInterval = this._apiConfig.scheduleRefreshInterval > apiWait ? this._apiConfig.scheduleRefreshInterval : apiWait

            console.debug(`[SP] Refreshing schedule every ${this._refreshInterval}ms`);

            //my config is once a minute, seems reasonable for what we are looking for with game, still respecting the api wait time in case it changes
            this._processInterval = setInterval(() => this.CheckSchedule(), this._refreshInterval);
        }
    }

    private async CheckSchedule(): Promise<void> {
        console.log("[SP] Checking schedule...");
        const gameManager = new GameManager();
        const data = await this.LoadData();
        if (data !== null) {
            if (data["totalGames"] > 0) {
                if (this._isLongPolling) {
                    console.log("[SP] Games found in schedule, returning to default refresh interval");
                    this._isLongPolling = false;
                    clearInterval(this._processInterval);
                    this._processInterval = setInterval(() => this.CheckSchedule(), this._refreshInterval);
                }

                const games: any[] = data["dates"][0]["games"];

                console.debug(`[SP] Found ${games.length} games scheduled today`);
                
                let gamesStarted = 0;
                for (let i = 0; i < games.length; i++) {
                    const game = games[i];
                    if (this._gamesStarted.indexOf(game["gamePk"]) === -1 && this.GetGameStatus(game) > GameStatus.PreviewPreGame) {
                        console.log(`[SP] Game status changed, starting game ${game["gamePk"]}`);
                        this._gamesStarted.push(game["gamePk"])
                        gameManager.StartGame(game["gamePk"]);
                    }
                }
                console.debug(`[SP] Games checked, ${gamesStarted} were started`);
            } else {
                //no games scheduled today, should back off how often we are polling
                const nextUpdate = new Date().getTime() + this._apiConfig.scheduleRefreshLongInterval;

                console.log(`[SP] No games found in schedule, backing off to long polling.  Next update at ${new Date(nextUpdate).toISOString()}`);
                this._isLongPolling = true;
                clearInterval(this._processInterval);
                this._processInterval = setInterval(() => this.CheckSchedule(), this._apiConfig.scheduleRefreshLongInterval);
            }
        }
    }

    //probably won't get used unless I add a mechanism to run this as a seperate process or shutdown the app gracefully
    private CleanAndExit(): void {
        console.log("[SP] Closing schedule processing");
        
        //shutdown the loop if its running
        if (this._processInterval !== null) {
            clearInterval(this._processInterval);
        }

        //not running as a seperate fork right now...
        //process.exit(exitCode);
    }

    private async LoadData(): Promise<JSON> {
        try {
            //current date filter lets us get preseason games
            let requestUrl = `/schedule?date=${this.GetCurrentDate()}`;
            const { data } = await axios.get(requestUrl);
            return data;
        } catch (error) {
            //with more time this would probably bubble up or send a more detailed alert since data failures on a long running process need to get reviewed
            console.error("[SP] Unknown error in schedule data load: " + error);
            return null;
        }
    }

    private GetCurrentDate(): string {
        const now = new Date(2022, 8, 24);
        return `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`;
    }

    private GetGameStatus(data: JSON): GameStatus {
        return Number.parseInt(data["status"]["statusCode"]);
    }
}