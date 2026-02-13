export interface MediumArticle {
    title: string;
    link: string;
    date: string;
    thumbnail?: string;
}

export const fetchMediumArticles = async (): Promise<MediumArticle[]> => {
    try {
        // Check localStorage cache
        const cacheKey = 'medium_articles_cache';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache for 1 hour
            if (Date.now() - timestamp < 1000 * 60 * 60) {
                return data;
            }
        }

        const response = await fetch('/api/medium');

        if (!response.ok) {
            throw new Error('Failed to fetch articles');
        }

        const { items } = await response.json();

        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
            data: items,
            timestamp: Date.now()
        }));

        return items;
    } catch (error) {
        console.error('Error fetching Medium articles:', error);
        return [];
    }
};
