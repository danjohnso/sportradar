import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm"
import { GamePlayer } from "./GamePlayer";

@Entity()
export class Player {
    @PrimaryColumn()
    Id: number;

    @Column()
    FullName!: string;

    @OneToMany(() => GamePlayer, gamePlayer => gamePlayer.Player)
    Games: GamePlayer[];
}