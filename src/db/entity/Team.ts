import { Entity, Column, PrimaryColumn, ManyToOne } from "typeorm"

@Entity()
export class Team {
    @PrimaryColumn()
    Id: number;

    @Column()
    Name!: string;
}