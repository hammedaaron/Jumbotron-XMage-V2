import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Bell, 
  Search, 
  MoreHorizontal,
  Hash
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen bg-black text-white font-sans selection:bg-x-blue/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-72 border-r border-x-border sticky top-0 h-screen px-2 lg:px-4 py-4">
        <div className="mb-4 px-4">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: -5 }}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black font-black text-xl italic cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            J
          </motion.div>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavItem icon={<Home size={26} />} label="Home" active />
          <NavItem icon={<Hash size={26} />} label="Explore" />
          <NavItem icon={<Bell size={26} />} label="Notifications" />
          <NavItem icon={<Users size={26} />} label="Communities" />
          <NavItem icon={<Settings size={26} />} label="Settings" />
        </nav>

        <div className="mt-auto pt-4 border-t border-x-border">
          <button 
            onClick={signOut}
            className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-red-500/10 text-red-500 transition-all group"
          >
            <div className="p-2 rounded-full group-hover:bg-red-500/20 transition-colors">
              <LogOut size={22} />
            </div>
            <span className="hidden lg:inline font-bold">Logout</span>
          </button>

          <div className="mt-4 flex items-center gap-3 p-3 rounded-full hover:bg-x-hover transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-x-blue to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.username}</p>
              <p className="text-xs text-x-gray truncate">@{user?.handle}</p>
            </div>
            <MoreHorizontal size={18} className="hidden lg:block text-x-gray" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row min-w-0">
        <div className="flex-1 min-w-0 border-r border-x-border max-w-2xl mx-auto w-full">
          {children}
        </div>

        {/* Right Sidebar (Desktop only) */}
        <aside className="hidden xl:block w-80 p-4 space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-x-gray group-focus-within:text-x-blue transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search Jumbotron"
                className="w-full bg-[#202327] border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-1 focus:ring-x-blue focus:bg-black transition-all outline-none"
              />
            </div>

            <div className="bg-[#16181C] rounded-2xl p-4 border border-x-border">
              <h3 className="text-xl font-black mb-4 px-2">What's happening</h3>
              <div className="space-y-4">
                <TrendItem category="Trending in Tech" title="#Jumbotron" posts="12.5K posts" />
                <TrendItem category="Engagement" title="Alpha Squad Session" posts="2.1K active" />
                <TrendItem category="SaaS" title="Micro-Engagement" posts="892 posts" />
              </div>
              <button className="text-x-blue text-sm mt-4 px-2 hover:underline">Show more</button>
            </div>

            <div className="bg-[#16181C] rounded-2xl p-4 border border-x-border">
              <h3 className="text-xl font-black mb-4 px-2">Who to follow</h3>
              <div className="space-y-4">
                <FollowItem name="Elon Musk" handle="elonmusk" />
                <FollowItem name="Jumbotron HQ" handle="jumbotron_app" />
              </div>
              <button className="text-x-blue text-sm mt-4 px-2 hover:underline">Show more</button>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-x-border flex items-center justify-around py-3 px-4">
        <Home size={24} className="text-white" />
        <Search size={24} className="text-x-gray" />
        <Bell size={24} className="text-x-gray" />
        <Users size={24} className="text-x-gray" />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "flex items-center gap-4 w-fit lg:w-full p-3 rounded-full transition-all group",
      active ? "text-white" : "text-white/90 hover:bg-x-hover"
    )}>
      <div className="relative">
        {icon}
        {active && <div className="absolute -top-1 -right-1 w-2 h-2 bg-x-blue rounded-full" />}
      </div>
      <span className={cn(
        "hidden lg:inline text-xl",
        active ? "font-black" : "font-normal"
      )}>{label}</span>
    </button>
  );
}

function TrendItem({ category, title, posts }: { category: string, title: string, posts: string }) {
  return (
    <div className="hover:bg-white/5 p-2 rounded-xl cursor-pointer transition-colors">
      <p className="text-xs text-x-gray">{category}</p>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-xs text-x-gray">{posts}</p>
    </div>
  );
}

function FollowItem({ name, handle }: { name: string, handle: string }) {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs">
          {name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{name}</p>
          <p className="text-xs text-x-gray truncate">@{handle}</p>
        </div>
      </div>
      <button className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full hover:bg-neutral-200 transition-colors">
        Follow
      </button>
    </div>
  );
}
