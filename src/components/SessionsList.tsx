import React, { useEffect, useState } from 'react';
import { Session } from '../types';
import { Calendar, Clock, Users, Play, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';

interface SessionsListProps {
  communityId: string;
  isAdmin: boolean;
  onJoin: (sessionId: string) => void;
  onCreateClick: () => void;
}

export default function SessionsList({ communityId, isAdmin, onJoin, onCreateClick }: SessionsListProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [communityId]);

  const fetchData = async () => {
    try {
      const [sessionsRes, communitiesRes] = await Promise.all([
        fetch(`/api/communities/${communityId}/sessions`),
        fetch(`/api/communities?userId=${user?.id}`)
      ]);
      const sessionsData = await sessionsRes.json();
      const communitiesData = await communitiesRes.json();
      
      setSessions(sessionsData);
      setCommunity(communitiesData.find((c: any) => c.id === communityId));
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch(`/api/communities/${communityId}/upgrade`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setUpgrading(false);
    }
  };

  const getSessionStatus = (session: Session) => {
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    
    if (currentTime < start) return 'upcoming';
    if (currentTime >= start && currentTime <= end) return 'active';
    return 'closed';
  };

  if (loading) return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-x-hover rounded-2xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black tracking-tight">Sessions</h3>
          {community && (
            <div className={cn(
              "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
              community.planType === 'pro' ? "bg-x-blue/20 text-x-blue" : "bg-amber-500/20 text-amber-500"
            )}>
              {community.planType}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && community?.planType === 'trial' && (
            <button 
              onClick={handleUpgrade}
              disabled={upgrading}
              className="text-x-blue text-xs font-bold hover:underline disabled:opacity-50"
            >
              {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={onCreateClick}
              className="x-button-primary py-1.5 px-4 text-sm"
            >
              Schedule
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="p-12 text-center bg-x-hover/30 rounded-3xl border border-dashed border-x-border">
          <Calendar className="mx-auto text-x-gray mb-4" size={32} />
          <p className="text-x-gray font-bold">No sessions scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const status = getSessionStatus(session);
            return (
              <motion.div 
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "x-card p-5 rounded-2xl relative overflow-hidden group",
                  status === 'active' && "border-x-blue/50 bg-x-blue/5 shadow-[0_0_30px_rgba(29,155,240,0.1)]"
                )}
              >
                {status === 'active' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-x-blue animate-pulse" />
                )}
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-black tracking-tight group-hover:text-x-blue transition-colors">
                        {session.name}
                      </h4>
                      {status === 'active' && (
                        <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase">
                          <span className="w-1.5 h-1.5 bg-white rounded-full" />
                          Live
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:flex md:items-center gap-4 text-x-gray text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-x-blue" />
                        <span>{format(new Date(session.startTime), 'MMM d, h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span>Ends {format(new Date(session.endTime), 'h:mm a')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {status === 'active' ? (
                      <button 
                        onClick={() => onJoin(session.id)}
                        className="x-button-primary bg-x-blue text-white hover:bg-x-blue/90 px-6 flex items-center gap-2"
                      >
                        <Play size={16} fill="currentColor" />
                        Join Now
                      </button>
                    ) : status === 'upcoming' ? (
                      <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full text-xs font-bold">
                        <AlertCircle size={14} />
                        Upcoming
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-x-gray bg-white/5 px-4 py-2 rounded-full text-xs font-bold">
                        <CheckCircle2 size={14} />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
