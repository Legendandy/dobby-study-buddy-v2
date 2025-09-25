'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { StorageManager } from '@/lib/storage';
import type { User, StudyNote } from '@/lib/types';
import { 
  BookOpen, 
  Search,
  Calendar,
  ArrowLeft,
  Trash2,
  Edit3,
  Plus,
  FileText,
  Clock,
  ArrowRight,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudyNotesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);
    loadStudyNotes();
  }, [router]);

  const loadStudyNotes = () => {
    const notes = StorageManager.getStudyNotes();
    setStudyNotes(notes);
  };

  const filteredNotes = studyNotes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      StorageManager.deleteStudyNote(noteId);
      loadStudyNotes();
      toast.success('Note deleted successfully');
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  const handleEditNote = (note: StudyNote) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedNote || !editTitle.trim()) {
      toast.error('Please provide a valid title');
      return;
    }

    const updatedNote: StudyNote = {
      ...selectedNote,
      title: editTitle.trim(),
      content: editContent.trim(),
      updatedAt: new Date().toISOString(),
    };

    StorageManager.updateStudyNote(updatedNote);
    loadStudyNotes();
    setSelectedNote(updatedNote);
    setIsEditing(false);
    toast.success('Note updated successfully');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
    }
  };

  const handleUseForQuiz = (note: StudyNote) => {
    // Store the note content in session storage for the quiz creator
    sessionStorage.setItem('importedNotes', note.content);
    router.push('/quiz/create');
    toast.success('Notes imported to quiz creator');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">

          <div className="mb-6">
            <Link 
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Dashboard
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Study Notes
                </h1>
                <p className="text-gray-600">
                  View and manage your saved study notes
                </p>
              </div>
              <button
                onClick={() => router.push('/research')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Notes
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notes by title, query, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Notes List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Your Notes ({filteredNotes.length})
                  </h2>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {filteredNotes.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {filteredNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedNote?.id === note.id 
                              ? 'bg-blue-50 border-r-4 border-blue-500' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedNote(note)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {note.title}
                              </h3>
                              <p className="text-sm text-gray-500 truncate mt-1">
                                Query: {note.query}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(note.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditNote(note);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit note"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNote(note.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete note"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'No notes found matching your search' : 'No study notes yet'}
                      </p>
                      <button
                        onClick={() => router.push('/research')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Plus className="w-4 h-4" />
                        Create Your First Notes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Note Viewer/Editor */}
            <div className="lg:col-span-2">
              {selectedNote ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-300 focus:border-blue-500 outline-none flex-1 mr-4"
                          placeholder="Note title..."
                        />
                      ) : (
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedNote.title}
                        </h2>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditNote(selectedNote)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleUseForQuiz(selectedNote)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              Use for Quiz
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {!isEditing && (
                      <div className="mt-4 text-sm text-gray-500 space-y-2">
                        <p><strong>Original Query:</strong> {selectedNote.query}</p>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Created: {formatDate(selectedNote.createdAt)}
                          </span>
                          {selectedNote.updatedAt !== selectedNote.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Updated: {formatDate(selectedNote.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Note content..."
                      />
                    ) : (
                      <div className="prose max-w-none">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                            {selectedNote.content}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select a Note to View
                  </h3>
                  <p className="text-gray-500">
                    Choose a note from the list to view its content
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}