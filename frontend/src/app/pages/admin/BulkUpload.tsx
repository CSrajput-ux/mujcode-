import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Upload, File, ArrowLeft, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { bulkUploadStudents, getFaculty } from '../../services/adminService';

export default function BulkUpload() {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [facultyList, setFacultyList] = useState<any[]>([]);
    const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);
    const [facultySearch, setFacultySearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        getFaculty({ limit: 1000 }).then(res => {
            setFacultyList(res.faculty || []);
        }).catch(err => console.error("Failed to fetch faculty", err));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus('idle');
            setMessage('');
        }
    };

    const toggleFaculty = (id: string) => {
        setSelectedFacultyIds(prev => 
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setStatus('idle');
        try {
            const res = await bulkUploadStudents(file, selectedFacultyIds);
            setStatus('success');
            setMessage(res.message || 'Students uploaded successfully!');
            setFile(null);
            setSelectedFacultyIds([]);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to upload students.');
        } finally {
            setUploading(false);
        }
    };

    const downloadSample = () => {
        const headers = ["Name", "Email", "RollNumber", "Branch", "Section", "Year", "Semester"];
        const sampleRow = ["John Doe", "john.doe@example.com", "2427030001", "CSE", "A", "1", "1"];
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + sampleRow.join(",");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "student_bulk_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredFaculty = facultyList.filter(f => 
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) || 
        (f.department && f.department.toLowerCase().includes(facultySearch.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/students')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Bulk Upload Students
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Upload a CSV or Excel file containing student records.
                    </p>
                </div>
            </div>

            <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Upload File & Assign Mentors</CardTitle>
                            <CardDescription>Upload students and optionally assign one or more faculty mentors to them.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={downloadSample} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-900/30">
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Assign Faculty Mentors (Optional)
                        </label>
                        <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-900">
                            <div className="p-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <input 
                                    type="text" 
                                    placeholder="Search faculty by name or department..." 
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    value={facultySearch}
                                    onChange={(e) => setFacultySearch(e.target.value)}
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                {filteredFaculty.length === 0 ? (
                                    <div className="p-3 text-sm text-gray-500 text-center">No faculty found.</div>
                                ) : (
                                    filteredFaculty.map(fac => {
                                        const id = fac._id || fac.id;
                                        const isSelected = selectedFacultyIds.includes(id);
                                        return (
                                            <label key={id} className={`flex items-center p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                                                    checked={isSelected}
                                                    onChange={() => toggleFaculty(id)}
                                                />
                                                <div className="ml-3">
                                                    <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>{fac.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{fac.department}</p>
                                                </div>
                                            </label>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                        {selectedFacultyIds.length > 0 && (
                            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                {selectedFacultyIds.length} faculty member(s) selected
                            </p>
                        )}
                    </div>

                    <div 
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors
                        ${file ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}
                    >
                        <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            {file ? (
                                <>
                                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4">
                                        <File className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{file.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                    <span className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium">Choose a different file</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <Upload className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Click to upload</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        CSV or Excel files only (max. 5MB)
                                    </p>
                                </>
                            )}
                        </label>
                    </div>

                    {status === 'success' && (
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 flex items-start">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
                            <p className="text-green-800 dark:text-green-300 font-medium text-sm">{message}</p>
                        </div>
                    )}
                    
                    {status === 'error' && (
                        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                            <p className="text-red-800 dark:text-red-300 font-medium text-sm">{message}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="outline" onClick={() => navigate('/admin/students')}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpload} 
                            disabled={!file || uploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {uploading ? 'Uploading...' : 'Upload Students'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
