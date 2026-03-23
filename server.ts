import express from "express";
import { createServer as createViteServer } from "vite";
import * as tf from "@tensorflow/tfjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTERESTS = ["AI", "Web Development", "Data Science", "Cyber Security", "Core"];
const EDUCATION_STATUSES = ["Pursuing", "Graduated", "Looking for Job"];
const BRANCHES = ["CSE", "IT", "ECE", "MECH", "CIVIL"];
const SKILLS = ["Python", "JavaScript", "React", "TensorFlow", "SQL", "AWS", "Docker", "Java", "C++", "Figma"];
const CAREERS = [
  "ML Engineer",
  "Web Developer",
  "Data Scientist",
  "Cyber Security",
  "Software Developer"
];

function encodeFeatures(cgpa: number, education: string, branch: string, interest: string, skillsArr: string[]): number[] {
  const features: number[] = [];
  features.push(cgpa / 4.0);
  EDUCATION_STATUSES.forEach(status => features.push(status === education ? 1 : 0));
  BRANCHES.forEach(b => features.push(b === branch ? 1 : 0));
  INTERESTS.forEach(i => features.push(i === interest ? 1 : 0));
  SKILLS.forEach(s => features.push(skillsArr.includes(s) ? 1 : 0));
  return features;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Model state
  let model: tf.LayersModel | null = null;

  // Initialize and train a simple model for the API to use
  async function initModel() {
    console.log("Initializing server-side model...");
    const inputSize = 1 + EDUCATION_STATUSES.length + BRANCHES.length + INTERESTS.length + SKILLS.length;
    
    const m = tf.sequential();
    m.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [inputSize] }));
    m.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    m.add(tf.layers.dropout({ rate: 0.2 }));
    m.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    m.add(tf.layers.dense({ units: CAREERS.length, activation: 'softmax' }));
    
    m.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });

    // Dummy training data
    const trainData: number[][] = [];
    const labels: number[][] = [];

    const addSample = (cgpa: number, edu: string, br: string, intr: string, sk: string[], careerIdx: number) => {
      trainData.push(encodeFeatures(cgpa, edu, br, intr, sk));
      const label = new Array(CAREERS.length).fill(0);
      label[careerIdx] = 1;
      labels.push(label);
    };

    addSample(3.9, "Pursuing", "CSE", "AI", ["Python", "TensorFlow"], 0);
    addSample(3.5, "Graduated", "IT", "Web Development", ["JavaScript", "React"], 1);
    addSample(3.7, "Graduated", "IT", "Data Science", ["Python", "SQL"], 2);
    addSample(3.8, "Graduated", "CSE", "Cyber Security", ["Python"], 3);
    addSample(3.5, "Graduated", "ECE", "Core", ["C++"], 4);

    const xs = tf.tensor2d(trainData);
    const ys = tf.tensor2d(labels);

    await m.fit(xs, ys, { epochs: 20 });
    model = m;
    console.log("Server-side model ready.");
  }

  await initModel();

  // API Endpoint: /predict
  app.post("/api/predict", async (req, res) => {
    try {
      const { cgpa, education, branch, interest, skills } = req.body;

      if (cgpa === undefined || !education || !branch || !interest) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const skillsArr = typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : (Array.isArray(skills) ? skills : []);

      if (!model) {
        return res.status(500).json({ error: "Model not initialized" });
      }

      const features = encodeFeatures(parseFloat(cgpa), education, branch, interest, skillsArr);
      const input = tf.tensor2d([features]);
      const prediction = model.predict(input) as tf.Tensor;
      const data = await prediction.data();
      
      // Get top 3 predictions
      const predictions = Array.from(data).map((confidence, index) => ({
        career: CAREERS[index],
        confidence
      })).sort((a, b) => b.confidence - a.confidence).slice(0, 3);
      
      input.dispose();
      prediction.dispose();

      res.json({
        topPredictions: predictions,
        cgpa,
        interest
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
