interface DBConfig {
    host: string; 
    port: number;
    username: string;
    password: string;
    database: string;
}

interface APIConfig {
    baseUrl: string; 
    refreshInterval: number;
}

interface AppConfig {
    //db: DBConfig;
    api: APIConfig;
}