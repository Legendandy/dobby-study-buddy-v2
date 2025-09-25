'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, StudyNote, ResearchRequest } from '@/lib/types';
import { 
  Search, 
  BookOpen, 
  Save,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  History,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [studyNotes, setStudyNotes] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ResearchRequest | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [recentRequests, setRecentRequests] = useState<ResearchRequest[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);
    
    // Load recent research requests
    const requests = StorageManager.getResearchRequests();
    setRecentRequests(requests.slice(0, 5)); // Show last 5 requests
  }, [router]);

  const handleCopyNotes = async () => {
    if (!studyNotes) return;

    try {
      await navigator.clipboard.writeText(studyNotes);
      setIsCopied(true);
      toast.success('Notes copied to clipboard!');
      
      // Reset the copy state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy notes:', error);
      toast.error('Failed to copy notes');
    }
  };

  const handleResearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a research query!');
      return;
    }

    if (query.trim().length < 3) {
      toast.error('Please provide a more detailed query (at least 3 characters)');
      return;
    }

    if (!user) {
      toast.error('User not found. Please refresh and try again.');
      return;
    }

    setIsResearching(true);
    setStudyNotes('');
    setShowSaveOptions(false);
    setIsCopied(false); // Reset copy state

    // Create and store research request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const researchRequest: ResearchRequest = {
      id: requestId,
      query: query.trim(),
      userId: user.id,
      status: 'processing',
      requestedAt: new Date().toISOString(),
    };

    setCurrentRequest(researchRequest);
    StorageManager.addResearchRequest(researchRequest);

    // Generate note title from query
    const generatedTitle = query.trim().length > 50 
      ? query.trim().substring(0, 50) + '...' 
      : query.trim();
    setNoteTitle(generatedTitle);

    try {
      console.log('Starting research for:', query);
      
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          userId: user.id,
        }),
      });

      console.log('Research API response status:', response.status);

      const result = await response.json();
      console.log('Research API result:', result);

      if (!response.ok) {
        const updatedRequest = {
          ...researchRequest,
          status: 'failed' as const,
          completedAt: new Date().toISOString(),
          error: result.error || 'Failed to generate study notes',
        };
        setCurrentRequest(updatedRequest);
        StorageManager.updateResearchRequest(updatedRequest);

        if (result.timeout) {
          toast.error('Research timed out. This query might be too complex. Try a simpler topic.');
        } else if (result.network) {
          toast.error('Connection error. Please check if the research service is running.');
        } else {
          toast.error(result.error || 'Failed to generate study notes');
        }
        return;
      }

      if (!result.studyNotes || result.studyNotes.trim().length === 0) {
        const updatedRequest = {
          ...researchRequest,
          status: 'failed' as const,
          completedAt: new Date().toISOString(),
          error: 'No study notes were generated',
        };
        setCurrentRequest(updatedRequest);
        StorageManager.updateResearchRequest(updatedRequest);
        toast.error('No study notes were generated. Please try a different query.');
        return;
      }

      // Success!
      const updatedRequest = {
        ...researchRequest,
        status: 'completed' as const,
        completedAt: new Date().toISOString(),
        result: result.studyNotes,
      };
      setCurrentRequest(updatedRequest);
      StorageManager.updateResearchRequest(updatedRequest);

      setStudyNotes(result.studyNotes);
      setShowSaveOptions(true);
      toast.success('Study notes generated successfully!');

      // Update recent requests
      const requests = StorageManager.getResearchRequests();
      setRecentRequests(requests.slice(0, 5));

    } catch (error) {
      console.error('Research error:', error);
      const updatedRequest = {
        ...researchRequest,
        status: 'failed' as const,
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
      setCurrentRequest(updatedRequest);
      StorageManager.updateResearchRequest(updatedRequest);
      toast.error(`Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResearching(false);
    }
  };

  const handleSaveNotes = () => {
    if (!studyNotes || !user) return;

    if (!noteTitle.trim()) {
      toast.error('Please provide a title for your notes!');
      return;
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const studyNote: StudyNote = {
      id: noteId,
      title: noteTitle.trim(),
      content: studyNotes,
      query: query.trim(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    StorageManager.addStudyNote(studyNote);
    toast.success('Study notes saved successfully!');
    setShowSaveOptions(false);
  };

  const getStatusIcon = (status: ResearchRequest['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: ResearchRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'processing':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  // Helper function to format study notes for display
  const formatNotesForDisplay = (notes: string) => {
    if (!notes) return '';
    
    // Split into paragraphs and format
    return notes
      .split('\n\n')
      .map((paragraph, index) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;
        
        // Check if it's a heading (starts with # or ##)
        if (trimmed.startsWith('##')) {
          return (
            <h3 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              {trimmed.replace(/^##\s*/, '')}
            </h3>
          );
        } else if (trimmed.startsWith('#')) {
          return (
            <h2 key={index} className="text-xl font-bold text-gray-900 mt-8 mb-4">
              {trimmed.replace(/^#\s*/, '')}
            </h2>
          );
        } 
        // Check for bullet points
        else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const items = trimmed.split('\n').filter(item => item.trim());
          return (
            <ul key={index} className="list-disc list-inside space-y-1 mb-4 text-gray-700">
              {items.map((item, itemIndex) => (
                <li key={itemIndex} className="ml-2">
                  {item.replace(/^[-•]\s*/, '')}
                </li>
              ))}
            </ul>
          );
        }
        // Regular paragraph
        else {
          return (
            <p key={index} className="text-gray-700 leading-relaxed mb-4">
              {trimmed}
            </p>
          );
        }
      })
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Research & Create Study Notes
            </h1>
            <p className="text-gray-600">
              Enter any topic to generate comprehensive study notes using AI research
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Research Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Query Input */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Research Query
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your research topic... (e.g., 'World War 2 causes and effects', 'Photosynthesis process', 'Machine Learning algorithms')"
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isResearching}
                  />
                  
                  <button
                    onClick={handleResearch}
                    disabled={isResearching || !query.trim() || query.trim().length < 3}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isResearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Start Research
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {isResearching && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Research in progress</span>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        The AI is researching your topic. 
                        Please be patient and don't close this tab.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Study Notes */}
              {studyNotes && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Generated Study Notes
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyNotes}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          isCopied 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                        }`}
                        title="Copy notes to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                      {showSaveOptions && (
                        <button
                          onClick={() => setShowSaveOptions(!showSaveOptions)}
                          className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save Notes
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Save Options */}
                  {showSaveOptions && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Note Title
                          </label>
                          <input
                            type="text"
                            value={noteTitle}
                            onChange={(e) => setNoteTitle(e.target.value)}
                            placeholder="Enter a title for these notes..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveNotes}
                            disabled={!noteTitle.trim()}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save Notes
                          </button>
                          <button
                            onClick={() => setShowSaveOptions(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Formatted Study Notes Display */}
                  <div className="prose max-w-none">
                    <div className="bg-gray-50 p-6 rounded-lg border">
                      <div className="study-notes-content">
                        {formatNotesForDisplay(studyNotes)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Request Status */}
              {currentRequest && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Current Research
                    </h3>
                  </div>

                  <div className={`p-3 rounded-lg border ${getStatusColor(currentRequest.status)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(currentRequest.status)}
                      <span className="font-medium capitalize">
                        {currentRequest.status}
                      </span>
                    </div>
                    <p className="text-sm mb-2">
                      <strong>Query:</strong> {currentRequest.query}
                    </p>
                    <p className="text-xs text-gray-600">
                      Started: {new Date(currentRequest.requestedAt).toLocaleString()}
                    </p>
                    {currentRequest.completedAt && (
                      <p className="text-xs text-gray-600">
                        Completed: {new Date(currentRequest.completedAt).toLocaleString()}
                      </p>
                    )}
                    {currentRequest.error && (
                      <p className="text-xs text-red-600 mt-1">
                        <strong>Error:</strong> {currentRequest.error}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Research Requests */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <History className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Research
                  </h3>
                </div>

                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.map((request) => (
                      <div key={request.id} className={`p-3 rounded-lg border text-sm ${getStatusColor(request.status)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(request.status)}
                          <span className="font-medium">
                            {request.query.length > 30 
                              ? request.query.substring(0, 30) + '...' 
                              : request.query
                            }
                          </span>
                        </div>
                        <p className="text-xs opacity-75">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No recent requests</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/study-notes')}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 p-3 rounded-lg text-left transition-colors flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    View Saved Notes
                  </button>
                  
                  <button
                    onClick={() => router.push('/quiz/create')}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 p-3 rounded-lg text-left transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Create Quiz
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Research Tips
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Be specific with your queries for better results</p>
                  <p>• Researching takes a some minute, please be patient. If you get an error, kindly try again</p>
                  <p>• Copy notes to use elsewhere or save for later</p>
                  <p>• Use saved notes to create quizzes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom styles for better formatting */}
      <style jsx>{`
        .study-notes-content h2 {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        
        .study-notes-content h3 {
          color: #374151;
          font-weight: 600;
        }
        
        .study-notes-content ul {
          margin-left: 1rem;
        }
        
        .study-notes-content li {
          margin-bottom: 0.25rem;
        }
        
        .study-notes-content p {
          text-align: justify;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}