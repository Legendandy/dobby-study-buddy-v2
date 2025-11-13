import { NextRequest, NextResponse } from 'next/server';

interface OpenAlexWork {
  id: string;
  doi: string | null;
  title: string;
  display_name: string;
  publication_year: number;
  publication_date: string;
  type: string;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  authorships: Array<{
    author: {
      id: string;
      display_name: string;
      orcid: string | null;
    };
    institutions: Array<{
      id: string;
      display_name: string;
      country_code: string;
    }>;
  }>;
  concepts: Array<{
    id: string;
    wikidata: string;
    display_name: string;
    level: number;
    score: number;
  }>;
  primary_location: {
    source: {
      id: string;
      display_name: string;
      issn_l: string | null;
      issn: string[] | null;
      is_oa: boolean;
      host_organization: string | null;
    } | null;
    landing_page_url: string | null;
    pdf_url: string | null;
    is_oa: boolean;
  } | null;
  open_access: {
    is_oa: boolean;
    oa_status: string;
    oa_url: string | null;
  };
  sustainable_development_goals: Array<{
    id: string;
    display_name: string;
    score: number;
  }>;
}

interface OpenAlexResponse {
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
  };
  results: OpenAlexWork[];
}

// Helper function to reconstruct abstract from inverted index
function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string {
  if (!invertedIndex) return '';
  
  try {
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const position of positions) {
        words.push([word, position]);
      }
    }
    
    words.sort((a, b) => a[1] - b[1]);
    return words.map(([word]) => word).join(' ');
  } catch (error) {
    console.error('Error reconstructing abstract:', error);
    return '';
  }
}

// Format paper data for frontend
function formatPaper(work: OpenAlexWork) {
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  
  return {
    id: work.id,
    doi: work.doi,
    title: work.display_name || work.title,
    year: work.publication_year,
    publicationDate: work.publication_date,
    type: work.type,
    citationCount: work.cited_by_count,
    abstract: abstract.length > 500 ? abstract.substring(0, 500) + '...' : abstract,
    fullAbstract: abstract,
    authors: work.authorships.slice(0, 5).map(a => ({
      name: a.author.display_name,
      orcid: a.author.orcid,
      institutions: a.institutions.map(i => i.display_name).join(', ')
    })),
    authorCount: work.authorships.length,
    concepts: work.concepts
      .filter(c => c.level <= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(c => ({
        name: c.display_name,
        score: Math.round(c.score * 100)
      })),
    journal: work.primary_location?.source?.display_name || 'Unknown Journal',
    isOpenAccess: work.open_access.is_oa,
    oaStatus: work.open_access.oa_status,
    pdfUrl: work.primary_location?.pdf_url || work.open_access.oa_url,
    url: work.primary_location?.landing_page_url || `https://openalex.org/${work.id}`,
    sdgs: work.sustainable_development_goals.map(sdg => ({
      name: sdg.display_name,
      score: Math.round(sdg.score * 100)
    }))
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const filter = searchParams.get('filter') || '';
    const sort = searchParams.get('sort') || 'cited_by_count:desc';

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log('OpenAlex search:', { query, page, perPage, filter, sort });

    // Build OpenAlex API URL
    const baseUrl = 'https://api.openalex.org/works';
    const params = new URLSearchParams({
      search: query.trim(),
      page: page.toString(),
      per_page: perPage.toString(),
      mailto: 'contact@studybuddy.app' // Polite pool - faster API responses
    });

    if (filter) {
      params.append('filter', filter);
    }

    params.append('sort', sort);

    const apiUrl = `${baseUrl}?${params.toString()}`;
    console.log('Fetching from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StudyBuddy/1.0 (mailto:contact@studybuddy.app)'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAlex API error:', response.status, errorText);
      throw new Error(`OpenAlex API responded with status ${response.status}`);
    }

    const data: OpenAlexResponse = await response.json();
    console.log(`Found ${data.meta.count} results`);

    // Format papers for frontend
    const papers = data.results.map(formatPaper);

    return NextResponse.json({
      success: true,
      papers,
      meta: {
        total: data.meta.count,
        page: data.meta.page,
        perPage: data.meta.per_page,
        totalPages: Math.ceil(data.meta.count / data.meta.per_page)
      }
    });

  } catch (error) {
    console.error('OpenAlex research error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to search papers',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

// Get detailed information about a specific paper
export async function POST(request: NextRequest) {
  try {
    const { paperId } = await request.json();

    if (!paperId) {
      return NextResponse.json(
        { error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching paper details:', paperId);

    const response = await fetch(`https://api.openalex.org/works/${paperId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StudyBuddy/1.0 (mailto:contact@studybuddy.app)'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenAlex API responded with status ${response.status}`);
    }

    const work: OpenAlexWork = await response.json();
    const paper = formatPaper(work);

    return NextResponse.json({
      success: true,
      paper
    });

  } catch (error) {
    console.error('Paper details error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch paper details'
      },
      { status: 500 }
    );
  }
}