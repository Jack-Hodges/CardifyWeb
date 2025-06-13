import { useState } from 'react';
import Modal from './Modal';

function GenerateModal({ isOpen, onClose, onGenerate, isGenerating }) {
    const [cardCount, setCardCount] = useState('5');
    const [topic, setTopic] = useState('');

    const handleGenerate = () => {
        onGenerate(parseInt(cardCount), topic);
    };

    return (
        <Modal
            isOpen={isOpen}
            onFirstAction={onClose}
            onSecondAction={handleGenerate}
            text="Generate Flashcards"
            mainText={
                <div className="space-y-4 mt-20 sm:mt-0">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <p className="text-gray-200">Generating flashcards...</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    Number of Cards
                                </label>
                                <select
                                    value={cardCount}
                                    onChange={(e) => setCardCount(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1">1</option>
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">
                                    Topic
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Enter topic for flashcards..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </>
                    )}
                </div>
            }
            firstActionText="Cancel"
            firstActionCol="bg-red-500 hover:bg-red-400"
            secondActionText={isGenerating ? "Generating..." : "Generate"}
            secondActionCol={isGenerating ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-400"}
            width="w-full h-full sm:w-2/3 sm:h-auto"
        />
    );
}

export default GenerateModal; 