//https://statsapi.web.nhl.com/api/v1/gameStatus
export class GameStatus {
    static readonly PreviewScheduled = "1";
    static readonly PreviewPreGame = "2";
    static readonly LiveInProgress = "3";
    static readonly LiveInProgressCritical = "4";
    static readonly FinalGameOver = "5";
    static readonly FinalFinal = "6";
    //dup in source, unknown purpose
    static readonly FinalFinalAgain = "7";
    static readonly PreviewScheduledTimeTBD = "8";
    static readonly PreviewPostponed = "9";
}