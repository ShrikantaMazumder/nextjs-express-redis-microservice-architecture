"use strict";
import dotenv from "dotenv";
import express from "express";


dotenv.config();

// env variables
const expressPort = process.env.PORT || 5001

const app = express()

// endpoints
app.get("/", (req, res) => {
	res.send("Server running, hello")
})

app.listen(expressPort, () => console.log(`Server running on: ${expressPort}`))
