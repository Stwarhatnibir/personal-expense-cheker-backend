require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173", // local dev frontend port
  "http://localhost:3000", // alternate local frontend port
  "https://incredible-baklava-788502.netlify.app", // your Netlify frontend URL
];

// CORS middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g., mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Handle preflight requests for all routes
app.options("*", cors());

app.use(bodyParser.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Expense schema and model
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

// API routes (note: only relative paths, no full URLs!)
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

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
