export async function GET() {
  try {
    // Basic health checks
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'bitswitch-web',
      node_version: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
        unit: 'MB'
      },
      environment: {
        node_env: 'production',
        api_url: process.env.NEXT_PUBLIC_API_URL || 'not-set'
      }
    };

    return Response.json(healthCheck, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'feature-flag-web',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  try {
    return new Response(null, { status: 200 });
  } catch (_error) {
    console.error('Health check failed:', _error);
    return new Response(null, { status: 503 });
  }
} 