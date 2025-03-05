import React from 'react';
import { FileText, Search, BarChart2 } from 'lucide-react';

const AnalysisModal = ({ isOpen, onClose, onSelectAnalysis }) => {
if (!isOpen) return null;

const options = [
    {
    id: 'patterns',
    title: 'POS Pattern Analysis',
    description: 'Analyze syntactic patterns using Part-of-Speech tagging',
    icon: FileText,
    color: 'indigo'
    },
    {
    id: 'exact',
    title: 'Exact Match Analysis',
    description: 'Find repeated exact phrases and patterns in the text',
    icon: Search,
    color: 'emerald'
    },
    {
    id: 'metrics',
    title: 'Diversity Metrics',
    description: 'Calculate and analyze text diversity metrics',
    icon: BarChart2,
    color: 'blue'
    }
];

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-8 animate-fadeIn">
        <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Choose Analysis Type</h2>
        <p className="mt-2 text-gray-600">Select how you'd like to analyze your text</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((option) => {
            const Icon = option.icon;
            return (
            <button
                key={option.id}
                onClick={() => {
                onSelectAnalysis(option.id);
                onClose();
                }}
                className="p-6 border border-gray-200 rounded-lg hover:border-indigo-500 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md group"
            >
                <div className="flex flex-col items-center space-y-4">
                <div className={`w-12 h-12 rounded-full bg-${option.color}-100 flex items-center justify-center group-hover:bg-${option.color}-200 transition-colors`}>
                    <Icon className={`w-6 h-6 text-${option.color}-600`} />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900">{option.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                    {option.description}
                    </p>
                </div>
                </div>
            </button>
            );
        })}
        </div>

        <div className="mt-6 text-center">
        <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
            Cancel
        </button>
        </div>
    </div>
    </div>
);
};

export default AnalysisModal;