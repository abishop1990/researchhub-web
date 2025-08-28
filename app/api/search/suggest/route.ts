import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth.config';

export async function GET(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions);

    // Temporarily disable authentication for testing
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const indexParam = searchParams.get('index');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Check environment variables
    if (!process.env.BACKEND_API_URL) {
      return NextResponse.json({ error: 'Backend API not configured' }, { status: 500 });
    }

    // Parse indices to search
    const indices = indexParam ? indexParam.split(',') : ['paper', 'post', 'hub'];
    const results: any[] = [];

    // Search for papers
    if (indices.includes('paper')) {
      try {
        const papers = await searchPapers(query, limit, session);
        results.push(...papers);
      } catch (error) {
        // Continue with other search types even if papers fail
      }
    }

    // Search for posts
    if (indices.includes('post')) {
      try {
        const posts = await searchPosts(query, limit, session);
        results.push(...posts);
      } catch (error) {
        // Continue with other search types even if posts fail
      }
    }

    // Search for hubs (topics)
    if (indices.includes('hub')) {
      try {
        const hubs = await searchHubs(query, limit, session);
        results.push(...hubs);
      } catch (error) {
        // Continue with other search types even if hubs fail
      }
    }

    // Return results in the format expected by the search transformer
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function searchPapers(query: string, limit: number, session: any): Promise<any[]> {
  if (!process.env.BACKEND_API_URL) {
    return [];
  }

  try {
    const backendUrl = `${process.env.BACKEND_API_URL}/api/lists/search_papers/?q=${encodeURIComponent(query)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Token authentication from session (matching ApiClient format)
    if (session?.authToken) {
      headers['Authorization'] = `Token ${session.authToken}`;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const papers = data.results || [];

    // Transform papers to match the expected format
    const transformed = papers.map((paper: any) => {
      const result = {
        entity_type: 'paper',
        id: paper.paper_id, // Use paper_id directly since that's what the backend provides
        display_name: paper.title,
        doi: paper.doi,
        authors: Array.isArray(paper.authors)
          ? paper.authors
              .map((author: any) =>
                typeof author === 'string'
                  ? author
                  : `${author.first_name || ''} ${author.last_name || ''}`.trim()
              )
              .filter(Boolean)
          : [],
        citations: paper.citations || 0,
        date_published: paper.published_date,
        source: 'backend',
      };

      return result;
    });

    return transformed;
  } catch (error) {
    return [];
  }
}

async function searchPosts(query: string, limit: number, session: any): Promise<any[]> {
  if (!process.env.BACKEND_API_URL) {
    return [];
  }

  try {
    const backendUrl = `${process.env.BACKEND_API_URL}/api/lists/search_posts/?q=${encodeURIComponent(query)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Token authentication from session (matching ApiClient format)
    if (session?.authToken) {
      headers['Authorization'] = `Token ${session.authToken}`;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const posts = data.results || [];

    return posts.map((post: any) => ({
      entity_type: 'post',
      id: post.post_id, // Use post_id directly since that's what the backend provides
      display_name: post.title,
      source: 'backend',
    }));
  } catch (error) {
    return [];
  }
}

async function searchHubs(query: string, limit: number, session: any): Promise<any[]> {
  if (!process.env.BACKEND_API_URL) {
    return [];
  }

  try {
    const backendUrl = `${process.env.BACKEND_API_URL}/api/lists/search_hubs/?q=${encodeURIComponent(query)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Token authentication from session (matching ApiClient format)
    if (session?.authToken) {
      headers['Authorization'] = `Token ${session.authToken}`;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const hubs = data.results || [];

    return hubs.map((hub: any) => ({
      entity_type: 'hub',
      id: hub.id,
      display_name: hub.name,
      slug: hub.slug,
      description: hub.description,
      source: 'backend',
    }));
  } catch (error) {
    return [];
  }
}
