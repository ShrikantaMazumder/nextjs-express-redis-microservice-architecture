"use strict";
import cors from 'cors';
import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2/promise";
import { createClient } from "redis";

dotenv.config();

// env variables
const expressPort = process.env.PORT || 5001;

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

// configs
const redisUrl = `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`;
const dbConfig = {
  host: sqlHost,
  user: sqlUser,
  password: sqlPassword,
  database: sqlDatabase,
};

const redisClient = createClient({ url: redisUrl });

// helper functions
const getData = async () => {
  const sqlQuery = `SELECT * FROM ${sqlTable}`;
  const sqlConnection = await mysql.createConnection(dbConfig);
  return sqlConnection.execute(sqlQuery);
};


// Redis cached helpers
const setRedisCache = async (data) => {
	const value = JSON.stringify({isCached: true, data})
	await redisClient.connect()
	await redisClient.set('key', value)
	return redisClient.disconnect()
}

const getRedisCache = async () => {
	await redisClient.connect()
	const cachedData = await redisClient.get("key")
	await redisClient.disconnect();
	return cachedData
}

const deleteRedisCache = async () => {
	await redisClient.connect()
	await redisClient.del("key")
	return redisClient.disconnect()
}

const publishToRedis = async (data) => {
	await redisClient.connect()
	const subscriberCount = await redisClient.publish(redisChannel, data)
	await redisClient.disconnect();
	return subscriberCount;
}

// express config
const app = express();
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// endpoints
app.get("/", (req, res) => {
  res.send("Server running, hello");
});

app.get("/data", async (_, res) => {
  try {
	const cachedData = await getRedisCache()

	if (cachedData) {
		const result = JSON.parse(cachedData)
		return res.status(200).json({
			message: "success",
			...result
		})
	}
    const [data, _] = await getData();
	await setRedisCache(data)

    return res.status(200).json({
      message: "success",
      isCached: false,
      data,
    });
  } catch (error) {
	console.log({error});
	res.status(500).json({
		message: "error",
		error
	})
  }
});

app.post("/create", async (req, res) => {
	const {data} = req.body
	try {
		if (!data) {
      	throw new Error("Missing data");
    }

	const subscriberCount = await publishToRedis(data)
	console.log({ subscriberCount});
	await deleteRedisCache()
    return res.status(200).json({
		message: "Insert request taken."
	});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			message: error.message
		})
	}
})

app.listen(expressPort, () => console.log(`Server running on: ${expressPort}`));
