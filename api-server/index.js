"use strict";
import express from "express";
import dotenv from "dotenv";


dotenv.config();

// env variables
const expressPort = process.env.PORT || 5001

const app = express()

// endpoints
app.get("/", (req, res) => {
	res.send("Server running")
})

app.listen(expressPort, () => console.log(`Server running on: ${expressPort}`))
