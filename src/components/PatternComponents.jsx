import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Pattern highlight component
export const PatternHighlight = ({ match, isHighlighted, onClick, colorClass }) => {
return (
    <span 
    className={`
        cursor-pointer rounded px-1 py-0.5 transition-all
        ${colorClass} 
        ${isHighlighted ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}
        hover:opacity-90
    `}
    onClick={(e) => {
        e.stopPropagation();
        onClick(match, e.target.getBoundingClientRect());
    }}
    >
    {match.text}
    <span className="inline-flex items-center ml-1 text-xs font-medium text-gray-500 bg-white/50 px-1 rounded">
        {match.length}g
    </span>
    </span>
);
};

// Collapsible section component for the sidebar
export const CollapsibleSection = ({ title, children, isOpen, onToggle, colorClass }) => {
return (
    <div className="border-b border-gray-100 last:border-b-0">
    <button
        onClick={onToggle}
        className="w-full px-2 py-3 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
    >
        <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
        <span className="font-medium text-gray-700">{title}</span>
        </div>
        {isOpen ? (
        <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
    </button>
    {isOpen && (
        <div className="px-2 pb-3">
        {children}
        </div>
    )}
    </div>
);
};

// Statistics card component
export const StatisticsCard = ({ modelName, stats, colorClass }) => {
const coverage = (stats.percentage * 100).toFixed(1);
const isHighCoverage = coverage > 50;

return (
    <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center justify-between mb-2">
        <h4 className="text-lg font-medium text-gray-900 capitalize">
        {modelName}
        </h4>
        <div className={`w-3 h-3 rounded-full ${colorClass?.replace('hover:', '')}`} />
    </div>
    <div className="space-y-2">
        <p className="text-sm text-gray-500">
        {stats.count} template matches found
        </p>
        <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
            <div>
            <span className={`
                text-xs font-semibold inline-block py-1 px-2 rounded 
                ${isHighCoverage ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}
            `}>
                {coverage}% coverage
            </span>
            </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
            <div 
            style={{ width: `${coverage}%` }}
            className={`
                shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center 
                ${isHighCoverage ? 'bg-yellow-500' : 'bg-blue-500'}
            `}
            />
        </div>
        </div>
    </div>
    </div>
);
};