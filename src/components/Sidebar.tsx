"use client";

import { useState, useEffect, useRef } from "react";

interface Box {
  id: string;
  title: string;
  content: string[];
  category?: string;
  color: string;
  position?: { x: number; y: number };
  connections?: string[];
  tags: string[];
  section: 'WORK' | 'LIFE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  archived: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SidebarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  currentWeekDates: Date[];
  activeSection: 'sched' | 'work' | 'life';
  userId?: string;
  // Box navigation props
  workView?: 'box' | 'board';
  lifeView?: 'box' | 'board';
  onBoxSelect?: (boxId: string, section: 'WORK' | 'LIFE') => void;
}

const neonColors = [
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ff4500', // Orange Red
  '#00ff00', // Lime
  '#ffff00', // Yellow
  '#ff69b4', // Hot Pink
  '#00bfff', // Deep Sky Blue
  '#9400d3', // Violet
];

export default function Sidebar({
  selectedDate,
  setSelectedDate,
  currentWeekDates,
  activeSection,
  userId,
  workView = 'box',
  lifeView = 'box',
  onBoxSelect
}: SidebarProps) {
  const [showYearSelector, setShowYearSelector] = useState(false);
  const yearScrollRef = useRef<HTMLDivElement>(null);

  // Box management state
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['All']));
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [newBoxTitle, setNewBoxTitle] = useState('');

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthIndex);

    // Find the first Monday of the new month
    const firstDay = new Date(newDate.getFullYear(), monthIndex, 1);
    const firstMonday = new Date(firstDay);

    // Adjust to first Monday
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1);
    }

    setSelectedDate(firstMonday);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    setShowYearSelector(false);
  };

  const generateYearRange = () => {
    const years = [];
    // Generate much wider range for unlimited scrolling
    for (let i = 1900; i <= 2100; i++) {
      years.push(i);
    }
    return years;
  };

  // Auto-scroll to current year when year selector opens (only once)
  useEffect(() => {
    if (showYearSelector && yearScrollRef.current) {
      // Add a small delay to ensure DOM is rendered
      setTimeout(() => {
        const currentYearElement = yearScrollRef.current?.querySelector(`[data-year="${currentYear}"]`);
        if (currentYearElement) {
          currentYearElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }, [showYearSelector]); // Remove currentYear dependency to prevent re-scrolling

  // Fetch boxes when activeSection changes to work/life
  useEffect(() => {
    if ((activeSection === 'work' || activeSection === 'life') && userId) {
      fetchBoxes();
    }
  }, [activeSection, userId]);

  const fetchBoxes = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const sectionParam = activeSection === 'work' ? 'WORK' : 'LIFE';
      const response = await fetch(`/api/notes?userId=${userId}&section=${sectionParam}`);
      if (response.ok) {
        const fetchedNotes = await response.json();
        const convertedBoxes = fetchedNotes.map((note: any, index: number) => ({
          ...note,
          content: note.content ? note.content.split('\n').filter((line: string) => line.trim()) : [],
          color: neonColors[index % neonColors.length],
          position: { x: (index % 4) * 250 + 100, y: Math.floor(index / 4) * 200 + 100 },
          connections: []
        }));
        setBoxes(convertedBoxes);
      }
    } catch (error) {
      console.error('Failed to fetch boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBox = async () => {
    if (!newBoxTitle.trim() || !userId) return;

    try {
      const newBox = {
        title: newBoxTitle,
        content: '',
        category: 'General',
        tags: [],
        section: activeSection === 'work' ? 'WORK' : 'LIFE',
        priority: 'MEDIUM',
        archived: false,
        userId
      };

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBox)
      });

      if (response.ok) {
        setNewBoxTitle('');
        setShowCreateBox(false);
        await fetchBoxes();
      } else {
        const errorData = await response.json();
        console.error('Failed to create box:', errorData);
      }
    } catch (error) {
      console.error('Failed to create box:', error);
    }
  };

  const deleteBox = async (id: string) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchBoxes();
      }
    } catch (error) {
      console.error('Failed to delete box:', error);
    }
  };

  // Filter and categorize boxes
  const filteredBoxes = boxes.filter(box =>
    box.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    box.content.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = ['All', ...Array.from(new Set(boxes.map(box => box.category || 'General')))];

  const categorizedBoxes = selectedCategory === 'All'
    ? filteredBoxes
    : filteredBoxes.filter(box => (box.category || 'General') === selectedCategory);

  const getBoxesByCategory = () => {
    const categoryGroups: { [key: string]: Box[] } = {};
    categorizedBoxes.forEach(box => {
      const category = box.category || 'General';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(box);
    });
    return categoryGroups;
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Render box management UI for Work/Life sections
  const renderBoxManager = () => (
    <div className="h-full flex flex-col relative" style={{ zIndex: 10 }}>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="text-center">
          <div
            style={{
              opacity: 0.80,
              color: '#FF5983',
              fontSize: 'clamp(16px, 3.5vw, 24px)',
              fontFamily: 'Wallpoet, monospace',
              fontWeight: '400',
              textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)',
            }}
          >
            {activeSection.toUpperCase()} BOXES
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search boxes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg text-white placeholder-gray-400 focus:outline-none border-none"
          style={{
            background: 'rgba(44, 44, 44, 0.8)',
            boxShadow: '0px 0px 23px -10px #C080FF inset',
            outline: '1px #B57BEE solid',
            outlineOffset: '-1px'
          }}
        />

        {/* Create Box Button */}
        <button
          onClick={() => setShowCreateBox(!showCreateBox)}
          className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200"
          style={{
            background: showCreateBox ? 'rgba(192, 128, 255, 0.46)' : '#2C2C2C',
            boxShadow: '0px 0px 23px -10px #C080FF inset',
            outline: '1px #B57BEE solid',
            outlineOffset: '-1px',
            opacity: 0.80,
            color: showCreateBox ? '#FF5983' : '#00C3FF',
            fontFamily: 'Wallpoet, monospace',
            fontWeight: '400',
            textShadow: showCreateBox
              ? '0px 0px 18px rgba(255, 89, 131, 1.00)'
              : '0px 0px 6px rgba(0, 195, 255, 1.00)'
          }}
        >
          + NEW BOX
        </button>

        {/* Create Box Input */}
        {showCreateBox && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Box title..."
              value={newBoxTitle}
              onChange={(e) => setNewBoxTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createBox()}
              className="flex-1 px-3 py-2 text-sm rounded text-white focus:outline-none border-none"
              style={{
                background: 'rgba(44, 44, 44, 0.8)',
                boxShadow: '0px 0px 23px -10px #C080FF inset',
                outline: '1px #B57BEE solid',
                outlineOffset: '-1px'
              }}
              autoFocus
            />
            <button
              onClick={createBox}
              className="px-3 py-2 rounded text-white text-sm transition-all duration-200"
              style={{
                background: 'rgba(34, 197, 94, 0.8)',
                border: '1px solid rgba(34, 197, 94, 0.5)'
              }}
            >
              ✓
            </button>
          </div>
        )}

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg text-white focus:outline-none border-none"
          style={{
            background: 'rgba(44, 44, 44, 0.8)',
            boxShadow: '0px 0px 23px -10px #C080FF inset',
            outline: '1px #B57BEE solid',
            outlineOffset: '-1px'
          }}
        >
          {categories.map(category => (
            <option key={category} value={category} style={{ background: '#2C2C2C' }}>{category}</option>
          ))}
        </select>
      </div>

      {/* Box List */}
      <div className="flex-1 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3b82f6 #374151' }}>
        {loading ? (
          <div className="text-center py-4" style={{ color: '#00C3FF', fontFamily: 'Wallpoet, monospace', fontSize: '14px' }}>
            Loading boxes...
          </div>
        ) : (
          Object.entries(getBoxesByCategory()).map(([category, categoryBoxes]) => (
            <div key={category} className="space-y-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm transition-all duration-200 rounded"
                style={{
                  background: '#2C2C2C',
                  boxShadow: '0px 0px 23px -10px #C080FF inset',
                  outline: '1px #B57BEE solid',
                  outlineOffset: '-1px',
                  color: '#00C3FF',
                  fontFamily: 'Wallpoet, monospace',
                  opacity: 0.8
                }}
              >
                <span className="font-medium">{category} ({categoryBoxes.length})</span>
                <span className="text-xs">
                  {expandedCategories.has(category) ? '▼' : '▶'}
                </span>
              </button>

              {/* Category Boxes */}
              {expandedCategories.has(category) && (
                <div className="space-y-1 ml-2">
                  {categoryBoxes.map((box) => (
                    <div
                      key={box.id}
                      className="flex items-center gap-2 p-2 rounded transition-all cursor-pointer hover:bg-gray-700/50"
                      style={{
                        background: 'rgba(44, 44, 44, 0.6)',
                        border: `2px solid ${box.color}40`,
                        borderLeftColor: box.color,
                        borderLeftWidth: '4px'
                      }}
                      onClick={() => {
                        onBoxSelect?.(box.id, box.section);
                      }}
                      title={`Click to navigate to ${box.title} in ${(box.section === 'WORK' ? workView : lifeView).toUpperCase()} view`}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{
                            color: '#F1E2FF',
                            fontFamily: 'Cal Sans, sans-serif'
                          }}
                        >
                          {box.title}
                        </div>
                        <div
                          className="text-xs flex items-center gap-2"
                          style={{
                            color: '#9CA3AF',
                            fontFamily: 'Syne Mono, monospace'
                          }}
                        >
                          <span>{box.content.length} item{box.content.length !== 1 ? 's' : ''}</span>
                          {box.connections && box.connections.length > 0 && (
                            <span>🔗 {box.connections.length}</span>
                          )}
                          <div
                            className="w-2 h-2 rounded-full ml-auto"
                            style={{ backgroundColor: box.color }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBox(box.id);
                        }}
                        className="text-gray-400 hover:text-red-400 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {!loading && categorizedBoxes.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📦</div>
            <div
              className="text-sm mb-1"
              style={{
                color: '#00C3FF',
                fontFamily: 'Wallpoet, monospace'
              }}
            >
              No boxes found
            </div>
            <div
              className="text-xs"
              style={{
                color: '#9CA3AF',
                fontFamily: 'Syne Mono, monospace'
              }}
            >
              Create your first box above
            </div>
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="pt-3 border-t text-center" style={{ borderColor: 'rgba(181, 123, 238, 0.3)' }}>
        <div
          className="text-xs"
          style={{
            color: '#9CA3AF',
            fontFamily: 'Syne Mono, monospace'
          }}
        >
          {boxes.length} total box{boxes.length !== 1 ? 'es' : ''} • {filteredBoxes.length} shown
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full p-2 relative">
      <div
        className="h-full p-3 relative z-10 overflow-y-auto rounded-lg flex flex-col"
        style={{
          boxShadow: '0px 0px 37px -10px #C080FF inset',
          border: '1px #C080FF solid'
        }}
      >
        {/* Background overlay for opacity */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            backgroundImage: 'url(https://i.imgur.com/fu1Gj1m.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            zIndex: 0
          }}
        >
          <img
            src="https://i.imgur.com/fu1Gj1m.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-30"
            style={{ zIndex: -1 }}
            onError={(e) => {
              console.log('Background image failed to load:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Render content based on active section */}
        {activeSection === 'sched' ? (
          // Original calendar content for SCHED section
          <>
            {/* Year Selector */}
            <div className="mb-4 flex justify-center relative" style={{ zIndex: 10 }}>
              <div
                className="relative overflow-hidden rounded-lg cursor-pointer flex items-center justify-center"
                style={{
                  width: '161px',
                  height: '34px',
                  boxShadow: '0px 0px 37px -10px #C080FF inset',
                  outline: '1px #C080FF solid',
                  outlineOffset: '-1px'
                }}
                onClick={() => setShowYearSelector(!showYearSelector)}
              >
                <div
                  style={{
                    opacity: 0.80,
                    color: '#FF5983',
                    fontSize: 'clamp(18px, 4vw, 36px)',
                    fontFamily: 'Wallpoet, monospace',
                    fontWeight: '400',
                    textShadow: '0px 0px 18px rgba(255, 89, 131, 1.00)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                >
                  {currentYear}
                </div>
              </div>
            </div>

            {/* Year Dropdown */}
            {showYearSelector && (
              <div
                ref={yearScrollRef}
                className="absolute top-12 left-2 right-2 z-20 max-h-48 overflow-y-scroll rounded-lg"
                style={{
                  background: '#2C2C2C',
                  boxShadow: '0px 0px 37px -10px #C080FF inset',
                  border: '1px #C080FF solid',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#3b82f6 #374151',
                  overscrollBehavior: 'contain'
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="py-2">
                  {generateYearRange().map(year => (
                    <button
                      key={year}
                      data-year={year}
                      onClick={() => handleYearSelect(year)}
                      className="w-full p-2 text-center transition-all duration-200 border-none outline-none"
                      style={{
                        color: year === currentYear ? '#FF5983' : '#00C3FF',
                        opacity: year === currentYear ? 0.80 : 0.60,
                        fontSize: '14px',
                        fontFamily: 'Wallpoet, monospace',
                        fontWeight: '400',
                        textShadow: year === currentYear
                          ? '0px 0px 18px rgba(255, 89, 131, 1.00)'
                          : '0px 0px 6px rgba(0, 195, 255, 1.00)',
                        background: year === currentYear
                          ? 'rgba(192, 128, 255, 0.46)'
                          : 'transparent'
                      }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Month Grid - 2 columns, 6 rows - Fit with uniform buffering */}
            <div className="grid grid-cols-2 gap-2 mx-4 flex-1 relative overflow-hidden" style={{ zIndex: 10 }}>
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => handleMonthSelect(index)}
                  className="flex items-center justify-center overflow-hidden rounded-lg transition-all duration-200 text-center"
                  style={{
                    background: index === currentMonth
                      ? 'rgba(192, 128, 255, 0.46)'
                      : '#2C2C2C',
                    boxShadow: '0px 0px 23px -10px #C080FF inset',
                    outline: '1px #B57BEE solid',
                    outlineOffset: '-1px'
                  }}
                >
                  <div
                    style={{
                      opacity: index === currentMonth ? 0.80 : 0.60,
                      color: index === currentMonth ? '#FF5983' : '#00C3FF',
                      fontSize: 'clamp(12px, 2.5vw, 24px)',
                      fontFamily: 'Wallpoet, monospace',
                      fontWeight: '400',
                      textShadow: index === currentMonth
                        ? '0px 0px 18px rgba(255, 89, 131, 1.00)'
                        : '0px 0px 6px rgba(0, 195, 255, 1.00)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
                  >
                    {month}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          // Box manager for WORK/LIFE sections
          renderBoxManager()
        )}
      </div>
    </div>
  );
}
