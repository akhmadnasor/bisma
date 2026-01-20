import React from 'react';
import { 
  Activity, Server, Shield, Zap, Users,
  Globe, AlertTriangle, Terminal, Cpu, Database
} from 'lucide-react';

interface SuperAdminProps {
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-cyan-500 selection:text-white pb-10">
      {/* Top Bar "Sat Set" */}
      <header className="border-b border-slate-800 bg-[#0F172A] sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
           <h1 className="font-black text-xl tracking-tight text-white italic">BISMA <span className="text-cyan-400">CORE</span></h1>
        </div>
        <button onClick={onLogout} className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-900/20 rounded-lg transition-colors border border-red-900/50">
          SHUTDOWN / LOGOUT
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 animate-fade-in-up">
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                 <div>
                     <div className="text-xs text-slate-500 font-bold uppercase">Latency</div>
                     <div className="text-xl font-mono font-bold text-green-400">24ms</div>
                 </div>
                 <Activity className="w-5 h-5 text-slate-600" />
             </div>
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                 <div>
                     <div className="text-xs text-slate-500 font-bold uppercase">Schools</div>
                     <div className="text-xl font-mono font-bold text-blue-400">12</div>
                 </div>
                 <Globe className="w-5 h-5 text-slate-600" />
             </div>
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                 <div>
                     <div className="text-xs text-slate-500 font-bold uppercase">Users</div>
                     <div className="text-xl font-mono font-bold text-purple-400">8.4k</div>
                 </div>
                 <Users className="w-5 h-5 text-slate-600" />
             </div>
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                 <div>
                     <div className="text-xs text-slate-500 font-bold uppercase">Status</div>
                     <div className="text-xl font-mono font-bold text-green-400">OK</div>
                 </div>
                 <Shield className="w-5 h-5 text-slate-600" />
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Control Panel */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-slate-300">MANAGEMENT CONSOLE</h3>
                        <div className="flex gap-2">
                             <span className="w-2 h-2 rounded-full bg-red-500"></span>
                             <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                             <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        </div>
                    </div>
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                            <tr>
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">Plan</th>
                                <th className="px-4 py-3">Server</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            <tr className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-white">SDN Baujeng 1</td>
                                <td className="px-4 py-3"><span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">PRO</span></td>
                                <td className="px-4 py-3 font-mono text-xs">sg-1</td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded">Manage</button>
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 font-bold text-white">SMP Merdeka</td>
                                <td className="px-4 py-3"><span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">LITE</span></td>
                                <td className="px-4 py-3 font-mono text-xs">sg-2</td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded">Manage</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="font-bold text-sm text-slate-400 mb-3 uppercase tracking-wider">Fast Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button className="p-3 bg-slate-800 hover:bg-cyan-900/30 hover:border-cyan-500/50 border border-slate-700 rounded-lg transition-all text-center">
                            <Database className="w-6 h-6 mx-auto mb-2 text-cyan-400"/>
                            <span className="text-xs font-bold block">Backup DB</span>
                        </button>
                        <button className="p-3 bg-slate-800 hover:bg-red-900/30 hover:border-red-500/50 border border-slate-700 rounded-lg transition-all text-center">
                            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-400"/>
                            <span className="text-xs font-bold block">Purge Cache</span>
                        </button>
                        <button className="p-3 bg-slate-800 hover:bg-green-900/30 hover:border-green-500/50 border border-slate-700 rounded-lg transition-all text-center">
                            <Server className="w-6 h-6 mx-auto mb-2 text-green-400"/>
                            <span className="text-xs font-bold block">Restart Srv</span>
                        </button>
                        <button className="p-3 bg-slate-800 hover:bg-yellow-900/30 hover:border-yellow-500/50 border border-slate-700 rounded-lg transition-all text-center">
                            <Terminal className="w-6 h-6 mx-auto mb-2 text-yellow-400"/>
                            <span className="text-xs font-bold block">Logs</span>
                        </button>
                    </div>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;