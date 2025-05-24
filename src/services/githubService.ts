const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

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

  async fetchRepoStructure(): Promise<FileNode[]> {
    const cacheKey = this.getCacheKey('structure:tree');
    const cached = this.cache.get(cacheKey);
    if (this.isValidCache(cached)) {
      console.log('Using cached repo structure (tree API)');
      return cached.data;
    }
    try {
      // Use the recursive tree API
      const url = `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/git/trees/main?recursive=1`;
      console.log('Fetching repo structure (tree API):', url);
      const response = await fetch(url, { headers: this.getHeaders(), cache: 'no-store' });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub API Error Response:', errorText);
        throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      if (!data.tree) throw new Error('No tree data found');
      // Convert tree to FileNode structure
      const fileMap: Record<string, FileNode> = {};
      data.tree.forEach((item: any) => {
        const type = item.type === 'tree' ? 'folder' : 'file';
        fileMap[item.path] = { name: item.path.split('/').pop(), path: item.path, type, sha: item.sha };
      });
      // Build hierarchy
      Object.values(fileMap).forEach(node => {
        const parentPath = node.path.includes('/') ? node.path.substring(0, node.path.lastIndexOf('/')) : null;
        if (parentPath && fileMap[parentPath]) {
          if (!fileMap[parentPath].children) fileMap[parentPath].children = [];
          fileMap[parentPath].children.push(node);
        }
      });
      // Only return top-level nodes
      const processedData = Object.values(fileMap).filter(node => !node.path.includes('/'));
      this.cache.set(cacheKey, { data: processedData, timestamp: Date.now() });
      console.log('Successfully processed repo structure (tree API):', processedData.length, 'items');
      return processedData;
    } catch (error) {
      console.error('Error fetching repo structure (tree API):', error);
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
