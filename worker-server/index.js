"use strict"
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { createClient } from "redis";

dotenv.config()

// redis
const redisUsername = process.env.REDIS_USERNAME || "";
const redisPassword = process.env.REDIS_PASSWORD || "";
const redisHost = process.env.REDIS_HOST || "";
const redisPort = process.env.REDIS_PORT || "";
const redisChannel = process.env.REDIS_CHANNEL || "";

// mysql
const sqlHost = process.env.MYSQL_HOST || "";
const sqlUser = process.env.MYSQL_USERNAME || "";
const sqlPassword = process.env.MYSQL_PASSWORD || "";
const sqlDatabase = process.env.MYSQL_DATABASE || "";
const sqlTable = process.env.MYSQL_TABLE || "";

const redisUrl = `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`;
const dbConfig = {
  host: sqlHost,
  user: sqlUser,
  password: sqlPassword,
  database: sqlDatabase,
};

// helper functions
const createData = async (data) => {
  const insertQuery = `INSERT INTO ${sqlTable} (data) VALUES ('${data}')`;
  const sqlConnection = await mysql.createConnection(dbConfig);
  sqlConnection.execute(insertQuery);
};

// redis action
(function () {
  const subscriber = createClient({url: redisUrl});
  subscriber.connect();

  // redis status logger
  subscriber.on("error", (error) => console.log("Redis client error", error));
  subscriber.on("connect", () => console.log("Connected to redis"));
  subscriber.on("reconnecting", () => console.log("Reconnecting to Redis"));
  subscriber.on("ready", () => {
    console.log("Redis ready for action!");

    subscriber.subscribe(redisChannel, async (message) => {
      console.log("Subscriber service: - ", message);

      try {
        await createData(message);
      } catch (error) {
        console.log({ error });
      }
    })
  })
})()