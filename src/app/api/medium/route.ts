import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://medium.com/feed/@maiaphrodite', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; MaiPortfolio/1.0;)'
            },
            next: { revalidate: 3600 } // Revalidate every hour
        });

        if (!response.ok) {
            throw new Error(`Medium API responded with ${response.status}`);
        }

        const xml = await response.text();

        // Simple Regex Parsing to avoid heavy XML dependencies
        const items = [];
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemContent = match[1];

            const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemContent.match(/<title>(.*?)<\/title>/);
            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);

            // Try to find first image in content:encoded
            const contentMatch = itemContent.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/);
            let thumbnail = null;
            if (contentMatch) {
                const imgMatch = contentMatch[1].match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) {
                    thumbnail = imgMatch[1];
                }
            }

            if (titleMatch && linkMatch) {
                items.push({
                    title: titleMatch[1],
                    link: linkMatch[1],
                    date: dateMatch ? new Date(dateMatch[1]).toLocaleDateString() : 'Recent',
                    thumbnail
                });
            }
        }

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Error fetching Medium feed:', error);
        return NextResponse.json({ items: [] }, { status: 500 });
    }
}
