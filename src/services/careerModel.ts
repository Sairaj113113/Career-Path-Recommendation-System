import * as tf from '@tensorflow/tfjs';

export const INTERESTS = ["AI", "Web Development", "Data Science", "Cyber Security", "Core"];
export const EDUCATION_STATUSES = ["Pursuing", "Graduated", "Looking for Job"];
export const BRANCHES = ["CSE", "IT", "ECE", "MECH", "CIVIL"];
export const SKILLS = ["Python", "JavaScript", "React", "TensorFlow", "SQL", "AWS", "Docker", "Java", "C++", "Figma"];
export const CAREERS = [
  "ML Engineer",
  "Web Developer",
  "Data Scientist",
  "Cyber Security",
  "Software Developer"
];

export interface CareerPrediction {
  career: string;
  confidence: number;
}

export interface PredictionResult {
  topPredictions: CareerPrediction[];
}

class CareerModelService {
  private model: tf.LayersModel | null = null;
  private isTraining = false;

  constructor() {
    this.initModel();
  }

  private initModel() {
    const model = tf.sequential();
    
    // Input size calculation:
    // CGPA (1) + Education (3) + Branch (5) + Interest (5) + Skills (10) = 24
    const inputSize = 1 + EDUCATION_STATUSES.length + BRANCHES.length + INTERESTS.length + SKILLS.length;

    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [inputSize]
    }));

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));

    // Output layer: Number of careers
    model.add(tf.layers.dense({
      units: CAREERS.length,
      activation: 'softmax'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    this.model = model;
  }

  private encodeFeatures(cgpa: number, education: string, branch: string, interest: string, skillsArr: string[]): number[] {
    const features: number[] = [];
    
    // 1. Normalize CGPA (0-4 -> 0-1)
    features.push(cgpa / 4.0);

    // 2. One-hot Education
    EDUCATION_STATUSES.forEach(status => {
      features.push(status === education ? 1 : 0);
    });

    // 3. One-hot Branch
    BRANCHES.forEach(b => {
      features.push(b === branch ? 1 : 0);
    });

    // 4. One-hot Interest
    INTERESTS.forEach(i => {
      features.push(i === interest ? 1 : 0);
    });

    // 5. Multi-hot Skills
    SKILLS.forEach(s => {
      features.push(skillsArr.includes(s) ? 1 : 0);
    });

    return features;
  }

  async trainModel(onEpochEnd?: (epoch: number, logs?: tf.Logs) => void) {
    if (!this.model || this.isTraining) return;
    this.isTraining = true;

    // Generate expanded training data
    const trainData: number[][] = [];
    const labels: number[][] = [];

    // Helper to add training sample
    const addSample = (cgpa: number, edu: string, br: string, intr: string, sk: string[], careerIdx: number) => {
      trainData.push(this.encodeFeatures(cgpa, edu, br, intr, sk));
      const label = new Array(CAREERS.length).fill(0);
      label[careerIdx] = 1;
      labels.push(label);
    };

    // ML Engineer (0)
    addSample(3.9, "Pursuing", "CSE", "AI", ["Python", "TensorFlow"], 0);
    addSample(4.0, "Graduated", "CSE", "AI", ["Python", "TensorFlow", "SQL"], 0);
    
    // Web Developer (1)
    addSample(3.5, "Graduated", "IT", "Web Development", ["JavaScript", "React", "SQL"], 1);
    addSample(3.2, "Looking for Job", "CSE", "Web Development", ["JavaScript", "React"], 1);

    // Data Scientist (2)
    addSample(3.7, "Graduated", "IT", "Data Science", ["Python", "SQL"], 2);
    addSample(3.4, "Pursuing", "CSE", "Data Science", ["Python", "SQL"], 2);

    // Cyber Security (3)
    addSample(3.8, "Graduated", "CSE", "Cyber Security", ["Python", "Docker"], 3);
    addSample(3.6, "Looking for Job", "IT", "Cyber Security", ["Python", "AWS"], 3);

    // Software Developer (4)
    addSample(3.5, "Graduated", "ECE", "Core", ["C++"], 4);
    addSample(3.3, "Pursuing", "MECH", "Core", ["C++"], 4);

    const xs = tf.tensor2d(trainData);
    const ys = tf.tensor2d(labels);

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 4,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onEpochEnd) onEpochEnd(epoch, logs);
        }
      }
    });

    xs.dispose();
    ys.dispose();
    this.isTraining = false;
  }

  async predict(cgpa: number, education: string, branch: string, interest: string, skillsStr: string): Promise<PredictionResult> {
    if (!this.model) throw new Error("Model not initialized");

    const skillsArr = skillsStr.split(',').map(s => s.trim());
    const features = this.encodeFeatures(cgpa, education, branch, interest, skillsArr);

    const input = tf.tensor2d([features]);
    const prediction = this.model.predict(input) as tf.Tensor;
    const data = await prediction.data();
    
    // Get top 3 predictions
    const predictions = Array.from(data).map((confidence, index) => ({
      career: CAREERS[index],
      confidence
    })).sort((a, b) => b.confidence - a.confidence).slice(0, 3);
    
    input.dispose();
    prediction.dispose();

    return {
      topPredictions: predictions
    };
  }

  async saveModel() {
    if (!this.model) return;
    // In browser, we can save to localstorage or indexedDB
    await this.model.save('localstorage://career-model');
  }

  async loadModel() {
    try {
      const loadedModel = await tf.loadLayersModel('localstorage://career-model');
      
      // Verify input shape
      const inputSize = 1 + EDUCATION_STATUSES.length + BRANCHES.length + INTERESTS.length + SKILLS.length;
      const expectedShape = [null, inputSize];
      const actualShape = loadedModel.layers[0].batchInputShape;

      if (JSON.stringify(actualShape) !== JSON.stringify(expectedShape)) {
        console.warn("Loaded model has incompatible input shape. Discarding.");
        return;
      }

      this.model = loadedModel;
      this.model.compile({
        optimizer: tf.train.adam(),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    } catch (e) {
      console.log("No saved model found or error loading, using default.");
    }
  }
}

export const careerModelService = new CareerModelService();
