"use client";

import { useState, useEffect, useRef } from "react";

interface SidebarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  currentWeekDates: Date[];
}

export default function Sidebar({ selectedDate, setSelectedDate, currentWeekDates }: SidebarProps) {
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
      </div>
    </div>
  );
}
