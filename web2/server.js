const redis = require("redis");
const express = require("express");
const mongoose = require("mongoose");

const port = 5000;
const dbRetryTime = process.env.db_retry_time || 2000;

const app = express();

const MONGO_PORT = 27017;

const redisClient = redis.createClient({
  host: "redis",
  port: 6379,
});

const mongoUri = `mongodb://${process.env.db_service_name}:${MONGO_PORT}/${process.env.db_name}`;

// Create a schema for the request document
const requestSchema = new mongoose.Schema({
  method: String,
  path: String,
  timestamp: Date,
});

// Create a model for the request document
const Request = mongoose.model("Request", requestSchema);
app.get("/", function (req, res) {
  redisClient.get("numVisits", function (err, numVisits) {
    numVisitsToDisplay = parseInt(numVisits) + 1;
    if (isNaN(numVisitsToDisplay)) {
      numVisitsToDisplay = 1;
    }
    res.send("web2: Total number of visits is: " + numVisitsToDisplay);
    numVisits++;
    redisClient.set("numVisits", numVisits);
  });
  Request.findOne({});
});
let db = mongoose.connection;
let connectWithRetry = function () {
  return mongoose
    .connect(mongoUri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    .then(() => {
      // Check if the "requests" collection exists
      return mongoose.connection.db
        .listCollections({ name: "requests" })
        .toArray();
    })
    .then((collections) => {
      if (collections.length === 0) {
        // Create the "requests" collection and insert documents
        return Request.insertMany([
          { method: "GET", path: "/initialize", timestamp: new Date() },
          { method: "POST", path: "/users", timestamp: new Date() },
          { method: "GET", path: "/products", timestamp: new Date() },
        ]);
      } else {
        // Collection exists, proceed to insert documents
        return Request.insertMany([
          { method: "POST", path: "/admin", timestamp: new Date() },
          { method: "PUT", path: "/settings", timestamp: new Date() },
        ]);
      }
    })
    .then((result) => {
      console.log("Documents inserted:", result);
      // Start the server after performing the database request
      //   app.listen(port, () => console.log(`All set up. Listening on ${port}!`));
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

connectWithRetry();

db.on("error", () => {
  setTimeout(() => {
    console.log("DB connection failed. Will try again.");

    connectWithRetry();
  }, dbRetryTime);
});

db.on("connected", function () {
  // Start the server after performing the database request
  //   app.listen(port, () => console.log(`All set up. Listening on ${port}!`));
});

app.listen(5000, function () {
  console.log("Web app is listening on port 5000");
});
