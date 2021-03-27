const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");
const app = express();
require('dotenv').config()
console.log(process.env.DB_HOST)
const port = 5000;

var serviceAccount = require("./configs/burj-al-arab-ef7ba-firebase-adminsdk-yobh8-a6b46bb050.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(bodyParser.json());

const uri = `mongodb://${process.env.DB_HOST}/burj-al-arab`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const collection = client.db("burj-al-arab").collection("bookings");
  console.log("server connected");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    collection.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;

    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log(idToken);

      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          console.log(tokenEmail);
          const queryEmail = req.query.email;
          console.log(queryEmail);

          if (tokenEmail == req.query.email) {
            collection
              .find({ email: req.query.email })
              .toArray((err, document) => {
                res.send(document);
              });
          }
          else{
            res.send('unAuthorized Access.');
          }
        })
        .catch((error) => {
          res.send('unAuthorized Access.');
        });
    }
    else{
      res.send('unAuthorized Access.');
    }

  });
});

app.get("/", (req, res) => {
  res.send("Hello Rafi!");
});

app.listen(port);
