require("dotenv").config();
const express = require('express')
const app = express()
const routes = require('./controllers/routes')
const apiClient = require('./controllers/apiClient')
const cors = require('cors')
const mongoose = require('mongoose')

app.use(cors())
app.use(express.json())

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use('/', routes);
app.use('/api', apiClient())

module.exports = app;