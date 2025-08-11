require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// ✅ Allow both local dev & Netlify frontend
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "http://localhost:3000", // alternate local dev
  "https://incredible-baklava-788502.netlify.app", // deployed frontend
];

// ✅ CORS config
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true, // optional, if you ever use cookies/auth
  })
);

// ✅ Handle preflight requests for all routes
app.options("*", cors());

// Middleware
app.use(bodyParser.json());

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Expense Schema & Model
const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    description: String,
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

// ✅ Routes
app.get("/api/expenses", async (req, res) => {
  try {
    const { category, date } = req.query;
    const query = {};

    if (category && category !== "All") query.category = category;
    if (date) query.date = date;

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const { amount, category, date, description } = req.body;

    if (!amount || !category || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const expense = new Expense({ amount, category, date, description });
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
