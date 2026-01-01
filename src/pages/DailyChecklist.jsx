import React, { useState } from 'react';
import { CheckSquare, Clock, RotateCcw } from 'lucide-react';

import Sidebar from '../partials/StockSidebar';
import Header from '../partials/Header';

function DailyChecklist() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initialChecklist = [
    {
      section: 'Morning Preparation (8:00 AM)',
      tasks: [
        { id: 1, text: 'Check overnight US & Asian markets', completed: false },
        { id: 2, text: 'Review pre-market news and announcements', completed: false },
        { id: 3, text: 'Update watchlist with stocks to monitor', completed: false },
        { id: 4, text: 'Set price alerts for key levels', completed: false }
      ]
    },
    {
      section: 'Pre-Market Window (8:30 AM)',
      tasks: [
        { id: 5, text: 'Check foreign market flows', completed: false },
        { id: 6, text: 'Review limit orders and adjust if needed', completed: false },
        { id: 7, text: 'Identify potential breakout/breakdown stocks', completed: false }
      ]
    },
    {
      section: 'Market Open (9:00 AM)',
      tasks: [
        { id: 8, text: 'Monitor opening price action', completed: false },
        { id: 9, text: 'Execute planned trades within first 30 min', completed: false },
        { id: 10, text: 'Set stop-loss for all positions', completed: false }
      ]
    },
    {
      section: 'End of Day Review (5:00 PM)',
      tasks: [
        { id: 11, text: 'Review all executed trades', completed: false },
        { id: 12, text: 'Update trading journal with lessons', completed: false },
        { id: 13, text: 'Plan for next trading day', completed: false },
        { id: 14, text: 'Check portfolio performance', completed: false }
      ]
    }
  ];

  const [checklist, setChecklist] = useState(initialChecklist);

  const toggleTask = (taskId) => {
    setChecklist(checklist.map(section => ({
      ...section,
      tasks: section.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    })));
  };

  const resetAll = () => {
    setChecklist(initialChecklist);
  };

  const totalTasks = checklist.reduce((sum, section) => sum + section.tasks.length, 0);
  const completedTasks = checklist.reduce(
    (sum, section) => sum + section.tasks.filter(t => t.completed).length,
    0
  );
  const progress = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

            {/* Header */}
            <div className="sm:flex sm:justify-between sm:items-center mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Daily Trading Checklist</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Stay disciplined with your trading routine</p>
              </div>

              <button
                onClick={resetAll}
                className="btn bg-gray-500 hover:bg-gray-600 text-white">
                <RotateCcw className="w-4 h-4 mr-2" />
                <span>Reset All</span>
              </button>
            </div>

            <div className="grid grid-cols-12 gap-6">

              {/* Main Checklist */}
              <div className="col-span-12 lg:col-span-8">

                {/* Progress Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Progress</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{completedTasks}/{totalTasks} ({progress}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                {/* Checklist Sections */}
                <div className="space-y-4">
                  {checklist.map((section, sectionIndex) => {
                    const sectionCompleted = section.tasks.filter(t => t.completed).length;
                    const sectionProgress = Math.round((sectionCompleted / section.tasks.length) * 100);

                    return (
                      <div key={sectionIndex} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-blue-500" />
                            {section.section}
                          </h3>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                            {sectionCompleted}/{section.tasks.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {section.tasks.map((task) => (
                            <label
                              key={task.id}
                              className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                                className="w-5 h-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                              />
                              <span className={`ml-3 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                {task.text}
                              </span>
                            </label>
                          ))}
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-4">
                          <div
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${sectionProgress}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Trading Rules Sidebar */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-sm text-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" />
                    Trading Rules
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Never risk more than 2% per trade</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Always use stop-loss orders</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Don't average down losing positions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Follow your trading plan strictly</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Keep emotions out of trading decisions</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Review and learn from every trade</span>
                    </li>
                  </ul>
                </div>

                {/* Statistics */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Today's Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{completedTasks}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Tasks Remaining</span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{totalTasks - completedTasks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

export default DailyChecklist;
