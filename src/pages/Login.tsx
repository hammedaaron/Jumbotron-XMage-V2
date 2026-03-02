import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Twitter, ShieldCheck, Zap, Trophy, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signInWithX, loading } = useAuth();

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row items-center justify-center font-sans selection:bg-x-blue/30 overflow-hidden">
      {/* Left Side - Branding */}
      <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-x-blue/20 to-transparent opacity-50" />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="w-32 h-32 md:w-64 md:h-64 bg-white rounded-[2rem] md:rounded-[4rem] flex items-center justify-center text-black font-black text-6xl md:text-9xl italic shadow-[0_0_100px_rgba(255,255,255,0.1)] rotate-[-5deg]">
            J
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login */}
      <div className="flex-1 w-full max-w-xl p-8 md:p-16 flex flex-col justify-center">
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">Happening now</h1>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-12">Join Jumbotron today.</h2>

          <div className="space-y-4 max-w-sm">
            <button 
              onClick={signInWithX}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-full font-bold text-lg hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <Twitter size={20} fill="currentColor" />
              <span>Sign up with X</span>
            </button>
            
            <p className="text-[10px] text-x-gray leading-relaxed mt-4">
              By signing up, you agree to the <span className="text-x-blue hover:underline cursor-pointer">Terms of Service</span> and <span className="text-x-blue hover:underline cursor-pointer">Privacy Policy</span>, including <span className="text-x-blue hover:underline cursor-pointer">Cookie Use</span>.
            </p>
          </div>

          <div className="mt-20">
            <h3 className="font-bold text-lg mb-4">Already have an account?</h3>
            <button 
              onClick={signInWithX}
              className="w-full max-w-sm bg-transparent border border-x-border text-x-blue py-3 rounded-full font-bold text-lg hover:bg-x-blue/5 transition-all active:scale-95"
            >
              Sign in
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-x-border bg-black/50 backdrop-blur-sm hidden md:flex items-center justify-center gap-12 text-x-gray text-[10px] font-black uppercase tracking-[0.2em]">
        <Feature icon={<ShieldCheck size={12} />} label="Multi-Tenant" />
        <Feature icon={<Zap size={12} />} label="Real-time" />
        <Feature icon={<Trophy size={12} />} label="Auto Grading" />
        <Feature icon={<Users size={12} />} label="Community" />
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
      {icon}
      <span>{label}</span>
    </div>
  );
}
