import express from 'express';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import cors from "cors";

const app = express();

// CORS middleware configuration
app.use(cors({
  origin: ["http://localhost:3000", "https://frontend-6ubd5jkcu-harishs-projects-01a8d1be.vercel.app"],
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));

app.use(express.json());

// MongoDB Atlas URI with database name
const uri = "mongodb+srv://harishmaneru:Xe2Mz13z83IDhbPW@cluster0.bu3exkw.mongodb.net/harish?retryWrites=true&w=majority&tls=true";
const client = new MongoClient(uri, {
  serverApi: {
    version: '1', 
    strict: true,
    deprecationErrors: true,
  },
});

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
    console.log("Connected successfully to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
  }
}

// Endpoint to handle POST request
app.post("/postUser", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("harish");
    const userCollection = db.collection("onepgr");
    const session = client.startSession();
    await session.withTransaction(async () => {
      await userCollection.insertOne(req.body);
      await sendEmail(req.body);
    });
    res.status(200).json("Successfully inserted");
  } catch (err) {
    console.error("An error occurred:", err);
    res.status(500).json("Error occurred");
  } finally {
    await client.close();
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


run();
