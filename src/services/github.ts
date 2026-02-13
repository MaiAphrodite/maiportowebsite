export interface GithubRepo {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    updated_at: string;
    topics: string[];
}

export const fetchGithubRepos = async (username: string): Promise<GithubRepo[]> => {
    try {
        // Check localStorage cache first to avoid rate limits
        const cacheKey = `github_repos_${username}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache for 1 hour
            if (Date.now() - timestamp < 1000 * 60 * 60) {
                return data;
            }
        }

        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);

        if (!response.ok) {
            throw new Error('Failed to fetch repos');
        }

        const data = await response.json();

        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
        }));

        return data;
    } catch (error) {
        console.error('Error fetching repos:', error);
        return [];
    }
};

export interface GithubUserProfile {
    login: string;
    name: string;
    bio: string;
    location: string;
    blog: string;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
}

export const fetchGithubUser = async (username: string): Promise<GithubUserProfile | null> => {
    try {
        const cacheKey = `github_user_${username}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 1000 * 60 * 60) return data;
        }

        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();

        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
};

export const inferTechStack = (repos: GithubRepo[]): string[] => {
    const languages = new Set<string>();
    repos.forEach(repo => {
        if (repo.language) languages.add(repo.language);
    });

    // Add some "inferred" techs based on topics or common stacks
    // Simple heuristic: if specific languages exist, add frameworks
    if (languages.has('TypeScript') || languages.has('JavaScript')) {
        languages.add('React');
        languages.add('Next.js');
        languages.add('Tailwind');
    }
    if (languages.has('Rust')) languages.add('Tauri'); // Assumption for desktop apps
    if (languages.has('Python')) languages.add('AI/ML'); // Assumption

    return Array.from(languages).slice(0, 8); // Top 8
};

export const fetchRepoReadme = async (owner: string, repo: string): Promise<string | null> => {
    try {
        const cacheKey = `github_readme_${owner}_${repo}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 1000 * 60 * 60) return data;
        }

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
            headers: { Accept: 'application/vnd.github.raw+json' }
        });
        if (!response.ok) return null;
        const data = await response.text();

        localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        return data;
    } catch (error) {
        console.error('Error fetching README:', error);
        return null;
    }
};
