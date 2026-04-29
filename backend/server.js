import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import giftsRouter from "./src/routes/gifts.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.use("/api/gifts", giftsRouter);

// Root
app.get("/", (req, res) => {
  res.json({
    name: "Mumzworld AI Gift Finder API",
    version: "1.0.0",
    endpoints: {
      recommend: "POST /api/gifts/recommend",
      health: "GET /api/gifts/health",
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n🎁 Mumzworld Gift Finder API running on http://localhost:${PORT}`);
  console.log(`   POST /api/gifts/recommend — Find the perfect gift`);
  console.log(`   GET  /api/gifts/health    — Health check\n`);
});
