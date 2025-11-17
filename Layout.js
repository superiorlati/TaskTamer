
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Grid3x3, CalendarClock, Home, Swords, Trophy, Play, Square, BarChart3, Beaker, Map } from "lucide-react"; // Added Map icon
import { ARCADE_COLORS, getArcadeBackground, getCRTOverlayCSS, getArcadeAnimations } from "./components/zombie/ThemePalettes";
import { useQuery } from "@tanstack/react-query";
import RandomEncounterPopup from "./components/zombie/RandomEncounterPopup";

const PERSONA_MESSAGES = {
  sweet: [
    "Hi sunshine! Let's keep your tasks from turning into bitey little troublemakers!",
    "You're doing amazing! Your tasks are looking healthy today!",
    "Keep going, friend! You've got this under control!"
  ],
  sarcastic: [
    "Wow, another day avoiding your responsibilities? Let's see how many zombies you've created now.",
    "Oh look, you're back. Try not to let everything decay this time.",
    "Finally decided to check your tasks? How brave."
  ],
  drill: [
    "ATTENTION! Your task list needs immediate action, soldier!",
    "Time to ELIMINATE those zombies! NO EXCUSES!",
    "Get moving! Those tasks won't complete themselves!"
  ],
  unhinged: [
    "LET'S GOOO I HOPE SOMETHING EXPLODES TODAY (metaphorically).",
    "CHAOS MODE ACTIVATED! Zombies beware!",
    "Your tasks are ALIVE and they're COMING FOR YOU!"
  ],
  horror: [
    "In the shadowed corners of your to-do list… something awakens.",
    "The infected tasks grow stronger with each passing hour...",
    "Beware... the zombies multiply in darkness..."
  ],
  arcade: [
    "PLAYER 1 READY — eliminate zombies and earn XP!",
    "GAME START! Clear your task board for bonus points!",
    "LEVEL UP! Your productivity score is rising!"
  ],
  deadpan: [
    "I have scanned your tasks. Several are dying. Proceed.",
    "Analysis complete. Zombie formation detected. Action required.",
    "Task status: suboptimal. Recommended action: immediate intervention."
  ]
};

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [topMessage, setTopMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [showEncounter, setShowEncounter] = useState(false);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    initialData: [],
    enabled: !isDemoMode
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!isDemoMode && tasks.length > 0) {
      const zombieTasks = tasks.filter(t => t.zombie?.state === 'zombie');
      if (zombieTasks.length > 0) {
        setTopMessage("🧟 WARNING: A ZOMBIE IS LOOSE IN YOUR TASK LIST!");
      } else {
        updatePersonaMessage();
      }
    } else if (isDemoMode) {
      setTopMessage("DEMO MODE — simulated week running fast. Click 'EXIT DEMO MODE' to return to your profile.");
    }
  }, [tasks, isDemoMode, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDemoMode && tasks.filter(t => t.zombie?.state === 'zombie').length === 0) {
        updatePersonaMessage();
      }
    }, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(interval);
  }, [user, isDemoMode, tasks]);

  // Random encounter trigger
  useEffect(() => {
    if (!isDemoMode && user) {
      const encounterChance = Math.random();
      if (encounterChance < 0.05) { // 5% chance every check
        const timeout = setTimeout(() => {
          setShowEncounter(true);
        }, Math.random() * 30000 + 10000); // Random delay 10-40s
        
        return () => clearTimeout(timeout);
      }
    }
  }, [location.pathname, isDemoMode, user]);

  const updatePersonaMessage = () => {
    if (!user) return;
    const tone = user.motivation_tone || 'sweet';
    const messages = PERSONA_MESSAGES[tone] || PERSONA_MESSAGES.sweet;
    setMessageIndex((prev) => (prev + 1) % messages.length);
    setTopMessage(messages[messageIndex % messages.length]);
  };

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleDemoToggle = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      updatePersonaMessage();
      
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 rounded-lg shadow-xl p-4 z-50 animate-slide-up';
      toast.style.background = ARCADE_COLORS.black;
      toast.style.border = `2px solid ${ARCADE_COLORS.matrixGreen}`;
      toast.style.color = '#FFFFFF';
      toast.textContent = "Demo stopped — returning to your profile.";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      
      navigate(createPageUrl("Matrix"));
    } else {
      setIsDemoMode(true);
      navigate(createPageUrl("Demo"));
    }
  };

  const handleLogout = async () => {
    try {
      // Delete all user data
      const allTasks = await base44.entities.Task.list();
      const allDuels = await base44.entities.Duel.list();
      const allCards = await base44.entities.MutationCard.list();
      const allChecks = await base44.entities.WellbeingCheck.list();
      const allProfiles = await base44.entities.ZombieProfile.list();
      const allCompanions = await base44.entities.ZombieCompanion.list();
      const allMutations = await base44.entities.MutationNode.list();
      const allEncounters = await base44.entities.RandomEncounter.list();
      const allMaterials = await base44.entities.CraftingMaterial.list();
      const allBadges = await base44.entities.PrestigeBadge.list();

      // Delete all entities in parallel
      await Promise.all([
        ...allTasks.map(t => base44.entities.Task.delete(t.id)),
        ...allDuels.map(d => base44.entities.Duel.delete(d.id)),
        ...allCards.map(c => base44.entities.MutationCard.delete(c.id)),
        ...allChecks.map(c => base44.entities.WellbeingCheck.delete(c.id)),
        ...allProfiles.map(p => base44.entities.ZombieProfile.delete(p.id)),
        ...allCompanions.map(c => base44.entities.ZombieCompanion.delete(c.id)),
        ...allMutations.map(m => base44.entities.MutationNode.delete(m.id)),
        ...allEncounters.map(e => base44.entities.RandomEncounter.delete(e.id)),
        ...allMaterials.map(m => base44.entities.CraftingMaterial.delete(m.id)),
        ...allBadges.map(b => base44.entities.PrestigeBadge.delete(b.id))
      ]);

      // Reset user data
      await base44.auth.updateMe({
        xp: 0,
        zombie_score: 0,
        badges: [],
        onboarding_completed: false
      });

      // Logout
      await base44.auth.logout();
    } catch (error) {
      console.error("Error during logout reset:", error);
      // Logout anyway
      await base44.auth.logout();
    }
  };

  const navItems = [
    { name: "Base Camp", icon: Home, path: createPageUrl("BaseCamp") },
    { name: "Tasks", icon: Grid3x3, path: createPageUrl("Matrix") },
    { name: "City Map", icon: Map, path: createPageUrl("CityMap") }, // New City Map item
    { name: "Cure Lab", icon: Beaker, path: createPageUrl("Lab") },
    { name: "Duel Arena", icon: Swords, path: createPageUrl("Duels") },
    { name: "Analytics", icon: BarChart3, path: createPageUrl("Analytics") },
    { name: "Rewards", icon: Trophy, path: createPageUrl("Profile") },
    { name: isDemoMode ? "⏹ EXIT DEMO" : "▶ DEMO", icon: isDemoMode ? Square : Play, path: "DEMO_TOGGLE", isDemoButton: true }
  ];

  const isActive = (path) => {
    if (path === "DEMO_TOGGLE") return location.pathname === createPageUrl("Demo");
    return location.pathname === path;
  };

  const intensity = user?.zombie_intensity || 3;
  const reducedMotion = user?.settings?.reduced_motion || false;
  const backgroundStyle = getArcadeBackground(intensity, reducedMotion);

  const activeTasks = tasks.filter(t => t.status !== 'done' && t.zombie?.state !== 'zombie');
  const zombieTasks = tasks.filter(t => t.zombie?.state === 'zombie');

  return (
    <div style={backgroundStyle} className="min-h-screen transition-all duration-300">
      <style>{`
        :root {
          --arcade-black: ${ARCADE_COLORS.black};
          --arcade-green: ${ARCADE_COLORS.matrixGreen};
          --arcade-radioactive: ${ARCADE_COLORS.radioactiveGreen};
          --arcade-cyan: ${ARCADE_COLORS.cyanGlow};
          --arcade-red: ${ARCADE_COLORS.bloodyRed};
        }
        
        .glass-card {
          background: ${ARCADE_COLORS.black}E6;
          backdrop-filter: blur(12px);
          border: 1px solid ${ARCADE_COLORS.matrixGreen}60;
          box-shadow: 0 0 20px ${ARCADE_COLORS.matrixGreen}33;
        }
        
        .zombie-glow {
          box-shadow: 0 0 30px ${ARCADE_COLORS.radioactiveGreen};
          border: 2px solid ${ARCADE_COLORS.radioactiveGreen};
        }

        .neon-text {
          color: ${ARCADE_COLORS.matrixGreen};
          text-shadow: 0 0 10px ${ARCADE_COLORS.matrixGreen}, 0 0 20px ${ARCADE_COLORS.matrixGreen};
        }

        .neon-border {
          border: 2px solid ${ARCADE_COLORS.matrixGreen};
          box-shadow: 0 0 10px ${ARCADE_COLORS.matrixGreen}, inset 0 0 10px ${ARCADE_COLORS.matrixGreen}33;
        }

        body, p, span, div, label, input, textarea, button, h1, h2, h3, h4, h5, h6 {
          color: #FFFFFF;
        }
        
        ${!reducedMotion ? getArcadeAnimations() : ''}
        ${!reducedMotion ? getCRTOverlayCSS() : ''}
        
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(.22,.9,.27,1);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {!reducedMotion && intensity >= 3 && (
        <div className="crt-overlay" />
      )}

      {/* Top Message Banner - ONLY shows when zombies exist or persona message */}
      {topMessage && (
        <div className="fixed top-16 left-0 right-0 z-40">
          <div className="max-w-4xl mx-auto px-4">
            <div 
              className="rounded-lg p-4 text-center font-bold shadow-lg"
              style={{
                background: ARCADE_COLORS.black,
                border: `2px solid ${
                  topMessage.includes('WARNING') || topMessage.includes('ZOMBIE') ? ARCADE_COLORS.bloodyRed :
                  topMessage.includes('DEMO MODE') ? ARCADE_COLORS.cyanGlow :
                  ARCADE_COLORS.matrixGreen
                }`,
                color: '#FFFFFF',
                boxShadow: `0 0 20px ${
                  topMessage.includes('WARNING') || topMessage.includes('ZOMBIE') ? ARCADE_COLORS.bloodyRed :
                  ARCADE_COLORS.matrixGreen
                }`,
                animation: (topMessage.includes('WARNING') || topMessage.includes('ZOMBIE')) ? 'arcadeFlash 1s infinite' : 'none'
              }}
            >
              {topMessage}
            </div>
          </div>
        </div>
      )}

      {showEncounter && (
        <RandomEncounterPopup
          intensity={user?.zombie_intensity || 3}
          onComplete={async (xp) => {
            // Update XP for the user
            await base44.auth.updateMe({ xp: (user.xp || 0) + xp });
            setShowEncounter(false);
          }}
          onFail={() => setShowEncounter(false)}
        />
      )}

      <main className="pb-20 md:pb-6 pt-32">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav 
        className="fixed bottom-0 left-0 right-0 md:hidden z-50"
        style={{
          background: `${ARCADE_COLORS.black}F0`,
          borderTop: `2px solid ${ARCADE_COLORS.matrixGreen}`,
          boxShadow: `0 -5px 30px ${ARCADE_COLORS.matrixGreen}33`
        }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            item.isDemoButton ? (
              <button
                key={item.name}
                onClick={handleDemoToggle}
                className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 font-bold text-xs"
                style={{
                  color: isActive(item.path) ? ARCADE_COLORS.bloodyRed : '#FFFFFF',
                  textShadow: isActive(item.path) ? `0 0 10px ${ARCADE_COLORS.bloodyRed}` : 'none'
                }}
              >
                <item.icon className="w-5 h-5" />
                <span className="mt-1">{isDemoMode ? '⏹' : '▶'}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200"
                style={{
                  color: isActive(item.path) ? ARCADE_COLORS.matrixGreen : '#FFFFFF',
                  textShadow: isActive(item.path) ? `0 0 10px ${ARCADE_COLORS.matrixGreen}` : 'none',
                  transform: isActive(item.path) ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs mt-1 font-bold">{item.name}</span>
              </Link>
            )
          ))}
        </div>
      </nav>

      {/* Top Navigation - Desktop */}
      <nav 
        className="hidden md:block fixed top-0 left-0 right-0 z-50"
        style={{
          background: `${ARCADE_COLORS.black}F0`,
          borderBottom: `2px solid ${ARCADE_COLORS.matrixGreen}`,
          boxShadow: `0 5px 30px ${ARCADE_COLORS.matrixGreen}33`
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center border-2"
              style={{
                background: ARCADE_COLORS.black,
                borderColor: ARCADE_COLORS.matrixGreen,
                boxShadow: `0 0 20px ${ARCADE_COLORS.matrixGreen}`
              }}
            >
              <span className="text-3xl">🧟</span>
            </div>
            <div>
              <h1 
                className="text-2xl font-bold neon-text"
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}
              >
                TASKTAMER
              </h1>
              <div className="flex gap-3 text-xs font-bold" style={{ color: '#FFFFFF' }}>
                <span style={{ color: ARCADE_COLORS.matrixGreen }}>
                  {activeTasks.length} Active
                </span>
                {zombieTasks.length > 0 && (
                  <span style={{ color: ARCADE_COLORS.bloodyRed }}>
                    {zombieTasks.length} 🧟 Zombies
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              item.isDemoButton ? (
                <button
                  key={item.name}
                  onClick={handleDemoToggle}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-bold"
                  style={{
                    background: isActive(item.path) ? `${ARCADE_COLORS.bloodyRed}20` : 'transparent',
                    color: isActive(item.path) ? ARCADE_COLORS.bloodyRed : '#FFFFFF',
                    border: `2px solid ${isActive(item.path) ? ARCADE_COLORS.bloodyRed : ARCADE_COLORS.matrixGreen}`,
                    boxShadow: isActive(item.path) ? `0 0 15px ${ARCADE_COLORS.bloodyRed}` : 'none',
                    textShadow: isActive(item.path) ? `0 0 10px ${ARCADE_COLORS.bloodyRed}` : 'none'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-bold"
                  style={{
                    background: isActive(item.path) ? `${ARCADE_COLORS.matrixGreen}20` : 'transparent',
                    color: isActive(item.path) ? ARCADE_COLORS.matrixGreen : '#FFFFFF',
                    border: isActive(item.path) ? `2px solid ${ARCADE_COLORS.matrixGreen}` : '2px solid transparent',
                    boxShadow: isActive(item.path) ? `0 0 15px ${ARCADE_COLORS.matrixGreen}` : 'none',
                    textShadow: isActive(item.path) ? `0 0 10px ${ARCADE_COLORS.matrixGreen}` : 'none'
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
