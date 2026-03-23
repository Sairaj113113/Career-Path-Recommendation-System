import React, { useState, useEffect } from 'react';
import { 
  careerModelService, 
  INTERESTS, 
  EDUCATION_STATUSES, 
  BRANCHES, 
  SKILLS,
  PredictionResult,
  CareerPrediction
} from './services/careerModel';
import { 
  Brain, 
  GraduationCap, 
  Target, 
  TrendingUp, 
  Loader2, 
  Save, 
  Play, 
  BookOpen, 
  Briefcase, 
  Code2, 
  Cpu,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Database,
  Globe,
  Settings,
  UserCheck,
  FileText,
  MessageSquare,
  Plus,
  Bot,
  Laptop,
  BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CAREER_DETAILS: Record<string, { description: string; icon: React.ReactNode; color: string }> = {
  "ML Engineer": {
    description: "Design and implement machine learning models and AI systems.",
    icon: <Bot className="w-6 h-6" />,
    color: "bg-purple-500"
  },
  "Web Developer": {
    description: "Create and maintain modern, responsive web applications.",
    icon: <Globe className="w-6 h-6" />,
    color: "bg-blue-500"
  },
  "Data Scientist": {
    description: "Extract insights from complex data using statistical and computational methods.",
    icon: <BarChart className="w-6 h-6" />,
    color: "bg-emerald-500"
  },
  "Cyber Security": {
    description: "Protect systems and networks from digital attacks and data breaches.",
    icon: <ShieldCheck className="w-6 h-6" />,
    color: "bg-rose-500"
  },
  "Software Developer": {
    description: "Build robust software solutions across various platforms and technologies.",
    icon: <Laptop className="w-6 h-6" />,
    color: "bg-slate-500"
  }
};

const ROADMAPS: Record<string, { title: string; steps: { icon: React.ReactNode; text: string }[] }> = {
  "Pursuing": {
    title: "Academic Focus Roadmap",
    steps: [
      { icon: <BookOpen className="w-4 h-4" />, text: "Master core subjects related to your target career." },
      { icon: <Code2 className="w-4 h-4" />, text: "Build 2-3 mini projects to apply theoretical knowledge." },
      { icon: <Target className="w-4 h-4" />, text: "Maintain a strong CGPA while exploring electives." }
    ]
  },
  "Graduated": {
    title: "Professional Transition Roadmap",
    steps: [
      { icon: <Sparkles className="w-4 h-4" />, text: "Obtain industry-recognized certifications (AWS, Google, etc.)." },
      { icon: <Briefcase className="w-4 h-4" />, text: "Apply for internships or entry-level roles to gain experience." },
      { icon: <Globe className="w-4 h-4" />, text: "Build a professional portfolio showcasing your best work." }
    ]
  },
  "Looking for Job": {
    title: "Career Placement Roadmap",
    steps: [
      { icon: <FileText className="w-4 h-4" />, text: "Optimize your resume with keywords relevant to your target role." },
      { icon: <MessageSquare className="w-4 h-4" />, text: "Practice mock interviews and refine your communication skills." },
      { icon: <TrendingUp className="w-4 h-4" />, text: "Network on LinkedIn and attend industry-specific job fairs." }
    ]
  }
};

export default function App() {
  const [cgpa, setCgpa] = useState<string>('3.5');
  const [education, setEducation] = useState<string>(EDUCATION_STATUSES[0]);
  const [branch, setBranch] = useState<string>(BRANCHES[0]);
  const [interest, setInterest] = useState<string>(INTERESTS[0]);
  const [skills, setSkills] = useState<string>('');
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [otherSkillInput, setOtherSkillInput] = useState('');
  
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<{ epoch: number; loss: number; acc: number }[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isApiPredicting, setIsApiPredicting] = useState(false);
  const [modelStatus, setModelStatus] = useState<'untrained' | 'trained' | 'training'>('untrained');

  useEffect(() => {
    const load = async () => {
      await careerModelService.loadModel();
    };
    load();
  }, []);

  const handleTrain = async () => {
    setIsTraining(true);
    setModelStatus('training');
    setTrainingProgress([]);
    
    await careerModelService.trainModel((epoch, logs) => {
      setTrainingProgress(prev => [
        ...prev.slice(-19),
        { epoch, loss: logs?.loss || 0, acc: logs?.acc || 0 }
      ]);
    });

    setIsTraining(false);
    setModelStatus('trained');
    await careerModelService.saveModel();
  };

  const handlePredict = async () => {
    if (modelStatus === 'untrained') {
      alert("Please train the model first!");
      return;
    }
    
    setIsPredicting(true);
    try {
      const result = await careerModelService.predict(parseFloat(cgpa), education, branch, interest, skills);
      setPrediction(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPredicting(false);
    }
  };

  const handlePredictApi = async () => {
    setIsApiPredicting(true);
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cgpa: parseFloat(cgpa), 
          education, 
          branch, 
          interest,
          skills
        })
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setPrediction(result);
    } catch (error: any) {
      alert("API Error: " + error.message);
    } finally {
      setIsApiPredicting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-200">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-light tracking-tight">
                Career<span className="font-bold text-indigo-600">Predictor</span>
              </h1>
            </motion.div>
            <p className="text-slate-500 mt-2 ml-14">Advanced Neural Network Career Guidance System</p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${
                modelStatus === 'trained' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                modelStatus === 'training' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
              }`} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Status: {modelStatus}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-mono text-indigo-600 font-bold">TFJS v4.22</span>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Input Form */}
          <section className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[5rem] -mr-8 -mt-8" />
              
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-800">
                <div className="bg-indigo-50 p-2 rounded-xl">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                </div>
                Student Profile
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Academic CGPA
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="4"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
                      placeholder="e.g. 3.8"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Education Status
                  </label>
                  <div className="relative">
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none font-medium text-slate-700"
                    >
                      {EDUCATION_STATUSES.map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                      <Briefcase className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Engineering Branch
                  </label>
                  <div className="relative">
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none font-medium text-slate-700"
                    >
                      {BRANCHES.map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                      <Cpu className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                    Primary Interest
                  </label>
                  <div className="relative">
                    <select
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-indigo-500 focus:bg-white transition-all outline-none appearance-none font-medium text-slate-700"
                    >
                      {INTERESTS.map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                      <Code2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Technical Skills (Select all that apply)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[...SKILLS, ...customSkills].map(skill => {
                        const isSelected = skills.split(',').map(s => s.trim()).includes(skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => {
                              const currentSkills = skills.split(',').map(s => s.trim()).filter(s => s !== "");
                              if (isSelected) {
                                setSkills(currentSkills.filter(s => s !== skill).join(', '));
                              } else {
                                setSkills([...currentSkills, skill].join(', '));
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                      Other Skills
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={otherSkillInput}
                        onChange={(e) => setOtherSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && otherSkillInput.trim()) {
                            e.preventDefault();
                            const newSkill = otherSkillInput.trim();
                            if (![...SKILLS, ...customSkills].includes(newSkill)) {
                              setCustomSkills(prev => [...prev, newSkill]);
                              const currentSkills = skills.split(',').map(s => s.trim()).filter(s => s !== "");
                              if (!currentSkills.includes(newSkill)) {
                                setSkills([...currentSkills, newSkill].join(', '));
                              }
                            }
                            setOtherSkillInput('');
                          }
                        }}
                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
                        placeholder="Type a skill and press Enter..."
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                        <Plus className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={handleTrain}
                    disabled={isTraining}
                    className="flex-1 bg-slate-900 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-200"
                  >
                    {isTraining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    {modelStatus === 'trained' ? 'Retrain Engine' : 'Initialize Engine'}
                  </button>
                  
                  <button
                    onClick={handlePredict}
                    disabled={isTraining || isPredicting || isApiPredicting}
                    className="flex-1 bg-indigo-600 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200"
                  >
                    {isPredicting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
                    Local Predict
                  </button>
                </div>

                <button
                  onClick={handlePredictApi}
                  disabled={isTraining || isPredicting || isApiPredicting}
                  className="w-full bg-white text-indigo-600 border-2 border-indigo-50 rounded-2xl py-4 font-bold flex items-center justify-center gap-3 hover:bg-indigo-50 disabled:opacity-50 transition-all"
                >
                  {isApiPredicting ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
                  Predict via Express API
                </button>
              </div>
            </motion.div>

            {/* Training Progress */}
            <AnimatePresence>
              {trainingProgress.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-900/20 text-white"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Neural Training</h3>
                    <div className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-500/30">
                      EPOCH {trainingProgress[trainingProgress.length - 1].epoch + 1}/50
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Loss Function</span>
                        <span className="text-rose-400">{trainingProgress[trainingProgress.length - 1].loss.toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-rose-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, trainingProgress[trainingProgress.length - 1].loss * 50)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        <span>Accuracy Rate</span>
                        <span className="text-emerald-400">{(trainingProgress[trainingProgress.length - 1].acc * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${trainingProgress[trainingProgress.length - 1].acc * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Right Column: Results & Roadmap */}
          <section className="lg:col-span-7 space-y-8">
            {/* Prediction Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[500px] flex flex-col relative overflow-hidden"
            >
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-800">
                <div className="bg-emerald-50 p-2 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                Analysis Result
              </h2>

              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {prediction ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-10"
                    >
                      {/* Top 3 Predictions */}
                      <div className="space-y-6">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Top Career Matches</p>
                        <div className="space-y-4">
                          {prediction.topPredictions.map((pred, index) => {
                            const details = CAREER_DETAILS[pred.career];
                            return (
                              <motion.div 
                                key={pred.career}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group bg-slate-50 rounded-3xl p-6 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all border border-transparent hover:border-slate-100"
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`${details?.color || 'bg-slate-500'} p-3 rounded-2xl text-white shadow-lg`}>
                                    {details?.icon || <Target className="w-6 h-6" />}
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-lg font-bold text-slate-800">{pred.career}</h3>
                                      <span className="text-sm font-black text-indigo-600">{(pred.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                      {details?.description || "A promising career path based on your profile."}
                                    </p>
                                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pred.confidence * 100}%` }}
                                        className={`h-full ${details?.color || 'bg-indigo-600'}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Personalized Roadmap */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="bg-white/20 p-2 rounded-xl">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">{ROADMAPS[education]?.title || "Personalized Roadmap"}</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {ROADMAPS[education]?.steps.map((step, index) => (
                            <div key={index} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                              <div className="bg-white text-indigo-600 p-2 rounded-lg">
                                {step.icon}
                              </div>
                              <p className="text-sm font-medium">{step.text}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-8 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                          <span>Status: {education}</span>
                          <div className="flex items-center gap-1">
                            Next Steps <ArrowRight className="w-3 h-3" />
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 py-20"
                    >
                      <div className="w-24 h-24 border-4 border-dashed border-slate-100 rounded-[2.5rem] flex items-center justify-center mx-auto rotate-12">
                        <Brain className="w-10 h-10 opacity-10 -rotate-12" />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="font-bold text-slate-300 uppercase tracking-widest text-xs">Awaiting Analysis</p>
                        <p className="text-sm max-w-[240px] mx-auto">Complete your profile and click Predict to generate your AI-powered career roadmap.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-20 pb-10 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-slate-300">
            <div className="h-px w-12 bg-slate-200" />
            <Brain className="w-5 h-5 opacity-50" />
            <div className="h-px w-12 bg-slate-200" />
          </div>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em]">
            Powered by TensorFlow.js Deep Learning Engine
          </p>
        </footer>
      </div>
    </div>
  );
}
