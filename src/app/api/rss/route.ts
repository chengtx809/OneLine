import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

export async function GET() {
  try {
    const rssUrl = 'https://rsshub.app/guancha/headline';
    const response = await fetch(rssUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml, { explicitArray: false });

    const items = result.rss.channel.item.map((item: any) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      description: item.description,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error fetching or parsing RSS feed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}