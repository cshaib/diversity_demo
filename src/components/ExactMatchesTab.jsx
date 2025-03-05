import React, { useState, useEffect } from 'react';

const ExactMatchesTab = ({ file }) => {
    const [matches, setMatches] = useState([]);
    const [minLength, setMinLength] = useState(3);
    const [minOccurrences, setMinOccurrences] = useState(2);
    const [loading, setLoading] = useState(false);

    const findExactMatches = async () => {
        if (!file) return;
        
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('pattern_length', minLength.toString());
            formData.append('match_mode', 'exact');

            const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze/patterns`, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Failed to analyze patterns');
            const data = await response.json();

            const processedMatches = Object.entries(data.patterns)
                .map(([text, examples]) => {
                    const documentMatches = data.matches.doc1.filter(match => 
                        match.matches.some(([pattern, matchText]) => pattern === text || matchText === text)
                    );

                    return {
                        text,
                        count: documentMatches.length,
                        examples: Array.from(examples),
                        documents: documentMatches.map(match => ({
                            text: match.text,
                            context: match.text
                        }))
                    };
                })
                .filter(match => match.count >= minOccurrences)
                .sort((a, b) => b.count - a.count);

            setMatches(processedMatches);
        } catch (error) {
            console.error('Error analyzing patterns:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (file) {
            findExactMatches();
        }
    }, [file, minLength, minOccurrences]);

    const HighlightedText = ({ text, matchText }) => {
        if (!text || !matchText) return text;
    
        // Fully escape special regex characters in matchText
        const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };
        
        try {
            // Create parts by splitting at the exact match points, using escaped regex
            const escapedMatchText = escapeRegExp(matchText);
            const regex = new RegExp(`(${escapedMatchText})`, 'gi');
            const parts = text.split(regex);
            
            return (
                <span>
                    {parts.map((part, index) => 
                        part.toLowerCase() === matchText.toLowerCase() ? (
                            <span key={index} className="bg-yellow-200 px-1 rounded">
                                {part}
                            </span>
                        ) : (
                            <span key={index}>{part}</span>
                        )
                    )}
                </span>
            );
        } catch (error) {
            console.error("Regex error in HighlightedText:", error);
            // Fallback to showing the original text without highlighting
            return <span>{text}</span>;
        }
    };

    const LoadingSpinner = () => (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-50 rounded-lg">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-600">Finding exact matches...</span>
            </div>
        </div>
    );

    return (
        <div className="relative">
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex items-center gap-8">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Words in Match
                        </label>
                        <input
                            type="range"
                            min="2"
                            max="10"
                            value={minLength}
                            onChange={(e) => setMinLength(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>2</span>
                            <span>{minLength} words</span>
                            <span>10</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Document Occurrences
                        </label>
                        <input
                            type="range"
                            min="2"
                            max="10"
                            value={minOccurrences}
                            onChange={(e) => setMinOccurrences(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>2</span>
                            <span>{minOccurrences} docs</span>
                            <span>10</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Cross-Document Repeated Text
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Showing text fragments that appear in {minOccurrences} or more different documents
                    </p>
                </div>

                <div className="p-6">
                    {matches.length > 0 ? (
                        <div className="space-y-6">
                            {matches.map((match, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900">
                                            "{match.text}"
                                        </span>
                                        <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                                            {match.count} docs
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2 space-y-2">
                                        <p className="text-sm font-medium text-gray-500">Appears in:</p>
                                        {match.documents.map((doc, idx) => (
                                            <div key={idx} className="text-sm text-gray-600 bg-white p-2 rounded">
                                                <HighlightedText text={doc.text} matchText={match.text} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No repeated text fragments found matching the current criteria
                        </div>
                    )}
                </div>
            </div>

            {loading && <LoadingSpinner />}
        </div>
    );
};

export default ExactMatchesTab;