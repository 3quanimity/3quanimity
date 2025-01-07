const https = require('https');
const fs = require('fs');

// Fetch data from WakaTime
const fetchData = () => {
  return new Promise((resolve, reject) => {
    https.get(process.env.WAKATIME_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    }).on('error', reject);
  });
};

// Generate color based on coding hours
const getColor = (hours) => {
  if (hours === 0) return '#161b22';
  if (hours < 2) return '#0e4429';
  if (hours < 4) return '#006d32';
  if (hours < 6) return '#26a641';
  return '#39d353';
};

// Generate SVG content
const generateSVG = (data) => {
  const days = data.days;
  let svgContent = `<svg width="800" height="140" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 140">
    <rect width="800" height="140" fill="#1a1b27" rx="6"/>
    <text x="20" y="30" fill="#70a5fd" font-family="Arial" font-size="14" font-weight="bold">Coding Activity</text>
    
    <!-- Legend -->
    <g transform="translate(600, 15)">
      <text x="0" y="0" fill="#70a5fd" font-family="Arial" font-size="10">Less</text>
      <rect x="30" y="-8" width="10" height="10" fill="#161b22" rx="2"/>
      <rect x="45" y="-8" width="10" height="10" fill="#0e4429" rx="2"/>
      <rect x="60" y="-8" width="10" height="10" fill="#006d32" rx="2"/>
      <rect x="75" y="-8" width="10" height="10" fill="#26a641" rx="2"/>
      <rect x="90" y="-8" width="10" height="10" fill="#39d353" rx="2"/>
      <text x="105" y="0" fill="#70a5fd" font-family="Arial" font-size="10">More</text>
    </g>
    
    <g transform="translate(20, 45)">`;

  // Add week labels
  svgContent += `
    <text x="-15" y="20" fill="#70a5fd" font-family="Arial" font-size="10">Mon</text>
    <text x="-15" y="50" fill="#70a5fd" font-family="Arial" font-size="10">Wed</text>
    <text x="-15" y="80" fill="#70a5fd" font-family="Arial" font-size="10">Fri</text>`;

  // Add activity squares
  days.forEach((day, index) => {
    const hours = day.total / 3600; // Convert seconds to hours
    const x = (index % 7) * 15;
    const y = Math.floor(index / 7) * 15;
    
    svgContent += `
      <rect 
        x="${x}" 
        y="${y}" 
        width="10" 
        height="10" 
        fill="${getColor(hours)}" 
        rx="2"
      >
        <title>${new Date(day.date).toLocaleDateString()}: ${hours.toFixed(1)} hours</title>
      </rect>`;
  });

  svgContent += `
    </g>
  </svg>`;

  return svgContent;
};

// Main function
async function main() {
  try {
    const data = await fetchData();
    const svg = generateSVG(data);
    fs.writeFileSync('activity-heatmap.svg', svg);
    console.log('Heatmap generated successfully!');
  } catch (error) {
    console.error('Error generating heatmap:', error);
    process.exit(1);
  }
}

main();
