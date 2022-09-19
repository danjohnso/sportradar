import { fork, ChildProcess } from 'child_process';
import { GAME_PROCESSOR_MESSAGES } from './classes/GameProcessorMessages';

export default class GameManager {
    private _processes: Record<number,ChildProcess> = {};
    
    //making this a singleton so schedule manager and the config based games can share state
    static instance: GameManager;

    constructor() {
        if (GameManager.instance) {
            return GameManager.instance
        }
        GameManager.instance = this
    }

    StartGame(gameId: number) {
        if (this._processes[gameId] !== undefined) {
            console.warn("[GM] Game is already being processed");
        } else {
            const process = fork(`${__dirname}/game-app`, [gameId.toString()]);

            process.on('error', (err: Error) => {
                console.error("[GM] Error: " + err);
            });

            process.once('exit', (code?: number, signal?: NodeJS.Signals) => {
                if (code !== 0) {
                    console.error("[GM] Exited with Code: " + code);
                }

                delete this._processes[gameId];
            });

            process.send(GAME_PROCESSOR_MESSAGES.START);

            this._processes[gameId] = process;
        }
    }

    Stop(gameId?: number) {
        if (gameId == null) {
            Object.keys(this._processes).forEach((key) => {
                this._processes[key].send(GAME_PROCESSOR_MESSAGES.STOP);
            });
        } else if (this._processes[gameId]) {
            this._processes[gameId].send(GAME_PROCESSOR_MESSAGES.STOP);
        }
    }
}