const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require("stripe")(process.env.Payment_Key);
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//mongodb

//mongodb connection
const uri = `mongodb+srv://${process.env.DB_UserName}:${process.env.DB_PassWord}@cluster0.6wlkevy.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    //project start
    const dbName = client.db("re-zanCharity");
    const storyCollections = dbName.collection("story-collections");
    const events = dbName.collection("eventsCollections");
    const vlounters = dbName.collection("vlountertem-collentions");
    const blogs = dbName.collection("blogsDatas");
    const users = dbName.collection("user-collection");
    const payments = dbName.collection("payment-Collection");

    //////////////////////////////////////////////user part
    //get user
    app.get("/users", async (req, res) => {
      const result = await users.find().limit(18).sort({ _id: -1 }).toArray();
      res.send(result);
    });

    //create user
    app.post("/users", async (req, res) => {
      const data = req.body;
      const query = { email: data.email };
      const exiting = await users.findOne(query);
      if (exiting) {
        return res.send("You are already in my db");
      }
      const result = await users.insertOne(data);
      res.send(result);
    });

    //make admin
    app.put("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upData = {
        $set: {
          role: "admin",
        },
      };
      const result = await users.updateOne(query, upData);
      res.send(result);
    });

    // get admi data
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await users.findOne(filter);

      res.send(result);
    });

    //make donar
    app.put("/users/donar/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upData = {
        $set: {
          role: "donar",
        },
      };
      const result = await users.updateOne(query, upData);
      res.send(result);
    });

    //delete users
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await users.deleteOne(filter);
      res.send(result);
    });

    ////////////////////////////////////////donate part
    //payment methods start
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //payment data saved to the db
    app.post("/payments", async (req, res) => {
      const data = req.body;
      const result = await payments.insertOne(data);
      res.send(result);
    });

    //payment history from db
    app.get("/payments/:email", async (req, res) => {
      const result = await payments.find({ email: req.params.email }).toArray();
      res.send(result);
    });
    //////////////////////////////////////////////////////////////////////////////////////////////
    //get user by their email
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await users.findOne(filter);
      res.send(result);
    });

    //donate
    app.patch("/users/donated/:email", async (req, res) => {
      const data = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const upDateData = {
        $set: {
          donation_amount: data.donation_amount,
          message: data.message,
        },
      };
      const result = await users.updateOne(filter, upDateData);
      res.send(result);
    });

    //////////////////////////////////////////events part
    //get data
    app.get("/events", async (req, res) => {
      const result = await events.find().limit(18).sort({ _id: -1 }).toArray();
      res.send(result);
    });

    //get single data
    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await events.findOne(query);
      res.send(result);
    });

    //create events
    app.post("/events", async (req, res) => {
      const data = req.body;
      const result = await events.insertOne(data);
      res.send(result);
    });

    //update data
    app.put("/events/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updetData = {
        $set: {
          title: data.title,
          short_title: data.short_title,
          description: data.description,
          location: data.location,
          date: data.date,
          image: data.image,
        },
      };
      const result = await events.updateOne(filter, updetData, options);
      res.send(result);
    });

    //status upadete
    app.patch("/events/status/upcoming/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updetData = {
        $set: {
          status: "upcoming",
        },
      };
      const result = await events.updateOne(filter, updetData);
      res.send(result);
    });

    app.patch("/events/status/cancel/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updetData = {
        $set: {
          status: "canceled",
        },
      };
      const result = await events.updateOne(filter, updetData);
      res.send(result);
    });

    //delete items
    app.delete("/events/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await events.deleteOne(filter);
      res.send(result);
    });

    ////////////////////////////////blogs part
    //get data
    app.get("/blogs", async (req, res) => {
      const result = await blogs.find().sort({ date: -1 }).toArray();
      res.send(result);
    });

    //get single data
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogs.findOne(query);
      res.send(result);
    });

    ////////////////////////////////vlounters part
    //get data
    app.get("/vlounters", async (req, res) => {
      const result = await vlounters
        .find()
        .limit(18)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    //create vlounteer
    app.post("/vlounters", async (req, res) => {
      const data = req.body;
      const resutl = await vlounters.insertOne(data);
      res.send(resutl);
    });

    //make voluanteer
    app.put("/vlounters/voluanteer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const upData = {
        $set: {
          role: "voluanteer",
        },
      };
      const result = await vlounters.updateOne(query, upData);
      res.send(result);
    });

    //delete voluanteer
    app.delete("/vlounters/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await vlounters.deleteOne(filter);
      res.send(result);
    });

    /////////////////////////////////their story part
    //get data
    app.get("/stories", async (req, res) => {
      const result = await storyCollections.find().toArray();
      res.send(result);
    });

    //////////////////////////////////////////////project end
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//testing
app.get("/", (req, res) => {
  res.send("Datas are cooking.....................");
});

//make connection
app.listen(port);
