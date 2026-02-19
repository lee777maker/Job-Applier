import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 300 },   // Ramp up to 300 users
    { duration: '5m', target: 300 },   // Stay at 300 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],      // Error rate under 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://jobapplier.ai';

// Helper function to make requests
function makeRequest(method, endpoint, body = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = http.request(method, url, body, { headers });
  
  apiResponseTime.add(response.timings.duration);
  
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
  
  return response;
}

export default function () {
  group('Authentication Flow', () => {
    // Login request
    const loginPayload = JSON.stringify({
      email: `user${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'password123',
    });
    
    const loginResponse = makeRequest(
      'POST',
      '/api/auth/login',
      loginPayload,
      { 'Content-Type': 'application/json' }
    );
    
    sleep(1);
  });

  group('Job Recommendations', () => {
    // Get job recommendations (up to 50 jobs)
    const jobsResponse = makeRequest(
      'GET',
      '/api/jobs/recommendations/test-user-id?limit=50'
    );
    
    check(jobsResponse, {
      'jobs returned': (r) => {
        const body = JSON.parse(r.body);
        return body.jobs && body.jobs.length > 0;
      },
    });
    
    sleep(2);
  });

  group('Profile Operations', () => {
    // Get profile
    makeRequest('GET', '/api/profile/test-user-id');
    
    sleep(1);
    
    // Update profile
    const profilePayload = JSON.stringify({
      contactInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
      skills: ['React', 'TypeScript', 'Node.js'],
    });
    
    makeRequest(
      'PUT',
      '/api/profile/test-user-id',
      profilePayload,
      { 'Content-Type': 'application/json' }
    );
    
    sleep(1);
  });

  group('AI Service - Match Score', () => {
    const matchPayload = JSON.stringify({
      userProfile: {
        skills: ['Python', 'React', 'AWS'],
      },
      jobDescription: 'Looking for a full-stack developer with Python and React experience...',
      resumeText: 'Experienced software engineer with 5 years in web development...',
    });
    
    const matchResponse = makeRequest(
      'POST',
      '/ai/agents/match-score',
      matchPayload,
      { 'Content-Type': 'application/json' }
    );
    
    check(matchResponse, {
      'match score returned': (r) => {
        const body = JSON.parse(r.body);
        return body.ats_score !== undefined && body.match_score !== undefined;
      },
    });
    
    sleep(3);
  });

  group('AI Service - Chat', () => {
    const chatPayload = JSON.stringify({
      message: 'How do I prepare for a technical interview?',
      context: {
        userProfile: { name: 'Test User' },
        jobPreferences: { preferredRole: 'Software Engineer' },
      },
      chatHistory: [],
    });
    
    const chatResponse = makeRequest(
      'POST',
      '/ai/agents/neilwe-chat',
      chatPayload,
      { 'Content-Type': 'application/json' }
    );
    
    check(chatResponse, {
      'chat response returned': (r) => {
        const body = JSON.parse(r.body);
        return body.response !== undefined;
      },
    });
    
    sleep(2);
  });

  group('Dashboard Analytics', () => {
    // Get user applications
    makeRequest('GET', '/api/applications/user/test-user-id');
    
    sleep(1);
  });
}

// Setup function
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  
  // Verify base URL is accessible
  const response = http.get(BASE_URL);
  check(response, {
    'base URL is accessible': (r) => r.status === 200,
  });
  
  return { baseUrl: BASE_URL };
}

// Teardown function
export function teardown(data) {
  console.log(`Load test completed for: ${data.baseUrl}`);
}