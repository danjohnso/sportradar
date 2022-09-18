import "dotenv/config";
import axios from "axios";
import AppDataSource from "./db/data-source";
import * as config from "config";

const apiConfig: APIConfig = config.get("api");

axios.defaults.baseURL = apiConfig.baseUrl;

AppDataSource.initialize().then(async () => {
    //


}).catch(error => console.log(error));
