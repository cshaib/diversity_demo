import React, { useState } from 'react';
import { Upload, FileText, BarChart2 } from 'lucide-react';

const EnhancedNavTabs = ({ activeTab, setActiveTab, hasUploadedFile, handleTabClick }) => {
const [showFeedback, setShowFeedback] = useState(false);

const handleTabInteraction = (tabName) => {
    if (!hasUploadedFile && ['patterns', 'exact', 'metrics'].includes(tabName)) {
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
    return;
    }
    if (tabName === 'metrics') {
    handleTabClick(tabName);
    } else {
    setActiveTab(tabName);
    }
};

return (
    <div className="relative">
    {/* Feedback Toast */}
    <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
        {showFeedback && (
        <div className="bg-white border border-indigo-100 shadow-lg rounded-lg p-3 animate-fade-in">
            <p className="text-center text-gray-700">
            Please upload a file in the <span className="text-indigo-600">Upload Text</span> tab first
            </p>
        </div>
        )}
    </div>

    {/* Navigation Tabs */}
    <nav className="flex w-full" aria-label="Tabs">
        {/* README Tab */}
        <button
        onClick={() => handleTabInteraction('readme')}
        className={`${
            activeTab === 'readme'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } flex items-center justify-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex-1`}
        >
        <FileText className="w-5 h-5 mr-2" />
        README
        </button>

        {/* Grouped Tabs */}
        <div className="flex bg-grey-200/90 rounded-t-lg flex-[3]">
        <button
            onClick={() => handleTabInteraction('upload')}
            className={`${
            activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex items-center justify-center whitespace-nowrap py-4 px-4 border-b-2 font-medium text-lg flex-1`}
        >
            <Upload className="w-5 h-5 mr-2" />
            Upload Text
        </button>

        {['patterns', 'exact', 'metrics'].map((tabName) => (
            <button
            key={tabName}
            onClick={() => handleTabInteraction(tabName)}
            className={`
                flex items-center justify-center whitespace-nowrap py-4 px-4 border-b-2 font-medium text-lg flex-1
                ${!hasUploadedFile ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${activeTab === tabName
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent'}
                ${!hasUploadedFile 
                ? 'text-gray-300 hover:text-gray-400'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
            aria-disabled={!hasUploadedFile}
            title={!hasUploadedFile ? "Please upload a file in the Upload Text tab first" : ""}
            >
            {tabName === 'metrics' ? (
                <BarChart2 className="w-5 h-5 mr-2" />
            ) : (
                <FileText className="w-5 h-5 mr-2" />
            )}
            {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
            </button>
        ))}
        </div>

        {/* Template Matcher Tab
        <button
        onClick={() => handleTabInteraction('template-matcher')}
        className={`${
            activeTab === 'template-matcher'
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        } flex items-center justify-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg flex-1`}
        >
        <FileText className="w-5 h-5 mr-2" />
        Template Matcher
        </button> */}
    </nav>

    <style jsx>{`
        @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
        animation: fadeIn 0.3s ease-out;
        }
    `}</style>
    </div>
);
};

export default EnhancedNavTabs;