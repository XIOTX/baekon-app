"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

interface HeaderProps {
  activeSection: 'sched' | 'work' | 'life';
  setActiveSection: (section: 'sched' | 'work' | 'life') => void;
  schedView: 'planner' | 'calendar';
  setSchedView: (view: 'planner' | 'calendar') => void;
  workView: 'box' | 'board';
  setWorkView: (view: 'box' | 'board') => void;
  lifeView: 'box' | 'board';
  setLifeView: (view: 'box' | 'board') => void;
  selectedDate?: Date;
  setSelectedDate?: (date: Date) => void;
  setSelectedTimeSlot?: (slot: { day: number; quarter: number; hour: number } | null) => void;
}

export default function Header({
  activeSection,
  setActiveSection,
  schedView,
  setSchedView,
  workView,
  setWorkView,
  lifeView,
  setLifeView,
  selectedDate,
  setSelectedDate,
  setSelectedTimeSlot
}: HeaderProps) {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [is24Hour, setIs24Hour] = useState(false); // Default to 12-hour

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: !is24Hour,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMoonPhase = () => {
    const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    const now = new Date();
    const phase = Math.floor((now.getDate() % 28) / 3.5);
    return phases[phase] || '🌑';
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const handleTodayClick = () => {
    if (setSelectedDate && setSelectedTimeSlot) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      setSelectedDate(today);

      // Calculate which day of the week today is (0-6, Monday=0)
      const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1;
      setSelectedTimeSlot({ day: dayOfWeek, quarter: 0, hour: 0 }); // Default to first quarter, first hour
    }
  };

  return (
    <div className="h-full w-full p-3 flex items-center justify-between" style={{ paddingTop: '1.5rem' }}>
      {/* Navigation Buttons */}
      <div className="flex-1 flex items-center">
        <div className="w-full flex items-center">
          <div className="flex w-full space-x-2">

            {/* SCHED Button with sub-tabs */}
            <div className="relative flex-1">
              <button
                onClick={() => setActiveSection('sched')}
                className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 font-red-hat font-semibold text-sm ${
                  activeSection === 'sched'
                    ? 'border-neon-aqua text-neon-aqua shadow-neon-aqua neon-text'
                    : 'border-gray-600 text-gray-400 hover:border-neon-purple hover:text-neon-purple'
                }`}
              >
                SCHED
              </button>

              {/* Sub-tabs for SCHED */}
              {activeSection === 'sched' && (
                <div className="absolute top-0 left-0 -mt-3 flex w-full z-20">
                  <button
                    onClick={() => setSchedView('planner')}
                    onDoubleClick={() => {
                      localStorage.setItem('baekon-default-view', 'planner');
                      alert('Default view set to Planner');
                    }}
                    className={`flex-1 px-2 py-0.5 text-xs rounded-tl border-l border-t border-r transition-all duration-200 ${
                      schedView === 'planner'
                        ? 'border-neon-blue text-neon-blue bg-black bg-opacity-60'
                        : 'border-gray-600 text-gray-400 hover:border-neon-blue hover:text-neon-blue bg-black bg-opacity-40'
                    }`}
                    title="Double-click to set as default view"
                  >
                    PLANNER
                  </button>
                  <button
                    onClick={() => setSchedView('calendar')}
                    onDoubleClick={() => {
                      localStorage.setItem('baekon-default-view', 'calendar');
                      alert('Default view set to Calendar');
                    }}
                    className={`flex-1 px-2 py-0.5 text-xs rounded-tr border-t border-r transition-all duration-200 ${
                      schedView === 'calendar'
                        ? 'border-neon-blue text-neon-blue bg-black bg-opacity-60'
                        : 'border-gray-600 text-gray-400 hover:border-neon-blue hover:text-neon-blue bg-black bg-opacity-40'
                    }`}
                    title="Double-click to set as default view"
                  >
                    CALENDAR
                  </button>
                </div>
              )}
            </div>

            {/* WORK Button with sub-tabs */}
            <div className="flex-1 relative">
              <button
                onClick={() => setActiveSection('work')}
                className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 font-red-hat font-semibold text-sm ${
                  activeSection === 'work'
                    ? 'border-neon-aqua text-neon-aqua shadow-neon-aqua neon-text'
                    : 'border-gray-600 text-gray-400 hover:border-neon-purple hover:text-neon-purple'
                }`}
              >
                WORK
              </button>

              {/* Sub-tabs for WORK */}
              {activeSection === 'work' && (
                <div className="absolute top-0 left-0 -mt-3 flex w-full z-20">
                  <button
                    onClick={() => setWorkView('box')}
                    className={`flex-1 px-2 py-0.5 text-xs rounded-tl border-l border-t border-r transition-all duration-200 ${
                      workView === 'box'
                        ? 'border-neon-blue text-neon-blue bg-black bg-opacity-60'
                        : 'border-gray-600 text-gray-400 hover:border-neon-blue hover:text-neon-blue bg-black bg-opacity-40'
                    }`}
                  >
                    BOX
                  </button>
                  <button
                    onClick={() => setWorkView('board')}
                    className={`flex-1 px-2 py-0.5 text-xs rounded-tr border-t border-r transition-all duration-200 ${
                      workView === 'board'
                        ? 'border-neon-blue text-neon-blue bg-black bg-opacity-60'
                        : 'border-gray-600 text-gray-400 hover:border-neon-blue hover:text-neon-blue bg-black bg-opacity-40'
                    }`}
                  >
                    BOARD
                  </button>
                </div>
              )}
            </div>

            {/* LIFE Button with sub-tabs */}
            <div className="flex-1 relative">
              <button
                onClick={() => setActiveSection('life')}
                className={`w-full px-4 py-2 rounded-lg border transition-all duration-200 font-red-hat font-semibold text-sm ${
                  activeSection === 'life'
                    ? 'border-neon-aqua text-neon-aqua shadow-neon-aqua neon-text'
                    : 'border-gray-600 text-gray-400 hover:border-neon-purple hover:text-neon-purple'
                }`}
              >
                LIFE
              </button>

              {/* Sub-tabs for LIFE */}
              {activeSection === 'life' && (
                <div className="absolute top-0 left-0 -mt-3 flex w-full z-20">
                  <button
                    onClick={() => setLifeView('box')}
                    className={`flex-1 px-2 py-0.5 text-xs rounded-tl border-l border-t border-r transition-all duration-200 ${
                      lifeView === 'box'
                        ? 'border-neon-blue text-neon-blue bg-black bg-opacity-60'
                        : 'border-gray-600 text-gray-400 hover:border-neon-blue hover:text-neon-blue bg-black bg-opacity-40'
                    }`}
                  >
                    BOX
                  </button>
                  <button
                    onClick={() => setLifeView('board')}
                    className={`flex-1 px-2 py-0.5 text-xs rounded-tr border-t border-r transition-all duration-200 ${
                      lifeView === 'board'
                        ? 'border-neon-blue text-neon-blue bg-black bg-opacity-60'
                        : 'border-gray-600 text-gray-400 hover:border-neon-blue hover:text-neon-blue bg-black bg-opacity-40'
                    }`}
                  >
                    BOARD
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center space-x-4 ml-4">
        {/* Time and Moon Phase */}
        <div className="text-right">
          <div className="flex items-center gap-2">
            <div className="text-neon-aqua font-red-hat text-lg font-bold">
              {currentTime ? formatTime(currentTime) : '--:--:--'}
            </div>
            <button
              onClick={() => setIs24Hour(!is24Hour)}
              className="text-xs text-gray-500 hover:text-neon-blue transition-colors px-1 py-0.5 rounded border border-gray-600 hover:border-neon-blue"
              title={`Switch to ${is24Hour ? '12' : '24'}-hour format`}
            >
              {is24Hour ? '24H' : '12H'}
            </button>
          </div>
          <div className="text-gray-400 text-xs flex items-center gap-2">
            <span>{getMoonPhase()} {currentTime?.toLocaleDateString()}</span>
            {/* Today Button - only show when on SCHED section */}
            {activeSection === 'sched' && setSelectedDate && (
              <button
                onClick={handleTodayClick}
                className="px-2 py-0.5 text-xs bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple hover:text-neon-pink border border-neon-purple/50 hover:border-neon-pink/50 rounded transition-all duration-200"
                title="Go to today"
              >
                TODAY
              </button>
            )}
          </div>
        </div>

        {/* User Info and Logout */}
        {session && (
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-gray-300 text-sm font-medium">
                {session.user.name || session.user.email}
              </div>
              <div className="text-gray-500 text-xs">
                {session.user.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded border border-gray-600 hover:border-red-500 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
