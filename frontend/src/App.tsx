import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Icon } from '@iconify/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Comment { id: number; author: string; userId: string; profileImage: string; content: string; likes: number; date: string; image: string | null; }
interface ScrapeResponse { post_id: string; bj_id: string; comments: Comment[]; }
interface RankState { rank: number; likes: number; }

const decodeEntities = (text: string) => { if (!text) return ''; const doc = new DOMParser().parseFromString(text, 'text/html'); return doc.documentElement.textContent || ''; };
const getCleanPreview = (text: string) => { const d = decodeEntities(text); return d.replace(/(https?:\/\/[^\s]+)/g, ' ').replace(/\/[\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9?!\u3131-\u318E\uAC00-\uD7A3!]+(_s)?\//g, ' ').replace(/\s+/g, ' ').trim(); };

const formatContent = (text: string, highlight: string = '') => {
  const d = decodeEntities(text);
  const regex = /((?:https?:\/\/[^\s]+)|(?:\/[\u3131-\u318E\uAC00-\uD7A3a-zA-Z0-9?!\u3131-\u318E\uAC00-\uD7A3!]+(?:_s)?\/))/g;
  return d.split(regex).map((part, i) => {
    if (part.startsWith('http')) {
      try { const url = new URL(part); return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 bg-brand/5 text-brand rounded-lg text-sm font-bold border border-brand/10 hover:bg-brand hover:text-white spring-transition align-baseline mb-0.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"><Icon icon="solar:export-linear" className="w-3 h-3" />{url.hostname + (url.pathname.length > 15 ? '...' : url.pathname)}</a>; } catch { return part; }
    }
    if (part.startsWith('/') && part.endsWith('/')) {
      const isSmall = part.includes('_s/');
      const name = isSmall ? part.slice(1, -3) : part.slice(1, -1);
      const smallMap: Record<string, string> = { 'ㄱㅇㅇ': '205', 'ㅋ': '206', 'ㅎㅇ': '207', 'ㅂㅇ': '208', 'ㅠㅠ': '209', 'ㄷㄷ': '210', 'ㅇㅈ': '211', 'ㄴㅇㅈ': '212', 'ㅊㅋ': '213', 'ㄱㄱ': '214', 'ㅅㄱ': '215', 'ㅈㅅ': '216', 'ㅗㅜㅑ': '217', 'ㅗ': '218', 'ㅂㄷㅂㄷ': '219', 'ㄲㅂ': '220', '댄스': '221', '문열어': '222', 'ㄴㅇㅂㅈ': '223', 'ㄹㅇ': '224', 'ㅈㅁ': '225', 'ㅈㄱ': '226', 'ㅈㅂ': '227', '쉿': '228', '냠냠': '229', '졸려': '230' };
      if (isSmall) { const id = smallMap[name]; return <img key={i} src={id ? `https://res.sooplive.com/images/chat/emoticon/big/${id}.png` : `https://szimg.sooplive.co.kr/img/emoticon/${encodeURIComponent(name)}_s.png`} alt={part} className="inline-block w-8 h-8 align-middle mx-0.5 hover:scale-150 spring-transition cursor-pointer" onError={(e) => { e.currentTarget.src = `https://szimg.sooplive.co.kr/img/emoticon/${encodeURIComponent(name)}_s.png`; }} />; }
      const classic: Record<string, string> = { 'ㅠㅠ': 'cry', 'ㅋㅋ': 'laugh', 'ㅎㅎ': 'smile', '우와': 'wow', '굿': 'good', '??': 'question', '!!': 'exclamation', '하트': 'heart', '별': 'star' };
      return <img key={i} src={`https://res.sooplive.com/images/chat/emoticon/small/${encodeURIComponent(classic[name] || name)}.png`} alt={part} className="inline-block w-6 h-6 align-middle mx-0.5 hover:scale-150 spring-transition cursor-pointer" onError={(e) => { if (e.currentTarget.src.endsWith('.png')) e.currentTarget.src = e.currentTarget.src.replace('.png', '.gif'); else { e.currentTarget.style.display = 'none'; e.currentTarget.after(part); } }} />;
    }
    if (highlight && part.toLowerCase().includes(highlight.toLowerCase())) {
        return part.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((chunk, j) => chunk.toLowerCase() === highlight.toLowerCase() ? <mark key={`${i}-${j}`} className="bg-brand/20 text-brand font-bold rounded-sm px-0.5">{chunk}</mark> : chunk);
    }
    return part;
  });
};

const Skeleton = ({ className }: { className?: string }) => <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`} />;

const CommentRow: React.FC<{ comment: Comment; isPinnedSection: boolean; currentRank: number; change: { type: string, rankDiff: number, likesDiff: number }; isPinned: boolean; isExpanded: boolean; toggleExpand: (id: number) => void; togglePin: (id: number) => void; url: string; searchTerm: string; }> = React.memo(({ comment, isPinnedSection, currentRank, change, isPinned, isExpanded, toggleExpand, togglePin, url, searchTerm }) => {
  const delay = Math.min((currentRank - 1) * 40, 600);
  const rowClasses = `group flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-10 items-start p-3 sm:p-4 md:p-6 md:px-8 spring-transition animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both ${isPinned && !isPinnedSection ? 'hidden' : ''} ${isExpanded ? 'bg-white dark:bg-[#111111] border-y border-gray-100 dark:border-white/5 first:border-t-0 last:border-b-0 shadow-premium z-10 relative scale-[1.002]' : 'relative'} hover:bg-brand/[0.02] dark:hover:bg-brand/[0.04] active:bg-brand/[0.04] dark:active:bg-brand/[0.06]`;

  return (
    <div style={{ animationDelay: `${delay}ms` }} className={rowClasses}>
      {/* Mobile layout */}
      <div className="flex items-center gap-3 sm:hidden w-full">
        <div className="flex flex-col items-center gap-0.5 w-8 flex-shrink-0">
          <span className={`text-lg font-black tabular-nums spring-transition ${currentRank <= 3 && !isPinnedSection ? 'text-brand' : 'text-gray-300 dark:text-gray-700'}`}>{currentRank.toString().padStart(2, '0')}</span>
          <div className="flex items-center gap-0.5">{change.type === 'up' && (<Icon icon="solar:arrow-up-bold" className="w-2 h-2 text-green-500" />)}{change.type === 'down' && (<Icon icon="solar:arrow-down-bold" className="w-2 h-2 text-red-500 opacity-40" />)}</div>
        </div>
        <div className="relative flex-shrink-0"><a href={`https://www.sooplive.com/station/${comment.userId}`} target="_blank" rel="noopener noreferrer"><img src={comment.profileImage} alt="" className="w-9 h-9 rounded-xl object-cover border border-gray-100 dark:border-white/5" loading="lazy" onError={(e) => { e.currentTarget.src = 'https://res.sooplive.com/images/station/img_profile_default.png'; }} /></a></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5"><a href={`https://www.sooplive.com/station/${comment.userId}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 dark:text-white text-[13px] truncate">{comment.author}</a></div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1 text-[10px] font-black text-brand tabular-nums"><Icon icon="solar:graph-up-bold" className="w-3 h-3" />{comment.likes.toLocaleString()}</div>
            {change.likesDiff !== 0 && <span className={`text-[9px] font-black tabular-nums ${change.likesDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>{change.likesDiff > 0 ? '+' : ''}{change.likesDiff}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="고정" onClick={() => togglePin(comment.id)} className={`p-2 rounded-lg spring-transition ${isPinned ? 'text-brand bg-brand/10' : 'text-gray-300 dark:text-gray-700'}`}><Icon icon={isPinned ? "solar:pin-bold" : "solar:pin-linear"} className={`w-3.5 h-3.5 ${isPinned ? 'rotate-45' : ''}`} /></button>
          <button aria-label="펼치기" onClick={() => toggleExpand(comment.id)} className={`p-2 rounded-lg spring-transition ${isExpanded ? 'text-brand bg-brand/10' : 'text-gray-400 dark:text-gray-600'}`}><Icon icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Desktop left section */}
      <div className="hidden sm:flex items-start gap-4 flex-shrink-0 pt-1">
        <div className="flex flex-col items-center justify-start w-10">
          <span className={`text-2xl font-black tabular-nums spring-transition ${currentRank <= 3 && !isPinnedSection ? 'text-brand' : 'text-gray-200 dark:text-gray-800 group-hover:text-gray-400 dark:group-hover:text-gray-600'}`}>{currentRank.toString().padStart(2, '0')}</span>
          <div className="mt-1 flex items-center gap-1">{change.type === 'up' && (<div className="flex items-center gap-0.5 text-green-500"><Icon icon="solar:arrow-up-bold" className="w-2.5 h-2.5" /><span className="text-[9px] font-black tabular-nums">{change.rankDiff}</span></div>)}{change.type === 'down' && (<div className="flex items-center gap-0.5 text-red-500 opacity-40"><Icon icon="solar:arrow-down-bold" className="w-2.5 h-2.5" /><span className="text-[9px] font-black tabular-nums">{change.rankDiff}</span></div>)}</div>
        </div>
        <div className="relative flex-shrink-0"><a href={`https://www.sooplive.com/station/${comment.userId}`} target="_blank" rel="noopener noreferrer"><img src={comment.profileImage} alt="" className="w-12 h-12 rounded-2xl object-cover border border-gray-100 dark:border-white/5 shadow-sm spring-transition group-hover:scale-105" loading="lazy" onError={(e) => { e.currentTarget.src = 'https://res.sooplive.com/images/station/img_profile_default.png'; }} /></a></div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col w-full">
        <div className="hidden sm:flex justify-between items-start mb-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2.5">
              <h4 className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight truncate"><a href={`https://www.sooplive.com/station/${comment.userId}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{comment.author}</a></h4>
              <div className="flex items-center gap-1 text-[11px] font-black text-brand tabular-nums"><Icon icon="solar:graph-up-bold" className="w-3.5 h-3.5" />{comment.likes.toLocaleString()}</div>
              {change.likesDiff !== 0 && <span className={`text-[10px] font-black tabular-nums animate-pulse ${change.likesDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>{change.likesDiff > 0 ? '+' : ''}{change.likesDiff}</span>}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest opacity-60"><span className="truncate">@{comment.userId}</span><span className="w-0.5 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" /><span>{comment.date}</span></div>
          </div>
          <div className="flex items-center gap-1 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 spring-transition translate-x-2 group-hover:translate-x-0">
            <button aria-label="고정" onClick={() => togglePin(comment.id)} className={`p-2 rounded-xl spring-transition hover:bg-gray-100 dark:hover:bg-white/5 ${isPinned ? 'text-brand bg-brand/5' : 'text-gray-300 dark:text-gray-700'}`}><Icon icon={isPinned ? "solar:pin-bold" : "solar:pin-linear"} className={`w-4 h-4 ${isPinned ? 'rotate-45' : ''}`} /></button>
            <a aria-label="원문" href={`${url.split('#')[0]}#comment_noti${comment.id}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl text-gray-400 hover:text-brand spring-transition hover:bg-gray-100 dark:hover:bg-white/5"><Icon icon="solar:export-linear" className="w-4 h-4" /></a>
            <button aria-label="펼치기" onClick={() => toggleExpand(comment.id)} className={`p-2 rounded-xl spring-transition hover:bg-gray-100 dark:hover:bg-white/5 ${isExpanded ? 'text-brand bg-brand/5' : 'text-gray-400'}`}><Icon icon={isExpanded ? "solar:alt-arrow-up-linear" : "solar:alt-arrow-down-linear"} className="w-4.5 h-4.5" /></button>
          </div>
        </div>
        <div className="w-full break-all overflow-wrap-anywhere">{!isExpanded ? (<p className="text-gray-500 dark:text-gray-400 text-[13px] sm:text-[14px] leading-relaxed line-clamp-1 cursor-pointer hover:text-gray-900 dark:hover:text-white spring-transition font-medium" onClick={() => toggleExpand(comment.id)}>{getCleanPreview(comment.content) || "콘텐츠 데이터 포함됨"}</p>) : (<div className="mt-2 sm:mt-3 animate-in fade-in slide-in-from-top-1 duration-400 cursor-pointer" onClick={() => toggleExpand(comment.id)}><div className="relative p-3 sm:p-5 md:p-7 bg-gray-50/50 dark:bg-white/[0.015] rounded-2xl border border-gray-100/50 dark:border-white/5"><div className="absolute left-0 top-4 sm:top-6 bottom-4 sm:bottom-6 w-1 bg-brand/20 rounded-full" /><div className="text-gray-800 dark:text-[#d1d5db] text-[14px] sm:text-[15px] md:text-[16px] leading-[1.7] sm:leading-[1.8] font-medium whitespace-pre-wrap [word-break:keep-all]">{formatContent(comment.content, searchTerm)}</div>{comment.image && (<div className="mt-4 sm:mt-6 relative group/img"><div className="absolute inset-0 bg-brand/5 blur-3xl opacity-0 group-hover/img:opacity-100 spring-transition" /><img src={comment.image} alt="" className="max-h-[400px] sm:max-h-[500px] w-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-lg relative z-10 spring-transition hover:scale-[1.01] cursor-zoom-in" loading="lazy" /></div>)}</div></div>)}</div>
      </div>
    </div>
  );
}, (p, n) => p.comment.likes === n.comment.likes && p.currentRank === n.currentRank && p.isPinned === n.isPinned && p.isExpanded === n.isExpanded && p.change.likesDiff === n.change.likesDiff && p.searchTerm === n.searchTerm);

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [searchTerm, setSearchBar] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [sortMode, setSortMode] = useState<'likes' | 'latest'>('likes');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [visibleCount, setVisibleCount] = useState(30);
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  const [prevRanks, setPrevRanks] = useState<Record<number, RankState>>({});

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setVisibleCount(30); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchComments = useCallback(async (isAuto = false) => {
    if (!url) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    if (!isAuto) { setLoading(true); setError(null); }
    try {
      const res = await axios.get<ScrapeResponse>(`${API_BASE_URL}/api/comments`, { 
        params: { url },
        signal: abortControllerRef.current.signal
      });

      setData(prev => {
        // Calculate new ranks for potential state transition
        const newRanks: Record<number, RankState> = {};
        [...res.data.comments]
          .sort((a, b) => b.likes - a.likes || b.id - a.id)
          .forEach((c, i) => { newRanks[c.id] = { rank: i + 1, likes: c.likes }; });
        
        if (prev) {
          const oldRanks: Record<number, RankState> = {};
          [...prev.comments]
            .sort((a, b) => b.likes - a.likes || b.id - a.id)
            .forEach((c, i) => { oldRanks[c.id] = { rank: i + 1, likes: c.likes }; });
          setPrevRanks(oldRanks);
        }
        return res.data;
      });
      setCountdown(3);
    } catch (err) {
      if (!isAuto) {
        const axiosErr = err as { response?: { data?: { error?: string } }, name?: string };
        if (axiosErr.name !== 'CanceledError') {
          setError(axiosErr.response?.data?.error || '데이터 수집 실패. URL 확인 필요.');
          setData(null);
        }
      }
    } finally { if (!isAuto) setLoading(false); }
  }, [url]);

  useEffect(() => {
    let iId: number | undefined, cId: number | undefined;
    if (data && url && !error) {
      iId = window.setInterval(() => fetchComments(true), 3000);
      cId = window.setInterval(() => setCountdown(p => (p <= 1 ? 3 : p - 1)), 1000);
    }
    return () => { clearInterval(iId); clearInterval(cId); };
  }, [data, url, fetchComments, error]);

  const sortedComments = useMemo(() => data ? [...data.comments].sort((a, b) => b.likes - a.likes || b.id - a.id) : [], [data]);
  const rankMap = useMemo(() => { const m = new Map<number, number>(); sortedComments.forEach((c, i) => m.set(c.id, i + 1)); return m; }, [sortedComments]);

  const processedComments = useMemo(() => {
    if (!data) return [];
    let r = [...data.comments];
    if (debouncedSearch) { const l = debouncedSearch.toLowerCase(); r = r.filter(c => c.author.toLowerCase().includes(l) || c.userId.toLowerCase().includes(l) || c.content.toLowerCase().includes(l)); }
    if (sortMode === 'likes') r.sort((a, b) => b.likes - a.likes || b.id - a.id); else r.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id - a.id);
    return r;
  }, [data, sortMode, debouncedSearch]);

  const displayComments = useMemo(() => processedComments.slice(0, visibleCount), [processedComments, visibleCount]);

  const togglePin = useCallback((id: number) => { setPinnedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }, []);
  const toggleExpand = useCallback((id: number) => { setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }, []);
  const toggleAllExpand = useCallback(() => { setExpandedIds(prev => prev.size > 0 ? new Set() : new Set(data?.comments.map(c => c.id) || [])); }, [data]);
  const getRankChange = useCallback((id: number, rank: number, likes: number) => {
    const p = prevRanks[id]; if (!p) return { type: 'new', rankDiff: 0, likesDiff: 0 };
    let rt = 'same'; if (p.rank > rank) rt = 'up'; else if (p.rank < rank) rt = 'down';
    return { type: rt, rankDiff: Math.abs(p.rank - rank), likesDiff: likes - p.likes };
  }, [prevRanks]);

  const exportToExcel = useCallback(() => {
    const target = searchTerm ? processedComments : sortedComments; if (!target.length || !data) return;
    const meta = [['SOOP Station Comment Ranking Data'], ['BJ ID', data.bj_id], ['Post ID', data.post_id], ['URL', url], ['Date', new Date().toLocaleString()], ['Total', target.length], [], ['Rank', 'Author', 'ID', 'Content', 'UP', 'Date', 'Image']];
    const rows = target.map((c, i) => [i + 1, c.author, c.userId, getCleanPreview(c.content), c.likes, c.date, c.image || '']);
    const ws = XLSX.utils.aoa_to_sheet([...meta, ...rows]);
    ws['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 15 }, { wch: 50 }, { wch: 10 }, { wch: 20 }, { wch: 40 }];
    for (let i = 0; i < target.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i + meta.length, c: 3 });
      const cell = ws[cellRef];
      if (cell) cell.l = { Target: `https://www.sooplive.com/station/${data.bj_id}/post/${data.post_id}#comment_noti${target[i].id}` };
    }
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Ranking Data');
    XLSX.writeFile(wb, `soop_rank_${data.post_id}_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.xlsx`);
    showToast('엑셀 다운로드가 시작되었습니다.');
  }, [searchTerm, processedComments, sortedComments, data, url, showToast]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-[#111111] dark:text-[#fafafa] font-sans spring-transition noise-overlay">
      <div className="mesh-bg" />
      
      {/* Toast Notification */}
      <div className={`fixed bottom-16 md:bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 pointer-events-none ${toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
        <div className="bg-gray-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-gray-900 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-premium-lg font-bold text-xs md:text-sm flex items-center gap-2">
          <Icon icon="solar:check-circle-linear" className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400 dark:text-green-600" />
          {toast.message}
        </div>
      </div>

      <header className="sticky top-0 z-50 glass-panel border-b border-gray-100 dark:border-white/10 pt-3 pb-2.5 px-3 md:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-2 md:gap-6">
          <button aria-label="홈으로 이동" className="flex items-center gap-3 cursor-pointer group flex-shrink-0 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none rounded-xl" onClick={() => { setData(null); setUrl(''); setError(null); }}>
            <div className="w-8 h-8 md:w-9 md:h-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-brand spring-transition group-hover:rotate-6 group-hover:scale-105 active:scale-[0.98] relative overflow-hidden flex-shrink-0"><div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" /><Icon icon="solar:chat-round-line-linear" className="w-4.5 h-4.5 md:w-5.5 md:h-5.5 relative z-10" /></div>
            <div className="hidden md:flex items-center gap-1.5"><span className="text-sm font-black tracking-[-0.05em] uppercase">SOOP</span><span className="text-sm font-medium text-brand">RANK</span></div>
          </button>
          <div className="flex-1 min-w-0 max-w-2xl relative group"><Icon icon="solar:magnifer-linear" className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-brand spring-transition w-3.5 h-3.5 md:w-4 md:h-4" /><input type="text" placeholder={data ? "검색..." : "게시물 주소 입력"} className="w-full pl-9 md:pl-11 pr-3 md:pr-5 py-2 md:py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand/10 spring-transition font-semibold text-xs md:text-sm border border-transparent focus:bg-white dark:focus:bg-white/10 focus:border-gray-200 dark:focus:border-white/10 shadow-inner dark:text-white" value={data ? searchTerm : url} onChange={(e) => data ? setSearchBar(e.target.value) : setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !data && fetchComments()} /></div>
          <div className="flex items-center gap-1 md:gap-2">{!data ? (<button onClick={() => fetchComments()} disabled={loading || !url} className="px-3 md:px-5 py-2 md:py-2.5 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-400 dark:disabled:text-gray-600 spring-transition shadow-brand active:scale-[0.98] text-[10px] md:text-xs flex items-center gap-1 md:gap-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090b]">{loading ? <Icon icon="solar:refresh-linear" className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <Icon icon="solar:graph-up-linear" className="w-3.5 h-3.5 md:w-4 md:h-4" />}<span className="hidden xs:inline">조회</span><span className="xs:hidden md:inline">조회하기</span></button>) : (<button onClick={() => { setData(null); setUrl(''); setError(null); }} className="px-2 md:px-4 py-2 md:py-2.5 text-gray-400 dark:text-gray-500 hover:text-red-500 spring-transition rounded-xl hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/10 active:scale-[0.98] text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090b]"><Icon icon="solar:logout-linear" className="w-3.5 h-3.5 md:w-4 md:h-4" /><span className="hidden xs:inline">종료</span></button>)}<div className="w-px h-4 md:h-5 bg-gray-200 dark:bg-white/10 mx-0.5 md:mx-1" /><button aria-label="다크모드 전환" onClick={() => setIsDark(!isDark)} className="p-1.5 md:p-2.5 text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-yellow-400 spring-transition rounded-xl active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">{isDark ? <Icon icon="solar:sun-linear" className="w-4 h-4 md:w-4.5 md:h-4.5" /> : <Icon icon="solar:moon-linear" className="w-4 h-4 md:w-4.5 md:h-4.5" />}</button></div>
        </div>
      </header>

      {data && !error && (
        <div className="sticky top-[58px] md:top-[64px] z-40 bg-[#fafafa]/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500 overflow-x-auto no-scrollbar">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-2 md:py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-2 px-2 py-1 bg-brand/[0.03] dark:bg-brand/[0.08] rounded-lg border border-brand/10">
                <div className="relative w-2.5 h-2.5 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-brand/10" />
                    <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray={25.12} strokeDashoffset={25.12 * (countdown / 3)} className="text-brand transition-all duration-1000 ease-linear" />
                  </svg>
                  <div className="w-1 h-1 bg-brand rounded-full animate-pulse" />
                </div>
                <span className="text-[10px] font-black text-brand uppercase tabular-nums tracking-widest leading-none">Live</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-0.5 rounded-lg border border-gray-100 dark:border-white/5">
                <button onClick={() => setSortMode('likes')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold spring-transition ${sortMode === 'likes' ? 'bg-white dark:bg-gray-800 text-brand shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><Icon icon="solar:graph-up-linear" className="w-3.5 h-3.5" />추천순</button>
                <button onClick={() => setSortMode('latest')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold spring-transition ${sortMode === 'latest' ? 'bg-white dark:bg-gray-800 text-brand shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><Icon icon="solar:clock-circle-linear" className="w-3.5 h-3.5" />최신순</button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest tabular-nums">
              <div className="flex items-center gap-2">
                <span className="opacity-40">Total</span>
                <span className="text-gray-600 dark:text-gray-200">{data.comments.length.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="opacity-40">Sum UP</span>
                <span className="text-brand">{data.comments.reduce((sum, c) => sum + c.likes, 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={toggleAllExpand} title={expandedIds.size > 0 ? "모두 접기" : "모두 펼치기"} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg spring-transition active:scale-[0.98] text-[10px] font-bold ${expandedIds.size > 0 ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
                <Icon icon={expandedIds.size > 0 ? "solar:widget-bold" : "solar:widget-linear"} className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{expandedIds.size > 0 ? "모두 접기" : "모두 펼치기"}</span>
              </button>
              <div className="w-px h-3 bg-gray-200 dark:bg-white/10 mx-1" />
              <button onClick={exportToExcel} title="엑셀 저장" className="flex items-center gap-1.5 px-3 py-1 text-gray-400 hover:text-brand dark:hover:text-white spring-transition rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 active:scale-[0.98] text-[10px] font-bold">
                <Icon icon="solar:download-linear" className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">엑셀 저장</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto pb-32 px-4">
        {error && (
            <div className="py-20 md:py-40 flex flex-col items-center text-center animate-in zoom-in duration-500 px-4"><div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 dark:bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 border border-red-100 dark:border-red-500/20 shadow-inner"><Icon icon="solar:close-circle-linear" className="w-8 h-8 md:w-10 md:h-10 text-red-500" /></div><h2 className="text-xl md:text-2xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">조회에 실패했습니다</h2><p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm md:text-base leading-relaxed font-medium mb-6 md:mb-8">{error}</p><button onClick={() => { setError(null); setUrl(''); }} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 spring-transition active:scale-[0.98] text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">홈으로 돌아가기</button></div>
        )}
        {!data && !loading && !error && (
          <div className="py-20 md:py-32 flex flex-col md:flex-row items-center gap-12 md:gap-20 px-4">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] md:text-xs font-black uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-left-4 duration-1000">
                <Icon icon="solar:ranking-bold" className="w-3 h-3" />
                SOOP Comment Ranker
              </div>
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-8 text-gray-900 dark:text-white leading-[1] animate-in slide-in-from-bottom-4 duration-700">
                SOOP 스테이션<br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand via-blue-500 to-cyan-400">댓글 랭커</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-lg text-lg md:text-2xl leading-relaxed font-medium animate-in slide-in-from-bottom-6 duration-1000 delay-200 [word-break:keep-all]">
                방송국 게시물의 댓글을 추천 수 기준으로 정렬합니다.<br/>실시간 순위 변화를 확인하고 엑셀로 간편하게 저장하세요.
              </p>
            </div>
            <div className="flex-1 w-full max-w-lg relative group animate-in zoom-in fade-in duration-1000 delay-300">
              <div className="absolute inset-0 bg-brand/20 blur-[100px] rounded-full scale-125 animate-pulse" />
              <div className="relative glass-panel rounded-[2.5rem] border-white/20 dark:border-white/5 shadow-premium-lg overflow-hidden p-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-6 bg-white/50 dark:bg-white/[0.03] rounded-3xl border border-white/20 dark:border-white/5 flex flex-col gap-4">
                    <Icon icon="solar:graph-up-bold" className="w-8 h-8 text-brand" />
                    <div>
                      <div className="text-[10px] font-black opacity-40 uppercase tracking-widest">UP Count</div>
                      <div className="text-2xl font-black tabular-nums">482 UP</div>
                    </div>
                  </div>
                  <div className="p-6 bg-brand text-white rounded-3xl flex flex-col gap-4 shadow-brand">
                    <Icon icon="solar:ranking-bold" className="w-8 h-8" />
                    <div>
                      <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">Rank Update</div>
                      <div className="text-xl font-bold flex items-center gap-2">01 <Icon icon="solar:arrow-up-bold" className="w-4 h-4" /><span className="text-xs">3</span></div>
                    </div>
                  </div>
                  <div className="col-span-2 p-6 bg-white/50 dark:bg-white/[0.03] rounded-3xl border border-white/20 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Icon icon="solar:document-text-bold" className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">엑셀 내보내기</div>
                        <div className="text-[10px] opacity-40">Download as XLSX</div>
                      </div>
                    </div>
                    <Icon icon="solar:download-linear" className="w-5 h-5 opacity-40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {loading && (
          <div className="mt-8 md:mt-16 space-y-4"><div className="mb-6 md:mb-8 flex items-center gap-3 animate-in fade-in duration-700"><div className="w-2 h-2 bg-brand rounded-full animate-bounce" /><span className="text-xs md:text-sm font-bold text-brand uppercase tracking-widest">데이터를 불러오고 있습니다...</span></div><div className="bg-white dark:bg-[#161b22] rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-premium overflow-hidden divide-y divide-gray-50 dark:divide-white/5">{[...Array(6)].map((_, i) => (<div key={i} className="p-4 md:p-7 md:px-10 flex gap-3 md:gap-10 items-start"><div className="flex flex-col items-center gap-2 md:gap-4 pt-1 md:pt-2"><Skeleton className="w-7 h-7 md:w-9 md:h-9" /><Skeleton className="w-4 h-2 md:w-5 md:h-3" /></div><Skeleton className="w-9 h-9 md:w-12 md:h-12 rounded-xl" /><div className="flex-1 space-y-2 md:space-y-3"><div className="flex justify-between items-start"><div className="space-y-1 md:space-y-2"><Skeleton className="w-20 h-4 md:w-28 md:h-5" /><Skeleton className="w-28 h-2 md:w-40 md:h-2.5" /></div><Skeleton className="w-12 h-6 md:w-16 md:h-7" /></div><Skeleton className="w-full h-3 md:h-3.5" /><Skeleton className="w-2/3 h-3 md:h-3.5" /></div></div>))}</div></div>
        )}
        {data && !error && (
          <div className="mt-8 space-y-6 animate-in fade-in duration-700">
            <div className="bg-white dark:bg-[#161b22] rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-premium-lg overflow-hidden divide-y divide-gray-50 dark:divide-white/5">
              {pinnedIds.size > 0 && (
                <div className="bg-brand/[0.03] dark:bg-brand/[0.05] divide-y divide-brand/[0.05]"><div className="px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black text-brand uppercase tracking-[0.2em] md:tracking-[0.25em] opacity-90"><Icon icon="solar:pin-linear" className="w-3 h-3 md:w-3.5 md:h-3.5" /> Pinned Monitoring</div>{sortedComments.filter(c => pinnedIds.has(c.id)).map(comment => { const r = rankMap.get(comment.id) || 0; const change = getRankChange(comment.id, r, comment.likes); return <CommentRow key={`pinned-${comment.id}`} comment={comment} isPinnedSection={true} currentRank={r} change={change} isPinned={pinnedIds.has(comment.id)} isExpanded={expandedIds.has(comment.id)} toggleExpand={toggleExpand} togglePin={togglePin} url={url} searchTerm={searchTerm} />; })}</div>
              )}
              <div className="divide-y divide-gray-50 dark:divide-white/5">{displayComments.map(comment => { const r = rankMap.get(comment.id) || 0; const change = getRankChange(comment.id, r, comment.likes); return <CommentRow key={comment.id} comment={comment} isPinnedSection={false} currentRank={r} change={change} isPinned={pinnedIds.has(comment.id)} isExpanded={expandedIds.has(comment.id)} toggleExpand={toggleExpand} togglePin={togglePin} url={url} searchTerm={searchTerm} />; })}</div>
              {processedComments.length > visibleCount && (
                <div className="p-4 md:p-8 text-center bg-gray-50/30 dark:bg-white/[0.01]"><button onClick={() => setVisibleCount(prev => prev + 50)} className="px-6 md:px-10 py-3 md:py-3.5 bg-white dark:bg-gray-800 text-brand font-bold rounded-xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md spring-transition active:scale-[0.98] text-xs md:text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">더 많은 댓글 보기 (+50)</button><br /><button onClick={() => setVisibleCount(processedComments.length)} className="mt-2 md:mt-3 text-[10px] md:text-[11px] font-bold text-gray-400 dark:text-gray-500 hover:text-brand spring-transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none rounded-lg px-2 md:px-3 py-1">한번에 모두 보기</button></div>
              )}
              {processedComments.length === 0 && (
                <div className="py-24 md:py-48 text-center animate-in fade-in duration-700"><div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 border border-gray-100 dark:border-white/10 shadow-inner"><Icon icon="solar:magnifer-linear" className="w-8 h-8 md:w-10 md:h-10 text-gray-300 dark:text-gray-600" /></div><p className="text-lg md:text-xl font-bold text-gray-400 dark:text-gray-600 italic">검색 결과가 없습니다.</p></div>
              )}
            </div>
          </div>
        )}
      </main>
      <div className="fixed bottom-4 right-4 md:bottom-10 md:right-10 flex flex-col gap-2 md:gap-4 z-50">
        <button aria-label="맨 위로 가기" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-10 h-10 md:w-12 md:h-12 glass-panel border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl shadow-premium-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand spring-transition hover:-translate-y-1.5 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"><Icon icon="solar:arrow-up-linear" className="w-4 h-4 md:w-5 md:h-5 group-hover:stroke-[3px] spring-transition" /></button>
        <button aria-label="맨 아래로 가기" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="w-10 h-10 md:w-12 md:h-12 glass-panel border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl shadow-premium-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand spring-transition hover:translate-y-1.5 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"><Icon icon="solar:arrow-down-linear" className="w-4 h-4 md:w-5 md:h-5 group-hover:stroke-[3px] spring-transition" /></button>
      </div>
    </div>
  );
};
export default App;
