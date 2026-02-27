import { Sparkles, AlertCircle } from "lucide-react";

interface AiInsightPanelProps {
    isLoading: boolean;
    error: string | null;
    content: string | null;
    className?: string;
}

// A simple utility to render basic markdown like **bold** and line breaks
function renderFormattedText(text: string) {
    if (!text) return null;

    // Split by newlines to create paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');

    return paragraphs.map((paragraph, pIndex) => {
        // Handle bold text **...**
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);

        return (
            <p key={pIndex} className="mb-2 last:mb-0 text-sm leading-relaxed">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // Text is bold
                        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </p>
        );
    });
}

export default function AiInsightPanel({ isLoading, error, content, className = '' }: AiInsightPanelProps) {
    if (!isLoading && !error && !content) {
        return null;
    }

    return (
        <div className={`relative overflow-hidden rounded-lg border border-primary/20 bg-primary/5 p-4 mt-4 shadow-sm backdrop-blur-sm transition-all duration-300 ${className}`}>
            {/* Decorative background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

            <div className="relative flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                    {error ? (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                    ) : (
                        <div className="relative">
                            <Sparkles className={`w-5 h-5 text-primary ${isLoading ? 'animate-pulse' : ''}`} />
                            {isLoading && (
                                <span className="absolute inset-0 block w-full h-full rounded-full bg-primary/20 animate-ping" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 text-muted-foreground">
                    {/* Header */}
                    <div className="mb-1 flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            AI Insight
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">Cortex</span>
                        </h4>
                    </div>

                    {/* Content */}
                    <div className="w-full">
                        {isLoading ? (
                            <div className="space-y-2 mt-2">
                                <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                                <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
                                <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
                            </div>
                        ) : error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : content ? (
                            <div className="mt-1 text-foreground/80">
                                {renderFormattedText(content)}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
