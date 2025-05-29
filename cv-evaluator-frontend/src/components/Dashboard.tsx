'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';

type Evaluation = {
  filename: string;
  matchScore: number;
  sections: {
    title: string;
    status: 'success' | 'warning' | 'error';
    description: string | string[];
  }[];
};

type Props = {
  evaluations: Evaluation[];
};

const Dashboard = ({ evaluations }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'highest' | 'lowest'>('all');
  const [activeEval, setActiveEval] = useState<number | null>(null);

  const filteredEvaluations = useMemo(() => {
    let data = evaluations.filter(e =>
      e.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sections.some(section =>
        typeof section.description === 'string'
          ? section.description.toLowerCase().includes(searchTerm.toLowerCase())
          : section.description.some(desc =>
              desc.toLowerCase().includes(searchTerm.toLowerCase())
            )
      )
    );

    if (filter === 'highest') {
      data.sort((a, b) => b.matchScore - a.matchScore);
    } else if (filter === 'lowest') {
      data.sort((a, b) => a.matchScore - b.matchScore);
    }

    return data;
  }, [evaluations, searchTerm, filter]);

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">📄 Dashboard</h1>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search by filename or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'highest' ? 'default' : 'outline'}
            onClick={() => setFilter('highest')}
          >
            <ArrowUpWideNarrow className="w-4 h-4 mr-1" />
            Highest Rated
          </Button>
          <Button
            variant={filter === 'lowest' ? 'default' : 'outline'}
            onClick={() => setFilter('lowest')}
          >
            <ArrowDownWideNarrow className="w-4 h-4 mr-1" />
            Lowest Rated
          </Button>
        </div>
      </div>

      <ScrollArea className="space-y-6 h-[70vh] pr-4">
        {filteredEvaluations.map((evalData, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-md transition-all"
            onClick={() => setActiveEval(index === activeEval ? null : index)}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{evalData.filename}</h2>
                <span className="text-blue-600 font-bold">
                  Score: {evalData.matchScore}%
                </span>
              </div>
              <Progress value={evalData.matchScore} className="h-2 rounded" />

              {activeEval === index && (
                <div className="mt-4 space-y-4">
                  {evalData.sections.map((section, idx) => (
                    <div
                      key={idx}
                      className="bg-white border p-4 rounded-md flex gap-3 items-start"
                    >
                      {section.status === 'success' && (
                        <CheckCircle className="text-green-500 w-5 h-5 mt-1" />
                      )}
                      {section.status === 'warning' && (
                        <Clock className="text-yellow-500 w-5 h-5 mt-1" />
                      )}
                      {section.status === 'error' && (
                        <AlertCircle className="text-red-500 w-5 h-5 mt-1" />
                      )}

                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">
                          {section.title}
                        </h3>
                        {Array.isArray(section.description) ? (
                          <div className="flex flex-wrap gap-2">
                            {section.description.map((desc, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-gray-200 text-sm rounded-md"
                              >
                                {desc}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-700 text-sm">{section.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredEvaluations.length === 0 && (
          <div className="text-center text-gray-500 mt-16 text-lg">
            No evaluations match your search/filter.
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Dashboard;
export type { Evaluation };
