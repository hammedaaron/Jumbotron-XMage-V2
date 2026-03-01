import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { communitySchema, CommunityFormValues, Community } from '../types';
import { Plus, Users, ArrowRight, ArrowLeft, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SessionsList from '../components/SessionsList';
import CreateSession from '../components/CreateSession';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CommunityFormValues>({
    resolver: zodResolver(communitySchema)
  });

  useEffect(() => {
    if (user) {
      fetchCommunities();
    }
  }, [user]);

  const fetchCommunities = async () => {
    try {
      const res = await fetch(`/api/communities?userId=${user?.id}`);
      const data = await res.json();
      setCommunities(data);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: CommunityFormValues) => {
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, ownerId: user?.id }),
      });
      if (res.ok) {
        reset();
        setShowCreateForm(false);
        fetchCommunities();
      }
    } catch (error) {
      console.error('Failed to create community:', error);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (res.ok) {
        navigate(`/session/${sessionId}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to join session');
      }
    } catch (error) {
      console.error('Join error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-x-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {selectedCommunity && (
            <button 
              onClick={() => setSelectedCommunity(null)}
              className="p-2 hover:bg-x-hover rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-black tracking-tight">
              {selectedCommunity ? selectedCommunity.name : 'Home'}
            </h2>
            <p className="text-xs text-x-gray">
              {selectedCommunity ? 'Community Dashboard' : `${communities.length} communities`}
            </p>
          </div>
        </div>
        {!selectedCommunity && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="w-10 h-10 bg-x-blue rounded-full flex items-center justify-center hover:bg-x-blue/90 transition-colors shadow-lg shadow-x-blue/20"
          >
            <Plus size={24} />
          </button>
        )}
      </header>

      <div className="divide-y divide-x-border">
        <AnimatePresence mode="wait">
          {selectedCommunity ? (
            <motion.div 
              key="community-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-4"
            >
              <div className="relative h-32 bg-gradient-to-r from-x-blue/20 to-indigo-600/20 rounded-2xl mb-12 overflow-hidden border border-x-border">
                <div className="absolute -bottom-8 left-4">
                  <div className="w-20 h-20 bg-black border-4 border-black rounded-2xl flex items-center justify-center text-white font-black text-4xl shadow-2xl ring-1 ring-x-border">
                    {selectedCommunity.name[0].toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="px-2 mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-3xl font-black tracking-tighter">{selectedCommunity.name}</h3>
                  {selectedCommunity.ownerId === user?.id && (
                    <div className="flex items-center gap-2 text-x-blue bg-x-blue/10 px-3 py-1 rounded-full text-xs font-bold">
                      <ShieldCheck size={14} />
                      Admin
                    </div>
                  )}
                </div>
                <p className="text-x-gray leading-relaxed">{selectedCommunity.bio || 'No description provided.'}</p>
              </div>

              <SessionsList 
                communityId={selectedCommunity.id}
                isAdmin={selectedCommunity.ownerId === user?.id}
                onJoin={handleJoinSession}
                onCreateClick={() => setShowCreateSession(true)}
              />

              {showCreateSession && (
                <CreateSession 
                  communityId={selectedCommunity.id}
                  userId={user?.id!}
                  onClose={() => setShowCreateSession(false)}
                  onSuccess={() => {
                    setShowCreateSession(false);
                    window.location.reload();
                  }}
                />
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="community-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {communities.length === 0 && !showCreateForm ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-x-hover rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="text-x-gray" size={40} />
                  </div>
                  <h3 className="text-2xl font-black">No communities yet</h3>
                  <p className="text-x-gray mt-2 mb-8 max-w-xs mx-auto">Create your first community to start hosting engagement sessions.</p>
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="x-button-primary px-10 py-3 text-lg"
                  >
                    Get Started
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-x-border">
                  {communities.map((community) => (
                    <motion.div 
                      key={community.id}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      onClick={() => setSelectedCommunity(community)}
                      className="p-4 flex gap-4 cursor-pointer transition-colors group"
                    >
                      <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 border border-x-border group-hover:border-x-blue/50 transition-colors">
                        {community.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-lg group-hover:text-x-blue transition-colors">{community.name}</h4>
                            <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-white/5 rounded text-x-gray">
                              {community.planType}
                            </span>
                          </div>
                          <MoreHorizontal size={18} className="text-x-gray opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-x-gray text-sm line-clamp-2 mb-3">{community.bio || 'No description provided.'}</p>
                        <div className="flex items-center gap-4 text-x-gray text-xs">
                          <span className="flex items-center gap-1 hover:text-x-blue transition-colors">
                            <Users size={14} />
                            Members
                          </span>
                          <span className="flex items-center gap-1 hover:text-x-blue transition-colors">
                            <ArrowRight size={14} />
                            View Sessions
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Community Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-x-blue/10 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-black border border-x-border rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-x-blue/10"
          >
            <h3 className="text-2xl font-black mb-6 tracking-tighter">Create Community</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-x-gray mb-2">Community Name</label>
                <input 
                  {...register('name')}
                  className="x-input w-full"
                  placeholder="e.g. The Alpha Squad"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-x-gray mb-2">Bio (Optional)</label>
                <textarea 
                  {...register('bio')}
                  className="x-input w-full h-28 resize-none"
                  placeholder="What is this community about?"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="x-button-outline flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="x-button-primary flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
