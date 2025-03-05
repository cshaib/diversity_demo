import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, CheckCircle, Info, X, ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { renderHighlightedText, ModelLegend, PatternsSidebar, TemplatePopover} from './TemplateMatcherComponents';
// import { TemplatePopover } from './TemplatePopover';

const TemplateMatcher = () => {
const [inputText, setInputText] = useState('');
const [analysis, setAnalysis] = useState(null);
const [loading, setLoading] = useState(false);
const [selectedPatterns, setSelectedPatterns] = useState(new Set());
const [openSections, setOpenSections] = useState({});
const [modelColors, setModelColors] = useState({});
const [activePopover, setActivePopover] = useState(null);
const [templatePatterns, setTemplatePatterns] = useState({});
const [error, setError] = useState(null);
const [fetchTimeout, setFetchTimeout] = useState(false);
const [showHelpModal, setShowHelpModal] = useState(false);
const textDisplayRef = useRef(null);

useEffect(() => {
    const fetchTemplatePatterns = async (retryCount = 0) => {
    try {
        setError(null); // Clear any previous errors
        
        const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze/template-names`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ text: "" })
        });
        
        if (!response.ok) {
        // If the response wasn't ok, try to get more error details
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Initialize with empty patterns if the response is empty
        if (!data.matches || !Array.isArray(data.matches)) {
        console.warn('No template patterns received from server');
        setTemplatePatterns({});
        return;
        }
        
        const patternCounts = {};
        data.matches.forEach(match => {
        if (!patternCounts[match.templateName]) {
            patternCounts[match.templateName] = new Set();
        }
        patternCounts[match.templateName].add(match.pattern);
        });

        const modelPatternCounts = Object.fromEntries(
        Object.entries(patternCounts).map(([model, patterns]) => [
            model,
            Array.from(patterns)
        ])
        );
        
        setTemplatePatterns(modelPatternCounts);
        setError(null); // Clear any errors if successful

    } catch (error) {
        console.error('Error fetching template patterns:', error);
        
        // If we haven't retried too many times, try again
        if (retryCount < 3) {
        console.log(`Retrying template patterns fetch (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchTemplatePatterns(retryCount + 1), 1000 * (retryCount + 1));
        return;
        }
        
        // If we've exhausted retries, set a user-friendly error
        setError('Unable to load template patterns. You can still analyze text, but pattern matching may be limited.');
        
        // Set empty template patterns to allow the app to function
        setTemplatePatterns({});
    }
    };

    fetchTemplatePatterns();
}, []);

// Update the analyzeText function with better error handling:
const analyzeText = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    setError(null); // Clear any previous errors
    
    try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze/template-names`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({ text: inputText })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Validate the response data
    if (!data.matches || !Array.isArray(data.matches)) {
        throw new Error('Invalid response format from server');
    }
    
    const normalizedMatches = data.matches
        .filter(match => match && typeof match === 'object') // Ensure match exists and is an object
        .map(match => ({
            ...match,
            text: match.text?.trim() || '',
            pattern: match.pattern?.trim() || '',
            templateName: match.templateName || 'unknown'
        }))
        .filter(match => match.text && match.pattern);
    
    // If we got no matches, still show the analysis but with empty results
    data.matches = normalizedMatches;
    setAnalysis(data);
    
    // Only set patterns if we got some
    if (normalizedMatches.length > 0) {
        setSelectedPatterns(new Set(normalizedMatches.map(match => match.pattern)));
        
        const initialOpenSections = {};
        normalizedMatches.forEach(match => {
        initialOpenSections[match.templateName] = true;
        });
        setOpenSections(initialOpenSections);
    } else {
        setSelectedPatterns(new Set());
        setOpenSections({});
    }

    } catch (error) {
    console.error('Error analyzing text:', error);
    setError('Unable to analyze text. Please try again in a moment.');
    // Clear any previous analysis
    setAnalysis(null);
    setSelectedPatterns(new Set());
    setOpenSections({});
    } finally {
    setLoading(false);
    }
};

useEffect(() => {
    const fetchModels = async () => {
    try {
        setError(null);
        setFetchTimeout(false);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
        controller.abort();
        setFetchTimeout(true);
        }, 30000);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/models`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
            'Accept': 'application/json'
        },
        signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        if (!data.models) {
        throw new Error('Invalid response format');
        }

        const colors = [
        'bg-red-400',
        'bg-emerald-400',
        'bg-blue-400',
        'bg-amber-400',
        'bg-purple-400',
        'bg-cyan-400',
        'bg-pink-400',
        'bg-teal-400',
        'bg-orange-400',
        'bg-indigo-400'
        ];

        const colorMap = {};
        data.models.forEach((model, index) => {
        colorMap[model] = colors[index % colors.length];
        });
        setModelColors(colorMap);

    } catch (error) {
        console.error('Error fetching models:', error);
        if (error.name === 'AbortError' || fetchTimeout) {
        setError('Request timed out. Please try again.');
        } else {
        setError(`Failed to load models: ${error.message}`);
        }
    }
    };

    fetchModels();
}, [fetchTimeout]);

// const analyzeText = async () => {
//     if (!inputText.trim()) return;
    
//     setLoading(true);
//     try {
//     const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze/template-names`, {
//         method: 'POST',
//         headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//         },
//         mode: 'cors',
//         credentials: 'omit',
//         body: JSON.stringify({ text: inputText })
//     });
    
//     if (!response.ok) throw new Error('Failed to analyze text');
//     const data = await response.json();
    
//     const normalizedMatches = data.matches.map(match => ({
//         ...match,
//         text: match.text.trim(),
//         pattern: match.pattern.trim()
//     })).filter(match => match.text && match.pattern);
    
//     data.matches = normalizedMatches;
//     setAnalysis(data);
//     setSelectedPatterns(new Set(normalizedMatches.map(match => match.pattern)));
    
//     const initialOpenSections = {};
//     normalizedMatches.forEach(match => {
//         initialOpenSections[match.templateName] = true;
//     });
//     setOpenSections(initialOpenSections);
//     } catch (error) {
//     console.error('Error analyzing text:', error);
//     setError('Failed to analyze text. Please try again.');
//     } finally {
//     setLoading(false);
//     }
// };

const handleTemplateClick = (event) => {
    const templateSpan = event.target.closest('[data-match]');
    if (!templateSpan) return;

    const matchData = JSON.parse(decodeURIComponent(templateSpan.dataset.match));
    const rect = templateSpan.getBoundingClientRect();
    
    if (activePopover && 
        JSON.stringify(activePopover.match) === JSON.stringify(matchData)) {
    setActivePopover(null);
    return;
    }

    setActivePopover({
    match: matchData,
    anchorRect: rect
    });
};

return (
    <div className="max-w-[1800px] mx-auto p-6 bg-gray-50 min-h-screen">
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Template Analysis</h2>
            <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full transition-colors"
            >
            <HelpCircle className="w-5 h-5" />
            </button>
        </div>

        <div className="space-y-4">
            <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter or paste your text here..."
            className="w-full h-48 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <div className="flex justify-between items-center">
            <button
                onClick={analyzeText}
                disabled={loading || !inputText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
                {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                </>
                ) : (
                'Analyze Text'
                )}
            </button>
            {inputText.trim() && (
                <button
                onClick={() => setInputText('')}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                >
                Clear text
                </button>
            )}
            </div>
        </div>
        </div>

        {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <div className="flex">
            <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
            </div>
            </div>
        </div>
        )}

        {analysis && (
        <div className="grid grid-cols-12 gap-6 p-6">
            {/* Left sidebar - Pattern controls */}
            <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Matched Patterns</h3>
                    <button
                    onClick={() => {
                        const allOpen = Object.keys(analysis.templateStats).every(
                        model => openSections[model]
                        );
                        setOpenSections(
                        Object.fromEntries(
                            Object.keys(analysis.templateStats).map(model => [model, !allOpen])
                        )
                        );
                    }}
                    className="p-1 hover:bg-gray-50 rounded transition-colors"
                    >
                    <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
                </div>

                <div className="divide-y divide-gray-100">
                {Object.entries(analysis.templateStats).map(([modelName, stats]) => (
                    <div key={modelName} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${modelColors[modelName]}`} />
                        <span className="font-medium text-gray-900">{modelName}</span>
                        </div>
                        <button
                        onClick={() =>
                            setOpenSections(prev => ({
                            ...prev,
                            [modelName]: !prev[modelName]
                            }))
                        }
                        className="p-1 hover:bg-gray-50 rounded transition-colors"
                        >
                        {openSections[modelName] ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        </button>
                    </div>

                    {openSections[modelName] && (
                        <div className="space-y-2 ml-4">
                        {Array.from(
                            new Set(
                            analysis.matches
                                .filter(m => m.templateName === modelName)
                                .map(m => m.pattern)
                            )
                        ).map(pattern => (
                            <div
                            key={pattern}
                            onClick={() => {
                                const newSelected = new Set(selectedPatterns);
                                if (newSelected.has(pattern)) {
                                newSelected.delete(pattern);
                                } else {
                                newSelected.add(pattern);
                                }
                                setSelectedPatterns(newSelected);
                            }}
                            className={`
                                flex items-center gap-2 p-2 rounded-md cursor-pointer
                                ${
                                selectedPatterns.has(pattern)
                                    ? 'bg-blue-50 ring-1 ring-blue-200'
                                    : 'hover:bg-gray-50'
                                }
                                transition-all duration-200
                            `}
                            >
                            <CheckCircle
                                className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${
                                selectedPatterns.has(pattern)
                                    ? 'text-blue-600'
                                    : 'text-gray-300'
                                }`}
                            />
                            <span className="text-sm text-gray-700 truncate" title={pattern}>
                                {pattern}
                            </span>
                            </div>
                        ))}
                        </div>
                    )}
                    </div>
                ))}
                </div>
            </div>
            </div>

            {/* Main content area */}
            <div className="col-span-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Analysis Results</h3>
                </div>
                <div
                ref={textDisplayRef}
                className="p-6 prose max-w-none"
                onClick={handleTemplateClick}
                dangerouslySetInnerHTML={{
                    __html: renderHighlightedText(
                    inputText,
                    analysis,
                    selectedPatterns,
                    modelColors
                    )
                }}
                />
            </div>
            </div>

            {/* Right sidebar - Coverage Information */}
            <div className="col-span-3">
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
                            text-xs font-medium px-2 py-1 rounded-full items-center
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
            </div>
        </div>
        )}
    </div>

    {/* Help Modal */}
    {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">How Template Analysis Works</h3>
            <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
            >
                <X className="w-5 h-5" />
            </button>
            </div>
            <div className="prose max-w-none">
            <p>
                This tool analyzes text for patterns commonly found in AI-generated content.
                Here's what the different components mean:
            </p>
            <ul>
                <li>
                <strong>Matched Patterns:</strong> Shows specific sentence structures and
                patterns found in your text
                </li>
                <li>
                <strong>Template Coverage:</strong> Indicates what percentage of known
                patterns from each model were found
                </li>
                <li>
                <strong>Highlighted Text:</strong> Click on highlighted portions to see
                which models commonly use that pattern
                </li>
            </ul>
            <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Finding matches doesn't automatically mean the text
                is AI-generated. This tool helps identify potential patterns but shouldn't
                be used as definitive proof.
                </p>
            </div>
            </div>
        </div>
        </div>
    )}

    {/* Template Popover */}
    {activePopover && (
        <TemplatePopover
        matches={activePopover.match}
        anchorRect={activePopover.anchorRect}
        onClose={() => setActivePopover(null)}
        modelColors={modelColors}
        />
    )}
    </div>
);
};

export default TemplateMatcher;