import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Session, SessionParticipant } from '../types';
import { Users, Clock, ArrowLeft, ShieldCheck, Zap, Trophy, Share2, MoreHorizontal, Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function SessionRoom() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session & { participants: SessionParticipant[] } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isEnded, setIsEnded] = useState(false);
  const [engaging, setEngaging] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!session || session.status === 'completed') return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(session.endTime);
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsEnded(true);
        clearInterval(timer);
        fetchSession();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      setSession(data);
      if (data.status === 'completed') setIsEnded(true);
    } catch (error) {
      console.error('Failed to fetch session:', error);
    }
  };

  const handleEngage = async (targetId: string) => {
    if (isEnded || engaging) return;
    setEngaging(targetId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/engage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engagerId: user?.id, targetId }),
      });
      if (res.ok) {
        fetchSession();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to engage');
      }
    } catch (error) {
      console.error('Engage error:', error);
    } finally {
      setEngaging(null);
    }
  };

  const getGradeColor = (grade: string | null) => {
    switch (grade) {
      case 'A': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
      case 'B': return 'text-x-blue border-x-blue/30 bg-x-blue/10';
      case 'C': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
      case 'D': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      case 'F': return 'text-red-500 border-red-500/30 bg-red-500/10';
      default: return 'text-x-gray border-x-border bg-x-hover';
    }
  };

  const sortedParticipants = React.useMemo(() => {
    if (!session) return [];
    const participants = [...session.participants];
    if (session.status === 'completed') {
      const gradeOrder: Record<string, number> = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
      return participants.sort((a, b) => {
        const gradeA = a.grade || 'F';
        const gradeB = b.grade || 'F';
        if (gradeA !== gradeB) {
          return (gradeOrder[gradeB] || 0) - (gradeOrder[gradeA] || 0);
        }
        // Secondary sort by engagedWithCount
        return b.engagedWithCount - a.engagedWithCount;
      });
    }
    return participants;
  }, [session]);

  if (!session) return (
    <div className="h-screen w-screen flex items-center justify-center bg-black">
      <div className="text-x-blue animate-pulse font-black text-2xl italic tracking-tighter">
        Entering Jumbotron...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Header */}
      <header className="glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-x-hover rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">{session.name}</h2>
              {session.status === 'completed' ? (
                <span className="bg-white/10 text-x-gray text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest border border-x-border">Closed</span>
              ) : (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">Live</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-x-gray font-bold">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {session.participants.length} listening
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest font-black text-x-gray">
              {session.status === 'completed' ? 'Finalized' : 'Time Left'}
            </span>
            <span className={cn(
              "text-2xl font-mono font-black tabular-nums",
              isEnded && session.status !== 'completed' ? "text-red-500" : "text-white"
            )}>
              {session.status === 'completed' ? '00:00' : timeLeft}
            </span>
          </div>
          <button className="p-2 hover:bg-x-hover rounded-full text-x-gray transition-colors">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full border-x border-x-border">
        {/* Session Banner */}
        <div className="p-6 border-b border-x-border bg-gradient-to-b from-x-blue/10 to-transparent">
          <div className="flex items-start justify-between mb-6">
            <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center text-white font-black text-4xl border border-x-border shadow-2xl">
              {session.name[0].toUpperCase()}
            </div>
            <div className="flex gap-2">
              <button className="x-button-outline py-1.5 px-4 text-sm">Follow</button>
              <button className="p-2 hover:bg-x-hover rounded-full border border-x-border transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">{session.name}</h1>
          <p className="text-x-gray leading-relaxed mb-4">
            {session.status === 'completed' 
              ? "This session has ended. Check the standings below to see your final engagement grade."
              : "Welcome to the live engagement session! Connect with others, share insights, and boost your engagement score."}
          </p>
          <div className="flex items-center gap-4 text-sm text-x-gray">
            <span className="flex items-center gap-1"><Users size={14} /> <b className="text-white">{session.participants.length}</b> participants</span>
            <span className="flex items-center gap-1"><Clock size={14} /> <b className="text-white">{session.status}</b></span>
          </div>
        </div>

        {/* Participants Feed */}
        <div className="divide-y divide-x-border">
          <div className="px-4 py-3 bg-x-hover/50 border-b border-x-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-x-gray flex items-center gap-2">
              {session.status === 'completed' ? <Trophy size={14} className="text-amber-500" /> : <Users size={14} className="text-x-blue" />}
              {session.status === 'completed' ? 'Final Standings' : 'Participants'}
            </h3>
          </div>

          <AnimatePresence>
            {sortedParticipants.map((p, index) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 flex gap-4 hover:bg-x-hover transition-colors group",
                  p.userId === user?.id && "bg-x-blue/5"
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-white font-black text-xl border border-x-border">
                    {p.user?.username[0].toUpperCase()}
                  </div>
                  {p.userId === user?.id && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-x-blue border-2 border-black rounded-full flex items-center justify-center">
                      <ShieldCheck size={10} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="font-black text-sm truncate">{p.user?.username}</span>
                      <span className="text-x-gray text-xs truncate">@{p.user?.handle}</span>
                      <span className="text-x-gray text-xs">· {index + 1}</span>
                    </div>
                    {session.status === 'completed' ? (
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border",
                        getGradeColor(p.grade)
                      )}>
                        {p.grade}
                      </div>
                    ) : (
                      p.userId !== user?.id && (
                        <button 
                          onClick={() => handleEngage(p.userId)}
                          disabled={engaging === p.userId}
                          className="text-x-gray hover:text-x-blue transition-colors p-1"
                        >
                          <Zap size={18} className={cn(engaging === p.userId && "animate-bounce text-x-blue")} />
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-6 mt-3">
                    <div className="flex items-center gap-1.5 text-x-gray hover:text-x-blue transition-colors cursor-default group/stat">
                      <MessageCircle size={16} className="group-hover/stat:bg-x-blue/10 rounded-full p-0.5" />
                      <span className="text-xs font-bold">{p.engagedWithCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-x-gray hover:text-emerald-500 transition-colors cursor-default group/stat">
                      <Repeat2 size={16} className="group-hover/stat:bg-emerald-500/10 rounded-full p-0.5" />
                      <span className="text-xs font-bold">{p.engagedByCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-x-gray hover:text-red-500 transition-colors cursor-default group/stat">
                      <Heart size={16} className="group-hover/stat:bg-red-500/10 rounded-full p-0.5" />
                      <span className="text-xs font-bold">{Math.floor(p.engagedWithCount * 1.5)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Grading Key (Sticky on Desktop) */}
      <aside className="hidden lg:block fixed right-8 top-24 w-64 space-y-4">
        <div className="bg-x-hover/30 border border-x-border rounded-2xl p-4">
          <h4 className="font-black text-sm mb-3 flex items-center gap-2">
            <ShieldCheck size={16} className="text-x-blue" />
            Grading System
          </h4>
          <div className="space-y-2">
            <GradeRow grade="A" label="Expert" count="10+" color="text-emerald-500" />
            <GradeRow grade="B" label="Active" count="7-9" color="text-x-blue" />
            <GradeRow grade="C" label="Member" count="4-6" color="text-amber-500" />
            <GradeRow grade="D" label="Passive" count="1-3" color="text-orange-500" />
            <GradeRow grade="F" label="Inactive" count="0" color="text-red-500" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function GradeRow({ grade, label, count, color }: { grade: string, label: string, count: string, color: string }) {
  return (
    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <span className={cn("w-4 text-center", color)}>{grade}</span>
        <span className="text-x-gray">{label}</span>
      </div>
      <span className="text-x-gray/50">{count}</span>
    </div>
  );
}
