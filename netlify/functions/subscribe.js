// netlify/functions/subscribe.js - Minimal working version
exports.handler = async (event, context) => {
  console.log('📧 Newsletter function called');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, firstName = '', source = 'website' } = JSON.parse(event.body || '{}');
    
    console.log('📝 Subscription request:', { email, firstName, source });

    // Basic validation
    if (!email || !email.includes('@')) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          success: false,
          error: 'Valid email is required' 
        })
      };
    }

    // Log the subscription (you can see this in Netlify function logs)
    console.log(`✅ New subscriber: ${email} from ${source} at ${new Date().toISOString()}`);

    // For now, just return success
    // Later you can add ConvertKit, Mailchimp, or database integration here
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Thanks for subscribing! We\'ll be in touch soon.',
        subscriber: {
          email: email,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('❌ Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Internal server error' 
      })
    };
  }
};