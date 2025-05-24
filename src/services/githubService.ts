const GITHUB_API_BASE = 'https://api.github.com';

// GitHub Personal Access Token for higher rate limits
// This is a public token with read-only access to public repositories
const GITHUB_TOKEN = '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';

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
  sha: string;
}

interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file';
  content: string;
  encoding: 'base64';
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  sha?: string;
}

export class GitHubService {
  private owner: string;
  private repo: string;
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DSA-Solutions-Viewer'
    };

    // Add authorization header if token is available
    if (GITHUB_TOKEN) {
  headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
}

    return headers;
  }

  private getCacheKey(path: string): string {
    return `${this.owner}/${this.repo}/${path}`;
  }

  private isValidCache(cacheEntry: any): boolean {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
  }

  async fetchRepoStructure(path: string = ''): Promise<FileNode[]> {
    const cacheKey = this.getCacheKey(`structure:${path}`);
    const cached = this.cache.get(cacheKey);
    
    if (this.isValidCache(cached)) {
      console.log('Using cached repo structure for:', path);
      return cached.data;
    }

    try {
      const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}`;
      console.log('Fetching repo structure:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API Error Response:', errorText);
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      const data: GitHubFile[] = await response.json();
      console.log('Fetched repo data:', data.length, 'items');
      
      const processedData = await Promise.all(
        data.map(async (item): Promise<FileNode> => {
          if (item.type === 'dir') {
            try {
              const children = await this.fetchRepoStructure(item.path);
              return {
                name: item.name,
                path: item.path,
                type: 'folder',
                children,
                sha: item.sha
              };
            } catch (error) {
              console.warn(`Failed to fetch folder contents for ${item.path}:`, error);
              return {
                name: item.name,
                path: item.path,
                type: 'folder',
                children: [],
                sha: item.sha
              };
            }
          } else {
            return {
              name: item.name,
              path: item.path,
              type: 'file',
              sha: item.sha
            };
          }
        })
      );

      // Cache the result
      this.cache.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      });

      console.log('Successfully processed repo structure:', processedData.length, 'items');
      return processedData;
    } catch (error) {
      console.error('Error fetching repo structure:', error);
      throw error;
    }
  }

  async fetchFileContent(path: string): Promise<string> {
    const cacheKey = this.getCacheKey(`content:${path}`);
    const cached = this.cache.get(cacheKey);
    
    if (this.isValidCache(cached)) {
      console.log('Using cached file content for:', path);
      return cached.data;
    }

    try {
      const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}`;
      console.log('Fetching file content:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API Error Response:', errorText);
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }

      const data: GitHubContent = await response.json();
      
      if (data.type !== 'file') {
        throw new Error('Requested path is not a file');
      }

      // Decode base64 content
      const content = atob(data.content);
      console.log('Successfully fetched file content for:', path);

      // Cache the result
      this.cache.set(cacheKey, {
        data: content,
        timestamp: Date.now()
      });

      return content;
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log('GitHub service cache cleared');
  }

  getRepoUrl(): string {
    return `https://github.com/${this.owner}/${this.repo}`;
  }

  getFileUrl(path: string): string {
    return `${this.getRepoUrl()}/blob/main/${path}`;
  }
}
