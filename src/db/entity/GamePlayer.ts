import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm"
import { Game } from "./Game"
import { Player } from "./Player"
import { Team } from "./Team";

@Entity()
export class GamePlayer {
    @PrimaryGeneratedColumn()
    GamePlayerId: number;

    @Column()
    GameId!: number;

    @Column()
    PlayerId!: number;

    @Column()
    TeamId!: string;

    @Column()
    Age!: number;

    @Column()
    JerseyNumber!: string;

    @Column()
    PrimaryPosition!: string;

    @Column()
    Assists!: number;

    @Column()
    Goals!: number;

    @Column()
    Hits!: number;

    @Column()
    Points!: number;

    @Column()
    PenaltyMinutes!: number;
   
    @ManyToOne(() => Game, (game) => game.Players)
    @JoinColumn({ name: "GameId" })
    Game: Game;

    @ManyToOne(() => Player, (player) => player.Games)
    @JoinColumn({ name: "PlayerId" })
    Player: Player;

    @ManyToOne(() => Team)
    @JoinColumn({ name: "TeamId" })
    Team: Team;
}