
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Search, Command, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

interface SidebarProps {
  files: FileNode[];
  selectedFile: string | null;
  onFileSelect: (file: FileNode) => void;
  onCommandPaletteOpen: () => void;
}

const FileTreeItem: React.FC<{
  node: FileNode;
  level: number;
  selectedFile: string | null;
  onFileSelect: (file: FileNode) => void;
}> = ({ node, level, selectedFile, onFileSelect }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded);
    } else if (node.name.endsWith('.md')) {
      onFileSelect(node);
    }
  };

  const isSelected = selectedFile === node.path;
  const isMarkdownFile = node.type === 'file' && node.name.endsWith('.md');
  const isClickable = node.type === 'folder' || isMarkdownFile;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all duration-200 group',
          isClickable && 'cursor-pointer hover:bg-vintage-gray-700',
          !isClickable && 'opacity-50 cursor-not-allowed',
          isSelected && 'bg-vintage-purple/20 text-vintage-purple-light border-l-2 border-vintage-purple',
          level > 0 && 'ml-4'
        )}
        onClick={handleClick}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {node.type === 'folder' && (
          <span className="text-vintage-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        
        <span className={cn(
          node.type === 'folder' ? 'text-vintage-amber' : 'text-vintage-green'
        )}>
          {node.type === 'folder' ? (
            <Folder className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </span>
        
        <span className={cn(
          'flex-1 truncate',
          node.type === 'folder' ? 'text-vintage-amber' : 'text-gray-300',
          isSelected && 'text-vintage-purple-light font-medium',
          !isMarkdownFile && node.type === 'file' && 'text-vintage-gray-500'
        )}>
          {node.name}
        </span>
        
        {!isMarkdownFile && node.type === 'file' && (
          <span className="text-xs text-vintage-gray-600">
            {node.name.split('.').pop()?.toUpperCase()}
          </span>
        )}
      </div>
      
      {node.type === 'folder' && isExpanded && node.children && (
        <div className="animate-accordion-down">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFile,
  onFileSelect,
  onCommandPaletteOpen,
}) => {
  // Count total markdown files
  const countMarkdownFiles = (nodes: FileNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'file' && node.name.endsWith('.md')) {
        return count + 1;
      } else if (node.type === 'folder' && node.children) {
        return count + countMarkdownFiles(node.children);
      }
      return count;
    }, 0);
  };

  const totalFiles = countMarkdownFiles(files);

  return (
    <div className="w-80 bg-vintage-gray-800 border-r border-vintage-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-vintage-gray-700">
        <h1 className="text-xl font-bold text-vintage-purple-light font-serif">
          DSA Solutions
        </h1>
        <p className="text-sm text-vintage-gray-400 mt-1">
          Digital Notebook
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-vintage-gray-700">
        <button
          onClick={onCommandPaletteOpen}
          className="w-full flex items-center gap-3 px-3 py-2 bg-vintage-gray-700 border border-vintage-gray-600 rounded-md text-vintage-gray-400 hover:text-vintage-green transition-colors group"
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-left text-sm">Search problems...</span>
          <div className="flex items-center gap-1 text-xs">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-b border-vintage-gray-700">
        <div className="text-xs text-vintage-gray-500">
          {totalFiles} problems • {files.length} categories
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {files.length > 0 ? (
            files.map((file) => (
              <FileTreeItem
                key={file.path}
                node={file}
                level={0}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            ))
          ) : (
            <div className="text-center py-8 text-vintage-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files found</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-vintage-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-vintage-gray-500">
            <div className="w-2 h-2 bg-vintage-green rounded-full animate-glow"></div>
            <span>Live sync enabled</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="text-vintage-gray-500 hover:text-vintage-green transition-colors"
            title="Refresh (⌘R)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
