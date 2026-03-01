import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sessionSchema, SessionFormValues } from '../types';
import { X, Calendar, Clock, Play, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateSessionProps {
  communityId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSession({ communityId, userId, onClose, onSuccess }: CreateSessionProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      startTime: new Date().toISOString().slice(0, 16),
      endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      graceEndTime: new Date(Date.now() + 7200000).toISOString().slice(0, 16),
    }
  });

  const onSubmit = async (values: SessionFormValues) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, userId }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-x-blue/10 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-black border border-x-border rounded-3xl p-8 w-full max-w-lg shadow-2xl relative shadow-x-blue/10"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-x-gray hover:text-white transition-colors">
          <X size={24} />
        </button>

        <h3 className="text-2xl font-black mb-2 tracking-tighter">Schedule Session</h3>
        <p className="text-x-gray mb-8 text-sm">Set the timeframe for your community engagement.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-x-gray mb-2">Session Name</label>
            <input 
              {...register('name')}
              className="x-input w-full"
              placeholder="e.g. Weekly Alpha Sync"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-x-gray mb-2 flex items-center gap-1">
                <Play size={10} /> Start
              </label>
              <input 
                type="datetime-local"
                {...register('startTime')}
                className="x-input w-full text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-x-gray mb-2 flex items-center gap-1">
                <Clock size={10} /> End
              </label>
              <input 
                type="datetime-local"
                {...register('endTime')}
                className="x-input w-full text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-x-gray mb-2 flex items-center gap-1">
                <Lock size={10} /> Grace
              </label>
              <input 
                type="datetime-local"
                {...register('graceEndTime')}
                className="x-input w-full text-sm py-2"
              />
            </div>
          </div>
          {errors.startTime && <p className="text-red-500 text-xs">{errors.startTime.message}</p>}

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="x-button-primary w-full py-4 text-lg"
            >
              {isSubmitting ? 'Scheduling...' : 'Create Session'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
