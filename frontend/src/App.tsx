import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { 
  Search, Download, TrendingUp, Loader2, ArrowUp, ArrowDown, 
  Pin, LayoutGrid, ExternalLink, Link as LinkIcon,
  ChevronDown, ChevronUp, Sun, Moon, XCircle, Clock, LogOut, CheckCircle2
} from 'lucide-react';

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
      try { const url = new URL(part); return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 bg-brand/5 text-brand rounded-lg text-sm font-bold border border-brand/10 hover:bg-brand hover:text-white spring-transition align-baseline mb-0.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"><ExternalLink className="w-3 h-3" />{url.hostname + (url.pathname.length > 15 ? '...' : url.pathname)}</a>; } catch { return part; }
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

const CommentRow: React.FC<{ comment: Comment; isPinnedSection: boolean; currentRank: number; change: { type: string, rankDiff: number, likesDiff: number }; isPinned: boolean; isExpanded: boolean; toggleExpand: (id: number) => void; togglePin: (id: number) => void; showToast: (msg: string) => void; url: string; searchTerm: string; }> = React.memo(({ comment, isPinnedSection, currentRank, change, isPinned, isExpanded, toggleExpand, togglePin, showToast, url, searchTerm }) => {
  const delay = Math.min((currentRank - 1) * 20, 400);
  const copyLink = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      const link = `${url.split('#')[0]}#comment_noti${comment.id}`;
      navigator.clipboard.writeText(link).then(() => showToast('해당 댓글의 링크가 복사되었습니다.'));
  }, [url, comment.id, showToast]);

  const rowClasses = `group flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-10 items-start p-3 sm:p-4 md:p-6 md:px-8 spring-transition animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both ${isPinned && !isPinnedSection ? 'hidden' : ''} ${isExpanded ? 'bg-white dark:bg-[#111111] border-y border-gray-100 dark:border-white/5 first:border-t-0 last:border-b-0 shadow-premium z-10 relative scale-[1.002]' : 'relative'} hover:bg-brand/[0.02] dark:hover:bg-brand/[0.04] active:bg-brand/[0.04] dark:active:bg-brand/[0.06]`;
  const btnBase = "p-2 sm:p-1.5 rounded-lg spring-transition active:scale-90 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none";

  return (
    <div style={{ animationDelay: `${delay}ms` }} className={rowClasses}>
      {/* Mobile layout: row with all info */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="flex flex-col items-center gap-1 w-9 flex-shrink-0">
          <span className={`text-lg font-bold tabular-nums spring-transition ${currentRank <= 3 && !isPinnedSection ? 'text-brand' : 'text-gray-200 dark:text-gray-800'}`}>{currentRank.toString().padStart(2, '0')}</span>
          <div className="flex items-center gap-1">{change.type === 'up' && (<div className="flex items-center gap-0.5"><ArrowUp className="w-2 h-2 stroke-[4] text-green-600 dark:text-green-400" /><span className="text-[7px] font-black text-green-600 dark:text-green-400 tabular-nums">{change.rankDiff}</span></div>)}{change.type === 'down' && (<div className="flex items-center gap-0.5 opacity-40"><ArrowDown className="w-2 h-2 stroke-[4] text-red-500 dark:text-red-500" /><span className="text-[7px] font-black text-red-500 dark:text-red-400 tabular-nums">{change.rankDiff}</span></div>)}</div>
        </div>
        <div className="relative flex-shrink-0"><a href={`https://www.sooplive.com/station/${comment.userId}`} target="_blank" rel="noopener noreferrer"><img src={comment.profileImage} alt="" className="w-8 h-8 rounded-xl object-cover border-2 border-[#f0f0f0] dark:border-gray-800/50 shadow-sm spring-transition group-hover:scale-105" loading="lazy" onError={(e) => { e.currentTarget.src = 'https://res.sooplive.com/images/station/img_profile_default.png'; }} /></a></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1"><span className="font-bold text-gray-900 dark:text-white text-[13px] truncate">{comment.author}</span><div className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg text-[8px] font-black bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 tabular-nums flex-shrink-0">{comment.likes.toLocaleString()}</div>{change.likesDiff > 0 && <span className="text-[8px] font-black text-green-500 dark:text-green-400 animate-pulse tabular-nums">+{change.likesDiff}</span>}{change.likesDiff < 0 && <span className="text-[8px] font-black text-red-500 dark:text-red-400 animate-pulse tabular-nums">{change.likesDiff}</span>}</div>
          <div className="text-[8px] font-bold text-gray-400 dark:text-gray-500 truncate">@{comment.userId}</div>
        </div>
      </div>
      {/* Desktop left section: rank + profile side by side */}
      <div className="hidden sm:flex items-start gap-4 flex-shrink-0 pt-1.5">
        <div className="flex flex-col items-center justify-start w-10 pt-0.5">
          <span className={`text-2xl font-bold tabular-nums spring-transition ${currentRank <= 3 && !isPinnedSection ? 'text-brand' : 'text-gray-200 dark:text-gray-800 group-hover:text-gray-400 dark:group-hover:text-gray-600'}`}>{currentRank.toString().padStart(2, '0')}</span>
          <div className="mt-1 flex flex-col items-center gap-1">{change.type === 'up' && (<div className="flex items-center gap-0.5"><ArrowUp className="w-2.5 h-2.5 stroke-[4] text-green-600 dark:text-green-400" /><span className="text-[9px] font-black text-green-600 dark:text-green-400 tabular-nums">{change.rankDiff}</span></div>)}{change.type === 'down' && (<div className="flex items-center gap-0.5 opacity-40"><ArrowDown className="w-2.5 h-2.5 stroke-[4] text-red-500 dark:text-red-500" /><span className="text-[9px] font-black text-red-500 dark:text-red-400 tabular-nums">{change.rankDiff}</span></div>)}</div>
        </div>
        <div className="relative flex-shrink-0 pt-0.5"><a href={`https://www.sooplive.com/station/${comment.userId}`} target="_blank" rel="noopener noreferrer"><img src={comment.profileImage} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-[#f0f0f0] dark:border-gray-800/50 shadow-sm spring-transition group-hover:scale-105" loading="lazy" onError={(e) => { e.currentTarget.src = 'https://res.sooplive.com/images/station/img_profile_default.png'; }} /></a></div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col w-full">
        <div className="hidden sm:flex justify-between items-start mb-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2.5"><h4 className="font-bold text-gray-900 dark:text-white text-[15px] tracking-tight group-hover:text-brand spring-transition truncate"><a href={`https://www.sooplive.com/station/${comment.userId}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-inherit no-underline">{comment.author}</a></h4><div className="px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm border bg-white dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700 group-hover:border-brand/20 spring-transition tabular-nums flex items-center gap-1"><TrendingUp className="w-3 h-3" />{comment.likes.toLocaleString()}</div>
{change.likesDiff > 0 && <span className="text-[10px] font-black text-green-500 dark:text-green-400 animate-pulse tabular-nums">+{change.likesDiff}</span>}
{change.likesDiff < 0 && <span className="text-[10px] font-black text-red-500 dark:text-red-400 animate-pulse tabular-nums">{change.likesDiff}</span>}
</div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"><span className="opacity-60">@{comment.userId}</span><span className="w-0.5 h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full" /><span className="tabular-nums">{comment.date}</span></div>
          </div>
          <div className="flex items-center gap-1.5 ml-4 flex-shrink-0 pt-0.5">
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 translate-x-0 md:translate-x-2 md:group-hover:translate-x-0 spring-transition">
              <button aria-label={isExpanded ? "댓글 접기" : "댓글 펼치기"} onClick={() => toggleExpand(comment.id)} className={`${btnBase} ${isExpanded ? 'bg-brand text-white' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-brand border border-gray-100 dark:border-gray-700'}`}>{isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</button>
              <button aria-label="링크 복사" onClick={copyLink} className={`${btnBase} bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-brand border border-gray-100 dark:border-gray-700`} title="링크 복사"><LinkIcon className="w-3.5 h-3.5" /></button>
              <a aria-label="원문 보기" href={`${url.split('#')[0]}#comment_noti${comment.id}`} target="_blank" rel="noopener noreferrer" className={`${btnBase} bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-brand border border-gray-100 dark:border-gray-700`} title="원문 보기"><ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
            <button aria-label={isPinned ? "고정 해제" : "상단 고정"} onClick={() => togglePin(comment.id)} className={`${btnBase} ${isPinned ? 'bg-brand text-white' : 'bg-white dark:bg-gray-800 text-gray-300 dark:text-gray-600 hover:text-brand border border-gray-100 dark:border-gray-700 opacity-100 md:opacity-40 md:group-hover:opacity-100'}`} title={isPinned ? "고정 해제" : "상단 고정"}><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 spring-transition ${isPinned ? 'fill-current rotate-[30deg]' : 'rotate-0'}`}><path d="M15.185 10.1511L12.9622 7.92823C12.4414 7.40742 11.5968 7.40742 11.076 7.92823L4.92842 14.0758C4.40761 14.5966 4.40761 15.4412 4.92842 15.962L7.15129 18.1849M15.185 10.1511L18.4116 6.92446C18.9324 6.40365 19.7771 6.40365 20.2979 6.92446L21.0755 7.70208C21.5963 8.22289 21.5963 9.0675 21.0755 9.58831L17.8489 12.8149M15.185 10.1511L17.8489 12.8149M17.8489 12.8149L15.626 15.0378C15.1052 15.5586 14.2606 15.5586 13.7398 15.0378L12.9622 14.2602L11.4513 15.7711C11.1119 16.1104 11.1119 16.6606 11.4513 17L12.4339 17.9826C12.7732 18.3219 12.7732 18.8722 12.4339 19.2115L10.3125 21.2329L7.15129 18.1849M17.8489 12.8149L15.626 15.0378M7.15129 18.1849L3 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          </div>
        </div>
        <div className="w-full break-all overflow-wrap-anywhere">{!isExpanded ? (<p className="text-gray-500 dark:text-gray-400 text-[13px] sm:text-[14px] leading-relaxed line-clamp-1 cursor-pointer hover:text-gray-900 dark:hover:text-white spring-transition font-medium" onClick={() => toggleExpand(comment.id)}>{getCleanPreview(comment.content) || "콘텐츠 데이터 포함됨"}</p>) : (<div className="mt-2 sm:mt-3 animate-in fade-in slide-in-from-top-1 duration-400 cursor-pointer" onClick={() => toggleExpand(comment.id)}><div className="relative p-3 sm:p-5 md:p-7 bg-gray-50/50 dark:bg-white/[0.015] rounded-2xl border border-gray-100/50 dark:border-white/5"><div className="absolute left-0 top-4 sm:top-6 bottom-4 sm:bottom-6 w-1 bg-brand/20 rounded-full" /><div className="text-gray-800 dark:text-[#d1d5db] text-[14px] sm:text-[15px] md:text-[16px] leading-[1.7] sm:leading-[1.8] font-medium whitespace-pre-wrap [word-break:keep-all]">{formatContent(comment.content, searchTerm)}</div>{comment.image && (<div className="mt-4 sm:mt-6 relative group/img"><div className="absolute inset-0 bg-brand/5 blur-3xl opacity-0 group-hover/img:opacity-100 spring-transition" /><img src={comment.image} alt="" className="max-h-[400px] sm:max-h-[500px] w-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-lg relative z-10 spring-transition hover:scale-[1.01] cursor-zoom-in" loading="lazy" /></div>)}</div></div>)}</div>
      </div>
    </div>
  );
}, (p, n) => p.comment.likes === n.comment.likes && p.currentRank === n.currentRank && p.isPinned === n.isPinned && p.isExpanded === n.isExpanded && p.change.likesDiff === n.change.likesDiff && p.searchTerm === n.searchTerm);

const App: React.FC = () => {
  const [url, setUrl] = useState(''); const [loading, setLoading] = useState(false); const [data, setData] = useState<ScrapeResponse | null>(null); const [error, setError] = useState<string | null>(null);   const [countdown, setCountdown] = useState(3); const [searchTerm, setSearchBar] = useState(''); const [debouncedSearch, setDebouncedSearch] = useState(''); const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set()); const [sortMode, setSortMode] = useState<'likes' | 'latest'>('likes'); const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set()); const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark'); const [visibleCount, setVisibleCount] = useState(30);
  const [toast, setToast] = useState<{show: boolean, message: string}>({ show: false, message: '' });

  const showToast = useCallback((message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  }, []);

  useEffect(() => { const t = setTimeout(() => { setDebouncedSearch(searchTerm); setVisibleCount(30); }, 300); return () => clearTimeout(t); }, [searchTerm]);
  useEffect(() => { if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); } }, [isDark]);
  const [prevRanks, setPrevRanks] = useState<Record<string, RankState>>({});

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
        const ranks: Record<number, RankState> = {};
        [...res.data.comments]
          .sort((a, b) => b.likes - a.likes || b.id - a.id)
          .forEach((c, i) => { ranks[c.id] = { rank: i + 1, likes: c.likes }; });
        
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
    } catch (err) { if (!isAuto) { const axiosErr = err as { response?: { data?: { error?: string } } }; setError(axiosErr.response?.data?.error || '데이터 수집 실패. URL 확인 필요.'); setData(null); }
    } finally { if (!isAuto) setLoading(false); }
  }, [url]);

  useEffect(() => {
    let iId: number | undefined, cId: number | undefined;
    if (data && url && !error) { iId = window.setInterval(() => fetchComments(true), 3000); cId = window.setInterval(() => setCountdown(p => (p <= 1 ? 3 : p - 1)), 1000); }
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
    // Add hyperlinks to Content cells (column D)
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
          <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400 dark:text-green-600" />
          {toast.message}
        </div>
      </div>

      <header className="sticky top-0 z-50 glass-panel border-b border-gray-100 dark:border-white/10 pt-3 pb-2.5 px-3 md:px-8 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-2 md:gap-6">
          <button aria-label="홈으로 이동" className="flex items-center gap-3 cursor-pointer group flex-shrink-0 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none rounded-xl" onClick={() => { setData(null); setUrl(''); setError(null); }}>
            <div className="w-8 h-8 md:w-9 md:h-9 bg-brand rounded-xl flex items-center justify-center text-white shadow-brand spring-transition group-hover:rotate-6 group-hover:scale-105 active:scale-95 relative overflow-hidden flex-shrink-0"><div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" /><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 md:w-5.5 md:h-5.5 stroke-[2.5] relative z-10"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 13V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 13V9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="hidden md:flex items-center gap-1.5"><span className="text-sm font-black tracking-[-0.05em] uppercase">SOOP</span><span className="text-sm font-medium text-brand">RANK</span></div>
          </button>
          <div className="flex-1 min-w-0 max-w-2xl relative group"><Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-brand spring-transition w-3.5 h-3.5 md:w-4 md:h-4" /><input type="text" placeholder={data ? "검색..." : "게시물 주소 입력"} className="w-full pl-9 md:pl-11 pr-3 md:pr-5 py-2 md:py-2.5 bg-gray-100 dark:bg-white/5 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand/10 spring-transition font-semibold text-xs md:text-sm border border-transparent focus:bg-white dark:focus:bg-white/10 focus:border-gray-200 dark:focus:border-white/10 shadow-inner dark:text-white" value={data ? searchTerm : url} onChange={(e) => data ? setSearchBar(e.target.value) : setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !data && fetchComments()} /></div>
          <div className="flex items-center gap-1 md:gap-2">{!data ? (<button onClick={() => fetchComments()} disabled={loading || !url} className="px-3 md:px-5 py-2 md:py-2.5 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 disabled:bg-gray-100 dark:disabled:bg-white/5 disabled:text-gray-400 dark:disabled:text-gray-600 spring-transition shadow-brand active:scale-95 text-[10px] md:text-xs flex items-center gap-1 md:gap-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090b]">{loading ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />}<span className="hidden xs:inline">조회</span><span className="xs:hidden md:inline">조회하기</span></button>) : (<button onClick={() => { setData(null); setUrl(''); setError(null); }} className="px-2 md:px-4 py-2 md:py-2.5 text-gray-400 dark:text-gray-500 hover:text-red-500 spring-transition rounded-xl hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/10 active:scale-95 text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-2 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090b]"><LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" /><span className="hidden xs:inline">종료</span></button>)}<div className="w-px h-4 md:h-5 bg-gray-200 dark:bg-white/10 mx-0.5 md:mx-1" /><button aria-label="다크모드 전환" onClick={() => setIsDark(!isDark)} className="p-1.5 md:p-2.5 text-gray-400 dark:text-gray-500 hover:text-brand dark:hover:text-yellow-400 spring-transition rounded-xl active:scale-95 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">{isDark ? <Sun className="w-4 h-4 md:w-4.5 md:h-4.5" /> : <Moon className="w-4 h-4 md:w-4.5 md:h-4.5" />}</button></div>
        </div>
      </header>

      {data && !error && (
        <div className="sticky top-[58px] md:top-[64px] z-40 bg-[#fafafa]/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 animate-in slide-in-from-top-4 duration-500 overflow-x-auto no-scrollbar"><div className="max-w-5xl mx-auto px-3 md:px-8 py-2 md:py-3 flex flex-wrap md:flex-nowrap items-center justify-center md:justify-between gap-x-2 gap-y-1.5"><div className="flex items-center gap-2 px-2 py-1 bg-brand/[0.03] dark:bg-brand/[0.08] rounded-lg border border-brand/10 w-fit"><div className="relative w-2.5 h-2.5 flex items-center justify-center"><svg className="absolute inset-0 w-full h-full -rotate-90"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-brand/10" /><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray={25.12} strokeDashoffset={25.12 * (countdown / 3)} className="text-brand transition-all duration-1000 ease-linear" /></svg><div className="w-1 h-1 bg-brand rounded-full animate-pulse" /></div><span className="text-[9px] font-black text-brand uppercase tabular-nums tracking-widest leading-none">Live Radar</span></div><div className="flex items-center gap-1 bg-gray-100/50 dark:bg-white/5 p-0.5 rounded-lg border border-gray-100 dark:border-white/5"><button onClick={() => setSortMode('likes')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold spring-transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${sortMode === 'likes' ? 'bg-white dark:bg-gray-800 text-brand shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><TrendingUp className="w-3 h-3" />추천순</button><button onClick={() => setSortMode('latest')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold spring-transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${sortMode === 'latest' ? 'bg-white dark:bg-gray-800 text-brand shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}><Clock className="w-3 h-3" />최신순</button></div><div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest tabular-nums"><div className="flex items-center gap-1.5"><span className="text-gray-300 dark:text-gray-700">|</span> <span>Total <span className="text-gray-600 dark:text-gray-200">{data.comments.length.toLocaleString()}</span></span></div><div className="flex items-center gap-1.5"><span>Sum <span className="text-brand">{data.comments.reduce((sum, c) => sum + c.likes, 0).toLocaleString()} UP</span></span></div></div><div className="flex items-center gap-1.5"><button onClick={toggleAllExpand} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg spring-transition border active:scale-95 text-[10px] font-bold focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none ${expandedIds.size > 0 ? 'bg-brand text-white border-brand shadow-brand' : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-brand border-gray-100 dark:border-white/10'}`}><LayoutGrid className="w-3.5 h-3.5" /><span>{expandedIds.size > 0 ? "전체 접기" : "전체 펼치기"}</span></button><button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-green-600 spring-transition rounded-lg border border-gray-100 dark:border-white/10 active:scale-95 text-[10px] font-bold shadow-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"><Download className="w-3.5 h-3.5" /><span>엑셀 저장</span></button></div></div></div>
      )}

      <main className="max-w-5xl mx-auto pb-32 px-4">
        {error && (
            <div className="py-20 md:py-40 flex flex-col items-center text-center animate-in zoom-in duration-500 px-4"><div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 dark:bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-6 md:mb-8 border border-red-100 dark:border-red-500/20 shadow-inner"><XCircle className="w-8 h-8 md:w-10 md:h-10 text-red-500" /></div><h2 className="text-xl md:text-2xl font-black tracking-tight mb-3 text-gray-900 dark:text-white">조회에 실패했습니다</h2><p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm md:text-base leading-relaxed font-medium mb-6 md:mb-8">{error}</p><button onClick={() => { setError(null); setUrl(''); }} className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 spring-transition active:scale-90 text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">홈으로 돌아가기</button></div>
        )}
        {!data && !loading && !error && (
          <div className="py-24 md:py-48 flex flex-col items-center text-center px-4"><div className="relative mb-8 md:mb-14"><div className="absolute inset-0 bg-brand/30 blur-[80px] md:blur-[120px] rounded-full scale-150 animate-pulse" /><div className="w-20 h-16 md:w-28 md:h-24 bg-white dark:bg-white/5 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center border border-gray-100 dark:border-white/10 shadow-premium relative z-10 animate-in zoom-in duration-1000"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 md:w-12 md:h-12 text-brand stroke-[2.5]"><path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 13V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 13V9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg></div></div><h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-6 md:mb-8 text-gray-900 dark:text-white leading-[1.1] md:leading-[1.05] animate-in slide-in-from-bottom-4 duration-700">SOOP 스테이션<br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-blue-400">댓글 랭커</span></h2><p className="text-gray-500 dark:text-gray-400 max-w-lg text-base md:text-xl leading-relaxed font-medium animate-in slide-in-from-bottom-6 duration-1000 delay-200">방송국 게시물의 모든 댓글을 한눈에.<br/>실시간 추천 순위 확인부터 간편한 엑셀 저장까지.</p></div>
        )}
        {loading && (
          <div className="mt-8 md:mt-16 space-y-4"><div className="mb-6 md:mb-8 flex items-center gap-3 animate-in fade-in duration-700"><div className="w-2 h-2 bg-brand rounded-full animate-bounce" /><span className="text-xs md:text-sm font-bold text-brand uppercase tracking-widest">데이터를 불러오고 있습니다...</span></div><div className="bg-white dark:bg-[#161b22] rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-premium overflow-hidden divide-y divide-gray-50 dark:divide-white/5">{[...Array(6)].map((_, i) => (<div key={i} className="p-4 md:p-7 md:px-10 flex gap-3 md:gap-10 items-start"><div className="flex flex-col items-center gap-2 md:gap-4 pt-1 md:pt-2"><Skeleton className="w-7 h-7 md:w-9 md:h-9" /><Skeleton className="w-4 h-2 md:w-5 md:h-3" /></div><Skeleton className="w-9 h-9 md:w-12 md:h-12 rounded-xl" /><div className="flex-1 space-y-2 md:space-y-3"><div className="flex justify-between items-start"><div className="space-y-1 md:space-y-2"><Skeleton className="w-20 h-4 md:w-28 md:h-5" /><Skeleton className="w-28 h-2 md:w-40 md:h-2.5" /></div><Skeleton className="w-12 h-6 md:w-16 md:h-7" /></div><Skeleton className="w-full h-3 md:h-3.5" /><Skeleton className="w-2/3 h-3 md:h-3.5" /></div></div>))}</div></div>
        )}
        {data && !error && (
          <div className="mt-8 space-y-6 animate-in fade-in duration-700">
            <div className="bg-white dark:bg-[#161b22] rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-premium-lg overflow-hidden divide-y divide-gray-50 dark:divide-white/5">
              {pinnedIds.size > 0 && (
                <div className="bg-brand/[0.03] dark:bg-brand/[0.05] divide-y divide-brand/[0.05]"><div className="px-4 md:px-8 py-3 md:py-4 flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black text-brand uppercase tracking-[0.2em] md:tracking-[0.25em] opacity-90"><Pin className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" /> Pinned Monitoring</div>{sortedComments.filter(c => pinnedIds.has(c.id)).map(comment => { const r = rankMap.get(comment.id) || 0; const change = getRankChange(comment.id, r, comment.likes); return <CommentRow key={`pinned-${comment.id}`} comment={comment} isPinnedSection={true} currentRank={r} change={change} isPinned={pinnedIds.has(comment.id)} isExpanded={expandedIds.has(comment.id)} toggleExpand={toggleExpand} togglePin={togglePin} showToast={showToast} url={url} searchTerm={searchTerm} />; })}</div>
              )}
              <div className="divide-y divide-gray-50 dark:divide-white/5">{displayComments.map(comment => { const r = rankMap.get(comment.id) || 0; const change = getRankChange(comment.id, r, comment.likes); return <CommentRow key={comment.id} comment={comment} isPinnedSection={false} currentRank={r} change={change} isPinned={pinnedIds.has(comment.id)} isExpanded={expandedIds.has(comment.id)} toggleExpand={toggleExpand} togglePin={togglePin} showToast={showToast} url={url} searchTerm={searchTerm} />; })}</div>
              {processedComments.length > visibleCount && (
                <div className="p-4 md:p-8 text-center bg-gray-50/30 dark:bg-white/[0.01]"><button onClick={() => setVisibleCount(prev => prev + 50)} className="px-6 md:px-10 py-3 md:py-3.5 bg-white dark:bg-gray-800 text-brand font-bold rounded-xl border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md spring-transition active:scale-95 text-xs md:text-sm focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none">더 많은 댓글 보기 (+50)</button><br /><button onClick={() => setVisibleCount(processedComments.length)} className="mt-2 md:mt-3 text-[10px] md:text-[11px] font-bold text-gray-400 dark:text-gray-500 hover:text-brand spring-transition focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none rounded-lg px-2 md:px-3 py-1">한번에 모두 보기</button></div>
              )}
              {processedComments.length === 0 && (
                <div className="py-24 md:py-48 text-center animate-in fade-in duration-700"><div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 dark:bg-white/5 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 border border-gray-100 dark:border-white/10 shadow-inner"><Search className="w-8 h-8 md:w-10 md:h-10 text-gray-300 dark:text-gray-600" /></div><p className="text-lg md:text-xl font-bold text-gray-400 dark:text-gray-600 italic">검색 결과가 없습니다.</p></div>
              )}
            </div>
          </div>
        )}
      </main>
      <div className="fixed bottom-4 right-4 md:bottom-10 md:right-10 flex flex-col gap-2 md:gap-4 z-50">
        <button aria-label="맨 위로 가기" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-10 h-10 md:w-12 md:h-12 glass-panel border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl shadow-premium-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand spring-transition hover:-translate-y-1.5 active:scale-90 group focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"><ArrowUp className="w-4 h-4 md:w-5 md:h-5 group-hover:stroke-[3px] spring-transition" /></button>
        <button aria-label="맨 아래로 가기" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="w-10 h-10 md:w-12 md:h-12 glass-panel border-gray-200 dark:border-white/10 rounded-xl md:rounded-2xl shadow-premium-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-brand spring-transition hover:translate-y-1.5 active:scale-90 group focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"><ArrowDown className="w-4 h-4 md:w-5 md:h-5 group-hover:stroke-[3px] spring-transition" /></button>
      </div>
    </div>
  );
};
export default App;