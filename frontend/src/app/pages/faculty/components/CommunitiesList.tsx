import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Users, MessageCircle } from 'lucide-react';
import facultyActivityService from '@/app/services/facultyActivityService';

const CommunitiesList = () => {
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const res = await facultyActivityService.getCommunities();
                if (res.success) {
                    setCommunities(res.data);
                }
            } catch (error) {
                console.error("Failed to load communities", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, []);

    if (loading) return <div>Loading communities...</div>;

    if (communities.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No communities found. Create one to get started!</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
                <Card key={community._id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{community.name}</span>
                            <Badge variant="outline" className="ml-2">
                                <Users className="w-3 h-3 mr-1" />
                                {community.sections.length} Sections
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{community.description || "No description provided."}</p>
                        <div className="flex flex-wrap gap-2">
                            {community.sections.slice(0, 3).map((sec: string) => (
                                <Badge key={sec} variant="secondary" className="text-xs">{sec}</Badge>
                            ))}
                            {community.sections.length > 3 && (
                                <Badge variant="secondary" className="text-xs">+{community.sections.length - 3}</Badge>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" className="w-full text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            View Discussion
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
};

export default CommunitiesList;
