"use client";

import { useState, useEffect, useRef } from "react";

interface SidebarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export default function Sidebar({ selectedDate, setSelectedDate }: SidebarProps) {
  const [showYearSelector, setShowYearSelector] = useState(false);
  const yearScrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="h-full w-full p-2 relative">
      <div className="neon-panel h-full p-3 relative z-10 overflow-y-auto">

        {/* Year Selector */}
        <div className="mb-4">
          <button
            onClick={() => setShowYearSelector(!showYearSelector)}
            className="w-full text-center text-xl font-bold text-neon-pink neon-text hover:text-neon-aqua transition-colors duration-200 font-cal-sans"
          >
            {currentYear}
          </button>

          {/* Year Dropdown */}
          {showYearSelector && (
            <div
              ref={yearScrollRef}
              className="absolute top-12 left-2 right-2 z-20 neon-panel max-h-48 overflow-y-scroll"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#3b82f6 #374151',
                overscrollBehavior: 'contain'
              }}
              onWheel={(e) => {
                // Prevent event bubbling to parent container
                e.stopPropagation();
              }}
            >
              <div className="py-2">
                {generateYearRange().map(year => (
                  <button
                    key={year}
                    data-year={year}
                    onClick={() => handleYearSelect(year)}
                    className={`w-full p-2 text-center hover:bg-neon-purple hover:bg-opacity-20 transition-all duration-200 border-none outline-none ${
                      year === currentYear
                        ? 'text-neon-pink neon-text bg-neon-pink bg-opacity-10'
                        : 'text-gray-400 hover:text-neon-purple'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Month Grid - 2 columns, 6 rows */}
        <div className="grid grid-cols-2 gap-1">
          {months.map((month, index) => (
            <button
              key={month}
              onClick={() => handleMonthSelect(index)}
              className={`p-1.5 text-center rounded border transition-all duration-200 text-xs ${
                index === currentMonth
                  ? 'border-neon-aqua text-neon-aqua shadow-neon-aqua neon-text'
                  : 'border-gray-600 text-gray-400 hover:border-neon-blue hover:text-neon-blue'
              }`}
            >
              <div className="font-syne-mono tracking-wider">
                {month.substring(0, 3)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
