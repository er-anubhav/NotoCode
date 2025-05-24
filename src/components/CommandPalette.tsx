
import React, { useState, useEffect } from 'react';
import { Search, FileText, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onFileSelect,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten files for searching
  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node);
      }
      if (node.children) {
        result = result.concat(flattenFiles(node.children));
      }
    }
    return result;
  };

  const allFiles = flattenFiles(files);
  const filteredFiles = allFiles.filter(file =>
    file.name.toLowerCase().includes(query.toLowerCase()) ||
    file.path.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredFiles.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredFiles[selectedIndex]) {
            onFileSelect(filteredFiles[selectedIndex]);
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredFiles, selectedIndex, onFileSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      <div className="w-full max-w-2xl mx-4 bg-vintage-gray-800 border border-vintage-gray-600 rounded-lg shadow-2xl animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-vintage-gray-700">
          <Search className="w-5 h-5 text-vintage-gray-400" />
          <input
            type="text"
            placeholder="Search for problems, algorithms, data structures..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-vintage-gray-400 outline-none"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-vintage-gray-400">
              {query ? 'No files found' : 'Start typing to search...'}
            </div>
          ) : (
            <div className="p-2">
              {filteredFiles.map((file, index) => (
                <button
                  key={file.path}
                  onClick={() => {
                    onFileSelect(file);
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-vintage-purple/20 text-vintage-purple-light'
                      : 'hover:bg-vintage-gray-700 text-gray-300'
                  )}
                >
                  <FileText className="w-4 h-4 text-vintage-amber flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {file.name.replace(/\.md$/, '').replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-vintage-gray-400 truncate">
                      {file.path}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-vintage-gray-700 text-xs text-vintage-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>{filteredFiles.length} results</div>
        </div>
      </div>
    </div>
  );
};
