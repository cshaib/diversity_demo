import React from 'react';
import { Info } from 'lucide-react';

const CoverageSection = ({ analysis, templatePatterns, modelColors }) => {
return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900">Template Coverage</h3>
        <Info className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">
        Shows how many unique templates from each model were found in your text.
        </p>
    </div>

    <div className="grid grid-cols-1 gap-3 p-4">
        {Object.entries(analysis.templateStats)
        .filter(([modelName]) => modelColors[modelName])
        .map(([modelName, stats]) => (
            <div
            key={modelName}
            className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors p-3"
            >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${modelColors[modelName]}`} />
                <h4 className="font-medium text-gray-900 text-sm truncate">{modelName}</h4>
                </div>
                <span className={`
                text-xs font-medium px-2 py-1 rounded-full
                ${stats.percentage > 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}
                `}>
                {(stats.percentage * 100).toFixed(1)}% coverage
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Found {stats.count} unique templates</span>
                <span>out of {templatePatterns[modelName]?.length || 0}</span>
                </div>

                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${
                    stats.percentage > 0.5 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(stats.percentage * 100, 2)}%` }}
                />
                </div>
            </div>
            </div>
        ))}
    </div>
    </div>
);
};

export default CoverageSection;