import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/review", async (req, res) => {
  const { cvText } = req.body;

  // TEMP: Just echo back for now
  res.json({ message: "Received", cvText });
});

app.listen(10000, () => console.log("Server running on port 10000"));
