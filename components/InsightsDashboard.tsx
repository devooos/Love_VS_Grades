import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { DataService } from '../services/DataService';
import { SurveySubmission } from '../types';
import { Loader2, TrendingUp, Users, Filter, Smile, Moon, BookOpen, Smartphone, FileDown, Table, Eye, EyeOff, LayoutGrid, Database, AlertCircle, RefreshCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// THEME: Neon Cyber-Noir
const COLORS = ['#F43F5E', '#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EC4899']; 
const GRADE_OPTIONS = ['All', '9', '10', '11', '12', 'college'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#05050a]/90 backdrop-blur-xl border border-white/20 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50">
        <p className="text-white font-bold mb-1 font-display tracking-wide uppercase text-xs">{label || payload[0].name}</p>
        <p className="text-cyan-300 text-sm font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          {payload[0].value} {payload[0].payload.unit || ''}
        </p>
      </div>
    );
  }
  return null;
};

// --- Reusable Analytics Table Component ---
const AnalyticsTable = ({ title, data, columns, visible = false }: { title: string, data: any[], columns: { header: string, key: string, format?: (val: any) => string }[], visible?: boolean }) => (
    <motion.div 
        initial={false}
        animate={{ height: visible ? 'auto' : 0, opacity: visible ? 1 : 0 }}
        className={`border-t border-white/5 bg-black/20 ${visible ? 'mt-4 pt-4' : 'pointer-events-none overflow-hidden'}`}
    >
        <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-left text-xs text-gray-400">
                <thead className="bg-white/5 text-gray-200 font-mono uppercase">
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i} className="px-4 py-3 whitespace-nowrap">{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.length > 0 ? data.map((row, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                            {columns.map((col, j) => (
                                <td key={j} className="px-4 py-3 font-mono whitespace-nowrap">
                                    {col.format ? col.format(row[col.key]) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={columns.length} className="px-4 py-3 text-center opacity-50 italic">No data available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </motion.div>
);

export const InsightsDashboard: React.FC = () => {
  const [rawData, setRawData] = useState<SurveySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [showTables, setShowTables] = useState(false);
  
  // PDF States
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await DataService.getAnalyticsData();
        // Remove duplicates based on ID just in case
        const unique = result.filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
        setRawData(unique);
      } catch (e) {
          console.error(e);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    if (selectedGrade === 'All') return rawData;
    return rawData.filter(d => String(d.answers.grade) === selectedGrade);
  }, [rawData, selectedGrade]);

  // --- Calculations ---

  // 1. Relationship Status Pie
  const pieData = useMemo(() => {
    const counts = filteredData.reduce((acc, curr) => {
      const s = String(curr.answers.status || 'Unknown');
      const label = s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).map((name, index) => ({
        name,
        value: counts[name],
        color: COLORS[index % COLORS.length],
        percentage: ((counts[name] / (filteredData.length || 1)) * 100).toFixed(1) + '%'
    }));
  }, [filteredData]);

  // 2. Focus vs Status (Bar)
  const focusData = useMemo(() => {
    const stats: Record<string, { sum: number, count: number }> = {};
    filteredData.forEach(sub => {
        const s = String(sub.answers.status || 'Unknown');
        const label = s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
        const focus = Number(sub.answers.focus_level || 0);
        if (!stats[label]) stats[label] = { sum: 0, count: 0 };
        stats[label].sum += focus;
        stats[label].count += 1;
    });
    return Object.keys(stats).map(key => ({
          name: key,
          value: Math.round(stats[key].sum / stats[key].count),
          count: stats[key].count,
          unit: 'Avg Focus'
      })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 3. Sleep vs Focus
  const sleepVsFocusData = useMemo(() => {
      const buckets = { "Zombie (<40)": { sum: 0, count: 0 }, "Okay (40-80)": { sum: 0, count: 0 }, "Rested (>80)": { sum: 0, count: 0 } };
      filteredData.forEach(sub => {
          let sleep = Number(sub.answers.sleep_quality || 0);
          if (sleep <= 5) sleep = sleep * 20; 

          const focus = Number(sub.answers.focus_level || 0);
          if (sleep < 40) { buckets["Zombie (<40)"].sum += focus; buckets["Zombie (<40)"].count++; }
          else if (sleep < 80) { buckets["Okay (40-80)"].sum += focus; buckets["Okay (40-80)"].count++; }
          else { buckets["Rested (>80)"].sum += focus; buckets["Rested (>80)"].count++; }
      });
      return Object.keys(buckets).map(key => ({
          name: key,
          value: buckets[key as keyof typeof buckets].count ? Math.round(buckets[key as keyof typeof buckets].sum / buckets[key as keyof typeof buckets].count) : 0,
          count: buckets[key as keyof typeof buckets].count,
          unit: 'Avg Focus'
      }));
  }, [filteredData]);

  // 4. Study Partner Impact
  const partnerData = useMemo(() => {
      const stats: Record<string, { sumFocus: number, count: number }> = {};
      filteredData.forEach(sub => {
          const p = String(sub.answers.study_partner || 'na');
          let label = "N/A";
          if (p === 'productive') label = "Productive";
          if (p === 'distracted') label = "Distracting";
          if (p === 'separate') label = "Solo";
          if (p === 'na') label = "No Partner";
          if (!stats[label]) stats[label] = { sumFocus: 0, count: 0 };
          stats[label].sumFocus += Number(sub.answers.focus_level || 0);
          stats[label].count++;
      });
      return Object.keys(stats).map(key => ({
          name: key,
          value: Math.round(stats[key].sumFocus / stats[key].count),
          count: stats[key].count,
          unit: 'Avg Focus'
      })).sort((a,b) => b.value - a.value);
  }, [filteredData]);

  // 5. Screen Time vs Motivation
  const screenTimeData = useMemo(() => {
      const buckets = { "Low (0-2h)": { sum: 0, count: 0 }, "Mid (3-6h)": { sum: 0, count: 0 }, "High (7h+)": { sum: 0, count: 0 } };
      filteredData.forEach(sub => {
          const hours = Number(sub.answers.screen_time || 0);
          const motiv = Number(sub.answers.homework_motivation || 0);
          if (hours <= 2) { buckets["Low (0-2h)"].sum += motiv; buckets["Low (0-2h)"].count++; }
          else if (hours <= 6) { buckets["Mid (3-6h)"].sum += motiv; buckets["Mid (3-6h)"].count++; }
          else { buckets["High (7h+)"].sum += motiv; buckets["High (7h+)"].count++; }
      });
      return Object.keys(buckets).map(key => ({
          name: key,
          value: buckets[key as keyof typeof buckets].count ? Math.round(buckets[key as keyof typeof buckets].sum / buckets[key as keyof typeof buckets].count) : 0,
          count: buckets[key as keyof typeof buckets].count,
          unit: 'Avg Motivation'
      }));
  }, [filteredData]);

  // Comprehensive Data Table
  const comprehensiveData = useMemo(() => {
    const groups: Record<string, { count: number, avgFocus: number, avgSleep: number, avgScreen: number }> = {};
    filteredData.forEach(sub => {
        const status = String(sub.answers.status || 'unknown');
        if (!groups[status]) groups[status] = { count: 0, avgFocus: 0, avgSleep: 0, avgScreen: 0 };
        groups[status].count++;
        groups[status].avgFocus += Number(sub.answers.focus_level || 0);
        
        let sleep = Number(sub.answers.sleep_quality || 0);
        if (sleep <= 5) sleep = sleep * 20; 
        groups[status].avgSleep += sleep;
        
        groups[status].avgScreen += Number(sub.answers.screen_time || 0);
    });
    return Object.keys(groups).map(status => ({
        status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        count: groups[status].count,
        avgFocus: Math.round(groups[status].avgFocus / groups[status].count),
        avgSleep: Math.round(groups[status].avgSleep / groups[status].count),
        avgScreen: (groups[status].avgScreen / groups[status].count).toFixed(1)
    }));
  }, [filteredData]);

  // --- PDF GENERATION ---
  const generatePdf = async () => {
    if (!dashboardRef.current) return;
    setIsGeneratingPdf(true);
    try {
        const element = dashboardRef.current;
        element.classList.add('capturing');
        
        const wasTableVisible = showTables;
        setShowTables(true);
        
        await new Promise(resolve => setTimeout(resolve, 800)); 
        
        const canvas = await html2canvas(element, {
            backgroundColor: '#020205', 
            scale: 2, 
            useCORS: true,
            logging: false,
            allowTaint: true,
            height: element.scrollHeight, 
            windowHeight: element.scrollHeight,
            ignoreElements: (el) => el.classList.contains('no-pdf')
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`VibeCheck_Report_${new Date().toISOString().slice(0,10)}.pdf`);
        
        setShowTables(wasTableVisible);
        element.classList.remove('capturing');
    } catch (err) {
        console.error("PDF Generation failed", err);
        alert("Could not generate PDF.");
        if (dashboardRef.current) dashboardRef.current.classList.remove('capturing');
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 50 } }
  };

  if (isLoading) {
      return (
          <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center text-cyan-400 gap-4">
              <Loader2 className="animate-spin" size={40} />
              <span className="text-sm font-mono uppercase tracking-widest opacity-70">Fetching Live Data...</span>
          </div>
      );
  }

  // --- EMPTY STATE IF NO DATA ---
  if (rawData.length === 0) {
      return (
          <div className="w-full h-[80vh] flex flex-col items-center justify-center p-8 text-center relative">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse border border-white/10">
                  <Database size={32} className="text-gray-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">No Responses Yet</h2>
              <p className="text-gray-400 max-w-md mb-8">
                  The Google Sheet appears to be empty or is waiting for its first submission.
              </p>
              
              <button 
                  onClick={fetchData}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-all font-bold uppercase tracking-widest text-xs"
              >
                  <RefreshCcw size={16} /> Check Again
              </button>
          </div>
      );
  }

  return (
    <>
      <div 
        id="dashboard-container"
        className="w-full max-w-7xl mx-auto px-4 pb-20 overflow-y-auto h-[90vh] no-scrollbar relative" 
        ref={dashboardRef}
      >
        {/* PDF Header Only */}
        <div className="pdf-only hidden mb-10 pt-10 px-6 border-b border-white/10 pb-6">
            <h1 className="text-5xl font-display font-black text-white text-center">LOVE vs GRADES</h1>
            <p className="text-center text-cyan-400 font-mono tracking-widest mt-2">CONFIDENTIAL ANALYTICS</p>
        </div>

        {/* Dashboard Header */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 sticky top-0 z-20 bg-[#020205]/90 backdrop-blur-md py-6 border-b border-white/5"
        >
            <div>
                <h2 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-200 to-cyan-200">The Vibe Check</h2>
                <div className="flex items-center gap-4 mt-2">
                    <p className="text-gray-400 text-xs font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/> LIVE: {filteredData.length} students
                    </p>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <p className="text-gray-500 text-xs font-mono">
                        UPDATED: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 no-pdf">
                <button 
                  onClick={fetchData}
                  className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"
                  title="Refresh Data"
                >
                    <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                </button>

                <button 
                  onClick={() => setShowTables(!showTables)}
                  className={`flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 ${showTables ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' : 'text-gray-400'} transition-all text-xs font-bold uppercase tracking-wider`}
                >
                    {showTables ? <EyeOff size={16} /> : <Table size={16} />}
                    {showTables ? 'Hide Tables' : 'Show Tables'}
                </button>
                
                <button 
                  onClick={generatePdf}
                  disabled={isGeneratingPdf}
                  className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
                  title="Export PDF"
                >
                    {isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
                </button>

                {/* Grade Filter */}
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    {GRADE_OPTIONS.map(grade => (
                        <button
                            key={grade}
                            onClick={() => setSelectedGrade(grade)}
                            className={`
                                px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                                ${selectedGrade === grade 
                                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                    : 'text-gray-500 hover:text-white hover:bg-white/10'}
                            `}
                        >
                            {grade === 'college' ? 'Uni' : grade}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>

        {/* Charts Grid */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Relationship Status */}
            <motion.div variants={itemVariants} className="bg-[#0a0a10] border border-white/5 rounded-3xl p-6 flex flex-col md:col-span-1 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-purple-600" />
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2 text-rose-300">
                        <Users size={18} />
                        <h3 className="font-bold tracking-wide uppercase text-xs">Status Breakdown</h3>
                    </div>
                </div>
                <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-display font-bold text-white tracking-tighter">{filteredData.length}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Responses</span>
                    </div>
                </div>
                <AnalyticsTable title="Status Data" data={pieData} visible={showTables} columns={[{ header: 'Status', key: 'name' }, { header: 'Count', key: 'value' }, { header: '%', key: 'percentage' }]} />
            </motion.div>

            {/* 2. Focus vs Status */}
            <motion.div variants={itemVariants} className="bg-[#0a0a10] border border-white/5 rounded-3xl p-6 flex flex-col md:col-span-2 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2 text-cyan-300">
                        <TrendingUp size={18} />
                        <h3 className="font-bold tracking-wide uppercase text-xs">Focus Levels by Status</h3>
                    </div>
                </div>
                <div className="h-64 w-full">
                    {focusData.every(d => d.value === 0) ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">No Focus Data Yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={focusData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <AnalyticsTable title="Focus Data" data={focusData} visible={showTables} columns={[{ header: 'Status', key: 'name' }, { header: 'Avg Focus', key: 'value', format: v => v + '/100' }, { header: 'Count', key: 'count' }]} />
            </motion.div>

            {/* 3. Sleep Impact */}
            <motion.div variants={itemVariants} className="bg-[#0a0a10] border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-600" />
                <div className="flex items-center gap-2 mb-6 text-blue-300 border-b border-white/5 pb-4"><Moon size={18} /><h3 className="font-bold tracking-wide uppercase text-xs">Sleep Quality Impact</h3></div>
                <div className="h-48 w-full">
                    {sleepVsFocusData.every(d => d.value === 0) ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">No Sleep Data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sleepVsFocusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <AnalyticsTable title="Sleep Data" data={sleepVsFocusData} visible={showTables} columns={[{ header: 'Group', key: 'name' }, { header: 'Avg Focus', key: 'value' }]} />
            </motion.div>

            {/* 4. Study Partner */}
            <motion.div variants={itemVariants} className="bg-[#0a0a10] border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-600" />
                <div className="flex items-center gap-2 mb-6 text-pink-300 border-b border-white/5 pb-4"><BookOpen size={18} /><h3 className="font-bold tracking-wide uppercase text-xs">Study Partner Effect</h3></div>
                 <div className="h-48 w-full">
                    {partnerData.every(d => d.value === 0) ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">No Partner Data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={partnerData} layout="vertical" margin={{ left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <AnalyticsTable title="Partner Data" data={partnerData} visible={showTables} columns={[{ header: 'Partner', key: 'name' }, { header: 'Avg Focus', key: 'value' }]} />
            </motion.div>

            {/* 5. Screen Time */}
            <motion.div variants={itemVariants} className="bg-[#0a0a10] border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <div className="flex items-center gap-2 mb-6 text-green-300 border-b border-white/5 pb-4"><Smartphone size={18} /><h3 className="font-bold tracking-wide uppercase text-xs">Screen Time vs Motivation</h3></div>
                 <div className="h-48 w-full">
                    {screenTimeData.every(d => d.value === 0) ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest">No Screen Data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={screenTimeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <AnalyticsTable title="Screen Time Data" data={screenTimeData} visible={showTables} columns={[{ header: 'Usage', key: 'name' }, { header: 'Motivation', key: 'value' }]} />
            </motion.div>

            {/* 6. Comprehensive Summary (Wide) */}
            <motion.div variants={itemVariants} className="bg-[#0a0a10] border border-white/5 rounded-3xl p-6 flex flex-col md:col-span-3 relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
                 <div className="flex items-center gap-2 mb-6 text-white border-b border-white/5 pb-4"><LayoutGrid size={18} /><h3 className="font-bold tracking-wide uppercase text-xs">Comprehensive Matrix</h3></div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-200 font-mono text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-xl">Status Group</th>
                                <th className="px-6 py-4">Sample Size</th>
                                <th className="px-6 py-4">Avg Focus</th>
                                <th className="px-6 py-4">Avg Sleep Quality</th>
                                <th className="px-6 py-4 rounded-tr-xl">Avg Screen Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 bg-white/[0.02]">
                            {comprehensiveData.map((row, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">{row.status}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{row.count}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div style={{width: `${row.avgFocus}%`}} className={`h-full ${row.avgFocus > 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            </div>
                                            <span className="text-xs font-mono">{row.avgFocus}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{row.avgSleep}%</td>
                                    <td className="px-6 py-4 font-mono text-xs">{row.avgScreen} hrs</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </motion.div>

        </motion.div>
      </div>
    </>
  );
};