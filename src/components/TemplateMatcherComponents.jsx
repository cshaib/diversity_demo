import React, { useRef, useEffect } from 'react';
import { X, CheckCircle, ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';

export const renderHighlightedText = (inputText, analysis, selectedPatterns, modelColors) => {
    if (!inputText || !analysis || !analysis.matches || !selectedPatterns) {
    return inputText || '';
    }
    
    // Helper function to escape regex special chars - robust implementation
    const escapeRegExp = (string) => {
        if (!string || typeof string !== 'string') return '';
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    // Ensure all matches have the required properties
    const validMatches = analysis.matches.filter(
    match => match && match.start != null && match.end != null && match.pattern
    );

    const positions = [];
    const matchesByPosition = new Map();

    const filteredMatches = validMatches.filter(match => 
    selectedPatterns.has(match.pattern) && 
    match.start >= 0 && 
    match.end <= inputText.length &&
    match.text.trim() && 
    match.pattern.trim()
    );

    filteredMatches.forEach(match => {
    const key = `${match.start}-${match.end}`;
    if (!matchesByPosition.has(key)) {
        matchesByPosition.set(key, []);
    }
    matchesByPosition.get(key).push(match);
    });

    matchesByPosition.forEach((matches, key) => {
    const [start, end] = key.split('-').map(Number);
    positions.push({
        index: start,
        type: 'start',
        matches
    });
    positions.push({
        index: end,
        type: 'end',
        matches
    });
    });

    positions.sort((a, b) => a.index - b.index);

    let result = '';
    let lastIndex = 0;

    positions.forEach(pos => {
    if (pos.index > lastIndex) {
        result += inputText.slice(lastIndex, pos.index);
    }

    if (pos.type === 'start') {
        const models = [...new Set(pos.matches.map(m => m.templateName))];
        const modelDots = models
        .map((model, idx) => `<span class="inline-block w-2.5 h-2.5 rounded-full ${modelColors[model]} border border-white ${idx > 0 ? 'ml-[-8px]' : ''}" style="z-index: ${100 - idx};"></span>`)
        .join('');

        result += `<span 
        class="bg-blue-100 cursor-pointer rounded px-1 py-0.5 transition-all group relative border-x-2 border-transparent hover:border-blue-500"
        data-match="${encodeURIComponent(JSON.stringify(pos.matches))}"
        data-pattern="${pos.matches[0].pattern}"
        >
        <span class="invisible group-hover:visible absolute -top-2 left-1/2 transform -translate-x-1/2 flex items-center gap-0.5 bg-white shadow-md border border-gray-200 rounded-full px-2 py-1 z-[100]">
            ${modelDots}
        </span>`;
    } else {
        result += '</span>';
    }

    lastIndex = pos.index;
    });

    if (lastIndex < inputText.length) {
    result += inputText.slice(lastIndex);
    }

    return result;
};

export const ModelLegend = ({ modelColors }) => {
if (!modelColors || Object.keys(modelColors).length === 0) return null;

return (
    <div className="bg-white rounded-lg shadow p-4">
    <h4 className="text-sm font-medium text-gray-900 mb-3">Model Legend</h4>
    <div className="space-y-2">
        {Object.entries(modelColors).map(([modelName, colorClass]) => (
        <div key={modelName} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${colorClass}`} />
            <span className="text-sm text-gray-600">{modelName}</span>
        </div>
        ))}
    </div>
    </div>
);
};

export const TemplatePopover = ({ matches, anchorRect, onClose, modelColors }) => {
const popoverRef = useRef(null);

useEffect(() => {
    if (!popoverRef.current || !anchorRect) return;

    const popover = popoverRef.current;
    const { top, bottom, left, right } = anchorRect;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const MARGIN = 16;

    let popoverTop = bottom + MARGIN;
    let popoverLeft = left;

    const popoverHeight = popover.offsetHeight;
    const popoverWidth = popover.offsetWidth;

    if (popoverTop + popoverHeight > viewportHeight - MARGIN) {
    popoverTop = top - popoverHeight - MARGIN;
    }

    if (popoverLeft + popoverWidth > viewportWidth - MARGIN) {
    popoverLeft = Math.max(MARGIN, right - popoverWidth);
    }

    popoverTop = Math.max(MARGIN, Math.min(popoverTop, viewportHeight - popoverHeight - MARGIN));
    popoverLeft = Math.max(MARGIN, Math.min(popoverLeft, viewportWidth - popoverWidth - MARGIN));

    popover.style.transition = 'top 0.2s ease-out, left 0.2s ease-out';
    popover.style.top = `${popoverTop}px`;
    popover.style.left = `${popoverLeft}px`;
}, [anchorRect]);

const groupedMatches = matches.reduce((acc, match) => {
    if (!acc[match.pattern]) {
    acc[match.pattern] = {
        pattern: match.pattern,
        text: match.text,
        models: new Set([match.templateName])
    };
    } else {
    acc[match.pattern].models.add(match.templateName);
    }
    return acc;
}, {});

return (
    <div
    ref={popoverRef}
    style={{ 
        position: 'fixed',
        zIndex: 50,
        width: '320px',
        transform: 'translate3d(0, 0, 0)'  
    }}
    className="bg-white rounded-lg shadow-lg border border-gray-200"
    onClick={(e) => e.stopPropagation()}
    >
    <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Template Details</h3>
        <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
        <X className="w-4 h-4" />
        </button>
    </div>

    <div className="p-4 space-y-4">
        {Object.values(groupedMatches).map((match, index) => (
        <div key={index} className="space-y-2">
            <div>
            <label className="block text-xs font-medium text-gray-500">Template Pattern</label>
            <div className="mt-1 text-sm text-gray-900">{match.pattern}</div>
            </div>

            <div>
            <label className="block text-xs font-medium text-gray-500">Matching Models</label>
            <div className="mt-1 flex flex-wrap gap-2">
                {Array.from(match.models).map((model, idx) => (
                <span 
                    key={idx} 
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                    <span className={`w-2 h-2 rounded-full ${modelColors[model]}`} />
                    {model}
                </span>
                ))}
            </div>
            </div>

            <div>
            <label className="block text-xs font-medium text-gray-500">Matched Text</label>
            <div className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded">{match.text}</div>
            </div>

            {index < Object.values(groupedMatches).length - 1 && (
            <div className="border-b border-gray-100 pt-2" />
            )}
        </div>
        ))}
    </div>
    </div>
);
};

export const PatternsSidebar = ({ 
analysis, 
selectedPatterns, 
setSelectedPatterns, 
openSections, 
setOpenSections,
modelColors 
}) => {
if (!analysis?.matches) return null;

const highlightAndScrollToPattern = (pattern) => {
    const elements = document.querySelectorAll(`[data-pattern="${pattern}"]`);
    
    elements.forEach(element => {
    element.classList.add('animate-highlight-pulse');
    
    if (element === elements[0]) {
        element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
        });
    }
    
    setTimeout(() => {
        element.classList.remove('animate-highlight-pulse');
    }, 2000);
    });
};

const patternsByModel = {};
analysis.matches.forEach(match => {
    if (!patternsByModel[match.templateName]) {
    patternsByModel[match.templateName] = new Set();
    }
    patternsByModel[match.templateName].add(match.pattern);
});

const togglePattern = (pattern) => {
    const newSelected = new Set(selectedPatterns);
    if (newSelected.has(pattern)) {
    newSelected.delete(pattern);
    } else {
    newSelected.add(pattern);
    highlightAndScrollToPattern(pattern);
    }
    setSelectedPatterns(newSelected);
};

const handleSelectAllForModel = (modelName, patterns) => {
    const newSelected = new Set(selectedPatterns);
    patterns.forEach(pattern => newSelected.add(pattern));
    setSelectedPatterns(newSelected);
};

const handleDeselectAllForModel = (modelName, patterns) => {
    const newSelected = new Set(selectedPatterns);
    patterns.forEach(pattern => newSelected.delete(pattern));
    setSelectedPatterns(newSelected);
};

const handleSelectUniqueForModel = (modelName, patterns) => {
    const newSelected = new Set(selectedPatterns);
    const uniquePatterns = new Set();
    
    patterns.forEach(pattern => {
    const modelsWithPattern = Object.entries(patternsByModel)
        .filter(([name, modelPatterns]) => modelPatterns.has(pattern));
    
    if (modelsWithPattern.length === 1 && modelsWithPattern[0][0] === modelName) {
        uniquePatterns.add(pattern);
    }
    });
    
    uniquePatterns.forEach(pattern => newSelected.add(pattern));
    setSelectedPatterns(newSelected);
    
    if (uniquePatterns.size > 0) {
    uniquePatterns.forEach(highlightAndScrollToPattern);
    }
};

return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[700px]">
    <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Matched Patterns</h3>
        <button
            onClick={() => {
            const allOpen = Object.keys(patternsByModel).every(model => openSections[model]);
            const newOpenSections = {};
            Object.keys(patternsByModel).forEach(model => {
                newOpenSections[model] = !allOpen;
            });
            setOpenSections(newOpenSections);
            }}
            className="p-1 hover:bg-gray-100 rounded"
        >
            <ChevronsUpDown className="w-4 h-4 text-gray-400" />
        </button>
        </div>
    </div>
    
    <div className="flex-1 overflow-auto px-4 py-2">
        <div className="space-y-1">
        {Object.entries(patternsByModel).map(([modelName, patterns]) => (
            <div key={modelName} className="border-b border-gray-100 last:border-b-0">
            <div className="mb-2">
                <div className="flex gap-2">
                <button
                    onClick={() => handleSelectAllForModel(modelName, patterns)}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-indigo-600 hover:bg-gray-50"
                >
                    Select All
                </button>
                <button
                    onClick={() => handleDeselectAllForModel(modelName, patterns)}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-indigo-600 hover:bg-gray-50"
                >
                    Clear
                </button>
                <button
                    onClick={() => handleSelectUniqueForModel(modelName, patterns)}
                    className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-emerald-600 hover:bg-gray-50"
                >
                    Unique
                </button>
                </div>
            </div>

            <div className="flex items-center justify-between p-2">
                <button
                onClick={() => setOpenSections(prev => ({
                    ...prev,
                    [modelName]: !prev[modelName]
                }))}
                className="flex items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors w-full text-left"
                >
                <div className={`w-3 h-3 rounded-full ${modelColors[modelName]}`} />
                <span className="font-medium text-gray-700">{modelName}</span>
                {openSections[modelName] ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                )}
                </button>
            </div>

            {openSections[modelName] && (
                <div className="ml-7 space-y-2">
                {Array.from(patterns).map(pattern => (
                    <div 
                    key={pattern}
                    className={`
                        flex items-center space-x-2 p-2 
                        ${selectedPatterns.has(pattern) 
                        ? 'bg-gray-50 ring-1 ring-indigo-200' 
                        : 'hover:bg-gray-50'
                        } 
                        rounded-md cursor-pointer transition-all duration-200
                    `}
                    onClick={() => togglePattern(pattern)}
                    >
                    <CheckCircle 
                        className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                        selectedPatterns.has(pattern) 
                            ? 'text-indigo-600' 
                            : 'text-gray-300'
                        }`}
                    />
                    <div className="flex-1 text-sm text-gray-700">{pattern}</div>
                    </div>
                ))}
                </div>
            )}
            </div>
        ))}
        </div>
    </div>
    </div>
);
};