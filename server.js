import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Use CORS middleware with specific options
app.use(
  cors({
    origin: ["http://localhost:3000", "https://frontend-6ubd5jkcu-harishs-projects-01a8d1be.vercel.app"],
    methods: ["POST", "GET"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

console.log(uri);

// Function to create Ethereal transporter
async function createEtherealTransporter() {
  let testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

// Function to send an email with user details
async function sendEmail(userDetails) {
  try {
    const transporter = await createEtherealTransporter();
    const email = userDetails.email;
    const subject = "Your Submitted Details";
    const text = `
    Thank you for submitting your details!
    Full Name: ${userDetails.fullName}
    Age: ${userDetails.age}
    Education Level: ${userDetails.educationLevel}
    Institute: ${userDetails.institute}
    What You Studied: ${userDetails.study}
    Work Experience: ${userDetails.experience}
    Future Goals: ${userDetails.goals}
    English Scores - Listening: ${userDetails.scores}
    English Scores - Reading: ${userDetails.reading}
    English Scores - Speaking: ${userDetails.speaking}
    English Scores - Writing: ${userDetails.writing}
    `;
    const mailOptions = {
      from: "no-reply@ethereal.email",
      to: email,
      subject: subject,
      text: text,
    };
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", email);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

async function run() {
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("harish").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.post("/postUser", async (req, res) => {
  console.log("body: ", req.body);
  try {
    const session = client.startSession();
    await client.connect();
    const db = client.db("harish");
    const userCollection = db.collection("onepgr");
    await session.withTransaction(async () => {
      await userCollection.insertOne(req.body);
      await sendEmail(req.body);
    });
    res.status(200).send(JSON.stringify("successfully inserted"));
  } catch (err) {
    console.error("An error occurred:", err);
    res.status(500).send("Error occurred");
  } finally {
    await client.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
