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
  
  // Constants for SVG dimensions and layout
  const SQUARE_SIZE = 10;
  const SQUARE_SPACING = 4;
  const WEEKS_TO_SHOW = 53; // Show full year (52 weeks + 1 for partial weeks)
  const GRID_WIDTH = (SQUARE_SIZE + SQUARE_SPACING) * WEEKS_TO_SHOW;
  const GRID_HEIGHT = (SQUARE_SIZE + SQUARE_SPACING) * 7;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 50;
  const SVG_WIDTH = GRID_WIDTH + MARGIN_LEFT + 20;
  const SVG_HEIGHT = GRID_HEIGHT + MARGIN_TOP + 10;

  let svgContent = `<svg width="${SVG_WIDTH}" height="${SVG_HEIGHT}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
    <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="#1a1b27" rx="6"/>
    <text x="${MARGIN_LEFT}" y="30" fill="#70a5fd" font-family="Arial" font-size="16" font-weight="bold">Coding Activity (Generated from Wakatime Tracked Data)</text>
    
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

  // Sort days by date to ensure proper ordering
  const sortedDays = [...days].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Find the start and end dates
  const startDate = new Date(sortedDays[0].date);
  const endDate = new Date(sortedDays[sortedDays.length - 1].date);
  
  // Create a map of date strings to hours for easy lookup
  const dateToHours = new Map(
    sortedDays.map(day => [day.date, day.total / 3600])
  );

  // Calculate the day of the week (0-6, where 0 is Monday)
  const getDayOfWeek = (date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Sunday=6
  };

  // Generate all dates between start and end
  const currentDate = new Date(startDate);
  let weekIndex = 0;

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = getDayOfWeek(currentDate);
    const hours = dateToHours.get(dateStr) || 0;

    const x = weekIndex * (SQUARE_SIZE + SQUARE_SPACING);
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
        <title>${currentDate.toLocaleDateString()}: ${hours.toFixed(1)} hours</title>
      </rect>`;

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    if (getDayOfWeek(currentDate) === 0) {
      weekIndex++;
    }
  }

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
