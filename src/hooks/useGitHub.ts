
import { useState, useEffect } from 'react';
import { GitHubService, FileNode } from '@/services/githubService';

interface UseGitHubConfig {
  owner: string;
  repo: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseGitHubReturn {
  files: FileNode[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  fetchFileContent: (path: string) => Promise<string>;
  getFileUrl: (path: string) => string;
  clearCache: () => void;
}

export const useGitHub = ({
  owner,
  repo,
  autoRefresh = false,
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}: UseGitHubConfig): UseGitHubReturn => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubService] = useState(() => new GitHubService(owner, repo));

  const fetchData = async () => {
    try {
      setError(null);
      const structure = await githubService.fetchRepoStructure();
      setFiles(structure);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repository data';
      setError(errorMessage);
      console.error('GitHub fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await fetchData();
  };

  const fetchFileContent = async (path: string): Promise<string> => {
    return githubService.fetchFileContent(path);
  };

  const getFileUrl = (path: string): string => {
    return githubService.getFileUrl(path);
  };

  const clearCache = (): void => {
    githubService.clearCache();
  };

  useEffect(() => {
    fetchData();
  }, [owner, repo]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    files,
    isLoading,
    error,
    refreshData,
    fetchFileContent,
    getFileUrl,
    clearCache
  };
};
