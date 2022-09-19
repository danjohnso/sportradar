import axios from "axios";
import axiosRetry from 'axios-retry';
import config = require("config");
import { AppDataSource } from "./db/data-source";
import GameProcessor from "./GameProcessor";

const apiConfig: APIConfig = config.get("api");

axios.defaults.baseURL = apiConfig.baseUrl;
axiosRetry(axios, { retryDelay: axiosRetry.exponentialDelay });

//need to initilize again because it is a new process
AppDataSource.initialize().then(() => {
    new GameProcessor(process.argv);
}).catch(error => console.error("[GameApp] Error initializing database: " + error));