
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ContentViewer } from '@/components/ContentViewer';
import { CommandPalette } from '@/components/CommandPalette';
import { useToast } from '@/hooks/use-toast';
import { useGitHub } from '@/hooks/useGitHub';
import { FileNode } from '@/services/githubService';

// Configuration - you can change these to point to any public DSA repo
const GITHUB_CONFIG = {
  owner: 'er-anubhav',
  repo: 'DataStructures',
  autoRefresh: true,
  refreshInterval: 10 * 60 * 1000 // 10 minutes
};

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [content, setContent] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const { toast } = useToast();

  const {
    files,
    isLoading,
    error,
    refreshData,
    fetchFileContent,
    getFileUrl,
    clearCache
  } = useGitHub(GITHUB_CONFIG);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file' && file.name.endsWith('.md')) {
      setSelectedFile(file);
      setIsLoadingContent(true);
      
      try {
        const fileContent = await fetchFileContent(file.path);
        setContent(fileContent);
        console.log('Loaded file:', file.path);
        
        toast({
          title: "File loaded",
          description: `Successfully loaded ${file.name}`,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load file content';
        toast({
          title: "Error loading file",
          description: errorMessage,
          variant: "destructive",
        });
        console.error('Error loading file content:', err);
      } finally {
        setIsLoadingContent(false);
      }
    }
  };

  const handleRefresh = async () => {
    clearCache();
    await refreshData();
    toast({
      title: "Repository refreshed",
      description: "Latest content has been fetched from GitHub.",
    });
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "GitHub Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-vintage-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-vintage-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-serif text-vintage-purple-light">Loading DSA Solutions...</h2>
          <p className="text-vintage-gray-400 mt-2">Fetching from GitHub repository</p>
          <p className="text-sm text-vintage-gray-500 mt-1">
            {GITHUB_CONFIG.owner}/{GITHUB_CONFIG.repo}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && files.length === 0) {
    return (
      <div className="min-h-screen bg-vintage-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 text-red-500">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 font-serif mb-4">
            Failed to Load Repository
          </h2>
          <p className="text-vintage-gray-400 mb-6 leading-relaxed">
            Could not fetch content from {GITHUB_CONFIG.owner}/{GITHUB_CONFIG.repo}
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-vintage-purple hover:bg-vintage-purple/80 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vintage-gray-900 flex">
      <Sidebar
        files={files}
        selectedFile={selectedFile?.path || null}
        onFileSelect={handleFileSelect}
        onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
      />
      
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <ContentViewer
            content={content}
            fileName={selectedFile.name}
            lastUpdated="Live from GitHub"
            githubUrl={getFileUrl(selectedFile.path)}
            isLoading={isLoadingContent}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-vintage-gray-900">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-6 terminal-glow">⚡</div>
              <h2 className="text-3xl font-bold text-vintage-purple-light font-serif mb-4">
                DSA Solutions
              </h2>
              <p className="text-vintage-gray-400 mb-6 leading-relaxed">
                Select a problem from the sidebar to view the solution, or press{' '}
                <kbd className="px-2 py-1 bg-vintage-gray-700 border border-vintage-gray-600 rounded text-sm font-mono">
                  ⌘K
                </kbd>{' '}
                to search.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center gap-2 text-sm text-vintage-gray-500">
                  <div className="w-2 h-2 bg-vintage-green rounded-full animate-glow"></div>
                  <span>Connected to {GITHUB_CONFIG.owner}/{GITHUB_CONFIG.repo}</span>
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-vintage-gray-400 hover:text-vintage-green transition-colors"
                >
                  <span>⌘R to refresh</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
};

export default Index;
