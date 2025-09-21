"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Timeline } from '@/components/Timeline';
import { ImpactAssessment } from '@/components/ImpactAssessment';
import { EventSummary } from '@/components/EventSummary';
import { ApiSettings } from '@/components/ApiSettings';
import { ApiProvider, useApi } from '@/contexts/ApiContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { TimelineData, TimelineEvent, DateFilterOption, DateFilterConfig } from '@/types';
import { fetchTimelineData, fetchEventDetails, fetchImpactAssessment, type ProgressCallback, type StreamCallback } from '@/lib/api';
import { SearchProgress, type SearchProgressStep } from '@/components/SearchProgress';
import { HotSearchDropdown } from '@/components/HotSearchDropdown';
import { SearchHistory, type SearchHistoryItem } from '@/components/SearchHistory';
import { toast } from 'sonner';
import { Settings, SortDesc, SortAsc, Download, Search, ChevronDown, Flame, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMarkdownText } from '@/lib/markdown';

// Markdown rendering utility
const renderMarkdown = (content: string) => {
  if (!content) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      {content.split("\n\n").map((paragraph, index) => (
        <div
          key={`paragraph-${index}`}
          className="text-sm leading-relaxed animate-fade-in"
          style={{ animationDelay: `${0.15 * index}s` }}
          dangerouslySetInnerHTML={{
            __html: formatMarkdownText(paragraph.replace(/\n/g, '<br />'))
          }}
        />
      ))}
    </div>
  );
};

function MainContent() {
  const { apiConfig, isConfigured, isPasswordProtected, isPasswordValidated } = useApi();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineData>({ events: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState('');
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterConfig>({ option: 'all' });
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [searchPosition, setSearchPosition] = useState<'center' | 'top'>('center');
  const [timelineVisible, setTimelineVisible] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchProgressVisible, setSearchProgressVisible] = useState(false);
  const [searchProgressSteps, setSearchProgressSteps] = useState<SearchProgressStep[]>([]);
  const [searchProgressActive, setSearchProgressActive] = useState(false);

  const [showHotSearch, setShowHotSearch] = useState(true);
  const [flyingHotItem, setFlyingHotItem] = useState<{ title: string, startX: number, startY: number } | null>(null);

  // Search history related states
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const MAX_HISTORY_ITEMS = 10;

  const [showImpact, setShowImpact] = useState<boolean>(false);

  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [searchTimeElapsed, setSearchTimeElapsed] = useState<number | null>(null);

  const lastSearchQuery = useRef<string>('');

  // For event summary (事件概述)
  const [eventSummary, setEventSummary] = useState<string | null>(null);
  const [showEventSummary, setShowEventSummary] = useState<boolean>(false);

  // For impact assessment content (to parse summary)
  const [impactContent, setImpactContent] = useState<string | null>(null);
  const [parsedImpact, setParsedImpact] = useState<{ summary?: string } | null>(null);

  // Load search history from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedHistory = localStorage.getItem('oneLine_searchHistory');
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory) as SearchHistoryItem[];
          // Sort by timestamp (newest first)
          const sortedHistory = parsedHistory.sort((a, b) => b.timestamp - a.timestamp);
          setSearchHistory(sortedHistory);
        }
      } catch (error) {
        console.error('Failed to load search history from localStorage:', error);
      }
    }
  }, []);

  // Function to save a search query to history
  const saveSearchToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const trimmedQuery = searchQuery.trim();
    const timestamp = Date.now();

    setSearchHistory(prevHistory => {
      // Check if this query already exists in history
      const existingItemIndex = prevHistory.findIndex(item => item.query.toLowerCase() === trimmedQuery.toLowerCase());
      let newHistory: SearchHistoryItem[];

      if (existingItemIndex >= 0) {
        // Update existing item with new timestamp and increment count
        const existingItem = prevHistory[existingItemIndex];
        const updatedItem = {
          ...existingItem,
          timestamp,
          count: existingItem.count + 1
        };

        // Remove the existing item and create a new array
        newHistory = [
          updatedItem,
          ...prevHistory.slice(0, existingItemIndex),
          ...prevHistory.slice(existingItemIndex + 1)
        ];
      } else {
        // Add new item to the beginning
        const newItem: SearchHistoryItem = {
          query: trimmedQuery,
          timestamp,
          count: 1
        };

        newHistory = [newItem, ...prevHistory];
      }

      // Keep only the most recent MAX_HISTORY_ITEMS
      if (newHistory.length > MAX_HISTORY_ITEMS) {
        newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('oneLine_searchHistory', JSON.stringify(newHistory));
      }

      return newHistory;
    });
  };

  const progressCallback: ProgressCallback = (message, status) => {
    const newStep: SearchProgressStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      message,
      status,
      timestamp: new Date()
    };

    setSearchProgressSteps(prev => [...prev, newStep]);

    if (status !== 'pending') {
      // 结束或错误时不再激活
    } else {
      setSearchProgressActive(true);
    }
  };

  const scrollToTimeline = () => {
    if (timelineRef.current) {
      const header = document.querySelector('header');
      const headerHeight = header?.offsetHeight || 0;
      const yOffset = -headerHeight - 20;
      const y = timelineRef.current.getBoundingClientRect().top + window.scrollY + yOffset;

      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  const handleHotItemClick = (title: string) => {
    if (title.trim() === query.trim() && timelineData.events.length > 0 && timelineVisible) {
      console.log("跳过相同热搜项点击:", title);
      setShowHotSearch(false);
      setShowSearchHistory(false);
      return;
    }

    const hotItems = document.querySelectorAll('.hot-item');
    let startX = 0;
    let startY = 0;

    hotItems.forEach((item) => {
      if (item.textContent?.includes(title)) {
        const rect = item.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
      }
    });

    lastSearchQuery.current = title.trim();

    // Save the hot item to search history
    saveSearchToHistory(title);

    setFlyingHotItem({ title, startX, startY });

    setTimeout(() => {
      setQuery(title);
      setFlyingHotItem(null);
      setShowHotSearch(false);
      setShowSearchHistory(false);

      setTimeout(() => {
        if (inputRef.current) {
          const form = inputRef.current.form;
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          }
        }
      }, 300);
    }, 600);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowFloatingButton(true);
      } else {
        setShowFloatingButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (timelineData.events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    const now = new Date();
    let startDate: Date | undefined;

    switch (dateFilter.option) {
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'halfYear':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        startDate = dateFilter.startDate;
        break;
      default:
        setFilteredEvents(sortEvents(timelineData.events));
        return;
    }

    const endDate = dateFilter.option === 'custom' ? dateFilter.endDate : undefined;

    const filtered = timelineData.events.filter(event => {
      const dateParts = event.date.split('-').map(Number);
      let eventDate: Date;

      if (dateParts.length === 3) {
        eventDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      } else if (dateParts.length === 2) {
        eventDate = new Date(dateParts[0], dateParts[1] - 1, 1);
      } else if (dateParts.length === 1) {
        eventDate = new Date(dateParts[0], 0, 1);
      } else {
        return true;
      }

      if (startDate && eventDate < startDate) {
        return false;
      }
      if (endDate && eventDate > endDate) {
        return false;
      }
      return true;
    });

    setFilteredEvents(sortEvents(filtered));
  }, [timelineData.events, dateFilter, sortDirection]);

  useEffect(() => {
    if (timelineData.events.length > 0 && !timelineVisible) {
      setTimelineVisible(true);
    }
  }, [timelineData.events.length, timelineVisible]);

  useEffect(() => {
    if (flyingHotItem && inputRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      const inputCenterX = inputRect.left + inputRect.width / 2;
      const inputCenterY = inputRect.top + inputRect.height / 2;

      const flyX = inputCenterX - flyingHotItem.startX;
      const flyY = inputCenterY - flyingHotItem.startY;

      document.documentElement.style.setProperty('--fly-x', `${flyX}px`);
      document.documentElement.style.setProperty('--fly-y', `${flyY}px`);
    }
  }, [flyingHotItem]);

  useEffect(() => {
    if (!query.trim()) {
      setShowHotSearch(true);
      setShowSearchHistory(false);
    }
  }, [query]);

  useEffect(() => {
    if (query.trim()) {
      setShowHotSearch(false);
      setShowSearchHistory(false);
    }
  }, [query]);

  useEffect(() => {
    if (timelineVisible && timelineData.events.length > 0) {
      setShowHotSearch(false);
      setShowSearchHistory(false);
    }
  }, [timelineVisible, timelineData.events.length]);

  // 处理提取到的事件概括
  const handleSummaryExtracted = (summary: string) => {
    setEventSummary(summary);
    setShowEventSummary(true);
  };

  // For impact assessment summary extraction
  const extractSummary = (content: string): string => {
    if (!content) return '';

    // First try to find the summary section marked with ===事件简介===
    const summaryMatch = content.match(/===事件简介===\s*([\s\S]*?)(?=\s*===经济影响===|$)/);
    if (summaryMatch && summaryMatch[1]) {
      return summaryMatch[1].trim();
    }

    // If not found, try to extract the first paragraph as a fallback
    const firstParagraph = content.split('\n\n')[0];
    if (firstParagraph) {
      return firstParagraph.trim();
    }

    return '';
  };

  // Update the useEffect for processing impact content to properly set parsedImpact
  useEffect(() => {
    if (impactContent) {
      const summary = extractSummary(impactContent);
      setParsedImpact(prev => ({ ...prev, summary }));
      if (summary && !eventSummary) {
        setEventSummary(summary);
        setShowEventSummary(true);
      }
    }
  }, [impactContent, eventSummary]);

  const sortEvents = (events: TimelineEvent[]): TimelineEvent[] => {
    return [...events].sort((a, b) => {
      const dateA = a.date.replace(/\D/g, '');
      const dateB = b.date.replace(/\D/g, '');
      return sortDirection === 'asc'
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);
    });
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.warning('请输入搜索关键词');
      return;
    }

    if (!isConfigured) {
      toast.info('请先配置API设置');
      setShowSettings(true);
      return;
    }

    if (isPasswordProtected && !isPasswordValidated) {
      toast.info('请先验证访问密码');
      setShowSettings(true);
      return;
    }

    if (timelineData.events.length > 0 && timelineVisible && lastSearchQuery.current === query.trim()) {
      console.log("跳过重复搜索:", query);
      return;
    }

    lastSearchQuery.current = query.trim();

    // Save search query to history
    saveSearchToHistory(query);

    setShowHotSearch(false);
    setShowSearchHistory(false);

    setSearchProgressSteps([]);
    setSearchProgressActive(true);
    setSearchProgressVisible(true);

    setSearchStartTime(Date.now());
    setSearchTimeElapsed(null);

    if (searchPosition === 'center') {
      setSearchPosition('top');
      setTimeout(() => {
        fetchData();
      }, 700);
    } else {
      fetchData();
    }
  };

  // --- UPDATED fetchData: More intelligent analysis based on the query type ---
  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    setShowImpact(false); // Initially don't show impact until we determine if it's relevant
    setShowEventSummary(false);
    setEventSummary(null);
    setImpactContent(null);
    setParsedImpact(null);

    if (timelineData.events.length === 0) {
      setTimelineVisible(false);
    }

    try {
      let queryWithDateFilter = query;

      if (dateFilter.option !== 'all') {
        let dateRangeText = '';
        const now = new Date();

        switch (dateFilter.option) {
          case 'month':
            const monthAgo = new Date(now);
            monthAgo.setMonth(now.getMonth() - 1);
            dateRangeText = `，请主要搜索 ${formatDate(monthAgo)} 至 ${formatDate(now)} 这段时间的内容`;
            break;
          case 'halfYear':
            const halfYearAgo = new Date(now);
            halfYearAgo.setMonth(now.getMonth() - 6);
            dateRangeText = `，请主要搜索 ${formatDate(halfYearAgo)} 至 ${formatDate(now)} 这段时间的内容`;
            break;
          case 'year':
            const yearAgo = new Date(now);
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateRangeText = `，请主要搜索 ${formatDate(yearAgo)} 至 ${formatDate(now)} 这段时间的内容`;
            break;
          case 'custom':
            if (dateFilter.startDate && dateFilter.endDate) {
              dateRangeText = `，请主要搜索 ${formatDate(dateFilter.startDate)} 至 ${formatDate(dateFilter.endDate)} 这段时间的内容`;
            }
            break;
        }

        queryWithDateFilter += dateRangeText;
      }

      // 判断查询类型以决定适当的分析方法
      const shouldAnalyzeImpact = determineIfShouldAnalyzeImpact(query);
      if (shouldAnalyzeImpact) {
        setShowImpact(true);

        // 获取影响评估内容（流式）
        if (progressCallback) {
          progressCallback('正在分析事件影响', 'pending');
        }

        let impactText = '';
        fetchImpactAssessment(
          queryWithDateFilter,
          apiConfig,
          progressCallback,
          (chunk, isDone) => {
            impactText += chunk;
            setImpactContent(impactText);
          }
        ).catch(err => {
          console.error('Error fetching impact assessment:', err);
        });
      }

      // 在短暂延迟后生成时间轴
      setTimeout(async () => {
        try {
          // 再获取时间轴数据
          const streamCallback: StreamCallback = (chunk, isDone) => {
            // 可用于流式处理时间轴
          };

          if (progressCallback) {
            progressCallback('正在生成事件时间轴', 'pending');
          }

          const data = await fetchTimelineData(queryWithDateFilter, apiConfig, progressCallback, streamCallback);
          setTimelineData(data);

          if (searchStartTime) {
            setSearchTimeElapsed(Date.now() - searchStartTime);
          }

          setTimeout(() => {
            if (!timelineVisible) {
              setTimelineVisible(true);
            }

            if (data.events.length > 0) {
              setTimeout(scrollToTimeline, 300);
            }

            setSearchProgressActive(false);

          }, 300);

          if (data.events.length === 0) {
            toast.warning('未找到相关事件，请尝试其他关键词');
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : '发生错误，请稍后再试';
          setError(errorMessage);
          toast.error(errorMessage);
          console.error('Error fetching timeline data:', err);

          setSearchProgressActive(false);

          if (searchStartTime) {
            setSearchTimeElapsed(Date.now() - searchStartTime);
          }
        } finally {
          setIsLoading(false);
        }
      }, shouldAnalyzeImpact ? 1000 : 0); // 如果有影响分析，延迟1秒，否则立即开始

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '发生错误，请稍后再试';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching timeline data:', err);

      setSearchProgressActive(false);

      if (searchStartTime) {
        setSearchTimeElapsed(Date.now() - searchStartTime);
      }
      setIsLoading(false);
    }
  };
  // --- END UPDATED fetchData ---

  // 判断查询是否适合做影响评估分析
  const determineIfShouldAnalyzeImpact = (queryText: string): boolean => {
    // 检查查询内容是否是事件或话题，而不是简单的人物、概念或其他不适合影响分析的内容

    // 判断是否是热点事件、社会现象、政治事件、经济事件、国际关系等有明显影响的主题
    const impactAnalysisKeywords = [
      '事件', '冲突', '危机', '战争', '协议', '签署', '宣布', '政策', '改革', '谈判',
      '疫情', '灾害', '事故', '抗议', '示威', '选举', '公投', '会谈', '会议', '峰会',
      '事故', '决策', '立法', '判决', '制裁', '合作', '争端', '矛盾', '问题', '风波',
      '关系', '纠纷', '协议', '条约', '法案', '通过', '改变', '变化', '影响', '改革'
    ];

    // 检查查询中是否包含这些关键词
    const hasImpactKeyword = impactAnalysisKeywords.some(keyword =>
      queryText.includes(keyword)
    );

    // 简单的规则：查询文本较长（可能是描述性的事件）或包含影响分析关键词
    return queryText.length > 8 || hasImpactKeyword;
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleDateFilterChange = (value: DateFilterOption) => {
    if (value === 'custom') {
      setDateFilter({
        option: value,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      });
    } else {
      setDateFilter({ option: value });
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    if (dateFilter.option === 'custom' && e.target.value) {
      setDateFilter({
        ...dateFilter,
        startDate: new Date(e.target.value)
      });
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    if (dateFilter.option === 'custom' && e.target.value) {
      setDateFilter({
        ...dateFilter,
        endDate: new Date(e.target.value)
      });
    }
  };

  const handleRequestDetails = async (event: TimelineEvent, streamCallback?: StreamCallback): Promise<string> => {
    if (!isConfigured) {
      toast.info('请先配置API设置');
      setShowSettings(true);
      return '请先配置API设置';
    }

    if (isPasswordProtected && !isPasswordValidated) {
      toast.info('请先验证访问密码');
      setShowSettings(true);
      return '请先验证访问密码';
    }

    setSearchProgressSteps([]);
    setSearchProgressActive(true);
    setSearchProgressVisible(true);

    setSearchStartTime(Date.now());
    setSearchTimeElapsed(null);

    try {
      const detailedQuery = `事件：${event.title}（${event.date}）\n\n请提供该事件的详细分析，包括事件背景、主要过程、关键人物、影响与意义。请尽可能提供多方观点，并分析该事件在${query}整体发展中的位置与作用。`;

      const detailsContent = await fetchEventDetails(
        event.id,
        detailedQuery,
        apiConfig,
        progressCallback,
        streamCallback
      );

      if (searchStartTime) {
        setSearchTimeElapsed(Date.now() - searchStartTime);
      }

      setTimeout(() => {
        setSearchProgressActive(false);
      }, 1000);

      return detailsContent;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '获取详细信息失败';
      toast.error(errorMessage);
      console.error('Error fetching event details:', err);

      setSearchProgressActive(false);

      if (searchStartTime) {
        setSearchTimeElapsed(Date.now() - searchStartTime);
      }

      return '获取详细信息失败，请稍后再试';
    }
  };

  const handleRequestImpact = async (query: string, streamCallback?: StreamCallback): Promise<string> => {
    if (!isConfigured) {
      toast.info('请先配置API设置');
      setShowSettings(true);
      return '请先配置API设置';
    }

    if (isPasswordProtected && !isPasswordValidated) {
      toast.info('请先验证访问密码');
      setShowSettings(true);
      return '请先验证访问密码';
    }

    setSearchProgressSteps([]);
    setSearchProgressActive(true);
    setSearchProgressVisible(true);

    setSearchStartTime(Date.now());
    setSearchTimeElapsed(null);

    try {
      let impactText = '';
      const result = await fetchImpactAssessment(
        query,
        apiConfig,
        progressCallback,
        (chunk, isDone) => {
          impactText += chunk;
          setImpactContent(impactText);
          if (streamCallback) streamCallback(chunk, isDone);
        }
      );

      if (searchStartTime) {
        setSearchTimeElapsed(Date.now() - searchStartTime);
      }

      setTimeout(() => {
        setSearchProgressActive(false);
      }, 1000);

      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '获取影响评估失败';
      toast.error(errorMessage);
      console.error('Error fetching impact assessment:', err);

      setSearchProgressActive(false);

      if (searchStartTime) {
        setSearchTimeElapsed(Date.now() - searchStartTime);
      }

      return '获取影响评估失败，请稍后再试';
    }
  };

  const exportAsImage = () => {
    if (filteredEvents.length === 0) {
      toast.warning('没有可导出的内容');
      return;
    }

    import('html2canvas').then(({ default: html2canvas }) => {
      const timelineElement = document.querySelector('.timeline-container') as HTMLElement;
      if (!timelineElement) {
        toast.error('找不到时间轴元素');
        return;
      }

      toast.info('正在生成图片，请稍候...');

      html2canvas(timelineElement, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const fileName = `一线-${query.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();

        toast.success('图片已导出');
      }).catch(err => {
        console.error('Error exporting image:', err);
        toast.error('导出图片失败');
      });
    }).catch(err => {
      console.error('Error loading html2canvas:', err);
      toast.error('加载导出功能失败');
    });
  };


  // Handle a click on a history item
  const handleHistoryItemClick = (queryText: string) => {
    if (queryText.trim() === query.trim() && timelineData.events.length > 0 && timelineVisible) {
      setShowSearchHistory(false);
      return;
    }

    // Update last search query reference and set query
    lastSearchQuery.current = queryText.trim();
    setQuery(queryText);

    // Update the count in history
    saveSearchToHistory(queryText);

    setShowSearchHistory(false);

    // Use setTimeout to allow the UI to update before submitting the form
    setTimeout(() => {
      if (inputRef.current) {
        const form = inputRef.current.form;
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }
    }, 100);
  };

  return (
    <main className="flex min-h-screen flex-col relative">
      <div className="bg-gradient-purple" />
      <div className="bg-gradient-blue" />

      <header className="fixed top-0 left-0 w-full z-20 flex justify-end items-center p-2 sm:p-4 md:px-8">
        <div className="flex gap-1 sm:gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="rounded-full w-8 h-8 sm:w-9 sm:h-9"
          >
            <Settings size={18} />
          </Button>
        </div>
      </header>

      <form
        ref={searchRef}
        onSubmit={(e) => {
          if (timelineData.events.length > 0 && timelineVisible && document.activeElement === inputRef.current) {
            console.log("阻止因输入框聚焦导致的重复提交");
            e.preventDefault();
            return;
          }
          handleSubmit(e);
        }}
        className={`${searchPosition === 'center' ? 'search-container-center' : 'search-container-top'} z-1001`}
      >
        {searchPosition === 'center' && (
          <div className="flex flex-col items-center mb-8 animate-slide-down">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center page-title">一线</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-center max-w-xl mx-auto">
              AI驱动的热点事件时间轴 · 洞察历史脉络
            </p>
          </div>
        )}

        <div className="p-4 w-full">
          <div className="glass-card rounded-full overflow-hidden flex items-center p-1 pr-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="输入关键词，如：俄乌冲突..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/70 text-sm sm:text-base h-8 sm:h-10"
              onFocus={(e) => {
                e.stopPropagation();
                setShowSearchHistory(true);
                // 不关闭热搜榜，历史和热搜可同时显示
              }}
              onBlur={() => {
                // Add a small delay before hiding search history to allow for clicks on history items
                setTimeout(() => {
                  setShowSearchHistory(false);
                }, 200);
              }}
            />

            <div className="flex items-center">
              <Select
                value={dateFilter.option}
                onValueChange={handleDateFilterChange as (value: string) => void}
                defaultValue="all"
              >
                <SelectTrigger className="w-auto border-0 bg-transparent mr-2 focus:ring-0">
                  <div className="flex items-center">
                    <ChevronDown size={14} className="mr-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {dateFilter.option === 'all' && '所有时间'}
                      {dateFilter.option === 'month' && '近一个月'}
                      {dateFilter.option === 'halfYear' && '近半年'}
                      {dateFilter.option === 'year' && '近一年'}
                      {dateFilter.option === 'custom' && '自定义'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="glass-card border-0">
                  <SelectItem value="all">所有时间</SelectItem>
                  <SelectItem value="month">近一个月</SelectItem>
                  <SelectItem value="halfYear">近半年</SelectItem>
                  <SelectItem value="year">近一年</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
                className="rounded-full aspect-square h-9 w-9 bg-primary hover:bg-primary/90"
              >
                {isLoading ?
                  <div className="loading-spinner" /> :
                  <Search size={16} />
                }
              </Button>
            </div>
          </div>

          {dateFilter.option === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2 mt-3 glass p-3 rounded-xl">
              <div className="flex-1 flex gap-2 items-center">
                <label htmlFor="start-date" className="text-sm whitespace-nowrap">开始日期:</label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="flex-1 glass-input text-sm h-8"
                />
              </div>
              <div className="flex-1 flex gap-2 items-center">
                <label htmlFor="end-date" className="text-sm whitespace-nowrap">结束日期:</label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="flex-1 glass-input text-sm h-8"
                />
              </div>
            </div>
          )}

          <div className="w-full mx-auto relative z-30">
            <SearchHistory
              visible={showSearchHistory && !isLoading}
              historyItems={searchHistory}
              onSelectHistoryItem={handleHistoryItemClick}
            />
            <HotSearchDropdown
              visible={searchPosition === 'center' && showHotSearch && !isLoading}
              onSelectHotItem={handleHotItemClick}
              hasSearchResults={timelineData.events.length > 0}
            />
          </div>
        </div>
      </form>

      <div className="w-full mx-auto px-4 max-w-3xl pt-24">
        <SearchProgress
          steps={searchProgressSteps}
          visible={searchProgressVisible}
          isActive={searchProgressActive}
          timeElapsed={searchTimeElapsed || undefined}
          resultCount={filteredEvents.length || undefined}
        />
      </div>


      {flyingHotItem && (
        <div
          className="fixed z-50 fly-to-input bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            left: flyingHotItem.startX,
            top: flyingHotItem.startY,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {flyingHotItem.title}
        </div>
      )}

      {/* Split impact analysis and timeline */}
      <div className="flex-1 pt-16 pb-12 px-2 sm:px-4 md:px-8 w-full max-w-6xl mx-auto">
        {/* 事件概括板块 */}
        {(showEventSummary || isLoading) && (
          <div className="mt-4 sm:mt-0 mb-4">
            <EventSummary
              summary={eventSummary}
              isLoading={isLoading && !eventSummary}
            />
          </div>
        )}

        {/* 影响分析板块 */}
        {(showImpact || timelineVisible) && (
          <div className="mt-4 sm:mt-0 mb-0">
            <ImpactAssessment
              query={query}
              isLoading={isLoading}
              onRequestImpact={handleRequestImpact}
              onSummaryExtracted={handleSummaryExtracted}
            />
          </div>
        )}

        {(timelineVisible || isLoading) && (
          <div
            ref={timelineRef}
            className={`timeline-container mt-2 sm:mt-24 ${timelineVisible ? 'timeline-container-visible' : ''}`}
          >
            {error && (
              <div className="mb-6 sm:mb-8 p-3 sm:p-4 glass text-red-500 dark:text-red-300 rounded-lg text-sm sm:text-base">
                {error}
              </div>
            )}

            {filteredEvents.length > 0 && (
              <div className="flex justify-between mb-4 glass rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSortDirection}
                  className="flex items-center gap-1 rounded-full text-xs"
                >
                  {sortDirection === 'asc' ? (
                    <>
                      <SortAsc size={14} /> 从远到近
                    </>
                  ) : (
                    <>
                      <SortDesc size={14} /> 从近到远
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportAsImage}
                  className="flex items-center gap-1 rounded-full text-xs"
                >
                  <Download size={14} /> 导出图片
                </Button>
              </div>
            )}

            <Timeline
              events={filteredEvents}
              isLoading={isLoading}
              onRequestDetails={handleRequestDetails}
              summary={timelineData.summary}
            />
          </div>
        )}
      </div>

      <ApiSettings
        open={showSettings}
        onOpenChange={setShowSettings}
      />

      {showFloatingButton && (
        <Button
          variant="secondary"
          size="sm"
          className="fixed bottom-4 right-4 z-50 rounded-full p-3 shadow-md sm:hidden glass"
          onClick={() => setShowSettings(true)}
        >
          <Settings size={20} />
        </Button>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <ApiProvider>
      <MainContent />
    </ApiProvider>
  );
}
