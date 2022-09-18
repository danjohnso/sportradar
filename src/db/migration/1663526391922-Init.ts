import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1663526391922 implements MigrationInterface {
    name = 'Init1663526391922'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`player\` (\`Id\` int NOT NULL, \`FullName\` varchar(255) NOT NULL, PRIMARY KEY (\`Id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`team\` (\`Id\` int NOT NULL, \`Name\` varchar(255) NOT NULL, PRIMARY KEY (\`Id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`game_player\` (\`GamePlayerId\` int NOT NULL AUTO_INCREMENT, \`GameId\` int NOT NULL, \`PlayerId\` int NOT NULL, \`TeamId\` int NOT NULL, \`Age\` int NOT NULL, \`JerseyNumber\` varchar(255) NOT NULL, \`PrimaryPosition\` varchar(255) NOT NULL, \`Assists\` int NOT NULL, \`Goals\` int NOT NULL, \`Hits\` int NOT NULL, \`Points\` int NOT NULL, \`PenaltyMinutes\` int NOT NULL, PRIMARY KEY (\`GamePlayerId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`game\` (\`Id\` int NOT NULL, \`GameStatus\` varchar(255) NOT NULL, \`LastUpdate\` varchar(255) NOT NULL, \`HomeTeamId\` int NOT NULL, \`AwayTeamId\` int NOT NULL, PRIMARY KEY (\`Id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`game_player\` ADD CONSTRAINT \`FK_15ec12d561d688f81c07169ed66\` FOREIGN KEY (\`GameId\`) REFERENCES \`game\`(\`Id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_player\` ADD CONSTRAINT \`FK_22031e2d179bbe649cb8beb802f\` FOREIGN KEY (\`PlayerId\`) REFERENCES \`player\`(\`Id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_player\` ADD CONSTRAINT \`FK_f05960ed7bd9b3133bbec739ea3\` FOREIGN KEY (\`TeamId\`) REFERENCES \`team\`(\`Id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game\` ADD CONSTRAINT \`FK_6cd291d4fc469ee02fab3d8dd36\` FOREIGN KEY (\`HomeTeamId\`) REFERENCES \`team\`(\`Id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game\` ADD CONSTRAINT \`FK_a80dd90f9d6f75edf51b542611c\` FOREIGN KEY (\`AwayTeamId\`) REFERENCES \`team\`(\`Id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`game\` DROP FOREIGN KEY \`FK_a80dd90f9d6f75edf51b542611c\``);
        await queryRunner.query(`ALTER TABLE \`game\` DROP FOREIGN KEY \`FK_6cd291d4fc469ee02fab3d8dd36\``);
        await queryRunner.query(`ALTER TABLE \`game_player\` DROP FOREIGN KEY \`FK_f05960ed7bd9b3133bbec739ea3\``);
        await queryRunner.query(`ALTER TABLE \`game_player\` DROP FOREIGN KEY \`FK_22031e2d179bbe649cb8beb802f\``);
        await queryRunner.query(`ALTER TABLE \`game_player\` DROP FOREIGN KEY \`FK_15ec12d561d688f81c07169ed66\``);
        await queryRunner.query(`DROP TABLE \`game\``);
        await queryRunner.query(`DROP TABLE \`game_player\``);
        await queryRunner.query(`DROP TABLE \`team\``);
        await queryRunner.query(`DROP TABLE \`player\``);
    }

}
