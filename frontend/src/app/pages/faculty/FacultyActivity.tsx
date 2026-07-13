import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { PlusCircle, FileText, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import CreateQuestionForm from './components/CreateQuestionForm';
import CreateCommunityForm from './components/CreateCommunityForm';
import QuestionsList from './components/QuestionsList';
import CommunitiesList from './components/CommunitiesList';

const FacultyActivity = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("questions");
    const [showCreateQuestion, setShowCreateQuestion] = useState(false);
    const [showCreateCommunity, setShowCreateCommunity] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    className="w-fit text-orange-600 hover:text-orange-700 hover:bg-orange-50 -ml-2"
                    onClick={() => navigate('/faculty/dashboard')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activity Center</h1>
                    <p className="text-muted-foreground font-medium">Manage coding questions and student communities</p>
                </div>
            </div>

            <Tabs defaultValue="questions" className="w-full" onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="questions" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Questions Bank
                        </TabsTrigger>
                        <TabsTrigger value="communities" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Communities
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "questions" && (
                        <Button onClick={() => setShowCreateQuestion(true)} className="bg-orange-600 hover:bg-orange-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Question
                        </Button>
                    )}

                    {activeTab === "communities" && (
                        <Button onClick={() => setShowCreateCommunity(true)} className="bg-orange-600 hover:bg-orange-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Community
                        </Button>
                    )}
                </div>

                <TabsContent value="questions" className="space-y-4">
                    {showCreateQuestion ? (
                        <CreateQuestionForm onCancel={() => setShowCreateQuestion(false)} onSuccess={() => setShowCreateQuestion(false)} />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>My Questions</CardTitle>
                                <CardDescription>Manage your coding and theory questions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <QuestionsList />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="communities" className="space-y-4">
                    {showCreateCommunity ? (
                        <CreateCommunityForm onCancel={() => setShowCreateCommunity(false)} onSuccess={() => setShowCreateCommunity(false)} />
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>My Communities</CardTitle>
                                <CardDescription>Engage with students in section-wise communities.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CommunitiesList />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FacultyActivity;
