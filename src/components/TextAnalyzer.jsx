import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import PatternsTab from './PatternsTab';
import TemplateMatcher from './TemplateMatcher';
import MetricsInfo from './MetricsInfo';
import ExactMatchesTab from './ExactMatchesTab';
import AnalysisModal from './AnalysisModal';
import DatasetSelector from './DatasetSelector'; 
import EnhancedNavTabs from './EnhancedNavTabs';

/**
 * TextAnalyzer Component
 * Main demo page, supports uploading .txt and .csv files, calculating diversity metrics, and visualizing comparisons.
 */

const TextAnalyzer = () => {
  // State Management
  const [files, setFiles] = useState({ file1: null, file2: null });
  const [metrics, setMetrics] = useState({ file1: null, file2: null });
  const [loading, setLoading] = useState({ 
    file1: {
      compression_ratio: false,
      compression_pos: false,
      self_repetition: false,
      n_texts: false,
      avg_length: false,
      var_length: false
    }, 
    file2: {
      compression_ratio: false,
      compression_pos: false,
      self_repetition: false,
      n_texts: false,
      avg_length: false,
      var_length: false
    } 
  });
  const [error, setError] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [activeTab, setActiveTab] = useState('readme'); // initial landing page
  const [comparison, setComparison] = useState(null);

  /**
   * Handles file upload for either file slot
   * Validates file type and updates state accordingly
   * @param {Event} event - Upload event
   * @param {string} fileKey - Identifier for file slot ('file1' or 'file2')
   */
  const handleFileUpload = (event, fileKey) => {
    // Define variables at the function scope level
    const uploadedFile = event?.target?.files?.[0];
    
    // Guard clause - if no file, exit early
    if (!uploadedFile) {
      console.error('No file was selected');
      return;
    }
    
    // File type validation
    const validTypes = ['text/plain', 'text/csv', 'application/csv'];
    const isValidType = validTypes.includes(uploadedFile.type) || 
                       uploadedFile.name.toLowerCase().endsWith('.csv') ||
                       uploadedFile.name.toLowerCase().endsWith('.txt');
    
    // File size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (uploadedFile.size > maxSize) {
      setError('File size exceeds 10MB limit. Please upload a smaller file.');
      setFiles(prev => ({ ...prev, [fileKey]: null }));
      return;
    }
    
    if (!isValidType) {
      setError('Please upload a valid text file (.txt) or CSV file (.csv)');
      setFiles(prev => ({ ...prev, [fileKey]: null }));
      return;
    }
    
    // Reset states and set new file
    setFiles(prev => ({ ...prev, [fileKey]: uploadedFile }));
    setError(null);
    setMetrics(prev => ({ ...prev, [fileKey]: { metrics: {} } }));
    setShowAnalysisModal(true);

    // Initialize loading state for ALL possible metrics
    setLoading(prev => ({
      ...prev,
      [fileKey]: {
        n_texts: false,
        avg_length: false,
        var_length: false,
        compression_ratio: false,
        compression_pos: false,
        self_repetition: false
      }
    }));

    // Create FormData at the function level, not in an async block
    const formData = new FormData();
    formData.append('file', uploadedFile);

    // Define the API URL at function level
    const apiUrl = import.meta.env.VITE_API_URL || 'https://diversity-demo-backend-ykl7j.ondigitalocean.app';
    console.log("Using API URL:", apiUrl);
    
    // Use a regular (non-async) fetch for simplicity
    fetch(`${apiUrl}/analyze/metrics`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.body.getReader();
    })
    .then(reader => {
      const decoder = new TextDecoder();
      
      // Process the stream
      function processStream() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            return;
          }
          
          const text = decoder.decode(value);
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              // Special handling for -Infinity in JSON
              const preprocessedLine = line.replace(/"value":\s*-Infinity/g, '"value": "-Infinity"')
                                         .replace(/"value":\s*Infinity/g, '"value": "Infinity"')
                                         .replace(/"value":\s*NaN/g, '"value": "NaN"');
              
              const update = JSON.parse(preprocessedLine);
              console.log("Received update:", update);
              
              // Convert string representations back to actual values
              if (update.value === "-Infinity") update.value = Number.NEGATIVE_INFINITY;
              if (update.value === "Infinity") update.value = Number.POSITIVE_INFINITY;
              if (update.value === "NaN") update.value = NaN;
              
              switch (update.type) {
                case 'metricStart':
                  console.log(`Starting metric: ${update.metric}`);
                  setLoading(prev => ({
                    ...prev,
                    [fileKey]: {
                      ...(prev[fileKey] || {}),
                      [update.metric]: true
                    }
                  }));
                  break;
                  
                case 'metricComplete':
                  console.log(`Completed metric: ${update.metric} = ${update.value}`);
                  setMetrics(prev => ({
                    ...prev,
                    [fileKey]: {
                      ...(prev[fileKey] || {}),
                      metrics: {
                        ...(prev[fileKey]?.metrics || {}),
                        [update.metric]: update.value
                      }
                    }
                  }));
                  setLoading(prev => ({
                    ...prev,
                    [fileKey]: {
                      ...(prev[fileKey] || {}),
                      [update.metric]: false
                    }
                  }));
                  break;
                  
                case 'metricError':
                  console.error(`Error calculating ${update.metric}:`, update.error);
                  setLoading(prev => ({
                    ...prev,
                    [fileKey]: {
                      ...(prev[fileKey] || {}),
                      [update.metric]: false
                    }
                  }));
                  break;
              }
            } catch (parseError) {
              console.error("Error parsing line:", line, parseError);
            }
          }
          
          // Continue processing the stream
          return processStream();
        });
      }
      
      return processStream();
    })
    .catch(error => {
      console.error('Error processing file:', error);
      setError(`Error processing file: ${error.message}`);
      
      // Reset loading state on error
      setLoading(prev => ({
        ...prev,
        [fileKey]: Object.keys(prev[fileKey] || {}).reduce((acc, key) => ({
          ...acc,
          [key]: false
        }), {})
      }));
    });
  };

  /**
   * Calculates metrics for a given file
   * Makes API call to backend service
   * @param {string} fileKey - Identifier for file slot ('file1' or 'file2')
   */
  const calculateMetrics = async (fileKey) => {
    if (!files[fileKey]) return;
  
    // Reset metrics and set all loading states to true
    setMetrics(prev => ({ ...prev, [fileKey]: { metrics: {} } }));
    setLoading(prev => ({
      ...prev,
      [fileKey]: Object.keys(prev[fileKey]).reduce((acc, key) => ({
        ...acc,
        [key]: true
      }), {})
    }));
  
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('file', files[fileKey]);
  
      // Use the environment variable with fallback
      const apiUrl = import.meta.env.VITE_API_URL || 'https://diversity-demo-backend-ykl7j.ondigitalocean.app';
      
      const response = await fetch(`${apiUrl}/analyze/metrics`, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
        }
      });
  
      if (!response.ok) {
        throw new Error(`Failed to calculate metrics: ${response.status}`);
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value);
        const updates = chunk.split('\n').filter(Boolean);
  
        for (const line of updates) {
          try {
            // Special handling for -Infinity in JSON
            const preprocessedLine = line.replace(/"value":\s*-Infinity/g, '"value": "-Infinity"')
                                       .replace(/"value":\s*Infinity/g, '"value": "Infinity"')
                                       .replace(/"value":\s*NaN/g, '"value": "NaN"');
                      
            const update = JSON.parse(preprocessedLine);
            
            // Convert string representations back to actual values
            if (update.value === "-Infinity") update.value = Number.NEGATIVE_INFINITY;
            if (update.value === "Infinity") update.value = Number.POSITIVE_INFINITY;
            if (update.value === "NaN") update.value = NaN;
            
            if (update.type === 'metricComplete') {
              setMetrics(prev => ({
                ...prev,
                [fileKey]: {
                  ...prev[fileKey],
                  metrics: {
                    ...prev[fileKey]?.metrics,
                    [update.metric]: update.value
                  }
                }
              }));
              setLoading(prev => ({
                ...prev,
                [fileKey]: {
                  ...prev[fileKey],
                  [update.metric]: false
                }
              }));
            }
          } catch (e) {
            console.error('Error parsing metric update:', e);
          }
        }
      }
    } catch (error) {
      console.error(`Error calculating metrics for ${fileKey}:`, error);
      setError(`Error calculating metrics: ${error.message}`);
      setLoading(prev => ({
        ...prev,
        [fileKey]: Object.keys(prev[fileKey]).reduce((acc, key) => ({
          ...acc,
          [key]: false
        }), {})
      }));
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'metrics' && files.file1) {
      calculateMetrics('file1');
      if (files.file2) {
        calculateMetrics('file2');
      }
    }
  };

  /**
   * Compare files and display metrics comparison
   */
  const compareFiles = () => {
    if (!files.file1 || !files.file2 || !metrics.file1 || !metrics.file2) return;
    
    // Create comparison data for charts
    const comparisonData = [
      {
        name: 'Compression Ratio',
        file1: metrics.file1.metrics.compression_ratio,
        file2: metrics.file2.metrics.compression_ratio,
      }
    ];
    
    // Add self-repetition if available
    if (metrics.file1.metrics.self_repetition !== undefined && 
        metrics.file2.metrics.self_repetition !== undefined) {
      comparisonData.push({
        name: 'Self-Repetition',
        file1: metrics.file1.metrics.self_repetition,
        file2: metrics.file2.metrics.self_repetition,
      });
    }
    
    setComparison(comparisonData);
  };

  /**
   * MetricsCard Component
   * Displays metrics for a given file
   */
  const MetricsCard = ({ data, title, loadingStates }) => {
    // Helper function to safely format numbers
    const safeFormat = (value, formatFn) => {
      // Handle special JavaScript values
      if (value === Number.POSITIVE_INFINITY || value === "Infinity") {
        return '∞';
      }
      if (value === Number.NEGATIVE_INFINITY || value === "-Infinity") {
        return 'N/A'; // Display N/A instead of -∞ for -Infinity
      }
      if (isNaN(value) || value === "NaN" || value === null || value === undefined) {
        return 'N/A';
      }
      
      // Handle normal numbers
      try {
        return formatFn(value);
      } catch (error) {
        console.error("Error formatting value:", value, error);
        return 'Error';
      }
    };

    // Define all metrics for display
    const allMetrics = [
      // Text Statistics
      { key: 'n_texts', label: 'Num. Documents', section: 'text', format: value => safeFormat(value, v => Math.round(v).toLocaleString()) },
      { key: 'avg_length', label: 'Mean Num. Words', section: 'text', format: value => safeFormat(value, v => Math.round(v).toLocaleString()) },
      { key: 'var_length', label: 'Variance Num. Words', section: 'text', format: value => safeFormat(value, v => Math.round(v).toLocaleString()) },
      
      // Diversity Metrics
      { key: 'compression_ratio', label: 'Compression Ratio', section: 'diversity', format: value => safeFormat(value, v => v.toFixed(3)) },
      { key: 'compression_pos', label: 'POS Compression', section: 'diversity', format: value => safeFormat(value, v => v.toFixed(3)) },
      { key: 'self_repetition', label: 'Self-Repetition', section: 'diversity', format: value => safeFormat(value, v => v.toFixed(3)) }
    ];
  
    // Split metrics by section
    const textStats = allMetrics.filter(m => m.section === 'text');
    const diversityMetrics = allMetrics.filter(m => m.section === 'diversity');
  
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-md text-red-700">
              Note: Diversity scores are correlated with text length. Consider this when comparing texts of different lengths.
            </p>
          </div>
  
          {/* Text Statistics Section */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-700 mb-4">Text Statistics</h4>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {textStats.map(({ key, label, format }) => (
                <div key={key} className="px-4 py-5 bg-gray-100 rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {loadingStates?.[key] || data?.metrics?.[key] === undefined ? (
                      <div className="flex items-center">
                        <div className="mr-2 animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span className="text-lg text-gray-500">Calculating...</span>
                      </div>
                    ) : (
                      format(data.metrics[key])
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
  
          {/* Diversity Metrics Section */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Diversity Metrics</h4>
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {diversityMetrics.map(({ key, label, format }) => (
                <div key={key} className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate flex items-center justify-between">
                    <div>{label}</div>
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {loadingStates?.[key] ? (
                      <div className="flex items-center">
                        <div className="mr-2 animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                        <span className="text-lg text-gray-500">Calculating...</span>
                      </div>
                    ) : (
                      data?.metrics?.[key] !== undefined
                        ? format(data.metrics[key])
                        : '—'
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Landing Page for Website
   */
  const LandingPage = () => {
    const [copiedStates, setCopiedStates] = useState({
      citation1: false,
      citation2: false
    });
  
    const handleCopy = (text, citationId) => {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedStates(prev => ({ ...prev, [citationId]: true }));
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [citationId]: false }));
        }, 2000);
      }).catch(err => console.error('Failed to copy:', err));
    };
  
    return (
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-12 mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 mx-auto max-w-4xl leading-tight">
            Explore your text's diversity and patterns.
          </h1>
          <p className="text-xl text-gray-600 mx-auto max-w-4xl leading-relaxed">
            Based on{' '}
            <a 
              href="https://arxiv.org/abs/2403.00553" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Standardizing the Measurement of Text Diversity
            </a>
            {' and '} 
            <a 
              href="https://aclanthology.org/2024.emnlp-main.368/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Detection and Measurement of Syntactic Templates in Generated Text
            </a>
          </p>
        </div>

        {/* Main Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <FeatureCard
            icon={<FileText className="w-8 h-8 text-indigo-600" />}
            title="Pattern Analysis"
            description="Upload your text to discover repeated patterns and measure diversity metrics."
            features={[
              "Identify common sentence structures",
              "Visualize template usage",
              "Calculate text diversity scores"
            ]}
          />
        {/* YouTube Video Embed */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="aspect-video w-full">
            <iframe
              className="w-full h-full rounded-lg"
              src="https://www.youtube.com/embed/jK8z6_d0yjk"
              title="Text Diversity Analysis Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <p className="mt-4 text-gray-600">
            Watch this quick overview of how to analyze text diversity and identify patterns.
          </p>
        </div>
      </div>

        {/* References Section */}
        <section className="mb-16">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">References</h3>
          <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <p className="text-gray-600 mb-4">If you use this work in your research, please cite both:</p>
            <div className="space-y-6">
              {/* First Citation */}
              <div className="group relative bg-white p-6 rounded-lg border border-gray-200 font-mono text-sm overflow-x-auto">
                <button 
                  onClick={() => handleCopy(`@article{shaib2024standardizing,
                  title={Standardizing the measurement of text diversity: A tool and a comparative analysis of scores},
                  author={Shaib, Chantal and Barrow, Joe and Sun, Jiuding and Siu, Alexa F and Wallace, Byron C and Nenkova, Ani},
                  journal={arXiv preprint arXiv:2403.00553},
                  year={2024}
                }`, 'citation1')}
                  className={`absolute top-2 right-2 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 border ${
                    copiedStates.citation1 
                      ? 'bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600' 
                      : 'bg-white/80 hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-xs">
                    {copiedStates.citation1 ? 'Copied!' : 'Copy BibTeX'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${copiedStates.citation1 ? 'text-white' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {copiedStates.citation1 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>
                {`@article{shaib2024standardizing,
                  title={Standardizing the measurement of text diversity: A tool and a comparative analysis of scores},
                  author={Shaib, Chantal and Barrow, Joe and Sun, Jiuding and Siu, Alexa F and Wallace, Byron C and Nenkova, Ani},
                  journal={arXiv preprint arXiv:2403.00553},
                  year={2024}
                }`}
              </div>

              {/* Second Citation */}
              <div className="group relative bg-white p-6 rounded-lg border border-gray-200 font-mono text-sm overflow-x-auto">
                <button 
                  onClick={() => handleCopy(`@inproceedings{Shaib2024DetectionAM,
                      title={Detection and Measurement of Syntactic Templates in Generated Text},
                      author={Chantal Shaib and Yanai Elazar and Junyi Jessy Li and Byron C. Wallace},
                      booktitle={Conference on Empirical Methods in Natural Language Processing},
                      year={2024},
                      url={https://api.semanticscholar.org/CorpusID:270869797}
                      }`, 'citation2')}
                  className={`absolute top-2 right-2 p-2 rounded-md opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 border ${
                    copiedStates.citation2 
                      ? 'bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600' 
                      : 'bg-white/80 hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-xs">
                    {copiedStates.citation2 ? 'Copied!' : 'Copy BibTeX'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${copiedStates.citation2 ? 'text-white' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {copiedStates.citation2 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    )}
                  </svg>
                </button>
                {`@inproceedings{Shaib2024DetectionAM,
                      title={Detection and Measurement of Syntactic Templates in Generated Text},
                      author={Chantal Shaib and Yanai Elazar and Junyi Jessy Li and Byron C. Wallace},
                      booktitle={Conference on Empirical Methods in Natural Language Processing},
                      year={2024},
                      url={https://api.semanticscholar.org/CorpusID:270869797}
                      }`}
              </div>
            </div>
          </div>
        </section>

        {/* Package Info Section */}
        <section className="mb-16">
          <div className="bg-gray-50 p-8 rounded-xl">
            <p className="text-gray-600 leading-relaxed mb-8">
              This demo is based on the Python <span className="font-semibold">Diversity</span> package, 
              which provides tools for analyzing text diversity and detecting templated patterns. 
              The package can be accessed via pip or GitHub:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PyPI Card */}
              <a 
                href="https://pypi.org/project/diversity"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-6 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors group"
              >
                <div className="mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#006DAD] group-hover:text-[#003B5C]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.101 4.8c.077-.057.164-.1.259-.122.475-.11.982.187 1.092.662.11.475-.187.982-.662 1.092-.475.11-.982-.187-1.092-.662-.053-.229-.018-.46.087-.656.042-.078.098-.148.166-.208l.15-.106zm-2.137-.123c.475-.11.982.187 1.092.662.11.475-.187.982-.662 1.092-.475.11-.982-.187-1.092-.662-.053-.229-.018-.46.087-.656.042-.078.098-.148.166-.208.077-.057.164-.1.259-.122l.15-.106zm-2.137 4.8c.077-.057.164-.1.259-.122.475-.11.982.187 1.092.662.11.475-.187.982-.662 1.092-.475.11-.982-.187-1.092-.662-.053-.229-.018-.46.087-.656.042-.078.098-.148.166-.208l.15-.106zm8.811 1.919c-.475.11-.982-.187-1.092-.662-.11-.475.187-.982.662-1.092.475-.11.982.187 1.092.662.053.229.018.46-.087.656-.042.078-.098.148-.166.208-.077.057-.164.1-.259.122l-.15.106zm2.137-4.8c-.077.057-.164.1-.259.122-.475.11-.982-.187-1.092-.662-.11-.475.187-.982.662-1.092.475-.11.982.187 1.092.662.053.229.018.46-.087.656-.042.078-.098.148.166.208l-.15.106z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">PyPI Package</h4>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">pip install diversity</code>
                </div>
              </a>

              {/* GitHub Card */}
              <a 
                href="https://github.com/cshaib/diversity"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-6 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors group"
              >
                <div className="mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-900 group-hover:text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">GitHub Repository</h4>
                  <span className="text-sm text-gray-600">View source code and contribute</span>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <section className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-8 rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Questions or Issues?</h3>
          <p className="text-gray-600">
            This website is currently maintained by <a href="https://cshaib.github.io" className="text-indigo-600 hover:text-indigo-500 font-medium">Chantal Shaib</a>.
            Please refer to <a href="https://github.com/cshaib/diversity_demo" className="text-indigo-600 hover:text-indigo-500 font-medium">the GitHub repository</a> for reporting any issues with the demo. We welcome contributions and feedback from the community!
          </p>
        </section>
      </div>
    );
  };

  /**
   * Feature Card Component
   * Used in the landing page to display features
   */
  const FeatureCard = ({ icon, title, description, features }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-4 mb-4">
        {icon}
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-gray-700">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  /**
   * File Upload Box Component
   * Handles file upload UI for a single file slot
   */
  const FileUploadBox = ({ fileKey, label }) => {
    const hasFile = files[fileKey] !== null;
    
    return (
      <div className="text-center">
        <input
          type="file"
          accept=".txt,.csv"
          onChange={(e) => handleFileUpload(e, fileKey)}
          className="hidden"
          id={`file-upload-${fileKey}`}
        />
        <label
          htmlFor={`file-upload-${fileKey}`}
          className="relative cursor-pointer bg-white rounded-md font-medium focus-within:outline-none"
        >
          <div className={`max-w-xl mx-auto mt-2 p-8 border-2 ${
            hasFile ? 'border-indigo-200 bg-indigo-50' : 'border-dashed border-gray-300'
          } rounded-lg hover:border-indigo-300 transition-colors`}>
            <div className="text-center">
              {hasFile ? (
                <>
                  <FileText className="mx-auto h-16 w-16 text-indigo-500" />
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">{files[fileKey].name}</h3>
                    <p className="mt-1 text-sm text-gray-500">Click to replace file</p>
                  </div>
                </> 
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      Upload {label}
                    </span>
                    <span className="text-sm text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">TXT or CSV files up to 10MB</p>
                </>
              )}
            </div>
          </div>
        </label>
      </div>
    );
  };

  // Main component render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <header className="bg-white shadow-sm">
        <div className="max-w-[90rem] mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Diversity</h1>
          <p className="mt-1 text-sm text-gray-500">
            Explore templates and calculate diversity metrics from{' '}
            <a 
              href="https://arxiv.org/abs/2403.00553" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-500"
            >
              Standardizing the Measurement of Text Diversity
            </a>
            {' and '} 
            <a 
              href="https://aclanthology.org/2024.emnlp-main.368/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-indigo-600 hover:text-indigo-500"
            >
              Detection and Measurement of Syntactic Templates in Generated Text
            </a>
          </p> 
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-[90rem] mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <EnhancedNavTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasUploadedFile={!!files.file1}
          handleTabClick={handleTabClick}
        />
        
        {/* Tab Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* Upload Tab Content */}
          {activeTab === 'upload' && (
            <div>
              {/* Title Section */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
                <p className="mt-2 text-gray-600">Load an example dataset or upload your own file to begin analysis</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Example Datasets Section */}
                <div>
                  <div className="bg-gray-50 p-6 rounded-lg h-[600px] overflow-y-auto">
                    <DatasetSelector 
                      onLoad={(file) => {
                        setFiles(prev => ({ ...prev, file1: file }));
                        setError(null);
                        setMetrics(prev => ({ ...prev, file1: null }));
                        setShowAnalysisModal(true);
                      }} 
                    />
                  </div>
                </div>

                {/* Upload Section */}
                <div>
                  <div className="bg-gray-50 p-6 rounded-lg h-[600px] flex flex-col justify-center items-center">
                    <FileUploadBox fileKey="file1" label="File 1" />
                    <p className="mt-4 text-sm text-gray-500">
                      Supported formats: .txt, .csv (max 10MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}
              
              {/* Analysis Modal */}
              <AnalysisModal 
                isOpen={showAnalysisModal}
                onClose={() => setShowAnalysisModal(false)}
                onSelectAnalysis={(tab) => {
                  handleTabClick(tab);
                  setShowAnalysisModal(false);
                }}
              />
            </div>
          )}
       
          {/* Exact Matches Tab Content */}
          {activeTab === 'exact' && (
            <div className="bg-white shadow rounded-lg p-6">
              <ExactMatchesTab file={files.file1} />
            </div>
          )}
          
          {/* Patterns Tab Content */}
          {activeTab === 'patterns' && (
            <div>
              <PatternsTab file={files.file1} file2={files.file2} activeTab={activeTab} />
            </div>
          )}

          {/* README Tab Content */}
          {activeTab === 'readme' && (
            <div className="bg-white shadow rounded-lg p-6">
              <LandingPage />
            </div>
          )}

          {/* Metrics Tab Content */}
          {activeTab === 'metrics' && (
            <div className="flex gap-4">
              <div className="flex-1 space-y-8">
                {/* Show loading message if any metrics are still calculating */}
                {Object.values(loading).some(fileLoading => 
                  fileLoading && Object.values(fileLoading).some(isLoading => isLoading)
                )}
            
                {/* Metrics Cards */}
                <div className={`${files.file2 ? 'grid grid-cols-2 gap-6' : ''}`}>
                  {files.file1 && (
                    <MetricsCard
                      data={metrics.file1}
                      title={`Metrics - ${files.file1?.name || 'File 1'}`}
                      loadingStates={loading.file1}
                    />
                  )}

                  {files.file2 && (
                    <MetricsCard
                      data={metrics.file2}
                      title={`Metrics - ${files.file2?.name || 'File 2'}`}
                      loadingStates={loading.file2}
                    />
                  )}
                </div>

                {/* Comparison Section */}
                {files.file2 && metrics.file1?.metrics && metrics.file2?.metrics && (
                  <div className="mt-8">
                    <button
                      onClick={compareFiles}
                      className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Compare Files
                    </button>
                    
                    {comparison && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Comparison Results</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={comparison}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="file1" fill="#4f46e5" name={files.file1.name} />
                            <Bar dataKey="file2" fill="#06b6d4" name={files.file2.name} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Right sidebar */}
              <div className="w-64 flex-shrink-0">
                <div className="bg-gray-50 p-4 rounded-lg h-[700px] overflow-y-auto">
                  <MetricsInfo />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TextAnalyzer;