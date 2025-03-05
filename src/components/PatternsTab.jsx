import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle, Sliders } from 'lucide-react';
import POSTagLegend from './POSTagLegend'; 

/**
 * PatternsTab Component
 * Analyzes and displays text patterns between one or two documents
 * 
 * @param {File} file - Primary document to analyze
 * @param {File} file2 - Optional secondary document for comparison
 * @param {string} activeTab - Current active tab in the parent component
 */
const PatternsTab = ({ file, file2, activeTab }) => {
//====================================================================
// UTILITY FUNCTIONS
//====================================================================

/**
 * Escapes special characters in a string for use in a regular expression
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
const escapeRegExp = (string) => {
    if (!string || typeof string !== 'string') return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Normalize tokenized text from backend format to frontend format
 * Handles spacing around punctuation and other special characters
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
const normalizeTokenizedText = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    return text
    // Remove space before punctuation
    .replace(/\s+([,.;:!?)\]}])/g, '$1')
    // Add space after punctuation if not followed by space already
    .replace(/([,.;:!?([{])(?!\s)/g, '$1 ')
    // Remove duplicate spaces
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Find text occurrences with flexible spacing around punctuation
 * @param {string} sourceText - Text to search in
 * @param {string} searchText - Text to search for
 * @returns {Array} Array of match objects with start and end positions
 */
const findTextWithVariableSpacing = (sourceText, searchText) => {
    if (!sourceText || !searchText) return [];
    
    const matches = [];
    
    // Option 1: Try exact match first
    let exactIndex = sourceText.indexOf(searchText);
    if (exactIndex !== -1) {
    matches.push({
        start: exactIndex,
        end: exactIndex + searchText.length,
        match: searchText
    });
    return matches;
    }
    
    // Option 2: Try normalized version
    const normalizedSearch = normalizeTokenizedText(searchText);
    let normalizedIndex = sourceText.indexOf(normalizedSearch);
    if (normalizedIndex !== -1) {
    matches.push({
        start: normalizedIndex,
        end: normalizedIndex + normalizedSearch.length,
        match: normalizedSearch
    });
    return matches;
    }
    
    // Option 3: Try word-based matching (more flexible)
    try {
    // Extract words from search text (ignore punctuation)
    const searchWords = searchText.split(/\s+/).filter(w => 
        w && !/^[,.;:!?()\[\]{}]$/.test(w)
    );
    
    if (searchWords.length > 0) {
        // Search for the first word
        let wordIndex = 0;
        while ((wordIndex = sourceText.indexOf(searchWords[0], wordIndex)) !== -1) {
        // Try to match following words
        let matched = true;
        let currentPos = wordIndex;
        
        for (let i = 1; i < searchWords.length; i++) {
            const nextWordPos = sourceText.indexOf(searchWords[i], currentPos + searchWords[i-1].length);
            
            // If the next word isn't found or is too far away, this isn't a match
            if (nextWordPos === -1 || nextWordPos - currentPos > 15) {
            matched = false;
            break;
            }
            
            currentPos = nextWordPos;
        }
        
        if (matched) {
            // Calculate the end position (approximately)
            const endPos = currentPos + searchWords[searchWords.length - 1].length;
            
            matches.push({
            start: wordIndex,
            end: endPos,
            match: sourceText.substring(wordIndex, endPos)
            });
        }
        
        wordIndex += 1; // Move past this occurrence
        }
    }
    } catch (error) {
    console.error("Error in word-based matching:", error);
    }
    
    return matches;
};

/**
 * Persists pattern data to sessionStorage with improved metadata
 * @param {string} cacheKey - Key for identifying the cached data
 * @param {Object} data - Pattern data to cache
 * @param {string} samplingMode - Current sampling mode used
 */
const persistPatternData = (cacheKey, data, samplingMode) => {
    try {
    // Store additional metadata for better persistence
    const persistableData = {
        key: cacheKey,
        timestamp: Date.now(),
        samplingMode,
        documentCount: documentCount,
        patternCount: Object.keys(data.patterns || {}).length,
        patterns: data.patterns,
        pattern_presence: data.pattern_presence,
        matches: data.matches // Store the complete matches data
    };
    
    // Use sessionStorage instead of localStorage to persist during the session
    // but clear when the browser is closed
    sessionStorage.setItem(`pattern_data_${cacheKey}`, JSON.stringify(persistableData));
    
    // Update the list of loaded lengths
    setLoadedLengths(prev => new Set([...prev, parseInt(cacheKey.split('-')[0])]));
    
    console.log(`Cached data for ${cacheKey} with ${persistableData.patternCount} patterns`);
    } catch (error) {
    console.error('Error persisting pattern data:', error);
    }
};

/**
 * Retrieves cached pattern data from sessionStorage
 * @param {string} cacheKey - Key for identifying the cached data
 * @returns {Object|null} Retrieved pattern data or null if not found
 */
const retrievePatternData = (cacheKey) => {
    try {
    const storedData = sessionStorage.getItem(`pattern_data_${cacheKey}`);
    if (!storedData) return null;
    
    const parsedData = JSON.parse(storedData);
    
    // Check if data is for the current document set
    // This ensures we don't use cached data for different documents
    if (parsedData.documentCount !== documentCount) {
        console.log('Cached data is for a different document set, ignoring');
        sessionStorage.removeItem(`pattern_data_${cacheKey}`);
        return null;
    }
    
    // Check if data is recent enough (less than 1 hour old)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - parsedData.timestamp > ONE_HOUR) {
        console.log('Cached data is too old, removing');
        sessionStorage.removeItem(`pattern_data_${cacheKey}`);
        return null;
    }
    
    return parsedData;
    } catch (error) {
    console.error('Error retrieving pattern data:', error);
    return null;
    }
};
//====================================================================
// STATE MANAGEMENT
//====================================================================

// Core state management
const [matchMode] = useState('pos'); // 'pos' or 'exact'
const [patterns, setPatterns] = useState({}); // Stores pattern analysis results
const [patternPresence, setPatternPresence] = useState({}); // Tracks which patterns appear in which documents
const [matches, setMatches] = useState({ doc1: [], doc2: [] }); // Pattern matches for each document
const [selectedPatterns, setSelectedPatterns] = useState(new Set()); // Currently selected patterns for highlighting

// UI state management
const [loading, setLoading] = useState(false);
const [patternLength, setPatternLength] = useState(4); // Length of patterns to analyze
const [filterMode, setFilterMode] = useState('all'); // Filter mode for pattern display
const [patternColors, setPatternColors] = useState({}); // Color assignments for patterns

// Hybrid demand-loading states
const [patternCache, setPatternCache] = useState({}); // Caches analysis results by pattern length
const [loadedLengths, setLoadedLengths] = useState(new Set()); // Tracks which pattern lengths are loaded

// Sampling states
const [samplingMode, setSamplingMode] = useState('random200'); // Sampling mode for large datasets
const [documentCount, setDocumentCount] = useState(0); // Number of documents in the file
const [samplingEnabled, setSamplingEnabled] = useState(false); // Whether sampling is enabled
const [showSamplingModal, setShowSamplingModal] = useState(false); // Whether to show sampling modal
const [analysisInitiated, setAnalysisInitiated] = useState(false); // Whether user has initiated analysis

// Refs for managing async operations
const isLoadingRef = useRef(false);
const isMountedRef = useRef(true);
const abortControllerRef = useRef(null);

const [activeLoading, setActiveLoading] = useState(null); // Track which pattern length is actively loading

// Colour classes for pattern highlighting
const colorClasses = [
    'bg-red-300/90 hover:bg-red-300',         
    'bg-orange-400/90 hover:bg-orange-400',   
    'bg-amber-300/90 hover:bg-amber-300', 
    'bg-yellow-200/90 hover:bg-yellow-200',  
    'bg-rose-400/90 hover:bg-rose-400',      
    'bg-blue-400/90 hover:bg-blue-400',      
    'bg-sky-300/90 hover:bg-sky-300',        
    'bg-teal-300/90 hover:bg-teal-300',     
    'bg-emerald-400/90 hover:bg-emerald-400', 
    'bg-green-300/90 hover:bg-green-300',  
    'bg-lime-300/90 hover:bg-lime-300',      
    'bg-stone-300/90 hover:bg-stone-300',     
    'bg-amber-200/90 hover:bg-amber-200',   
    'bg-purple-400/90 hover:bg-purple-400',   
    'bg-fuchsia-300/90 hover:bg-fuchsia-300',
    'bg-violet-400/90 hover:bg-violet-400',  
    'bg-pink-300/90 hover:bg-pink-300',      
    'bg-slate-400/90 hover:bg-slate-400',    
];

//====================================================================
// PATTERN ANALYSIS LOGIC
//====================================================================

/**
 * Analyzes patterns in text for a specific length with sampling support
 * @param {number} length - Length of patterns to analyze
 * @returns {Promise<Object|null>} Pattern data or null on error
 */
const analyzePatternLength = async (length) => {
    if (!file) return null;
    
    // Create a new abort controller for this specific request
    if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pattern_length', length.toString());
    formData.append('match_mode', matchMode);
    
    // Add sampling parameter based on user selection
    formData.append('sampling_mode', samplingMode);
    
    if (file2) {
        formData.append('file2', file2);
    }

    console.log(`Analyzing patterns for length ${length} with sampling mode: ${samplingMode}`);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze/patterns`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
        'Accept': 'application/json',
        },
        signal: abortControllerRef.current.signal
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    
    if (responseData.wasSampled) {
        setSamplingEnabled(true);
        console.log(`Server used sampling: ${responseData.samplingInfo}`);
    }
    
    // Log the response data structure for debugging
    console.log("API Response Structure:", {
        hasPatterns: !!responseData.patterns,
        patternCount: Object.keys(responseData.patterns || {}).length,
        hasMatches: !!responseData.matches,
        doc1Count: responseData.matches?.doc1?.length || 0,
        doc2Count: responseData.matches?.doc2?.length || 0
    });
    
    // Only process results if component is still mounted
    if (!isMountedRef.current) {
        console.log('Component unmounted, discarding results');
        return null;
    }
    
    // Update loaded lengths to track what's been loaded
    setLoadedLengths(prev => new Set([...prev, length]));
    
    return responseData;
    } catch (error) {
    if (error.name === 'AbortError') {
        console.log('Pattern analysis request was aborted');
        return null;
    }
    console.error('Pattern analysis error:', error);
    throw error;
    }
};

/**
 * Initiates analysis with user-selected sampling options
 */
const initiateAnalysis = () => {
    if (isLoadingRef.current || !file) return;
    
    // Mark analysis as initiated to prevent showing the modal again
    setAnalysisInitiated(true);
    
    // Close the sampling modal
    setShowSamplingModal(false);
    
    // Load the initial pattern length
    const initialLength = 4;
    const initialCacheKey = `${initialLength}-${matchMode}`;
    
    // Clear any previous results
    setPatternCache({});
    setLoadedLengths(new Set());
    
    // Start the loading process
    setLoading(true);
    isLoadingRef.current = true;
    
    // Perform the analysis
    analyzePatternLength(initialLength)
    .then(data => {
        if (data) {
        // Update in-memory cache
        setPatternCache(prev => ({ ...prev, [initialCacheKey]: data }));
        
        // Update state
        setPatterns(data.patterns);
        setPatternPresence(data.pattern_presence);
        setMatches(data.matches);
        
        // Persist data
        persistPatternData(initialCacheKey, data, samplingMode);
        }
    })
    .catch(error => {
        if (error.name !== 'AbortError') {
        console.error(`Error analyzing patterns for length ${initialLength}:`, error);
        }
    })
    .finally(() => {
        setLoading(false);
        isLoadingRef.current = false;
    });
};

/**
 * Handles pattern length change with on-demand loading
 * @param {number} length - New pattern length to analyze
 */
const handlePatternLengthChange = (length) => {
    // If already loading, ignore the request
    if (loading) {
    console.log('Ignoring pattern length change while loading');
    return;
    }
    
    // Update pattern length state
    setPatternLength(length);
    
    // Create cache key
    const cacheKey = `${length}-${matchMode}`;
    
    // Check if we already have this data cached in memory
    if (patternCache[cacheKey]) {
    console.log(`Using in-memory cached data for length ${length}`);
    const cachedData = patternCache[cacheKey];
    setPatterns(cachedData.patterns);
    setPatternPresence(cachedData.pattern_presence);
    setMatches(cachedData.matches);
    return;
    }
    
    // If not in memory, check sessionStorage
    const persistedData = retrievePatternData(cacheKey);
    if (persistedData) {
    console.log(`Using persisted data for length ${length}`);
    setPatternCache(prev => ({ ...prev, [cacheKey]: persistedData }));
    setPatterns(persistedData.patterns);
    setPatternPresence(persistedData.pattern_presence);
    setMatches(persistedData.matches);
    return;
    }
    
    // If not found in cache or storage, load from API
    setLoading(true);
    
    analyzePatternLength(length)
    .then(data => {
        if (data) {
        // Update in-memory cache
        setPatternCache(prev => ({ ...prev, [cacheKey]: data }));
        
        // Update state
        setPatterns(data.patterns);
        setPatternPresence(data.pattern_presence);
        setMatches(data.matches);
        
        // Persist data
        persistPatternData(cacheKey, data, samplingMode);
        }
    })
    .catch(error => {
        if (error.name !== 'AbortError') {
        console.error(`Error analyzing patterns for length ${length}:`, error);
        }
    })
    .finally(() => {
        setLoading(false);
    });
};

/**
 * Toggle pattern selection
 * @param {string} pattern - Pattern to toggle
 */
const togglePattern = (pattern) => {
    const newSelected = new Set(selectedPatterns);
    if (newSelected.has(pattern)) {
    newSelected.delete(pattern);
    } else {
    newSelected.add(pattern);
    }
    setSelectedPatterns(newSelected);
};

//====================================================================
// PROCESSED PATTERNS (DERIVED STATE)
//====================================================================

/**
 * Process and filter patterns based on current filter mode and frequency
 * This is a memoized value that recomputes when dependencies change
 */
const processedPatterns = useMemo(() => {
    const filtered = {};
    const frequencies = {};

    Object.entries(patterns).forEach(([pattern, examples]) => {
    const info = patternPresence[pattern];
    if (!info) return;

    const doc1Freq = matches.doc1.reduce((count, match) => {
        return count + (match.matches?.filter(([p]) => p === pattern).length || 0);
    }, 0);

    const doc2Freq = matches.doc2.reduce((count, match) => {
        return count + (match.matches?.filter(([p]) => p === pattern).length || 0);
    }, 0);

    const totalFreq = doc1Freq + doc2Freq;
    
    if (totalFreq === 0) return;

    // Apply filter based on mode
    switch (filterMode) {
        case 'doc1':
        if (info.doc1 && !info.doc2) {
            filtered[pattern] = examples;
            frequencies[pattern] = doc1Freq;
        }
        break;
        case 'doc2':
        if (!info.doc1 && info.doc2) {
            filtered[pattern] = examples;
            frequencies[pattern] = doc2Freq;
        }
        break;
        case 'common':
        if (info.doc1 && info.doc2) {
            filtered[pattern] = examples;
            frequencies[pattern] = totalFreq;
        }
        break;
        default:
        filtered[pattern] = examples;
        frequencies[pattern] = totalFreq;
    }
    });

    // Sort patterns by frequency
    const sortedEntries = Object.entries(filtered)
    .sort(([patternA], [patternB]) => frequencies[patternB] - frequencies[patternA]);

    const sortedPatterns = {};
    sortedEntries.forEach(([pattern, examples]) => {
    sortedPatterns[pattern] = examples;
    });

    return {
    patterns: sortedPatterns,
    frequencies
    };
}, [patterns, patternPresence, filterMode, matches]);

//====================================================================
// EFFECTS
//====================================================================

// Effect for cleaning up on unmount and initializing on mount
useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
    isMountedRef.current = false;
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('Aborting ongoing pattern analysis requests');
    }
    };
}, []);

// Effect for handling tab switch
useEffect(() => {
    // Check if this is the patterns tab
    const isPatternsTabActive = activeTab === 'patterns';
    
    if (isPatternsTabActive) {
    // Tab is active, resume normal operations
    isMountedRef.current = true;
    } else {
    // Tab is not active, abort any ongoing requests
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('Aborting pattern analysis - tab switched');
    }
    }
}, [activeTab]);

// Initialize selected patterns when pattern length changes
useEffect(() => {
    const patternsList = Object.keys(processedPatterns.patterns);
    if (patternsList.length > 0) {
    setSelectedPatterns(new Set([patternsList[0]]));
    }
}, [patterns, patternLength]);

// Assign colours to patterns
useEffect(() => {
    const newPatternColors = {};
    Object.keys(processedPatterns.patterns).forEach((pattern, index) => {
    newPatternColors[pattern] = colorClasses[index % colorClasses.length];
    });
    setPatternColors(newPatternColors);
}, [processedPatterns.patterns]);

// Detect file size and document count when file changes
useEffect(() => {
    const countDocuments = async () => {
    if (!file) return;
    
    try {
        // Read file content
        const text = await file.text();
        
        // Count number of documents (lines)
        const lines = text.split('\n').filter(line => line.trim());
        const count = lines.length;
        
        // Update state
        setDocumentCount(count);
        
        // Reset analysis initiated flag for new file
        setAnalysisInitiated(false);
        
        // Show sampling modal for large datasets
        if (count > 100) {
        console.log(`Large dataset detected: ${count} documents`);
        setSamplingEnabled(true);
        // Default to random sampling for large datasets
        setSamplingMode('random200');
        // Show the sampling modal
        setShowSamplingModal(true);
        } else {
        // For small datasets, don't show modal and use full processing
        setSamplingEnabled(false);
        setSamplingMode('full');
        // Auto-initiate analysis for small files
        setAnalysisInitiated(true);
        initiateAnalysis();
        }
    } catch (error) {
        console.error('Error counting documents:', error);
    }
    };
    
    countDocuments();
    
    // Clear loaded lengths when file changes
    setLoadedLengths(new Set());
    
    // Clear pattern cache when file changes
    setPatternCache({});
    
    // Clear session storage for previous files
    Object.keys(sessionStorage)
    .filter(key => key.startsWith('pattern_data_'))
    .forEach(key => sessionStorage.removeItem(key));
    
}, [file]);

//====================================================================
// UI COMPONENTS
//====================================================================

/**
 * Loading spinner component
 */
const LoadingSpinner = () => (
    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50 rounded-lg">
    <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Analyzing patterns...</span>
    </div>
    </div>
);

/**
 * Enhanced Pattern length selection button with explicit status indicators
 * @param {Object} props - Component props
 * @param {number} props.length - Pattern length this button represents
 */
/**
 * Enhanced Pattern length selection button with clear visual indicators for loading state
 * @param {Object} props - Component props
 * @param {number} props.length - Pattern length this button represents
 */
const PatternLengthButton = ({ length }) => {
    const isLoading = loading && patternLength === length;
    const isActive = patternLength === length;
    const isLoaded = loadedLengths.has(length);
    
    // Button base styling
    let buttonClasses = "relative flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors";
    
    // Button state-specific styling
    if (isActive) {
      // Currently selected and viewing
      buttonClasses += " bg-indigo-600 text-white shadow-sm";
    } else if (isLoaded) {
      // Data is loaded but not currently viewing
      buttonClasses += " bg-white text-gray-700 border border-blue-200 hover:bg-blue-50";
    } else if (loading && !isLoaded) {
      // Not loaded and global loading state is active
      buttonClasses += " bg-white text-gray-400 border border-gray-200";
    } else {
      // Not loaded, normal state
      buttonClasses += " bg-white text-gray-500 border border-gray-200 hover:border-gray-300";
    }
    
    return (
        <button
            onClick={() => handlePatternLengthChange(length)}
            disabled={loading && !isLoaded}
            className={buttonClasses}
            title={isActive ? "Currently viewing" : 
                  isLoaded ? "View loaded patterns" : 
                  loading ? "Please wait" : "Load this pattern length"}
        >
            {length}
            
            {/* Status indicators - Using more distinctive and intuitive icons */}
            {isLoaded && !isActive && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            
            {isActive && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 border border-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            
            {isLoading && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </button>
    );
};

/**
 * Pattern filter buttons component
 * Only shown when a comparison file is available
 */
const PatternFilterButtons = () => {
    if (!file2) return null;

    const buttons = [
    { mode: 'all', label: 'All Patterns' },
    { mode: 'doc1', label: 'Only in Doc 1' },
    { mode: 'doc2', label: 'Only in Doc 2' },
    { mode: 'common', label: 'Common Patterns' }
    ];

    return (
    <div className="flex flex-wrap gap-2 mb-4">
        {buttons.map(({ mode, label }) => (
        <button
            key={mode}
            onClick={() => setFilterMode(mode)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${filterMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
            disabled={!analysisInitiated}
        >
            {label}
        </button>
        ))}
    </div>
    );
};

/**
 * Simple file info component
 */
/**
 * Improved file info header component
 * More compact, better visual hierarchy, and cleaner design
 */
/**
 * Improved file info header component
 * More compact, better visual hierarchy, and cleaner design
 */
const FileInfoHeader = () => {
    if (!file) return null;
    
    return (
    <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Main header with file info */}
        <div className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <div className="mr-4 p-2 bg-indigo-50 rounded-lg">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            </div>
            <div>
            <h2 className="text-lg font-semibold text-gray-900">{file.name}</h2>
            <div className="flex items-center mt-0.5">
                <span className="text-sm text-gray-500">{documentCount} documents</span>
                {file2 && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                    comparing with {file2.name}
                </span>
                )}
            </div>
            </div>
        </div>
        
        <div className="flex items-center space-x-3">
            {samplingEnabled && analysisInitiated && (
            <div className="flex items-center rounded-full bg-blue-50 px-3 py-1.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span className="text-sm text-blue-700 font-medium">
                {samplingMode === 'full' ? 'All documents' : 
                samplingMode === 'first100' ? 'First 100 docs' : 
                'Random 200 docs'}
                </span>
            </div>
            )}
            
            {analysisInitiated && (
            <button
                onClick={() => setShowSamplingModal(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 px-3 py-1.5 border border-indigo-200 rounded-md hover:bg-indigo-50"
            >
                Change sampling
            </button>
            )}
        </div>
        </div>
        
        {/* Pattern length selection in a clean, compact bar */}
        {analysisInitiated && (
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center">
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
            <div className="flex items-center flex-wrap">
                <div className="flex-shrink-0 mr-4">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Sliders className="w-4 h-4 text-gray-500 mr-1.5" />
                    Pattern Length:
                </span>
                </div>
                
                <div className="flex items-center gap-2 flex-grow overflow-x-auto py-1">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((length) => (
                    <PatternLengthButton key={length} length={length} />
                ))}
                </div>
                
                {/* Legend for status indicators */}
                <div className="flex items-center gap-3 ml-4 text-xs text-gray-500 flex-shrink-0">
                    <div className="flex items-center">
                        <div className="w-3.5 h-3.5 bg-indigo-500 border border-indigo-600 rounded-full flex items-center justify-center mr-1">
                            <svg className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span>Selected</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3.5 h-3.5 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center mr-1">
                            <svg className="w-2 h-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span>Loaded</span>
                    </div>
                </div>
            </div>
            </div>
            
            <div className="flex-grow"></div>
            
            <div className="flex-shrink-0 ml-4">
            {loading ? (
                <div className="flex items-center text-gray-500 text-sm">
                <div className="animate-spin w-3 h-3 border border-gray-500 border-t-transparent rounded-full mr-1.5"></div>
                Processing...
                </div>
            ) : (
                <div className="text-xs text-gray-500">
                {Object.keys(processedPatterns.patterns).length > 0 ? 
                    `${Object.keys(processedPatterns.patterns).length} patterns found` : 
                    'Select a pattern length'}
                </div>
            )}
            </div>
        </div>
        )}
    </div>
    );
};

/**
 * Sampling Modal Component
 * Shows options for sampling large datasets
 */
const SamplingModal = () => {
    if (!showSamplingModal) return null;
    
    // Local state for the modal
    const [localSamplingMode, setLocalSamplingMode] = useState(samplingMode);
    
    // Estimate processing time based on document count and sampling mode
    const getEstimatedTime = (mode) => {
    let baseCount;
    
    switch (mode) {
        case 'first100':
        baseCount = Math.min(100, documentCount);
        break;
        case 'random200':
        baseCount = Math.min(200, documentCount);
        break;
        case 'full':
        baseCount = documentCount;
        break;
        default:
        baseCount = documentCount;
    }
    
    // Rough estimate: 1 second per 10 documents
    const estimatedSeconds = Math.round(baseCount / 10);
    
    if (estimatedSeconds < 60) {
        return `~${estimatedSeconds} seconds`;
    } else {
        return `~${Math.round(estimatedSeconds / 60)} minutes`;
    }
    };
    
    // Apply selected sampling mode and start analysis
    const applyAndAnalyze = () => {
    // Update the global sampling mode
    setSamplingMode(localSamplingMode);
    
    // Close the modal
    setShowSamplingModal(false);
    
    // Reset loaded lengths to force reloading with new sampling mode
    setLoadedLengths(new Set());
    
    // Clear pattern cache
    setPatternCache({});
    
    // Trigger analysis with the new sampling mode
    initiateAnalysis();
    };
    
    return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-indigo-600 text-white px-6 py-4">
            <h2 className="text-xl font-semibold">Configure Dataset Analysis</h2>
            <p className="mt-1 text-indigo-100 text-sm">
            {documentCount} documents detected in {file.name}
            </p>
        </div>
        
        <div className="p-6">
            <div className="mb-6">
            <p className="text-gray-700">
                Large datasets may take longer to process or may time out. Choose a sampling strategy to balance speed and detection:
            </p>
            </div>
            
            <div className="space-y-4">
            {/* Sampling options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* First 100 option */}
                <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    localSamplingMode === 'first100' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setLocalSamplingMode('first100')}
                >
                <div className="flex items-start">
                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex-shrink-0 ${
                    localSamplingMode === 'first100' 
                        ? 'border-indigo-600 bg-indigo-600' 
                        : 'border-gray-300'
                    }`}>
                    {localSamplingMode === 'first100' && (
                        <div className="h-2 w-2 m-auto rounded-full bg-white"></div>
                    )}
                    </div>
                    <div className="ml-2">
                    <div className="font-medium text-gray-800">First 100 documents</div>
                    <div className="text-xs text-gray-500 mt-1">Fastest option, but may not be representative</div>
                    <div className="text-xs font-medium text-indigo-600 mt-3">
                        {getEstimatedTime('first100')}
                    </div>
                    </div>
                </div>
                </div>
                
                {/* Random 200 option */}
                <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    localSamplingMode === 'random200' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setLocalSamplingMode('random200')}
                >
                <div className="flex items-start">
                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex-shrink-0 ${
                    localSamplingMode === 'random200' 
                        ? 'border-indigo-600 bg-indigo-600' 
                        : 'border-gray-300'
                    }`}>
                    {localSamplingMode === 'random200' && (
                        <div className="h-2 w-2 m-auto rounded-full bg-white"></div>
                    )}
                    </div>
                    <div className="ml-2">
                    <div className="font-medium text-gray-800">Random 200 documents</div>
                    <div className="text-xs text-gray-500 mt-1">Recommended: Good balance of speed and coverage</div>
                    <div className="text-xs font-medium text-indigo-600 mt-3">
                        {getEstimatedTime('random200')}
                    </div>
                    </div>
                </div>
                </div>
                
                {/* Full dataset option */}
                <div 
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    localSamplingMode === 'full' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setLocalSamplingMode('full')}
                >
                <div className="flex items-start">
                    <div className={`mt-0.5 h-4 w-4 rounded-full border flex-shrink-0 ${
                    localSamplingMode === 'full' 
                        ? 'border-indigo-600 bg-indigo-600' 
                        : 'border-gray-300'
                    }`}>
                    {localSamplingMode === 'full' && (
                        <div className="h-2 w-2 m-auto rounded-full bg-white"></div>
                    )}
                    </div>
                    <div className="ml-2">
                    <div className="font-medium text-gray-800">Full dataset</div>
                    <div className="text-xs text-gray-500 mt-1">Complete analysis but may be slow with large datasets</div>
                    <div className="text-xs font-medium text-indigo-600 mt-3">
                        {getEstimatedTime('full')}
                    </div>
                    </div>
                </div>
                </div>
            </div>
            
            {/* Performance warning */}
            {localSamplingMode === 'full' && documentCount > 200 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800 flex items-center">
                <svg className="w-5 h-5 text-amber-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                    {documentCount > 500 
                    ? "Warning: Processing all documents may cause timeouts or crashes with very large datasets." 
                    : "Caution: Processing may be slow with this many documents."}
                </span>
                </div>
            )}
            
            {/* Explanation text
            <div className="bg-gray-50 p-4 rounded-md text-sm mt-2">
                <p className="font-medium">Why use sampling?</p>
                <p className="mt-1 text-gray-600">
                For most analysis types, a sample of 100-200
                documents provides a good balance between performance and accuracy.
                </p>
            </div> */}
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
            <button
                onClick={() => setShowSamplingModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
                Cancel
            </button>
            
            <button
                onClick={applyAndAnalyze}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Analysis
            </button>
            </div>
        </div>
        </div>
    </div>
    );
};

/**
 * Document view component
 * Displays a single document with pattern highlights
 * @param {Object} props - Component props
 * @param {Array} props.matches - Match data for this document
 * @param {string} props.title - Title for the document
 * @param {string} props.documentType - Type of document ('doc1' or 'doc2')
 * @param {Object} props.patternColors - Color mappings for patterns
 */
const DocumentView = ({ matches, title, documentType, patternColors }) => {
    // Debug helper function for match structure
    const debugMatchStructure = (match) => {
    if (!match) {
        console.log("Match is null or undefined");
        return;
    }
    
    console.log("Match structure:", {
        hasText: typeof match.text === 'string',
        textLength: match.text?.length || 0,
        hasMatches: Array.isArray(match.matches),
        matchesLength: match.matches?.length || 0
    });
    
    if (match.matches && match.matches.length > 0) {
        const [pattern, matchText] = match.matches[0];
        console.log("First match tuple:", { pattern, matchText });
        console.log("Direct text inclusion check:", {
        isExactMatch: match.text.includes(matchText),
        normalizedMatch: match.text.includes(normalizeTokenizedText(matchText))
        });
        
        // Try different normalization strategies and log results
        console.log("Normalization results:", {
        backend: matchText,
        normalized: normalizeTokenizedText(matchText),
        removeAllWhitespace: matchText.replace(/\s+/g, '')
        });
    }
    };

    // Filter matches based on selected patterns and filter mode
    const processedMatches = matches?.map(match => ({
    text: match.text,
    matches: match.matches?.filter(([pattern, matchText]) => {
        // Make sure both pattern and matchText exist
        if (!pattern || !matchText) return false;
        
        if (!selectedPatterns.has(pattern)) return false;
        const info = patternPresence[pattern];
        if (!info) return false;
        
        switch (filterMode) {
        case 'doc1': return info.doc1 && !info.doc2;
        case 'doc2': return !info.doc1 && info.doc2;
        case 'common': return info.doc1 && info.doc2;
        default: return true;
        }
    })
    })).filter(match => match.matches && match.matches.length > 0);
    
    // Log the structure of processed matches for debugging
    if (processedMatches && processedMatches.length > 0) {
    debugMatchStructure(processedMatches[0]);
    }
    
    /**
     * Render text with pattern highlights
     * @param {string} text - Original text to highlight
     * @param {Array} matches - Matches to highlight in the text
     * @returns {string} HTML string with highlights
     */
    const renderTextWithOverlappingHighlights = (text, matches) => {
        if (!text || !matches || matches.length === 0) return text;
        
        try {
        // Find all specific highlight spans
        const spans = [];
        
        matches.forEach(([pattern, matchText]) => {
            if (!pattern || !matchText) return;
            
            try {
            const normalizedMatchText = normalizeTokenizedText(matchText);
            const foundMatches = findTextWithVariableSpacing(text, normalizedMatchText);
            
            foundMatches.forEach(match => {
                spans.push({
                pattern,
                start: match.start,
                end: match.end,
                id: `${pattern}-${match.start}-${match.end}` // Unique ID for each span
                });
            });
            } catch (error) {
            console.error("Error finding text matches:", error);
            }
        });
        
        // No matches found - return original text
        if (spans.length === 0) return text;
        
        // Sort spans for better processing (start ascending, then end descending for proper nesting)
        spans.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return b.end - a.end; // Longer spans first for same start position
        });
        
        // Create a flat array of all positions where something changes
        const positions = new Set();
        spans.forEach(span => {
            positions.add(span.start);
            positions.add(span.end);
        });
        
        const sortedPositions = Array.from(positions).sort((a, b) => a - b);
        
        // Process text segment by segment
        let result = '';
        let lastPos = 0;
        
        for (let i = 0; i < sortedPositions.length; i++) {
            const pos = sortedPositions[i];
            
            // Add text segment
            if (pos > lastPos) {
            result += text.substring(lastPos, pos);
            }
            
            // Determine which spans are active at this position
            const activeSpans = spans.filter(span => span.start <= pos && span.end > pos);
            const startingSpans = spans.filter(span => span.start === pos);
            const endingSpans = spans.filter(span => span.end === pos);
            
            // Close spans that are ending at this position
            if (endingSpans.length > 0) {
            // Sort ending spans in order of most recently opened
            const sortedEndingSpans = [...endingSpans].sort((a, b) => {
                // Find position in activeSpans
                const aIndex = spans.findIndex(s => s.id === a.id);
                const bIndex = spans.findIndex(s => s.id === b.id);
                // Close more recent spans first
                return bIndex - aIndex;
            });
            
            // Close each ending span
            sortedEndingSpans.forEach(() => {
                result += '</span>';
            });
            }
            
            // Open new spans that start at this position
            if (startingSpans.length > 0) {
            // Sort starting spans in the same order as overall spans
            const sortedStartingSpans = [...startingSpans].sort((a, b) => {
                const aIndex = spans.findIndex(s => s.id === a.id);
                const bIndex = spans.findIndex(s => s.id === b.id);
                return aIndex - bIndex;
            });
            
            // Open each new span
            sortedStartingSpans.forEach(span => {
                const colorClass = patternColors[span.pattern] || 'bg-gray-200';
                result += `<span class="${colorClass}" data-pattern="${escapeRegExp(span.pattern)}">`;
            });
            }
            
            lastPos = pos;
        }
        
        // Add remaining text
        if (lastPos < text.length) {
            result += text.substring(lastPos);
        }
        
        return result;
        } catch (error) {
        console.error("Error in renderTextWithOverlappingHighlights:", error);
        return text;
        }
    };
    
    return (
    <div className="bg-white p-4 rounded-lg border h-[700px] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4 sticky top-0 bg-white pb-2 border-b">
        {file2 ? (documentType === 'doc1' ? file.name : file2.name) : `Matching Text in ${file.name}`}
        </h3>
        
        {!analysisInitiated ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Analysis Not Started</h3>
            <p className="text-gray-500 max-w-md mb-4">
            Please select a sampling strategy from the modal to begin analyzing patterns in your text.
            </p>
            <button
            onClick={() => setShowSamplingModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
            Configure Analysis
            </button>
        </div>
        ) : (
        <div className="space-y-4">
            {processedMatches?.map((match, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div 
                className="leading-relaxed"
                dangerouslySetInnerHTML={{ 
                    __html: renderTextWithOverlappingHighlights(match.text, match.matches)
                }} 
                />
            </div>
            ))}
            {(!processedMatches || processedMatches.length === 0) && (
            <div className="text-center text-gray-500 py-8">
                No matching patterns found
            </div>
            )}
        </div>
        )}
    </div>
    );
};

/**
 * Placeholder component when no file is uploaded
 */
const NoFileView = () => (
    <div className="bg-white rounded-lg border p-8 text-center">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">No file uploaded</h3>
    <p className="mt-1 text-sm text-gray-500">
        Please upload a text file in the "Upload Text" tab to begin pattern analysis.
    </p>
    </div>
);

//====================================================================
// MAIN COMPONENT RENDER
//====================================================================

// If no file is uploaded, show placeholder
if (!file) {
    return <NoFileView />;
}

return (
    <div className="relative w-full">
    {/* File Info Header */}
    <FileInfoHeader />
    
    {/* Main content area - Only show if analysis is initiated */}
    <div className="flex gap-4">
        {/* Left sidebar with pattern controls */}
        <div className="w-72 flex-shrink-0">
        <div className="bg-gray-50 p-4 rounded-lg h-[700px] overflow-y-auto">
            {/* Pattern selection controls */}
            <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Templates</h3>
            <div className="flex space-x-2 mb-3">
                <button
                onClick={() => setSelectedPatterns(new Set(Object.keys(processedPatterns.patterns)))}
                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-indigo-600 hover:bg-gray-50"
                disabled={!analysisInitiated || Object.keys(processedPatterns.patterns).length === 0}
                >
                Select All
                </button>
                <button
                onClick={() => setSelectedPatterns(new Set())}
                className="px-2 py-1 text-xs bg-white border border-gray-200 rounded text-indigo-600 hover:bg-gray-50"
                disabled={!analysisInitiated || selectedPatterns.size === 0}
                >
                Clear All
                </button>
            </div>
            </div>

            {/* Pattern filter buttons */}
            <PatternFilterButtons />

            {/* Pattern list */}
            <div className="space-y-2 mt-4">
            {!analysisInitiated ? (
                <div className="text-center py-8 text-gray-500 italic">
                Configure analysis to view patterns
                </div>
            ) : Object.entries(processedPatterns.patterns).length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic">
                {loading ? "Loading patterns..." : "No patterns loaded. Select a pattern length to begin."}
                </div>
            ) : (
                Object.entries(processedPatterns.patterns).map(([pattern]) => (
                <div
                    key={pattern}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => togglePattern(pattern)}
                >
                    <CheckCircle 
                    className={`w-5 h-5 flex-shrink-0 ${
                        selectedPatterns.has(pattern) 
                        ? 'text-indigo-600' 
                        : 'text-gray-300'
                    }`}
                    />
                    <div className="flex flex-1 items-center justify-between">
                    <span 
                        className={`text-sm font-medium text-gray-700 ${
                        selectedPatterns.has(pattern) ? patternColors[pattern] : ''
                        } px-1 rounded`}
                    >
                        {pattern}
                    </span>
                    <span className="text-xs text-gray-500 tabular-nums ml-2">
                        {processedPatterns.frequencies[pattern]}×
                    </span>
                    </div>
                </div>
                ))
            )}
            </div>
        </div>
        </div>

        {/* Center content - Document view area */}
        <div className={`flex-1 ${file2 ? 'grid grid-cols-2 gap-4' : ''}`}>
        <DocumentView 
            matches={matches.doc1} 
            documentType="doc1"
            title={file2 ? "Document 1 Matches" : "Matching Text"}
            patternColors={patternColors}  
        />
        
        {file2 && (
            <DocumentView 
            matches={matches.doc2}
            documentType="doc2" 
            title="Document 2 Matches"
            patternColors={patternColors}  
            />
        )}
        </div>

        {/* Right sidebar for POS Tag Legend */}
        <div className="w-64 flex-shrink-0">
        <div className="bg-gray-50 p-4 rounded-lg h-[700px] overflow-y-auto">
            <POSTagLegend />
        </div>
        </div>
    </div>
    
    {/* Sampling Modal */}
    <SamplingModal />
    
    {/* Loading overlay */}
    {loading && <LoadingSpinner />}
    </div>
);
};

export default PatternsTab;