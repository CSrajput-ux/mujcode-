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
            <div className="flex flex-col gap-1.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit text-orange-600 hover:text-orange-700 hover:bg-orange-50 -ml-2 h-8 px-2.5 text-xs sm:text-sm font-semibold"
                    onClick={() => navigate('/faculty/dashboard')}
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to Dashboard
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Activity Center</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Manage coding questions and student communities</p>
                </div>
            </div>

            <Tabs defaultValue="questions" className="w-full" onValueChange={setActiveTab}>
                <div className="flex justify-between items-center mb-4">
                    <TabsList className="h-10 p-1">
                        <TabsTrigger value="questions" className="flex items-center gap-2 text-sm py-1.5 px-4 font-medium">
                            <FileText className="w-4 h-4" />
                            Questions Bank
                        </TabsTrigger>
                        <TabsTrigger value="communities" className="flex items-center gap-2 text-sm py-1.5 px-4 font-medium">
                            <Users className="w-4 h-4" />
                            Communities
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "questions" && (
                        <Button onClick={() => setShowCreateQuestion(true)} className="bg-orange-600 hover:bg-orange-700 h-10 text-sm font-semibold px-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Question
                        </Button>
                    )}

                    {activeTab === "communities" && (
                        <Button onClick={() => setShowCreateCommunity(true)} className="bg-orange-600 hover:bg-orange-700 h-10 text-sm font-semibold px-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Community
                        </Button>
                    )}
                </div>

                <TabsContent value="questions" className="space-y-4">
                    {showCreateQuestion ? (
                        <CreateQuestionForm onCancel={() => setShowCreateQuestion(false)} onSuccess={() => setShowCreateQuestion(false)} />
                    ) : (
                        <Card className="shadow-xs border-gray-100">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-base sm:text-lg font-bold">My Questions</CardTitle>
                                <CardDescription className="text-sm">Manage your coding and theory questions.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-1">
                                <QuestionsList />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="communities" className="space-y-4">
                    {showCreateCommunity ? (
                        <CreateCommunityForm onCancel={() => setShowCreateCommunity(false)} onSuccess={() => setShowCreateCommunity(false)} />
                    ) : (
                        <Card className="shadow-xs border-gray-100">
                            <CardHeader className="p-5 pb-3">
                                <CardTitle className="text-base sm:text-lg font-bold">My Communities</CardTitle>
                                <CardDescription className="text-sm">Engage with students in section-wise communities.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-1">
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
