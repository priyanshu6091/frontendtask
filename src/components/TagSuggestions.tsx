import React, { useState, useEffect } from 'react';
import { AIService } from '../services/aiService';
import { Sparkles, Tag, Plus, X, Loader2, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface TagSuggestionsProps {
    content: string;
    title: string;
    currentTags: string[];
    onTagsUpdate: (tags: string[]) => void;
    className?: string;
}

export const TagSuggestions: React.FC<TagSuggestionsProps> = ({
    content,
    title,
    currentTags,
    onTagsUpdate,
    className = ''
}) => {
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastGeneratedContent, setLastGeneratedContent] = useState('');

    // Auto-generate tags when content changes (debounced)
    useEffect(() => {
        const plainText = content.replace(/<[^>]*>/g, '').trim();

        // Only generate if content is substantial and different from last time
        if (plainText.length < 50 || plainText === lastGeneratedContent) {
            return;
        }

        const timer = setTimeout(() => {
            generateTags();
        }, 3000); // Wait 3 seconds after user stops typing

        return () => clearTimeout(timer);
    }, [content, title]);

    const generateTags = async () => {
        const plainText = content.replace(/<[^>]*>/g, '').trim();

        if (plainText.length < 20) {
            setSuggestedTags([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const aiService = AIService.getInstance();
            const tags = await aiService.generateTags(content, title);

            // Filter out tags that are already applied
            const newTags = tags.filter(
                tag => !currentTags.some(existingTag =>
                    existingTag.toLowerCase() === tag.toLowerCase()
                )
            );

            setSuggestedTags(newTags);
            setLastGeneratedContent(plainText);
        } catch (err) {
            console.error('Error generating tags:', err);
            setError('Failed to generate tag suggestions');
            setSuggestedTags([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = (tag: string) => {
        // Check if tag already exists (case-insensitive)
        const tagExists = currentTags.some(
            existingTag => existingTag.toLowerCase() === tag.toLowerCase()
        );

        if (!tagExists) {
            onTagsUpdate([...currentTags, tag]);
        }

        // Remove from suggestions
        setSuggestedTags(prev => prev.filter(t => t !== tag));
    };

    const handleRemoveTag = (tag: string) => {
        onTagsUpdate(currentTags.filter(t => t !== tag));
    };

    const handleDismissSuggestion = (tag: string) => {
        setSuggestedTags(prev => prev.filter(t => t !== tag));
    };

    const handleApplyAllSuggestions = () => {
        const newTags = [...currentTags];

        suggestedTags.forEach(tag => {
            const tagExists = newTags.some(
                existingTag => existingTag.toLowerCase() === tag.toLowerCase()
            );

            if (!tagExists) {
                newTags.push(tag);
            }
        });

        onTagsUpdate(newTags);
        setSuggestedTags([]);
    };

    return (
        <div className={clsx('space-y-3', className)}>
            {/* Current Tags */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Tag size={16} className="text-blue-600" />
                        Tags
                    </label>
                    <button
                        onClick={generateTags}
                        disabled={loading}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
                        title="Generate AI tag suggestions"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Generate</span>
                    </button>
                </div>

                {/* Display current tags */}
                <div className="flex flex-wrap gap-2">
                    {currentTags.length > 0 ? (
                        currentTags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200 shadow-sm animate-fade-in"
                            >
                                <Tag size={12} />
                                #{tag}
                                <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                    title="Remove tag"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic">
                            No tags yet. Click "Generate" to get AI suggestions.
                        </p>
                    )}
                </div>
            </div>

            {/* AI Tag Suggestions */}
            {(loading || suggestedTags.length > 0 || error) && (
                <div className="border-t border-gray-200 pt-3">
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-purple-700">
                            <Sparkles size={16} className="text-purple-600" />
                            AI Suggestions
                            {loading && <Loader2 size={14} className="animate-spin text-purple-500" />}
                        </label>
                        {suggestedTags.length > 1 && !loading && (
                            <button
                                onClick={handleApplyAllSuggestions}
                                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-full font-medium transition-colors shadow-sm"
                                title="Apply all suggestions"
                            >
                                Apply All
                            </button>
                        )}
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && suggestedTags.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <Loader2 size={16} className="animate-spin" />
                            <span>AI is analyzing your note to suggest tags...</span>
                        </div>
                    )}

                    {/* Suggested Tags */}
                    {!loading && suggestedTags.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {suggestedTags.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200 shadow-sm animate-fade-in hover:bg-purple-100 transition-all"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <Sparkles size={12} />
                                        #{tag}
                                        <div className="flex items-center gap-0.5 ml-1">
                                            <button
                                                onClick={() => handleAddTag(tag)}
                                                className="hover:bg-green-200 bg-green-100 text-green-700 rounded-full p-1 transition-colors"
                                                title="Add this tag"
                                            >
                                                <Plus size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleDismissSuggestion(tag)}
                                                className="hover:bg-purple-200 rounded-full p-1 transition-colors"
                                                title="Dismiss suggestion"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-purple-600 italic">
                                💡 Click <Plus size={10} className="inline" /> to add a tag, or <X size={10} className="inline" /> to dismiss.
                            </p>
                        </div>
                    )}

                    {/* Empty State after generation */}
                    {!loading && suggestedTags.length === 0 && !error && lastGeneratedContent && (
                        <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 italic">
                            No new tag suggestions at this time. All relevant tags may already be applied.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TagSuggestions;
