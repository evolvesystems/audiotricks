const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/api', '').replace('/.netlify/functions/api', '');
    
    // Log the request for debugging
    console.log('API Request:', {
      method: event.httpMethod,
      path: path,
      headers: event.headers,
      body: event.body
    });

    // Return a placeholder response for now
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'API endpoint received',
        path: path,
        method: event.httpMethod,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('API function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};