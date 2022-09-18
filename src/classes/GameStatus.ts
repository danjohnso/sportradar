//https://statsapi.web.nhl.com/api/v1/gameStatus
export enum GameStatus {
    PreviewScheduled = 1,
    PreviewPreGame = 2,
    LiveInProgress = 3,
    LiveInProgressCritical = 4,
    FinalGameOver = 5,
    FinalFinal = 6,
    //dup in source, unknown purpose
    FinalFinalAgain = 7,
    PreviewScheduledTimeTBD = 8,
    PreviewPostponed = 9
}