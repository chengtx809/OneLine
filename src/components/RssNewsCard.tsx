import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';

interface RssNewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

interface RssNewsCardProps {
  item: RssNewsItem;
  onAnalyze: (item: RssNewsItem) => void;
}

const RssNewsCard: React.FC<RssNewsCardProps> = ({ item, onAnalyze }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      return dateString; // Fallback to original string if parsing fails
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="text-lg font-semibold leading-tight">
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {item.title}
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-2">
          {formatDate(item.pubDate)}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {item.description.replace(/<[^>]*>?/gm, '')} {/* Remove HTML tags */}
        </p>
        <div className="absolute bottom-3 right-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAnalyze(item)}
            className="flex items-center gap-1 text-xs"
          >
            <Brain size={14} /> AI分析
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RssNewsCard;