import { useState } from 'react';
import { HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';

const POSTagLegend = () => {
const [isOpen, setIsOpen] = useState(true);  // Start expanded by default

const posTagMeanings = {
    // Based on spaCy's tag set
    'ADJ': 'Adjective (big, old, green)',
    'ADP': 'Adposition (in, to, during)',
    'ADV': 'Adverb (very, tomorrow, down)',
    'AUX': 'Auxiliary (is, has been)',
    'CONJ': 'Conjunction (and, or, but)',
    'CCONJ': 'Coordinating conj. (and, or)',
    'DET': 'Determiner (a, an, the)',
    'INTJ': 'Interjection (oh, hey)',
    'NOUN': 'Noun (girl, cat, tree)',
    'NUM': 'Numeral (1, one, first)',
    'PART': 'Particle (not, `s)',
    'PRON': 'Pronoun (I, you, he)',
    'PROPN': 'Proper noun (John, London)',
    'PUNCT': 'Punctuation (., (, ), ?)',
    'SCONJ': 'Subordinating conj. (if)',
    'SYM': 'Symbol ($, %, §)',
    'VERB': 'Verb (run, eat)',
    'X': 'Other',
    'NFP': 'List item marker (*)',
    'LS': 'Superfluous punctuation (!!!!)',
    // Penn Treebank tags
    'VB': 'Verb, base form',
    'VBD': 'Verb, past tense',
    'VBG': 'Verb, gerund/present',
    'VBN': 'Verb, past participle',
    'VBP': 'Verb, non-3rd present',
    'VBZ': 'Verb, 3rd sing. present',
    'NN': 'Noun, singular',
    'NNS': 'Noun, plural',
    'NNP': 'Proper noun, singular',
    'NNPS': 'Proper noun, plural',
    'IN': 'Preposition/subord. conj.',
    'JJ': 'Adjective',
    'JJR': 'Adjective, comparative',
    'JJS': 'Adjective, superlative',
    'RB': 'Adverb',
    'RBR': 'Adverb, comparative',
    'RBS': 'Adverb, superlative'
};

return (
<div className="bg-white rounded-lg border border-gray-200">
    <button
    onClick={() => setIsOpen(!isOpen)}
    className="w-full px-3 py-2 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
    >
    <div className="flex items-center">
        <HelpCircle className="w-4 h-4 mr-2 text-gray-400" />
        <span className="font-medium">POS Tag Reference</span>
    </div>
    {isOpen ? (
        <ChevronDown className="w-4 h-4 text-gray-400" />
    ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
    )}
    </button>
    
    {isOpen && (
    <div className="px-3 py-2 border-t border-gray-200">
        <div className="space-y-2">
        {Object.entries(posTagMeanings).map(([tag, meaning]) => (
            <div key={tag} className="flex items-start">
            <span className="font-mono text-indigo-600 w-12 flex-shrink-0">{tag}</span>
            <span className="text-sm text-gray-600 ml-2">{meaning}</span>
            </div>
        ))}
        </div>
    </div>
    )}
</div>
);
};

export default POSTagLegend;