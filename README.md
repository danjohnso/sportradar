# sportradar challenge repo

* Requirements

  The NHL hosts various public data feeds. This coding challenge is to set up a pipeline to ingest data. You'll need to monitor the schedule feed and when a game starts, or goes live, a corresponding job will activate and ingest the live data into a database. If it is off-season, then we should be able to reload data for a provided season or game. The separation of concerns, number of functions, and general approach is entirely up to you. 

* First process should continually watch for game status changes and toggle the next process on game status changes.
* The second process should only run when games are live. It should close when games are over. This process will ingest game data from the NHL:
  * Player ID
  * Player Name
  * Team ID
  * Team Name
  * Player Age
  * Player Number
  * Player Position
  * Assists
  * Goals
  * Hits
  * Points
  * Penalty Minutes

* We should be able to query the database for up-to-date stats during, and after, a live game.

# Development Notes

* If this was a longer lived thing, I would probably take the time to generate type definitions from the API with Swagger Code Gen, but I will just "blindly" parse for now

* Config file matching environment name is needed to fill in missing database connection info, ie development.json in the config folder

* https://typeorm.io
  * Migrations
    * **Generate:** yarn migration:generate ./src/db/migration/{Name}
    * **Run:** yarn migration:run
    * **Revert:** yarn migration:revert