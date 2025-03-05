import React from 'react';
import { HelpCircle } from 'lucide-react';

const MetricsInfo = () => {
const metrics = {
    'Compression Ratio': {
        description: 'Measures text redundancy using compression algorithms. Higher values indicate more repetitive/templated text.',
        interpretation: 'Higher values indicate more redundancy, meaning the text contains many repeated sequences that can be compressed.',
    },
    'POS Compression Ratio': {
        description: 'Measures redundancy in syntactic patterns by compressing sequences of part-of-speech (POS) tags.',
        interpretation: 'Higher values indicate repetitive syntactic patterns and similar sentence structures.',
    },
    // 'N-gram Diversity': {
    //     description: 'Measures the diversity of phrases or sequences of words in the text, focusing on 4-grams.',
    //     interpretation: 'Scale of 0-4. Higher values indicate more varied phrasing and richer language use.',
    // },
    'Self-BLEU': {
        description: 'Measures similarity between different outputs by using one output as a reference.',
        interpretation: 'Lower values suggest greater diversity, which is desirable for creative tasks.',
    },
    // 'ROUGE-L Homogenization': {
    //     description: 'Measures text overlap using longest common subsequences instead of fixed n-grams.',
    //     interpretation: 'Lower values suggest more varied outputs with diverse perspectives or phrasing.',
    // },
    // 'BERTScore Homogenization': {
    //     description: 'Uses BERT embeddings to measure semantic similarity between texts, capturing meaning beyond exact matches.',
    //     interpretation: 'Lower values indicate greater semantic diversity in ideas and themes.',
    // },
    'Self-Repetition Score': {
        description: 'Measures how often long n-grams are repeated across different outputs.',
        interpretation: 'Lower values indicate the text avoids repetitive patterns and is more original.',
    }
};

return (
    <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 flex items-center border-b border-gray-200">
        <HelpCircle className="w-5 h-5 mr-2 text-gray-400" />
        <span className="font-medium text-gray-900">Metrics Guide</span>
        </div>
        
        <div className="px-4 py-3">
        <div className="space-y-6">
            {Object.entries(metrics).map(([name, info]) => (
            <div key={name} className="space-y-2">
                <h3 className="font-medium text-gray-900">{name}</h3>
                <div className="space-y-1 text-sm">
                <p className="text-gray-600">{info.description}</p>
                <p className="text-gray-500 italic">{info.interpretation}</p>
                </div>
            </div>
            ))}
        </div>
        </div>
    </div>
    );
};

export default MetricsInfo;