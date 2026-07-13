import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { Search, BookOpen, Clock, CheckCircle2, Infinity } from 'lucide-react';
import { toast } from 'sonner';

interface MockTest {
    _id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    duration: number;
    totalQuestions: number;
    questionsPerAttempt: number;
    attemptsAllowed: number;
    category: string;
}

interface MockTestsListProps {
    onStartTest: (id: string) => void;
}

export default function MockTestsList({ onStartTest }: MockTestsListProps) {
    const [mockTests, setMockTests] = useState<MockTest[]>([]);
    const [filteredTests, setFilteredTests] = useState<MockTest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMockTests();
    }, []);

    useEffect(() => {
        filterTests();
    }, [searchQuery, difficultyFilter, mockTests]);

    const fetchMockTests = async () => {
        try {
            const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/mock-tests');
            const data = await res.json();
            setMockTests(data.mockTests || []);
            setFilteredTests(data.mockTests || []);
        } catch (error) {
            console.error('Error fetching mock tests:', error);
            toast.error('Failed to load mock tests');
        } finally {
            setLoading(false);
        }
    };

    const filterTests = () => {
        let filtered = [...mockTests];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(test =>
                test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                test.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by difficulty
        if (difficultyFilter !== 'All') {
            filtered = filtered.filter(test => test.difficulty === difficultyFilter);
        }

        setFilteredTests(filtered);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-500 text-white';
            case 'Medium': return 'bg-orange-500 text-white';
            case 'Hard': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading mock tests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="Search mock tests..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Difficulties</SelectItem>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Mock Tests Grid */}
            {filteredTests.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Mock Tests Found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTests.map((test) => (
                        <Card key={test._id} className="hover:shadow-lg transition-shadow border ">
                            <CardContent className="p-6 space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <Badge className={getDifficultyColor(test.difficulty)}>
                                        {test.difficulty}
                                    </Badge>
                                    {test.category && (
                                        <span className="text-xs text-gray-500 font-medium">
                                            {test.category}
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {test.title}
                                    </h3>
                                    {test.description && (
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {test.description}
                                        </p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center text-gray-600">
                                            <BookOpen className="w-4 h-4 mr-2 text-[#FF7A00]" />
                                            {test.questionsPerAttempt} Questions
                                        </span>
                                        <span className="flex items-center text-gray-600">
                                            <Clock className="w-4 h-4 mr-2 text-[#FF7A00]" />
                                            {test.duration} min
                                        </span>
                                    </div>

                                    {/* Attempts */}
                                    <div className="flex items-center text-sm">
                                        {test.attemptsAllowed === -1 ? (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                <Infinity className="w-3 h-3 mr-1" />
                                                Unlimited Attempts
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-gray-50">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                {test.attemptsAllowed} Attempts Allowed
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <Button
                                    onClick={() => onStartTest(test._id)}
                                    className="w-full bg-[#FF7A00] hover:bg-[#FF6A00] text-white"
                                >
                                    Start Mock Test
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
