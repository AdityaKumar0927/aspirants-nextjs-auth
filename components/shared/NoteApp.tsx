import React from "react";

const NotesApp: React.FC = () => {
  return (
    <div className="flex h-screen bg-white">
    {/* Left Sidebar */}
    <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <div className="p-4">
            <div className="relative">
                <input type="text" placeholder="Search anything..." className="w-full pl-8 pr-4 py-2 rounded-md bg-white border border-gray-300 text-sm" />
                <span className="absolute left-2 top-2.5 text-gray-400">
                    <i className="fas fa-search"></i>
                </span>
                <span className="absolute right-2 top-2.5 text-gray-400 text-xs">CTRL K</span>
            </div>
        </div>
        <nav className="mt-2">
            <a href="#" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><i className="fas fa-pencil-alt mr-3"></i>Daily notes</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><i className="far fa-sticky-note mr-3"></i>All notes</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><i className="fas fa-tasks mr-3"></i>Tasks</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"><i className="fas fa-map-marker-alt mr-3"></i>Map</a>
        </nav>
        <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pinned notes</h3>
            <div className="mt-2 space-y-2">
                <a href="#" className="block text-sm text-gray-600 hover:bg-gray-100 py-1">adwu jeanjgeal awdwalmk a</a>
                <a href="#" className="block text-sm text-gray-600 hover:bg-gray-100 py-1">How to use Reflect</a>
                <a href="#" className="block text-sm text-gray-600 hover:bg-gray-100 py-1">The power of Backlinks</a>
                <a href="#" className="block text-sm text-gray-600 hover:bg-gray-100 py-1">Saving websites</a>
                <a href="#" className="block text-sm text-gray-600 hover:bg-gray-100 py-1">Tips and tricks</a>
            </div>
        </div>
        <div className="mt-6 px-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account setup</h3>
            <div className="mt-2 space-y-2">
                <a href="#" className="flex items-center text-sm text-indigo-600 hover:bg-gray-100 py-1">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-2">1</span>
                    Create a backlink
                    <span className="text-xs text-gray-500 ml-2">See the power of your connected thoughts.</span>
                </a>
                <a href="#" className="flex items-center text-sm text-indigo-600 hover:bg-gray-100 py-1">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-2">2</span>
                    Save a link
                    <span className="text-xs text-gray-500 ml-2">Quickly bookmark websites and capture text.</span>
                </a>
                <a href="#" className="flex items-center text-sm text-indigo-600 hover:bg-gray-100 py-1">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-2">3</span>
                    Add a meeting
                    <span className="text-xs text-gray-500 ml-2">Retain notes from all your meetings.</span>
                </a>
            </div>
        </div>
    </div>

    {/* Main Content */}
    <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex-shrink-0 border-b border-gray-200">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center">
                    <input type="text" placeholder="Search..." className="w-64 px-3 py-1 text-sm border border-gray-300 rounded-md mr-4" />
                </div>
                <div className="flex items-center space-x-4">
                    <button className="text-gray-600 hover:text-gray-800"><i className="far fa-calendar-alt"></i> Schedule</button>
                    <button className="text-gray-600 hover:text-gray-800"><i className="far fa-check-square"></i> Convert to checklist (1)</button>
                    <button className="text-gray-600 hover:text-gray-800"><i className="fas fa-filter"></i> Task filters</button>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-700">⭐ Current</h2>
                    <button className="text-sm text-gray-600 hover:text-gray-800">+ Add</button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>📅</span>
                        <span>Sat, July 6th, 2024 →</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
  );
};

export default NotesApp;
