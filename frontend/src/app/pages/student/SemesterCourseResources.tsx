import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft, FileText, Download, Eye, BookOpen,
  AlertCircle, Loader2, File, Image, Film
} from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

interface ContentItem {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  type?: string;
  subject?: string;
  section?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  uploadedBy?: string;
  createdAt?: string;
}

function getFileIcon(fileType?: string, fileName?: string) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf') || ext === 'pdf') return FileText;
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return Image;
  if (type.includes('video') || ['mp4', 'avi', 'mov', 'mkv'].includes(ext)) return Film;
  return File;
}

function getFileTypeBadge(fileType?: string, fileName?: string) {
  const ext = (fileName || '').split('.').pop()?.toUpperCase() || '';
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf') || ext === 'PDF') return { label: 'PDF', color: 'bg-red-100 text-red-700' };
  if (type.includes('presentation') || ext === 'PPT' || ext === 'PPTX')
    return { label: ext || 'PPT', color: 'bg-orange-100 text-orange-700' };
  if (type.includes('image')) return { label: ext || 'IMG', color: 'bg-green-100 text-green-700' };
  if (type.includes('video')) return { label: ext || 'VID', color: 'bg-purple-100 text-purple-700' };
  if (type.includes('word') || ext === 'DOCX' || ext === 'DOC')
    return { label: ext || 'DOC', color: 'bg-blue-100 text-blue-700' };
  return { label: ext || 'FILE', color: 'bg-gray-100 text-gray-700' };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch {
    return '';
  }
}

export default function SemesterCourseResources() {
  const { courseName } = useParams<{ courseName: string }>();
  const navigate = useNavigate();
  const [resources, setResources] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedCourseName = decodeURIComponent(courseName || '');

  useEffect(() => {
    fetchResources();
  }, [courseName]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/api/content?subject=${encodeURIComponent(decodedCourseName)}`,
        { headers }
      );

      if (!res.ok) throw new Error(`Failed to fetch resources (${res.status})`);
      const data: ContentItem[] = await res.json();
      setResources(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item: ContentItem) => {
    const id = item._id || item.id;
    if (!id) return;
    const token = localStorage.getItem('token');
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    window.open(`${API_BASE_URL}/api/content/view/${id}${tokenQuery}`, '_blank');
  };

  const handleDownload = (item: ContentItem) => {
    const id = item._id || item.id;
    if (!id) return;
    const token = localStorage.getItem('token');
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    const a = document.createElement('a');
    a.href = `${API_BASE_URL}/api/content/download/${id}${tokenQuery}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Back */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/learning')}
            className="flex items-center space-x-2 hover:border-[#FF7A00] hover:text-[#FF7A00]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Learning</span>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{decodedCourseName}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Study materials uploaded by your faculty &amp; mentor
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF7A00] mb-4" />
            <p>Loading resources...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty state */}
        {!loading && !error && resources.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-gray-500">
              <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No materials uploaded yet</h3>
              <p className="text-sm text-gray-500 text-center max-w-sm">
                Your faculty hasn't uploaded any study materials for{' '}
                <strong>{decodedCourseName}</strong> yet. Check back later.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resources */}
        {!loading && !error && resources.length > 0 && (
          <>
            <p className="text-sm text-gray-500">
              {resources.length} material{resources.length !== 1 ? 's' : ''} available
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((item) => {
                const FileIcon = getFileIcon(item.fileType, item.fileName);
                const badge = getFileTypeBadge(item.fileType, item.fileName);
                return (
                  <Card
                    key={item._id}
                    className="shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-[#FF7A00] bg-opacity-10 rounded-lg flex-shrink-0">
                          <FileIcon className="w-6 h-6 text-[#FF7A00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug break-words">
                              {item.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                            {item.uploadedBy && <span>By {item.uploadedBy}</span>}
                            {item.createdAt && (
                              <>
                                <span>•</span>
                                <span>{formatDate(item.createdAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs hover:border-[#FF7A00] hover:text-[#FF7A00]"
                          onClick={() => handleView(item)}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs bg-[#FF7A00] hover:bg-[#FF6A00]"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}
