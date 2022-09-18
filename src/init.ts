import "dotenv/config";
import axios from "axios";
import axiosRetry from 'axios-retry';
import AppDataSource from "./db/data-source";
import * as config from "config";
import GameManager from "./GameManager";
import { ScheduleManager } from "./ScheduleManager";

const apiConfig: APIConfig = config.get("api");

console.debug("Application starting, configuring Axios");

axios.defaults.baseURL = apiConfig.baseUrl;
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay });

console.debug("Axios configured, initializing database connectivity");

AppDataSource.initialize().then(() => {
    console.debug("Database connection initialized, checking configuration for games to reload");

    const gameConfig: GameConfig = config.get("game");
    if (gameConfig.reloadGames.length > 0) {
        console.debug(`Found ${gameConfig.reloadGames.length} games to reload`);
        const gameManager = new GameManager();

        //CHECK: api limits might require throttling of this
        gameConfig.reloadGames.forEach((value:number) => {
            console.debug(`Reloading game ${value}`);
            gameManager.StartGame(value);
        });
    } else {
        console.debug("No games to reload");
    }

    console.debug("Launching ScheduleManager");
    
    const scheduleManager = new ScheduleManager();
    scheduleManager.Start();

    console.debug("ScheduleManager launched");
}).catch(error => console.error(error));
