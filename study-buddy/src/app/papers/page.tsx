'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Link from 'next/link';
import { StorageManager } from '@/lib/storage';
import type { User } from '@/lib/types';
import { 
  Search, 
  BookOpen, 
  ArrowLeft,
  Loader2,
  ExternalLink,
  Users,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Paper {
  id: string;
  doi: string | null;
  title: string;
  year: number;
  publicationDate: string;
  type: string;
  citationCount: number;
  abstract: string;
  fullAbstract: string;
  authors: Array<{
    name: string;
    orcid: string | null;
    institutions: string;
  }>;
  authorCount: number;
  concepts: Array<{
    name: string;
    score: number;
  }>;
  journal: string;
  isOpenAccess: boolean;
  oaStatus: string;
  pdfUrl: string | null;
  url: string;
  sdgs: Array<{
    name: string;
    score: number;
  }>;
}

export default function ScientificPapersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState('cited_by_count:desc');
  const [filterYear, setFilterYear] = useState('');
  const [filterOA, setFilterOA] = useState(false);

  useEffect(() => {
    const currentUser = StorageManager.getUser();
    if (!currentUser) {
      router.push('/onboarding');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleSearch = async (page = 1) => {
    if (!query.trim()) {
      toast.error('Please enter a search query!');
      return;
    }

    setIsSearching(true);
    setPapers([]);
    setSelectedPaper(null);

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        page: page.toString(),
        per_page: '20',
        sort: sortBy
      });

      // Add filters
      const filters: string[] = [];
      
      // Always filter for English language papers
      filters.push('language:en');
      
      if (filterYear) {
        filters.push(`publication_year:${filterYear}`);
      }
      if (filterOA) {
        filters.push('is_oa:true');
      }
      if (filters.length > 0) {
        params.append('filter', filters.join(','));
      }

      const response = await fetch(`/api/openalex?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to search papers');
      }

      const result = await response.json();
      
      setPapers(result.papers);
      setCurrentPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
      setTotalResults(result.meta.total);
      
      toast.success(`Found ${result.meta.total.toLocaleString()} papers!`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search papers. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    handleSearch(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getOAStatusColor = (status: string) => {
    switch (status) {
      case 'gold': return 'text-yellow-700 bg-yellow-100';
      case 'green': return 'text-green-700 bg-green-100';
      case 'hybrid': return 'text-blue-700 bg-blue-100';
      case 'bronze': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Scientific Papers Research
            </h1>
            <p className="text-gray-600">
              Search millions of English research papers from OpenAlex database
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Search Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search Bar */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Search Papers
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
                      placeholder="Search by title, author, topic, DOI..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSearching}
                    />
                    <button
                      onClick={() => handleSearch(1)}
                      disabled={isSearching || !query.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          Search
                        </>
                      )}
                    </button>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cited_by_count:desc">Most Cited</option>
                      <option value="publication_date:desc">Newest First</option>
                      <option value="publication_date:asc">Oldest First</option>
                    </select>

                    <input
                      type="number"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      placeholder="Year (e.g., 2024)"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-32"
                      min="1900"
                      max={new Date().getFullYear()}
                    />

                    <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={filterOA}
                        onChange={(e) => setFilterOA(e.target.checked)}
                        className="rounded"
                      />
                      <span>Open Access Only</span>
                    </label>
                  </div>

                  {totalResults > 0 && (
                    <p className="text-sm text-gray-600">
                      Found <strong>{totalResults.toLocaleString()}</strong> English papers
                    </p>
                  )}
                </div>
              </div>

              {/* Results */}
              {isSearching ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Searching OpenAlex database...</p>
                </div>
              ) : papers.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {papers.map((paper) => (
                      <div
                        key={paper.id}
                        className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all hover:shadow-md ${
                          selectedPaper?.id === paper.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedPaper(paper)}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {paper.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {paper.authors.slice(0, 2).map(a => a.name).join(', ')}
                                {paper.authorCount > 2 && ` +${paper.authorCount - 2}`}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {paper.year}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {paper.citationCount.toLocaleString()} citations
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {paper.isOpenAccess ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getOAStatusColor(paper.oaStatus)}`}>
                                {paper.oaStatus.toUpperCase()} OA
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-medium text-gray-700 bg-gray-100">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {paper.abstract || 'No abstract available.'}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {paper.concepts.slice(0, 3).map((concept, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                            >
                              {concept.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>

                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages.toLocaleString()}
                        </span>

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : query && !isSearching ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No papers found</h3>
                  <p className="text-gray-600">Try adjusting your search query or filters</p>
                </div>
              ) : null}
            </div>

            {/* Sidebar - Paper Details */}
            <div>
              {selectedPaper ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Paper Details
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {selectedPaper.title}
                      </h4>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Journal:</strong> {selectedPaper.journal}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Year:</strong> {selectedPaper.year}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Citations:</strong> {selectedPaper.citationCount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Type:</strong> {selectedPaper.type}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Authors:</p>
                      <div className="space-y-1">
                        {selectedPaper.authors.map((author, idx) => (
                          <p key={idx} className="text-sm text-gray-700">
                            {author.name}
                            {author.institutions && (
                              <span className="text-gray-500 text-xs ml-1">
                                ({author.institutions})
                              </span>
                            )}
                          </p>
                        ))}
                        {selectedPaper.authorCount > 5 && (
                          <p className="text-sm text-gray-500">
                            ... and {selectedPaper.authorCount - 5} more
                          </p>
                        )}
                      </div>
                    </div>

                    {selectedPaper.concepts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Key Concepts:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedPaper.concepts.map((concept, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                            >
                              {concept.name} ({concept.score}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPaper.sdgs.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">UN SDGs:</p>
                        <div className="space-y-1">
                          {selectedPaper.sdgs.map((sdg, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              {sdg.name} ({sdg.score}%)
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      <button
                        onClick={() => window.open(selectedPaper.url, '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View on OpenAlex
                      </button>
                      
                      {selectedPaper.pdfUrl && (
                        <button
                          onClick={() => window.open(selectedPaper.pdfUrl!, '_blank')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center sticky top-8">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Paper
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Click on any paper to view detailed information
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