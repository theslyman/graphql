const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const errorMessage = document.getElementById('error-message');
const logoutButton = document.getElementById('logout-button');

// Check if JWT exists on page load
if (localStorage.getItem('jwt')) {
  showProfile();
} else {
  showLogin();
}

// Login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const usernameOrEmail = document.getElementById('usernameOrEmail').value;
  const password = document.getElementById('password').value;
  const credentials = btoa(`${usernameOrEmail}:${password}`);

  try {
    const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    if (!response.ok) throw new Error('Invalid credentials');

    const data = await response.json();
    localStorage.setItem('jwt', data.token);
    showProfile();
  } catch (error) {
    errorMessage.style.display = 'block';
  }
});

// Logout
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('jwt');
  showLogin();
});

// Show login section
function showLogin() {
  loginSection.style.display = 'block';
  profileSection.style.display = 'none';
}

// Show profile section and fetch data
async function showProfile() {
  try {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) throw new Error('No JWT found');
    
    const userData = await fetchGraphQL(jwt, `
      {
        user {
          id
          login
        }
      }
    `);
    console.log('userData:', userData);
    
    if (!userData.data || !userData.data.user) {
      throw new Error('User data not found in response');
    }
    
    // Adjust based on actual response: array or object
    const login = Array.isArray(userData.data.user) 
      ? userData.data.user[0].login 
      : userData.data.user.login;
    document.getElementById('username').textContent = login;
    
    // Show profile page
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('profile-page').style.display = 'block';
  } catch (error) {
    console.error('Error fetching data:', error);
    showLogin();
  }
}

// Helper function to fetch GraphQL data
async function fetchGraphQL(jwt, query) {
  const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) throw new Error('Failed to fetch data');
  return response.json();
}

// Render XP over time graph (line graph)
function renderXpOverTime(transactions) {
  const svg = document.getElementById('xp-over-time');
  svg.innerHTML = '';

  if (transactions.length === 0) return;

  let cumulativeXP = 0;
  const data = transactions.map(t => {
    cumulativeXP += t.amount;
    return { date: new Date(t.createdAt), xp: cumulativeXP };
  });

  const width = 500;
  const height = 300;
  const padding = 40;

  const minDate = new Date(Math.min(...data.map(d => d.date)));
  const maxDate = new Date(Math.max(...data.map(d => d.date)));
  const maxXP = Math.max(...data.map(d => d.xp));

  const xScale = (date) => ((date - minDate) / (maxDate - minDate)) * (width - 2 * padding) + padding;
  const yScale = (xp) => height - padding - (xp / maxXP) * (height - 2 * padding);

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.date)},${yScale(d.xp)}`).join(' ');

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', path);
  line.classList.add('graph-line');
  svg.appendChild(line);

  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', padding);
  xAxis.setAttribute('y1', height - padding);
  xAxis.setAttribute('x2', width - padding);
  xAxis.setAttribute('y2', height - padding);
  xAxis.classList.add('graph-axis');
  svg.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', padding);
  yAxis.setAttribute('y1', padding);
  yAxis.setAttribute('x2', padding);
  yAxis.setAttribute('y2', height - padding);
  yAxis.classList.add('graph-axis');
  svg.appendChild(yAxis);
}

// Render XP per project graph (bar chart)
function renderXpPerProject(transactions) {
  const svg = document.getElementById('xp-per-project');
  svg.innerHTML = '';

  if (transactions.length === 0) return;

  const projectXP = {};
  transactions.forEach(t => {
    const project = t.object.name;
    projectXP[project] = (projectXP[project] || 0) + t.amount;
  });

  const projects = Object.entries(projectXP);
  const maxXP = Math.max(...projects.map(p => p[1]));

  const width = 500;
  const height = 300;
  const padding = 40;
  const barWidth = (width - 2 * padding) / projects.length;

  const yScale = (xp) => height - padding - (xp / maxXP) * (height - 2 * padding);

  projects.forEach((p, i) => {
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', padding + i * barWidth);
    bar.setAttribute('y', yScale(p[1]));
    bar.setAttribute('width', barWidth - 10);
    bar.setAttribute('height', height - padding - yScale(p[1]));
    bar.classList.add('graph-bar');
    svg.appendChild(bar);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', padding + i * barWidth + (barWidth - 10) / 2);
    text.setAttribute('y', height - padding + 20);
    text.setAttribute('text-anchor', 'middle');
    text.textContent = p[0];
    text.classList.add('graph-label');
    svg.appendChild(text);
  });

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', padding);
  yAxis.setAttribute('y1', padding);
  yAxis.setAttribute('x2', padding);
  yAxis.setAttribute('y2', height - padding);
  yAxis.classList.add('graph-axis');
  svg.appendChild(yAxis);
}