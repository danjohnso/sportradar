interface DBConfig {
    host: string; 
    port: number;
    username: string;
    password: string;
    database: string;
}

interface APIConfig {
    baseUrl: string; 
    scheduleRefreshInterval: number;
    scheduleRefreshLongInterval: number;
}

interface GameConfig {
    /** Configuration for loading specific Game IDs during offseason or for other reasons to reprocess their final state */
    reloadGames: number[]; 
}

interface AppConfig {
    db: DBConfig;
    api: APIConfig;
    game: GameConfig;
}