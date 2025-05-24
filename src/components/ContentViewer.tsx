import React from 'react';
import { Clock, ExternalLink, GitBranch, Loader2 } from 'lucide-react';

interface ContentViewerProps {
  content: string;
  fileName: string;
  lastUpdated?: string;
  githubUrl?: string;
  isLoading?: boolean;
}

export const ContentViewer: React.FC<ContentViewerProps> = ({
  content,
  fileName,
  lastUpdated,
  githubUrl,
  isLoading = false,
}) => {
  // Simple markdown to HTML conversion for demo
  const convertMarkdownToHTML = (markdown: string) => {
    return markdown
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Add support for markdown links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="leetcode-link">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.*)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<pre>.*<\/pre>)<\/p>/g, '$1');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-vintage-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-vintage-purple-light mx-auto mb-4" />
          <p className="text-vintage-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-vintage-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-vintage-gray-700 bg-vintage-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-vintage-purple-light font-serif">
              {fileName.replace(/\.md$/, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-vintage-gray-400">
              {lastUpdated && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Updated {lastUpdated}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <GitBranch className="w-4 h-4" />
                <span>main</span>
              </div>
            </div>
          </div>
          
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-vintage-gray-700 hover:bg-vintage-gray-600 border border-vintage-gray-600 rounded-md text-vintage-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on GitHub</span>
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div 
            className="markdown-content animate-fade-in"
            dangerouslySetInnerHTML={{ 
              __html: convertMarkdownToHTML(content) 
            }}
          />
        </div>
      </div>
    </div>
  );
};
