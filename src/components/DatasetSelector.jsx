import React, { useState } from 'react';
import { BookOpen, FileText, Beaker, ChevronDown, ChevronRight, Loader2, Info } from 'lucide-react';

const DatasetSelector = ({ onLoad }) => {
const [expandedCategory, setExpandedCategory] = useState(null);
const [loadingDataset, setLoadingDataset] = useState(null);
const [error, setError] = useState(null);
const [showCitations, setShowCitations] = useState(false);

// Updated dataset structure with fixed IDs
const datasets = {
    nature: {
    name: "Toy Dataset",
    description: "A set of nature-themed sentences to explore templates. (Tip: Loads the fastest!)",
    type: "single",
    file: "nature_examples.txt",
    icon: BookOpen,
    iconColor: "text-emerald-600"
    },
    paper: {
    name: "Generated News Summaries (Shaib et. al, 2024)",
    description: "News summaries collected from \"Standardizing the Measurement of Text Diversity\"",
    type: "collection",
    icon: FileText,
    iconColor: "text-indigo-600",
    citation: "Shaib, C., Barrow, J., Sun, J., Siu, A. F., Wallace, B. C., & Nenkova, A. (2024). Standardizing the measurement of text diversity: A tool and a comparative analysis of scores. arXiv preprint arXiv:2403.00553.",
    datasets: [
        //CNN
        {
            id: "cnn_flant5",
            name: "CNN/DailyMail (FlanT5)",
            description: "",
            file: "cnn_flant5.txt"
        },
        {
            id: "cnn_llama2",
            name: "CNN/DailyMail (Llama-2)",
            description: "",
            file: "cnn_llama-2.txt"
        },
        {
            id: "cnn_gpt4",
            name: "CNN/DailyMail (GPT-4)",
            description: "",
            file: "cnn_GPT-4.txt"
        },
        {
            id: "cnn_mistral",
            name: "CNN/DailyMail (Mistral)",
            description: "",
            file: "cnn_mistraltxt"
        },
        // {
        //     id: "cnn_ref",
        //     name: "CNN/DailyMail (Reference Article)",
        //     description: "",
        //     file: "cnn_ref.txt"
        // },
        {
            id: "cnn_gold", 
            name: "CNN/DailyMail (Human-written Summary)",
            description: "", 
            file: "cnn_gold.txt"
        },
        {
            id: "cnn_stablelm", 
            name: "CNN/DailyMail (StableLM)",
            description: "", 
            file: "cnn_stablelm.txt"
        },
        // {
        //     id: "cnn_stablebeluga", 
        //     name: "CNN/DailyMail (StableBeluga)",
        //     description: "", 
        //     file: "cnn_stablebeluga.txt"
        // },
        //XSUM
        {
            id: "xsum_flant5",
            name: "XSUM (FlanT5)",
            description: "",
            file: "xsum_flant5.txt"
        },
        {
            id: "xsum_llama2",
            name: "XSUM (Llama-2)",
            description: "",
            file: "xsum_llama-2.txt"
        },
        {
            id: "xsum_gpt4",
            name: "XSUM (GPT-4)",
            description: "",
            file: "xsum_GPT-4.txt"
        },
        {
            id: "xsum_mistral",
            name: "XSUM (GPT-4)",
            description: "",
            file: "xsum_GPT-4.txt"
        },
        // {
        //     id: "xsum_ref",
        //     name: "XSUM (Reference Article)",
        //     description: "",
        //     file: "xsum_ref.txt"
        // },
        {
            id: "xsum_gold", 
            name: "XSUM (Human-written Summary)",
            description: "", 
            file: "xsum_gold.txt"
        },
        {
            id: "xsum_stablelm", 
            name: "XSUM (StableLM)",
            description: "", 
            file: "xsum_stablelm.txt"
        },
        {
            id: "xsum_stablebeluga", 
            name: "XSUM (StableBeluga)",
            description: "", 
            file: "xsum_stablebeluga.txt"
        },
    ]
    },
    essays: {
        name: "Argumentative Essays (Padmakumar et. al, 2023)",
        description: "Essays collected from \"Does Writing With Language Models Reduce Content Diversity?\"",
        type:"collection",
        icon: FileText,
        iconColor: "text-purple-600",
        citation: "Padmakumar, V., & He, H. (2023). Does Writing with Language Models Reduce Content Diversity?. arXiv preprint arXiv:2309.05196.",
        datasets: [
            {
                id: "essays_gpt3",
                name: "GPT-3 Essays",
                description: "Essays co-written with GPT-3",
                file: "essays_gpt3.txt"
            },
            {
                id: "essays_solo",
                name: "Solo Essays",
                description: "Essays written only by humans.",
                file: "essays_solo.txt"
            },
            {
                id: "essays_instructgpt",
                name: "InstructGPT Essays",
                description: "Essays co-written with InstructGPT",
                file: "essays_instructgpt.txt"
            },
        ]

    },
    synthetic: {
    name: "Synthetic Data (Guo et. al, 2024)",
    description: "Abstracts, stories, and summaries from \"The Curious Decline of Linguistic Diversity\"",
    type: "collection",
    icon: FileText,
    iconColor: "text-orange-600",
    citation: "Guo, Y., Shang, G., Vazirgiannis, M., & Clavel, C. (2023). The Curious Decline of Linguistic Diversity: Training Language Models on Synthetic Text. NAACL-HLT.",
    datasets: [
        {
        id: "summary_1",
        name: "Summaries (iteration 1)",
        description: "XLSum summaries after 1 iteration of recursive training.",
        file: "summary_1.txt"
        },
        {
            id: "summary_3",
            name: "Summaries (iteration 3)",
            description: "XLSum summaries after 3 iterations of recursive training.",
            file: "summary_3.txt"
        },
        {
            id: "summary_5",
            name: "Summaries (iteration 5)",
            description: "XLSum summaries after 5 iterations of recursive training.",
            file: "summary_5.txt"
        },
        {
            id: "summary_human",
            name: "Summaries (reference)",
            description: "Human reference XLSum summaries.",
            file: "summary_human.txt"
        },
        {
            id: "abstract_1",
            name: "Scientific abstracts (iteration 1)",
            description: "Scientific abstract generation (ACL Anthology) after 1 iteration of recursive training.",
            file: "abstract_1.txt"
            },
            {
                id: "abstract_3",
                name: "Scientific abstracts (iteration 3)",
                description: "Scientific abstract generation (ACL Anthology)  after 3 iterations of recursive training.",
                file: "abstract_3.txt"
            },
            {
                id: "abstract_5",
                name: "Scientific abstracts (iteration 5)",
                description: "Scientific abstract generation (ACL Anthology)  after 5 iterations of recursive training.",
                file: "abstract_5.txt"
            },
            {
                id: "abstract_human",
                name: "Scientific abstracts (reference)",
                description: "ACL Anthology reference abstracts.",
                file: "abstract_human.txt"
            },
        {
            id: "story_1",
            name: "Story (iteration 1)",
            description: "WritingPrompts (creative story generation) after 1 iteration of recursive training.",
            file: "story_1.txt"
            },
            {
                id: "story_3",
                name: "Stories (iteration 3)",
                description: "WritingPrompts (creative story generation) after 3 iterations of recursive training.",
                file: "story_3.txt"
            },
            {
                id: "story_5",
                name: "Stories (iteration 5)",
                description: "WritingPrompts (creative story generation) after 5 iterations of recursive training.",
                file: "story_5.txt"
            },
            {
                id: "story_human",
                name: "Stories (reference)",
                description: "Human reference from the WritingPrompts data.",
                file: "story_human.txt"
            },
        
    ]
    }
};

const handleLoadDataset = async (categoryId, datasetId = null) => {
    const fileId = datasetId || categoryId;
    setLoadingDataset(fileId);
    try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/defaults/${fileId}`, {
        mode: 'cors',
        credentials: 'omit',
    });
    
    if (!response.ok) throw new Error(`Failed to load dataset`);
    
    const data = await response.json();
    const fileName = datasetId ? 
        datasets[categoryId].datasets.find(d => d.id === datasetId).file :
        datasets[categoryId].file;

    const file = new File(
        [data.content], 
        fileName,
        { type: 'text/plain' }
    );
    
    onLoad(file);
    } catch (err) {
    console.error('Error loading dataset:', err);
    setError(`Failed to load dataset`);
    } finally {
    setLoadingDataset(null);
    }
};

// Category Card Component
const CategoryCard = ({ id, category }) => {
    const Icon = category.icon;
    const isExpanded = expandedCategory === id;
    const isCollection = category.type === 'collection';

    return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Category Header */}
        <div 
        className={`px-4 py-4 flex items-center justify-between ${
            isCollection ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={isCollection ? () => setExpandedCategory(isExpanded ? null : id) : undefined}
        >
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-gray-50 ${category.iconColor}`}>
            <Icon className="w-5 h-5" />
            </div>
            <div>
            <h3 className="font-medium text-gray-900">{category.name}</h3>
            <p className="text-sm text-gray-500">{category.description}</p>
            </div>
        </div>
        
        {isCollection ? (
            isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
            )
        ) : (
            <button
            onClick={(e) => {
                e.stopPropagation();
                handleLoadDataset(id);
            }}
            className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 rounded-md"
            >
            {loadingDataset === id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                'Load'
            )}
            </button>
        )}
        </div>

        {/* Expanded Content for Collections */}
        {isCollection && isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
            {category.datasets.map((dataset) => (
            <div
                key={dataset.id}
                className="px-4 py-3 border-b border-gray-200 last:border-b-0 flex items-center justify-between hover:bg-gray-100"
            >
                <div>
                <h4 className="font-medium text-gray-800">{dataset.name}</h4>
                <p className="text-sm text-gray-500">{dataset.description}</p>
                </div>
                <button
                onClick={() => handleLoadDataset(id, dataset.id)}
                className="px-3 py-1 bg-white hover:bg-gray-50 text-sm font-medium text-gray-600 rounded-md border border-gray-200"
                >
                {loadingDataset === dataset.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    'Load'
                )}
                </button>
            </div>
            ))}
        </div>
        )}
    </div>
    );
};

return (
    <div className="space-y-6">
    {/* Dataset Categories */}
    <div className="space-y-4">
        {Object.entries(datasets).map(([id, category]) => (
        <CategoryCard key={id} id={id} category={category} />
        ))}
    </div>

    {/* Collapsible Citations Section */}
    <div className="border-t border-gray-200 pt-4">
        <button
        onClick={() => setShowCitations(!showCitations)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
        <Info className="w-4 h-4" />
        {showCitations ? 'Hide Citations' : 'Show Citations'}
        <ChevronDown className={`w-4 h-4 transform transition-transform ${showCitations ? 'rotate-180' : ''}`} />
        </button>
        
        {showCitations && (
        <div className="mt-4 space-y-3">
            {Object.entries(datasets).map(([id, category]) => (
            category.citation && (
                <div key={id} className="text-xs bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">{category.name}:</p>
                <code className="block bg-white p-2 rounded border border-gray-200 text-gray-600 overflow-x-auto">
                    {category.citation}
                </code>
                </div>
            )
            ))}
        </div>
        )}
    </div>

    {/* Error Display */}
    {error && (
        <div className="p-4 bg-red-50 rounded-lg text-red-600 text-sm">
        {error}
        </div>
    )}
    </div>
);
};

export default DatasetSelector;