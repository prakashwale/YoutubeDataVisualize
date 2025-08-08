# YouTube Trending Data Visualization

A comprehensive D3.js data visualization project analyzing YouTube trending videos across 10 countries. This project demonstrates advanced D3.js techniques and interactive data visualization concepts.

## 🎯 Project Overview

This project visualizes YouTube trending data from 10 countries, providing insights into:
- Video popularity patterns across different regions
- Category distribution and preferences
- Engagement metrics and correlations
- Temporal trends in trending videos
- Channel performance analysis

## 🌍 Countries Analyzed

- **CA** - Canada
- **DE** - Germany  
- **FR** - France
- **GB** - Great Britain
- **IN** - India
- **JP** - Japan
- **KR** - South Korea
- **MX** - Mexico
- **RU** - Russia
- **US** - United States

## 📊 Visualizations Implemented

### 1. **Overview Dashboard**
- Project statistics and data summary
- Interactive stats cards showing total videos, views, likes, countries, and categories
- Real-time data loading with progress indicators

### 2. **Bar Chart - Average Views by Country**
- Horizontal bar chart showing average views per video by country
- Interactive tooltips with detailed statistics
- Smooth animations and hover effects
- Uses D3 scales, axes, and transitions

### 3. **Pie Chart - Category Distribution**
- Interactive pie chart showing video category distribution
- Country-specific filtering with dropdown controls
- Dynamic legend with category names
- Percentage labels on larger segments

### 4. **Timeline - Trending Videos Over Time**
- Line chart showing number of trending videos over time
- Country-specific filtering
- Interactive data points with tooltips
- Smooth curve interpolation

### 5. **Scatter Plot - Views vs Likes Correlation**
- Scatter plot analyzing relationship between views and likes
- Trend line showing correlation
- Color-coded by country
- Correlation coefficient calculation
- Grid lines for better readability

### 6. **Heatmap - Country Activity**
- Heatmap visualization of country vs category activity
- Color intensity represents activity levels
- Interactive cells with detailed information

### 7. **Treemap - Top Channels**
- Hierarchical treemap showing top channels by total views
- Channel size proportional to total views
- Interactive tooltips with channel statistics
- Configurable channel limits (10, 25, 50, 100, 200, 500)
- Country-specific filtering

### 8. **Donut Chart - Engagement Breakdown**
- Donut chart showing engagement metrics (likes, dislikes, comments)
- Interactive segments with tooltips
- Country and category filtering options
- Legend with metric descriptions

## 🛠️ Technical Implementation

### D3.js Features Used

#### **Scales & Axes**
```javascript
// Linear scales for quantitative data
const xScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, width]);

// Band scales for categorical data
const yScale = d3.scaleBand()
    .domain(categories)
    .range([0, height])
    .padding(0.1);

// Time scales for temporal data
const timeScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);
```

#### **Shapes & Paths**
```javascript
// Line generator for time series
const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

// Arc generator for pie/donut charts
const arc = d3.arc()
    .innerRadius(radius * 0.5)
    .outerRadius(radius);
```

#### **Transitions & Animations**
```javascript
// Smooth transitions for data updates
selection.transition()
    .duration(1000)
    .attr('width', d => xScale(d.value));
```

### Data Processing

#### **CSV Parsing**
- Custom CSV parser handling quoted fields
- Data type conversion (strings to numbers)
- Date parsing for trending dates
- Category mapping from JSON files
- Performance optimization with data sampling (1000 rows per country)

#### **Data Aggregation**
- Country-level statistics calculation
- Category distribution analysis
- Engagement metrics computation
- Channel performance ranking
- Correlation analysis for views vs likes

### Interactive Features

#### **Tooltips**
- Dynamic tooltip creation and positioning
- Rich content with formatted data
- Smooth fade in/out animations

#### **Filtering**
- Country-specific data filtering
- Category-based filtering for engagement metrics
- Real-time visualization updates
- Dropdown controls with country names

#### **Responsive Design**
- Window resize handling with debouncing
- Responsive chart containers
- Mobile-friendly navigation

## 🚀 Setup & Installation

### Prerequisites
- Modern web browser with ES6 support
- Python 3.6+ (optional, for local server)

### Installation Steps

#### **Method 1: Using Python (Recommended)**

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd Project2_Data_Visualization
   ```

2. **Start the local server**
   ```bash
   # Python 3
   python -m http.server 3000
   
   # Python 2 (if you have it)
   python -m SimpleHTTPServer 3000
   ```

3. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The application will load automatically

#### **Method 2: Using Live Server (VS Code Extension)**

If you're using Visual Studio Code:

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### **Method 3: Using npx (if you have Node.js)**

If you have Node.js installed, you can use:

```bash
# Install and run http-server directly
npx http-server -p 3000 -o
```

#### **Method 4: Using PHP (if you have PHP)**

If you have PHP installed:

```bash
php -S localhost:3000
```

### Troubleshooting Common Issues

#### **Issue: Port 3000 is already in use**
**Solution:** Use a different port:

```bash
# Using Python
python -m http.server 8080

# Using npx
npx http-server -p 8080 -o

# Using PHP
php -S localhost:8080
```

#### **Issue: CORS errors when loading data**
**Solution:** Make sure you're running the project through a web server (not opening the HTML file directly):

- ❌ Don't open `index.html` directly in the browser
- ✅ Use one of the server methods above

#### **Issue: Data files not found**
**Solution:** Verify the data files are in the correct location:

```bash
# Check if data files exist
ls data/
# Should show: CAvideos.csv, DEvideos.csv, etc.
```

#### **Issue: Python not found**
**Solution:** Install Python from [python.org](https://python.org) or use an alternative method above.

### Quick Start for Beginners

If you're new to web development, here's the simplest way to run the project:

1. **Download and extract** the project files
2. **Open terminal/command prompt** in the project folder
3. **Run this command:**
   ```bash
   python -m http.server 3000
   ```
4. **Wait for the server to start** (you'll see a message)
5. **Open your browser** and go to `http://localhost:3000`

### System Requirements

- **Windows:** Python 3.6+ or any web server
- **macOS:** Python 3.6+ (usually pre-installed) or any web server
- **Linux:** Python 3.6+ (usually pre-installed) or any web server
- **Browser:** Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

## 📁 Project Structure

```
Project2_Data_Visualization/
├── index.html              # Main HTML file with navigation
├── css/
│   └── main.css           # Styles and responsive design
├── js/
│   ├── data-loader.js     # Data loading and processing
│   ├── visualizations.js  # D3.js visualization implementations
│   └── main.js           # Application logic and navigation
├── data/
│   ├── *.csv             # Video data for each country
│   └── *_category_id.json # Category mappings
└── README.md            # Project documentation
```

## 🎨 Design Features

### **Modern UI/UX**
- Clean, professional design with card-based layout
- Responsive layout for all screen sizes
- Smooth animations and transitions
- Intuitive navigation with sticky header

### **Color Schemes**
- D3.js built-in color schemes (`d3.schemeCategory10`)
- Sequential color scales for heatmaps
- Consistent color coding across visualizations

### **Typography**
- Modern font stack (Segoe UI, Tahoma, Geneva, Verdana)
- Hierarchical text sizing
- Good contrast ratios for accessibility

## 📈 Performance Optimizations

### **Data Loading**
- Asynchronous data loading with Promise.all()
- Data sampling for large datasets (1000 rows per country)
- Progressive loading with loading indicators
- Error handling for failed data loads

### **Rendering**
- Efficient D3.js selections and updates
- Debounced resize event handling (250ms delay)
- Memory management for large datasets
- Clear visualization containers before re-rendering

### **User Experience**
- Loading states and error handling
- Responsive design for mobile devices
- Smooth animations without blocking UI
- Interactive error recovery with retry buttons

## 🔧 Customization

### **Adding New Visualizations**
1. Add visualization method to `Visualizations` class in `js/visualizations.js`
2. Update navigation in `index.html`
3. Add case in `main.js` renderVisualization method
4. Add corresponding CSS styles in `css/main.css`

### **Modifying Data Sources**
1. Update `DataLoader` class methods in `js/data-loader.js`
2. Modify CSV parsing logic if needed
3. Update data aggregation functions

### **Styling Changes**
- Modify `css/main.css` for visual changes
- Update color schemes in visualization methods
- Adjust responsive breakpoints as needed

## 🎓 Learning Outcomes

This project demonstrates mastery of:

### **D3.js Concepts**
- Scales and axes for data mapping
- Shape generators (line, arc, treemap)
- Transitions and animations
- Event handling and interactivity
- Tooltip creation and positioning

### **Data Visualization Principles**
- Appropriate chart type selection
- Color theory and accessibility
- Interactive design patterns
- Responsive visualization design

### **Web Development**
- Modern JavaScript (ES6+)
- Asynchronous programming with async/await
- Error handling and user feedback
- Performance optimization
- Modular code organization

## 🐛 Troubleshooting

### **Common Issues**

1. **Data not loading**
   - Check browser console for CORS errors
   - Verify data files are in correct location
   - Ensure server is running on correct port

2. **Visualizations not rendering**
   - Check for JavaScript errors in console
   - Verify D3.js library is loaded
   - Check container dimensions

3. **Performance issues**
   - Reduce data sample size in `data-loader.js`
   - Check for memory leaks in large datasets
   - Optimize rendering loops

### **Browser Compatibility**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design supported

## 📝 Future Enhancements

### **Potential Additions**
- Real-time data updates
- Advanced filtering options
- Export functionality (PNG, SVG, CSV)
- User preferences and settings
- Dark mode theme
- Accessibility improvements (ARIA labels, keyboard navigation)

### **Advanced D3.js Features**
- Zoom and pan interactions
- Brush selections for data filtering
- Geographic visualizations with D3-geo
- 3D visualizations with WebGL

## 📚 Resources

### **D3.js Documentation**
- [D3.js Official Documentation](https://d3js.org/)
- [D3.js API Reference](https://github.com/d3/d3/blob/main/API.md)
- [D3.js Examples](https://observablehq.com/@d3/gallery)

### **Data Visualization Best Practices**
- [Data Visualization Society](https://www.datavisualizationsociety.com/)
- [Flowing Data](https://flowingdata.com/)
- [Visualization of the Week](https://www.visualisingdata.com/)

---

**Created for Web Content Management Course**  
*Demonstrating advanced D3.js data visualization techniques and interactive web development skills.*