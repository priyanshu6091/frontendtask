// Test content for grammar checker with various types of errors

export const grammarTestContent = {
  // Technical content with intentional errors
  technical: `<h2>API Documentation: User Authentication Pipeline</h2>
<p>The authentication pipeline consists off several key components:</p>
<ul>
  <li><strong>JWT Tokens:</strong> Secure access tokens that validates user sessions</li>
  <li><strong>OAuth Integration:</strong> Third-party authentication protocol's</li>
  <li><strong>Database Queries:</strong> Optimized query's for user data retrieval</li>
  <li><strong>Caching Layer:</strong> Redis implementation for performance boost</li>
</ul>
<p>When implementing the authentication flow, its important to consider security best practices. The API endpoint handles POST requests to /auth/login and return JSON responses.</p>
<p>Error handling should cover various scenario's including invalid credentials, expired tokens, and network timeouts.</p>`,

  // General content with grammar errors
  general: `<h1>My Travel Experience's</h1>
<p>Last summer, me and my family went to Europe for vacation. It was a amazing experience that I will never forget.</p>
<p>We visited alot of beautiful citys including Paris, Rome, and Barcelona. Each city had it's own unique charm and culture.</p>
<p>The food was incredible - we tried local cuisine's wherever we went. In Italy, we had authentic pasta's and pizza's that was much better then anything back home.</p>
<p>One of the most memorable moment's was when we climbed the Eiffel Tower. The view from the top were breathtaking, and we could see the hole city spread out below us.</p>
<p>I would definately reccommend this trip to anyone whose looking for a cultural adventure.</p>`,

  // Mixed technical and general content
  mixed: `<h2>Building a Web Application: My Journey</h2>
<p>When I first started learning web development, I was overwhelmed by all the different technologies. JavaScript, HTML, CSS - it seemed like their was so much to learn!</p>
<p>I began with the basics: setting up a development enviroment using Node.js and npm. Then I learned about frameworks like React and Vue.js for building user interface's.</p>
<p>The hardest part was understanding asynchronous programming. Promises and async/await syntax was confusing at first, but now I can write API calls that handles data fetching properly.</p>
<p>Database integration using MongoDB was another challange. Writing query's and managing schema's required alot of practice.</p>
<p>Now, after months of learning, I can build full-stack applications that includes authentication, data persistance, and responsive design.</p>`
};
