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
  const SQUARE_SIZE = 10;
  const SQUARE_SPACING = 4;
  const GRID_WIDTH = (SQUARE_SIZE + SQUARE_SPACING) * 25; // Enough for ~6 months
  const GRID_HEIGHT = (SQUARE_SIZE + SQUARE_SPACING) * 7;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 50;
  
  let svgContent = `<svg width="${GRID_WIDTH + MARGIN_LEFT + 20}" height="${GRID_HEIGHT + MARGIN_TOP + 10}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_WIDTH + MARGIN_LEFT + 20} ${GRID_HEIGHT + MARGIN_TOP + 10}">
    <rect width="${GRID_WIDTH + MARGIN_LEFT + 20}" height="${GRID_HEIGHT + MARGIN_TOP + 10}" fill="#1a1b27" rx="6"/>
    <text x="${MARGIN_LEFT}" y="30" fill="#70a5fd" font-family="Arial" font-size="14" font-weight="bold">Coding Activity</text>
    
    <!-- Legend -->
    <g transform="translate(${MARGIN_LEFT + GRID_WIDTH - 200}, 20)">
      <text x="0" y="0" fill="#70a5fd" font-family="Arial" font-size="10">Less</text>
      <rect x="30" y="-8" width="10" height="10" fill="#161b22" rx="2"/>
      <rect x="45" y="-8" width="10" height="10" fill="#0e4429" rx="2"/>
      <rect x="60" y="-8" width="10" height="10" fill="#006d32" rx="2"/>
      <rect x="75" y="-8" width="10" height="10" fill="#26a641" rx="2"/>
      <rect x="90" y="-8" width="10" height="10" fill="#39d353" rx="2"/>
      <text x="105" y="0" fill="#70a5fd" font-family="Arial" font-size="10">More</text>
    </g>
    
    <g transform="translate(${MARGIN_LEFT}, ${MARGIN_TOP})">`;

  // Add weekday labels
  const weekdays = ['Mon', 'Wed', 'Fri'];
  weekdays.forEach((day, index) => {
    const y = (index * 2 * (SQUARE_SIZE + SQUARE_SPACING)) + SQUARE_SIZE;
    svgContent += `
      <text x="-15" y="${y + 8}" fill="#70a5fd" font-family="Arial" font-size="10">${day}</text>`;
  });

  // Calculate the day of the week (0-6, where 0 is Sunday)
  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    return (date.getDay() + 6) % 7; // Convert Sunday=0 to Sunday=6
  };

  // Add activity squares
  days.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = getDayOfWeek(day.date);
    const weeks = Math.floor(index / 7);
    const hours = day.total / 3600;

    const x = weeks * (SQUARE_SIZE + SQUARE_SPACING);
    const y = dayOfWeek * (SQUARE_SIZE + SQUARE_SPACING);
    
    svgContent += `
      <rect 
        x="${x}" 
        y="${y}" 
        width="${SQUARE_SIZE}" 
        height="${SQUARE_SIZE}" 
        fill="${getColor(hours)}" 
        rx="2"
      >
        <title>${date.toLocaleDateString()}: ${hours.toFixed(1)} hours</title>
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
