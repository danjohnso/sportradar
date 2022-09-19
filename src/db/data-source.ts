import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";
import * as nodeConfig from 'config';

const dbConfig: DBConfig = nodeConfig.get("db");

const options: MysqlConnectionOptions = {
    type: "mysql",
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    synchronize: true,
    logging: false,
    //namingStrategy: , nothing by default that allows Pascal sadly 
    entities: [`${__dirname}/entity/*.{ts,js}`],
    migrations: [`${__dirname}/migration/*.{ts,js}`],
    subscribers: [],
};

export const AppDataSource = new DataSource(options); 