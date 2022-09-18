import { Entity, Column, PrimaryColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm"
import { GameStatus } from "../../classes/GameStatus";
import { GamePlayer } from "./GamePlayer";
import { Team } from "./Team";

@Entity()
export class Game {
    @PrimaryColumn()
    Id: number;

    @Column()
    GameStatus!: GameStatus;

    @Column()
    LastUpdate: string;

    @Column()
    HomeTeamId!: number;

    @Column()
    AwayTeamId!: number;

    @ManyToOne(type => Team)
    @JoinColumn({ name: "HomeTeamId" })
    HomeTeam: Team;

    @ManyToOne(type => Team)
    @JoinColumn({ name: "AwayTeamId" })
    AwayTeam: Team;

    @OneToMany(() => GamePlayer, gamePlayer => gamePlayer.Game)
    Players: GamePlayer[];
}