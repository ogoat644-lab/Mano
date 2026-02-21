import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Home,
  Send, 
  History, 
  MapPin, 
  Info, 
  ChevronRight, 
  Sparkles,
  Menu,
  X,
  Globe,
  Camera,
  BookOpen,
  Mic,
  MicOff,
  User as UserIcon,
  Baby,
  GraduationCap,
  Star,
  ArrowRight,
  LogOut,
  Lock,
  Mail,
  Users,
  Search,
  CheckCircle2,
  PlayCircle,
  Trash2,
  Plus
} from 'lucide-react';
import Markdown from 'react-markdown';
import { getHeritageResponse } from './services/geminiService';
import { Message, HeritageSite, Audience, AppView, User, ScavengerHuntData } from './types';
import { cn } from './lib/utils';

// Speech Recognition Type Definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

const HERITAGE_SITES: HeritageSite[] = [
  {
    id: '1',
    name: 'Taj Mahal',
    location: 'Agra, Uttar Pradesh, India',
    description: 'An ivory-white marble mausoleum on the right bank of the river Yamuna. It was commissioned in 1631 by the Mughal emperor Shah Jahan.',
    imageUrl: 'https://picsum.photos/seed/tajmahal/800/600',
    period: '17th Century',
    rating: 4.9
  },
  {
    id: '2',
    name: 'Hampi',
    location: 'Vijayanagara, Karnataka, India',
    description: 'The capital of the Vijayanagara Empire in the 14th century. It is a UNESCO World Heritage Site, located in east-central Karnataka.',
    imageUrl: 'https://picsum.photos/seed/hampi/800/600',
    period: '14th Century',
    rating: 4.8
  },
  {
    id: '3',
    name: 'Sun Temple',
    location: 'Konark, Odisha, India',
    description: 'A 13th-century CE Sun temple at Konark about 35 kilometres northeast from Puri on the coastline of Odisha, India.',
    imageUrl: 'https://picsum.photos/seed/konark/800/600',
    period: '13th Century',
    rating: 4.7
  },
  {
    id: '4',
    name: 'Ajanta Caves',
    location: 'Aurangabad, Maharashtra, India',
    description: '30 rock-cut Buddhist cave monuments which date from the 2nd century BCE to about 480 CE in Aurangabad district of Maharashtra.',
    imageUrl: 'https://picsum.photos/seed/ajanta/800/600',
    period: '2nd Century BC',
    rating: 4.9
  },
  {
    id: '5',
    name: 'Great Wall of China',
    location: 'Huairou District, China',
    description: 'A series of fortifications that were built across the historical northern borders of ancient Chinese states and Imperial China.',
    imageUrl: 'https://picsum.photos/seed/greatwall/800/600',
    period: '7th Century BC',
    rating: 4.8
  },
  {
    id: '6',
    name: 'Pyramids of Giza',
    location: 'Giza, Egypt',
    description: 'The oldest and largest of the three pyramids in the Giza pyramid complex bordering present-day Giza in Greater Cairo, Egypt.',
    imageUrl: 'https://picsum.photos/seed/pyramids/800/600',
    period: '26th Century BC',
    rating: 4.9
  },
  {
    id: '7',
    name: 'Machu Picchu',
    location: 'Cusco Region, Peru',
    description: 'A 15th-century Inca citadel located in the Eastern Cordillera of southern Peru on a 2,430-meter mountain ridge.',
    imageUrl: 'https://picsum.photos/seed/machu/800/600',
    period: '15th Century',
    rating: 4.9
  },
  {
    id: '8',
    name: 'Acropolis of Athens',
    location: 'Athens, Greece',
    description: 'An ancient citadel located on a rocky outcrop above the city of Athens and contains the remains of several ancient buildings.',
    imageUrl: 'https://picsum.photos/seed/acropolis/800/600',
    period: '5th Century BC',
    rating: 4.8
  },
  {
    id: '9',
    name: 'Angkor Wat',
    location: 'Siem Reap, Cambodia',
    description: 'A temple complex in Cambodia and the largest religious monument in the world by land area, on a site measuring 162.6 hectares.',
    imageUrl: 'https://picsum.photos/seed/angkor/800/600',
    period: '12th Century',
    rating: 4.9
  }
];

const LiquidBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        x: [0, 100, 0],
        y: [0, 50, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-heritage-olive/20 rounded-full blur-[120px]"
    />
    <motion.div
      animate={{
        x: [0, -150, 0],
        y: [0, 100, 0],
        scale: [1, 1.3, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-heritage-clay/20 rounded-full blur-[150px]"
    />
    <motion.div
      animate={{
        x: [0, 50, 0],
        y: [0, -100, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px]"
    />
  </div>
);

export default function App() {
  const [view, setView] = useState<AppView>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audience, setAudience] = useState<Audience>('general');
  const [grade, setGrade] = useState<number | undefined>(undefined);
  const [showGradeSelector, setShowGradeSelector] = useState(false);
  const [sites, setSites] = useState<HeritageSite[]>(HERITAGE_SITES);
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'features' | 'profile'>('home');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAudienceChange = (newAudience: Audience) => {
    setAudience(newAudience);
    if (newAudience === 'kids' && !grade) {
      setShowGradeSelector(true);
    } else {
      setShowGradeSelector(false);
    }
  };

  const handleGradeSelect = (selectedGrade: number) => {
    setGrade(selectedGrade);
    setShowGradeSelector(false);
    setUser(prev => prev ? { ...prev, grade: selectedGrade } : null);
    
    // Send a welcome message for the grade
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      role: 'model',
      content: `Awesome! Grade ${selectedGrade} is a great age to explore India. What would you like to learn about today? I can also give you a fun quiz if you want!`,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, welcomeMsg]);
  };

  const handleMCQAnswer = (messageId: string, questionIndex: number, answerIndex: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.mcq) {
        const newQuestions = [...msg.mcq.questions];
        // We don't really need to store the answer per question in the message state if we just want to show the final score
        // but let's assume we want to track it.
        
        // Check if it's the last question to calculate score
        const isLast = questionIndex === msg.mcq.questions.length - 1;
        if (isLast) {
          // This is a bit simplified. In a real app we'd track all answers.
          // For now, let's just mark it as completed and show a mock score or calculate it if we had the answers.
        }
      }
      return msg;
    }));
  };

  const completeQuiz = (messageId: string, answers: number[]) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.mcq) {
        let score = 0;
        msg.mcq.questions.forEach((q, i) => {
          if (q.correctAnswer === answers[i]) score++;
        });
        return {
          ...msg,
          mcq: { ...msg.mcq, score, isCompleted: true }
        };
      }
      return msg;
    }));
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = navigator.language || 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = navigator.language || 'en-US';
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  const MCQInterface = ({ message }: { message: Message }) => {
    const [answers, setAnswers] = useState<number[]>(new Array(message.mcq?.questions.length || 0).fill(-1));
    const [currentQuestion, setCurrentQuestion] = useState(0);

    if (!message.mcq) return null;

    const handleSelect = (optionIndex: number) => {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = optionIndex;
      setAnswers(newAnswers);
    };

    const next = () => {
      if (currentQuestion < message.mcq!.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        completeQuiz(message.id, answers);
      }
    };

    if (message.mcq.isCompleted) {
      return (
        <div className="mt-4 p-6 liquid-glass rounded-[32px] border border-white/10 text-center">
          <div className="w-16 h-16 bg-heritage-clay/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-heritage-clay" size={32} />
          </div>
          <h5 className="text-2xl font-serif mb-2">Quiz Completed!</h5>
          <div className="text-5xl font-display font-black mb-4">
            {message.mcq.score} / {message.mcq.questions.length}
          </div>
          <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Great job, Explorer!</p>
        </div>
      );
    }

    const q = message.mcq.questions[currentQuestion];

    return (
      <div className="mt-4 p-6 liquid-glass rounded-[32px] border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Question {currentQuestion + 1} of {message.mcq.questions.length}</span>
          <div className="flex gap-1">
            {message.mcq.questions.map((_, i) => (
              <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === currentQuestion ? "bg-white" : "bg-white/10")} />
            ))}
          </div>
        </div>
        <p className="text-lg font-serif mb-6">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={cn(
                "w-full text-left p-4 rounded-2xl text-sm transition-all border",
                answers[currentQuestion] === i 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          onClick={next}
          disabled={answers[currentQuestion] === -1}
          className="w-full mt-6 bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 transition-all disabled:opacity-20"
        >
          {currentQuestion === message.mcq.questions.length - 1 ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    );
  };
  const ScavengerHuntInterface = ({ message }: { message: Message }) => {
    const [hunt, setHunt] = useState<ScavengerHuntData>(message.scavengerHunt!);

    const toggleItem = (index: number) => {
      const newItems = [...hunt.items];
      newItems[index].isFound = !newItems[index].isFound;
      const isCompleted = newItems.every(i => i.isFound);
      setHunt({ ...hunt, items: newItems, isCompleted });
    };

    return (
      <div className="mt-4 p-6 liquid-glass rounded-[32px] border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-heritage-olive/20 rounded-xl flex items-center justify-center">
            <Search size={20} className="text-heritage-olive" />
          </div>
          <h5 className="text-xl font-serif">{hunt.title}</h5>
        </div>
        <div className="space-y-3">
          {hunt.items.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleItem(i)}
              className={cn(
                "w-full text-left p-4 rounded-2xl text-sm transition-all border flex items-center justify-between group",
                item.isFound 
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200" 
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <div>
                <p className="font-bold mb-1">{item.task}</p>
                <p className="text-[10px] opacity-40 italic group-hover:opacity-100 transition-opacity">Hint: {item.hint}</p>
              </div>
              {item.isFound ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-white/20" />}
            </button>
          ))}
        </div>
        {hunt.isCompleted && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-emerald-500 text-white rounded-2xl text-center font-bold"
          >
            🎉 Hunt Completed! You're a Master Explorer!
          </motion.div>
        )}
      </div>
    );
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsChatOpen(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const result = await getHeritageResponse(messageText, history, audience, grade);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: result.text || "I'm sorry, I couldn't process that request.",
        imageUrl: result.imageUrl,
        mcq: result.mcq,
        scavengerHunt: result.scavengerHunt,
        isStory: result.isStory,
        mapsLinks: result.mapsLinks,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const initialUser: User = { name: 'Explorer', email: 'explorer@heritage.in', isAuthenticated: true };
    setUser(initialUser);
    setProfiles([initialUser]);
    setView('main');
  };

  const addProfile = () => {
    if (profiles.length >= 15) {
      alert("Maximum 15 profiles allowed.");
      return;
    }
    if (!newProfileName.trim()) return;
    
    const newProfile: User = {
      name: newProfileName,
      email: newProfileEmail || `${newProfileName.toLowerCase().replace(/\s/g, '')}@heritage.in`,
      isAuthenticated: true
    };
    
    setProfiles(prev => [...prev, newProfile]);
    setNewProfileName('');
    setNewProfileEmail('');
    setIsAddingProfile(false);
  };

  const deleteProfile = (index: number) => {
    const profileToDelete = profiles[index];
    setProfiles(prev => prev.filter((_, i) => i !== index));
    if (user?.email === profileToDelete.email) {
      const remaining = profiles.filter((_, i) => i !== index);
      if (remaining.length > 0) {
        setUser(remaining[0]);
      } else {
        setView('welcome');
        setUser(null);
      }
    }
  };

  const switchProfile = (profile: User) => {
    setUser(profile);
  };

  const handleRate = (siteId: string, rating: number) => {
    setSites(prev => prev.map(site => 
      site.id === siteId ? { ...site, userRating: rating } : site
    ));
  };

  const renderWelcome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      <LiquidBackground />
      <div className="atmosphere" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative z-10 text-center max-w-5xl"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-80 h-80 border border-white/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-96 h-96 border border-white/5 rounded-full"
        />

        <span className="inline-block text-xs font-bold uppercase tracking-[0.5em] text-heritage-clay mb-6">
          The Digital Gateway to the World's Past
        </span>
        
        <h1 className="text-7xl md:text-9xl font-display font-black leading-none mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20">
          IGNITE<br /><span className="italic font-serif font-light">HISTORY</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-white/60 font-serif italic max-w-2xl mx-auto mb-12 leading-relaxed">
          Experience the grandeur of global history through our immersive liquid glass interface.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <motion.button 
            onClick={() => setView('login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-12 py-5 bg-white text-black font-bold rounded-full overflow-hidden transition-all"
          >
            <span className="relative z-10 flex items-center gap-2">
              Enter the Portal <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>
        </div>
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll to Explore</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-px h-12 bg-white"
        />
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <LiquidBackground />
      <div className="atmosphere" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md liquid-glass p-10 rounded-[40px] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Lock className="text-white" size={24} />
          </div>
          <h2 className="text-3xl font-serif mb-2">Welcome Back</h2>
          <p className="text-white/40 text-sm">Sign in to continue your historical journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="email" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                placeholder="name@example.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="password" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-white/30 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 transition-all active:scale-95"
          >
            Initialize Session
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setView('welcome')}
            className="text-xs text-white/40 hover:text-white transition-colors"
          >
            ← Back to Gateway
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderMain = () => (
    <div className="min-h-screen flex flex-col selection:bg-white/20">
      <LiquidBackground />
      <div className="atmosphere" />
      
      {/* Immersive Navigation */}
      <nav className="sticky top-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex items-center justify-between">
        <button 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 liquid-glass rounded-2xl flex items-center justify-center">
            <Compass size={24} className="text-white" />
          </div>
          <div className="text-left">
            <span className="text-xl font-display font-bold tracking-tighter block leading-none text-white">IGNITE</span>
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">History Portal</span>
          </div>
        </button>
        
        <div className="flex lg:hidden items-center gap-2">
          <button 
            onClick={() => setActiveTab('map')}
            className={cn("p-3 rounded-xl transition-colors", activeTab === 'map' ? "bg-white text-black" : "liquid-glass text-white/40")}
          >
            <MapPin size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('features')}
            className={cn("p-3 rounded-xl transition-colors", activeTab === 'features' ? "bg-white text-black" : "liquid-glass text-white/40")}
          >
            <Sparkles size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn("p-3 rounded-xl transition-colors", activeTab === 'profile' ? "bg-white text-black" : "liquid-glass text-white/40")}
          >
            <UserIcon size={20} />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
          <button 
            onClick={() => setActiveTab('home')} 
            className={cn("hover:text-white transition-colors", activeTab === 'home' && "text-white")}
          >
            Chronicles
          </button>
          <button 
            onClick={() => setActiveTab('map')} 
            className={cn("hover:text-white transition-colors", activeTab === 'map' && "text-white")}
          >
            Map
          </button>
          <button 
            onClick={() => setActiveTab('features')} 
            className={cn("hover:text-white transition-colors", activeTab === 'features' && "text-white")}
          >
            Features
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={cn("hover:text-white transition-colors", activeTab === 'profile' && "text-white")}
          >
            Profile
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('home')}
            className="p-3 liquid-glass rounded-2xl hover:bg-white/10 transition-colors group relative"
            title="Return to Chronicles"
          >
            <Home size={20} className="text-white" />
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Chronicles</span>
          </button>
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 liquid-glass rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{user?.name}</span>
          </div>
          <button 
            onClick={() => setView('welcome')}
            className="p-3 liquid-glass rounded-2xl hover:bg-white/10 transition-colors group relative"
            title="Sign Out"
          >
            <LogOut size={20} />
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 text-[8px] uppercase tracking-widest px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Sign Out</span>
          </button>
        </div>
      </nav>

      <main className="flex-grow">
        {activeTab === 'home' && (
          <>
            {/* Featured Sites Grid - Liquid Glass Cards */}
            <section className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-heritage-clay mb-4 block">Curated Wonders</span>
              <h2 className="text-5xl md:text-7xl font-display font-black leading-none">GLOBAL<br /><span className="italic font-serif font-light">TREASURES</span></h2>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsChatOpen(true)}
                className="px-8 py-4 liquid-glass rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-white/10 transition-all"
              >
                <Sparkles size={18} /> Ask the Guide
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sites.map((site, index) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                className="group relative"
              >
                <div className="liquid-glass rounded-[40px] overflow-hidden p-4 transition-all hover:-translate-y-2">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] mb-6">
                    <img 
                      src={site.imageUrl} 
                      alt={site.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-bold">{site.rating}</span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2 block">{site.period}</span>
                      <h3 className="text-2xl font-serif leading-none">{site.name}</h3>
                    </div>
                  </div>

                  <div className="px-2 pb-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        <MapPin size={12} />
                        {site.location}
                      </div>
                      <button 
                        onClick={() => {
                          setIsChatOpen(true);
                          handleSend(`Where is ${site.name} located?`);
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                        title="View on Map"
                      >
                        <MapPin size={14} />
                      </button>
                    </div>
                    
                    {/* Rating System */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Your Rating</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(site.id, star)}
                            className="transition-transform hover:scale-125 active:scale-90"
                          >
                            <Star 
                              size={14} 
                              className={cn(
                                "transition-colors",
                                (site.userRating || 0) >= star ? "text-yellow-500 fill-yellow-500" : "text-white/10"
                              )} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setIsChatOpen(true);
                        handleSend(`Provide a detailed research report on ${site.name}. Include its historical significance, current rating (${site.rating}/5), best timing to visit, and its precise location on the map.`);
                      }}
                      className="w-full py-4 liquid-glass border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-white transition-all hover:text-black flex items-center justify-center gap-2 group"
                    >
                      Explore Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Immersive Stats Section */}
        <section className="py-32 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: "UNESCO Sites", value: "40+", icon: Globe },
              { label: "Years of History", value: "5000+", icon: History },
              { label: "Cultural Regions", value: "28", icon: MapPin }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="liquid-glass p-12 rounded-[50px] text-center relative overflow-hidden group"
              >
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors" />
                <stat.icon size={40} className="mx-auto mb-8 text-white/20" />
                <div className="text-6xl font-display font-black mb-4">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-[0.4em] text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </section>
          </>
        )}

        {activeTab === 'map' && (
          <section className="max-w-7xl mx-auto px-8 py-20">
            <div className="mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-heritage-clay mb-4 block">Interactive Atlas</span>
              <h2 className="text-5xl md:text-7xl font-display font-black leading-none">WORLD<br /><span className="italic font-serif font-light">MAP</span></h2>
            </div>
            <div className="aspect-video w-full rounded-[40px] overflow-hidden liquid-glass border border-white/10 relative group">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-heritage-clay/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <MapPin size={48} className="text-heritage-clay" />
                </div>
                <h3 className="text-3xl font-serif mb-4 italic">Virtual Cartography Active</h3>
                <p className="text-white/40 max-w-md mb-8">
                  Ask the Ignite Guide about any heritage site location to see accurate maps and directions.
                </p>
                <button 
                  onClick={() => setIsChatOpen(true)}
                  className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:scale-105 transition-all"
                >
                  ASK FOR LOCATION
                </button>
              </div>
              <div className="absolute inset-0 -z-10 opacity-20 bg-[url('https://picsum.photos/seed/map/1920/1080')] bg-cover bg-center grayscale" />
            </div>
          </section>
        )}

        {activeTab === 'features' && (
          <section className="max-w-7xl mx-auto px-8 py-20">
            <div className="mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-heritage-clay mb-4 block">Capabilities</span>
              <h2 className="text-5xl md:text-7xl font-display font-black leading-none">IGNITE<br /><span className="italic font-serif font-light">FEATURES</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: Camera, 
                  title: 'AI Visuals', 
                  desc: 'Generate hyper-realistic images of ancient sites as they looked in their prime.',
                  query: 'Show me an AI-generated visual of the Taj Mahal as it looked in the 17th century.'
                },
                { 
                  icon: Search, 
                  title: 'Scavenger Hunts', 
                  desc: 'Engage in interactive virtual hunts to discover hidden details of history.',
                  query: 'I want to start a scavenger hunt for an ancient city.'
                },
                { 
                  icon: PlayCircle, 
                  title: 'Storytelling', 
                  desc: 'Listen to captivating legends and tales told with dramatic flair.',
                  query: 'Tell me a legendary story about a lost civilization.'
                },
                { 
                  icon: GraduationCap, 
                  title: 'Quiz Mode', 
                  desc: 'Test your knowledge with playful MCQs tailored to your grade level.',
                  query: 'I\'m ready for a history quiz! Surprise me.'
                },
                { 
                  icon: MapPin, 
                  title: 'Accurate Maps', 
                  desc: 'Get precise location data and directions powered by Google Maps grounding.',
                  query: 'Show me a map of the Great Wall of China and tell me how to get there.'
                },
                { 
                  icon: Mic, 
                  title: 'Voice Control', 
                  desc: 'Interact with the guide naturally using advanced speech recognition.',
                  query: 'How can I use my voice to interact with the Ignite Guide?'
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsChatOpen(true);
                    handleSend(feature.query);
                  }}
                  className="p-10 liquid-glass border border-white/10 rounded-[40px] group cursor-pointer hover:bg-white/5 transition-all"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-heritage-clay/20 transition-colors">
                    <feature.icon size={32} className="text-white group-hover:text-heritage-clay transition-colors" />
                  </div>
                  <h3 className="text-2xl font-serif mb-4 italic">{feature.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-8">{feature.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-heritage-clay opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it now <ArrowRight size={12} />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="max-w-5xl mx-auto px-8 py-20">
            <div className="mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.4em] text-heritage-clay mb-4 block">Explorer Identity</span>
              <h2 className="text-5xl md:text-7xl font-display font-black leading-none">MANAGE<br /><span className="italic font-serif font-light">PROFILES</span></h2>
              <p className="text-white/40 mt-4 font-serif italic">Up to 15 unique explorer identities allowed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "liquid-glass border p-8 rounded-[40px] relative group transition-all",
                    user?.email === p.email ? "border-heritage-clay shadow-[0_0_30px_rgba(194,123,76,0.2)]" : "border-white/10"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-2 border-white/10 p-1.5 mb-4">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-heritage-clay to-heritage-olive flex items-center justify-center text-2xl font-display font-black">
                        {p.name.charAt(0)}
                      </div>
                    </div>
                    <h3 className="text-xl font-serif mb-1 italic">{p.name}</h3>
                    <p className="text-white/40 text-xs mb-6 truncate w-full text-center">{p.email}</p>
                    
                    <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => switchProfile(p)}
                        disabled={user?.email === p.email}
                        className={cn(
                          "flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
                          user?.email === p.email ? "bg-heritage-clay text-white" : "bg-white/5 hover:bg-white/10 text-white/60"
                        )}
                      >
                        {user?.email === p.email ? 'Active' : 'Switch'}
                      </button>
                      <button 
                        onClick={() => deleteProfile(i)}
                        className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {profiles.length < 15 && (
                <button
                  onClick={() => setIsAddingProfile(true)}
                  className="border-2 border-dashed border-white/10 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 hover:border-white/30 hover:bg-white/5 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={32} className="text-white/20 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Add New Profile</span>
                </button>
              )}
            </div>

            <AnimatePresence>
              {isAddingProfile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-full max-w-md liquid-glass p-10 rounded-[40px] border border-white/10"
                  >
                    <h3 className="text-3xl font-serif mb-8 italic text-center">New Explorer</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Explorer Name</label>
                        <input 
                          type="text" 
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors"
                          placeholder="e.g. Marco Polo"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 ml-4">Email (Optional)</label>
                        <input 
                          type="email" 
                          value={newProfileEmail}
                          onChange={(e) => setNewProfileEmail(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-white/30 transition-colors"
                          placeholder="marco@heritage.in"
                        />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={() => setIsAddingProfile(false)}
                          className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={addProfile}
                          className="flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-white text-black hover:bg-white/90 transition-all"
                        >
                          Create Profile
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-20 pt-12 border-t border-white/5 flex justify-center">
              <button 
                onClick={() => setView('welcome')}
                className="flex items-center gap-3 px-10 py-5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all font-bold uppercase tracking-widest text-xs"
              >
                <LogOut size={18} /> Exit Portal
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Chat Overlay - Liquid Glass */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[600px] bg-black/40 backdrop-blur-3xl z-[70] border-l border-white/10 flex flex-col"
            >
              <div className="p-8 border-b border-white/10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 liquid-glass rounded-2xl flex items-center justify-center">
                      <Sparkles size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl leading-none mb-2">IGNITE GUIDE</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Neural Engine Active</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-3 liquid-glass rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex p-1 bg-white/5 rounded-2xl">
                  {[
                    { id: 'general', icon: UserIcon, label: 'General' },
                    { id: 'kids', icon: Baby, label: 'Kids' },
                    { id: 'adults', icon: GraduationCap, label: 'Adults' },
                    { id: 'family', icon: Users, label: 'Family' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleAudienceChange(opt.id as Audience)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        audience === opt.id ? "bg-white text-black" : "text-white/40 hover:text-white/60"
                      )}
                    >
                      <opt.icon size={14} /> {opt.label}
                    </button>
                  ))}
                </div>

                {/* Grade Selector for Kids */}
                <AnimatePresence>
                  {showGradeSelector && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 liquid-glass rounded-2xl border border-white/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 text-center">Select your grade (1-10)</p>
                        <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                            <button
                              key={g}
                              onClick={() => handleGradeSelect(g)}
                              className={cn(
                                "py-2 rounded-lg text-xs font-bold transition-all border",
                                grade === g ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/20"
                              )}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div 
                ref={scrollRef}
                className="flex-grow overflow-y-auto p-8 space-y-8"
              >
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-10">
                    <div className="w-24 h-24 liquid-glass rounded-[32px] flex items-center justify-center mb-8 animate-float">
                      <Globe className="text-white/20" size={48} />
                    </div>
                    <h4 className="text-3xl font-serif mb-4">What shall we discover?</h4>
                    <p className="text-white/40 text-sm mb-12 leading-relaxed">Ask about any Indian heritage site, its history, or plan your next visit.</p>
                    <div className="grid grid-cols-1 gap-3 w-full">
                      {[
                        "Tell me about the architecture of Taj Mahal",
                        "Fun facts about Hampi for kids",
                        "Best time to visit Konark Sun Temple",
                        "History of Ajanta Caves"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSend(suggestion)}
                          className="text-left p-5 text-xs font-bold uppercase tracking-widest liquid-glass rounded-2xl hover:bg-white/10 transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <motion.div 
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col",
                      message.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[90%] p-6 rounded-[32px] transition-all hover:scale-[1.02]",
                      message.role === 'user' 
                        ? "bg-white text-black font-medium rounded-tr-none shadow-[0_10px_30px_rgba(255,255,255,0.1)]" 
                        : "liquid-glass rounded-tl-none",
                      message.isStory && "border-2 border-heritage-clay/30 bg-heritage-clay/5"
                    )}>
                      {message.isStory && (
                        <div className="flex items-center gap-2 mb-4 text-heritage-clay font-bold uppercase tracking-widest text-[10px]">
                          <PlayCircle size={16} /> Animated Storytelling
                        </div>
                      )}
                      {message.imageUrl && (
                        <div className="mb-4 overflow-hidden rounded-2xl border border-white/10">
                          <img 
                            src={message.imageUrl} 
                            alt="Generated heritage visual" 
                            className="w-full h-auto object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className={cn(
                        "markdown-body text-sm",
                        message.isStory && "font-serif italic text-lg leading-relaxed text-white"
                      )}>
                        <Markdown>{message.content}</Markdown>
                      </div>
                      {message.mcq && <MCQInterface message={message} />}
                      {message.scavengerHunt && <ScavengerHuntInterface message={message} />}
                      {message.mapsLinks && message.mapsLinks.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.mapsLinks.map((link, i) => (
                            <a 
                              key={i} 
                              href={link.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                              <MapPin size={12} /> {link.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-white/20 mt-3 font-bold uppercase tracking-widest">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start">
                    <div className="liquid-glass p-6 rounded-[32px] rounded-tl-none">
                      <div className="flex gap-2">
                        {[0, 1, 2].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} 
                            className="w-2 h-2 bg-white rounded-full" 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-white/10 bg-black/20">
                <div className="relative flex items-end gap-4">
                  <div className="relative flex-grow">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={isListening ? "Listening to your voice..." : "Type your query..."}
                      className={cn(
                        "w-full bg-white/5 border border-white/10 rounded-[24px] py-5 pl-6 pr-16 text-sm focus:outline-none focus:border-white/30 transition-all resize-none h-16",
                        isListening && "border-white/50 ring-4 ring-white/10"
                      )}
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-3 top-3 w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-20"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      setInput("Where is the nearest heritage site?");
                      handleSend("Where is the nearest heritage site?");
                    }}
                    className="w-16 h-16 rounded-[24px] liquid-glass text-white hover:bg-white/10 flex items-center justify-center transition-all"
                    title="Quick Map Search"
                  >
                    <MapPin size={24} />
                  </button>
                  
                  <button
                    onClick={toggleListening}
                    className={cn(
                      "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all",
                      isListening 
                        ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]" 
                        : "liquid-glass text-white hover:bg-white/10"
                    )}
                  >
                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <AnimatePresence mode="wait">
      {view === 'welcome' && <motion.div key="welcome" exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.8 }}>{renderWelcome()}</motion.div>}
      {view === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderLogin()}</motion.div>}
      {view === 'main' && <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{renderMain()}</motion.div>}
    </AnimatePresence>
  );
}
