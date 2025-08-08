// D3.js Visualizations Module
class Visualizations {
    constructor() {
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        this.tooltip = this.createTooltip();
    }

    // Create reusable tooltip
    createTooltip() {
        return d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }

    // Clear any existing visualization
    clearVisualization(container) {
        d3.select(container).selectAll('*').remove();
    }

    // 1. Bar Chart - Average Views by Country
    createBarChart(data, container) {
        this.clearVisualization(container);
        
        const margin = { top: 20, right: 120, bottom: 40, left: 80 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        // Create main chart group
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Export controls removed per request

        // Prepare data
        const countries = Object.keys(data);
        const maxViews = d3.max(countries, d => data[d].avgViews);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, maxViews])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(countries)
            .range([0, height])
            .padding(0.1);

        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                const { transform } = event;
                
                // Update scales with zoom transform
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);
                
                // Update axes
                g.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(d3.format('.2s')));
                g.select('.y-axis').call(d3.axisLeft(newYScale));
                
                // Update bars
                g.selectAll('.bar')
                    .attr('x', 0)
                    .attr('y', d => newYScale(d))
                    .attr('width', d => newXScale(data[d].avgViews))
                    .attr('height', newYScale.bandwidth());
                
                // Update value labels
                g.selectAll('.value-label')
                    .attr('x', d => newXScale(data[d].avgViews) + 5)
                    .attr('y', d => newYScale(d) + newYScale.bandwidth() / 2);
            });

        // Apply zoom to SVG
        svg.call(zoom);

        // Add grid lines
        g.append('g')
            .attr('class', 'grid x-grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat('')
            );

        // Axes
        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format('.2s')));

        g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(yScale));

        // Bars with enhanced styling
        g.selectAll('.bar')
            .data(countries)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => yScale(d))
            .attr('width', 0)
            .attr('height', yScale.bandwidth())
            .attr('fill', (d, i) => this.colorScale(i))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('stroke-width', 2)
                    .attr('opacity', 0.8);
                
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d}</strong><br/>
                    Avg Views: ${d3.format('.2s')(data[d].avgViews)}<br/>
                    Total Videos: ${data[d].videoCount}<br/>
                    <small>Click to see details</small>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', (event) => {
                d3.select(event.target)
                    .attr('stroke-width', 1)
                    .attr('opacity', 1);
                this.tooltip.transition().duration(500).style('opacity', 0);
            })
            .on('click', (event, d) => {
                this.showCountryDetails(d, data[d]);
            })
            .transition()
            .duration(1000)
            .attr('width', d => xScale(data[d].avgViews));

        // Add value labels on bars
        g.selectAll('.value-label')
            .data(countries)
            .enter().append('text')
            .attr('class', 'value-label')
            .attr('x', d => Math.min(xScale(data[d].avgViews) + 5, width - 10))
            .attr('y', d => yScale(d) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('fill', '#2c3e50')
            .style('font-weight', 'bold')
            .style('text-anchor', d => xScale(data[d].avgViews) + 5 > width - 50 ? 'end' : 'start')
            .text(d => d3.format('.1s')(data[d].avgViews));

        // Labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Country');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Average Views');
    }

    // 2. Pie Chart - Category Distribution
    createPieChart(data, container, selectedCountry = null) {
        this.clearVisualization(container);
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const radius = Math.min(width, height) / 2 - 30;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width/2},${height/2})`);

        // Add title if country is selected
        if (selectedCountry && selectedCountry !== 'all') {
            const countryNames = {
                'CA': 'Canada', 'DE': 'Germany', 'FR': 'France', 'GB': 'Great Britain',
                'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'MX': 'Mexico',
                'RU': 'Russia', 'US': 'United States'
            };
            const countryName = countryNames[selectedCountry] || selectedCountry;
            
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', 20)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .text(`Category Distribution - ${countryName}`);
        }

        // Prepare data - all categories
        const sortedData = Object.entries(data)
            .sort((a, b) => b[1] - a[1]);

        const pie = d3.pie()
            .value(d => d[1])
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const arcs = g.selectAll('.arc')
            .data(pie(sortedData))
            .enter().append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('class', 'pie-slice')
            .attr('d', arc)
            .attr('fill', (d, i) => this.colorScale(i))
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.data[0]}</strong><br/>
                    Videos: ${d.data[1]}<br/>
                    Percentage: ${((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1)}%
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Add labels
        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('dy', '.35em')
            .style('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .text(d => {
                const percentage = (d.endAngle - d.startAngle) / (2 * Math.PI) * 100;
                return percentage > 3 ? `${percentage.toFixed(0)}%` : '';
            });

        // Legend - 2 columns for better layout with all categories
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, 20)`);

        const itemsPerColumn = Math.ceil(sortedData.length / 2);
        const legendItems = legend.selectAll('.legend-item')
            .data(sortedData)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => {
                const column = Math.floor(i / itemsPerColumn);
                const row = i % itemsPerColumn;
                return `translate(${column * 200}, ${row * 18})`;
            });

        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', (d, i) => this.colorScale(i));

        legendItems.append('text')
            .attr('x', 18)
            .attr('y', 9)
            .style('font-size', '11px')
            .text(d => d[0].length > 20 ? d[0].substring(0, 20) + '...' : d[0]);
    }

    // 2b. Donut Chart - Engagement Metrics
    createDonutChart(data, container) {
        this.clearVisualization(container);
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const radius = Math.min(width, height) / 2 - 20;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const pie = d3.pie()
            .value(d => d[1])
            .sort(null);

        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        const arcs = g.selectAll('.arc')
            .data(pie(Object.entries(data)))
            .enter().append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('class', 'pie-slice')
            .attr('d', arc)
            .attr('fill', (d, i) => this.colorScale(i))
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.data[0]}</strong><br/>
                    ${d3.format('.2s')(d.data[1])}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, 20)`);

        legend.selectAll('.legend-item')
            .data(Object.entries(data))
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .each((d, i, nodes) => {
                const gNode = d3.select(nodes[i]);
                gNode.append('rect')
                    .attr('width', 15)
                    .attr('height', 15)
                    .attr('fill', this.colorScale(i));
                gNode.append('text')
                    .attr('x', 20)
                    .attr('y', 12)
                    .text(d[0]);
            });
    }

    // 3. Scatter Plot - Views vs Likes
    createScatterPlot(data, container, selectedCountry = null) {
        this.clearVisualization(container);
        
        const margin = { top: 40, right: 40, bottom: 120, left: 80 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        // Filter out extreme outliers for better visualization
        const filteredData = data.filter(d => d.views > 0 && d.likes > 0 && d.views < 1e8 && d.likes < 1e7);
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.views)])
            .range([0, width])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.likes)])
            .range([height, 0])
            .nice();

        const colorByCountry = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(filteredData.map(d => d.country))]);

        // Create main chart group
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title if country is selected
        if (selectedCountry && selectedCountry !== 'all') {
            const countryNames = {
                'CA': 'Canada', 'DE': 'Germany', 'FR': 'France', 'GB': 'Great Britain',
                'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'MX': 'Mexico',
                'RU': 'Russia', 'US': 'United States'
            };
            const countryName = countryNames[selectedCountry] || selectedCountry;
            
            svg.append('text')
                .attr('x', (width + margin.left + margin.right) / 2)
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .text(`Views vs Likes Correlation - ${countryName}`);
        }

        // Add grid lines
        g.append('g')
            .attr('class', 'grid x-grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat('')
            );

        g.append('g')
            .attr('class', 'grid y-grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat('')
            );

        // Axes with better formatting
        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => {
                if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
                if (d >= 1e3) return (d / 1e3).toFixed(1) + 'K';
                return d;
            }));

        g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(yScale).tickFormat(d => {
                if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
                if (d >= 1e3) return (d / 1e3).toFixed(1) + 'K';
                return d;
            }));

        // Add trend line
        const sortedData = filteredData.sort((a, b) => a.views - b.views);
        const trendLine = d3.line()
            .x(d => xScale(d.views))
            .y(d => yScale(d.likes))
            .curve(d3.curveLinear);

        g.append('path')
            .datum(sortedData)
            .attr('class', 'trend-line')
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', trendLine);



        // Points with better styling
        g.selectAll('.dot')
            .data(filteredData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.views))
            .attr('cy', d => yScale(d.likes))
            .attr('r', 4)
            .attr('fill', d => colorByCountry(d.country))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7)
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('r', 6)
                    .attr('opacity', 1);
                
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.title.substring(0, 40)}...</strong><br/>
                    Views: ${d3.format(',')(d.views)}<br/>
                    Likes: ${d3.format(',')(d.likes)}<br/>
                    Country: ${d.country}<br/>
                    Category: ${d.category}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', (event) => {
                d3.select(event.target)
                    .attr('r', 4)
                    .attr('opacity', 0.7);
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Add correlation coefficient
        const correlation = this.calculateCorrelation(filteredData.map(d => d.views), filteredData.map(d => d.likes));
        
        g.append('text')
            .attr('x', width - 10)
            .attr('y', 30)
            .attr('text-anchor', 'end')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text(`Correlation: ${correlation.toFixed(3)}`);

        // Labels
        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .text('Views');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .text('Likes');



        // Create zoom behavior and apply to entire SVG
        const zoom = d3.zoom()
            .scaleExtent([0.1, 50])
            // Keep the zoomed viewport within the chart area to avoid losing data off-screen
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
            .on('zoom', (event) => {
                const { transform } = event;
                
                // Update scales with zoom transform
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);
                
                // Update axes
                g.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(d => {
                    if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
                    if (d >= 1e3) return (d / 1e3).toFixed(1) + 'K';
                    return d;
                }));
                
                g.select('.y-axis').call(d3.axisLeft(newYScale).tickFormat(d => {
                    if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
                    if (d >= 1e3) return (d / 1e3).toFixed(1) + 'K';
                    return d;
                }));
                
                // Update grid lines
                g.select('.x-grid').call(d3.axisBottom(newXScale).tickSize(-height).tickFormat(''));
                g.select('.y-grid').call(d3.axisLeft(newYScale).tickSize(-width).tickFormat(''));
                
                // Update points
                g.selectAll('.dot')
                    .attr('cx', d => newXScale(d.views))
                    .attr('cy', d => newYScale(d.likes));
                
                // Update trend line
                const newTrendLine = d3.line()
                    .x(d => newXScale(d.views))
                    .y(d => newYScale(d.likes))
                    .curve(d3.curveLinear);
                
                g.select('.trend-line').attr('d', newTrendLine(sortedData));
            });

        // Apply zoom to entire SVG for better control
        svg.call(zoom);

        // Add reset zoom button for deep zoom functionality
        const resetButton = svg.append('g')
            .attr('class', 'reset-zoom')
            .attr('transform', `translate(${width + margin.left - 80}, 10)`);

        resetButton.append('rect')
            .attr('width', 70)
            .attr('height', 25)
            .attr('rx', 5)
            .attr('fill', '#e74c3c')
            .attr('stroke', '#c0392b')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('click', () => {
                svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
            });

        resetButton.append('text')
            .attr('x', 35)
            .attr('y', 17)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text('Reset Zoom');
    }

    // Helper method to calculate correlation coefficient
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    // Helper method to show selection info
    showSelectionInfo(selectedPoints, container) {
        // Remove existing selection info
        d3.select(container).select('.selection-info').remove();
        
        const totalViews = selectedPoints.reduce((sum, d) => sum + d.views, 0);
        const totalLikes = selectedPoints.reduce((sum, d) => sum + d.likes, 0);
        const avgViews = totalViews / selectedPoints.length;
        const avgLikes = totalLikes / selectedPoints.length;
        
        const infoDiv = d3.select(container)
            .append('div')
            .attr('class', 'selection-info')
            .style('position', 'absolute')
            .style('top', '10px')
            .style('right', '10px')
            .style('background', 'rgba(255, 255, 255, 0.95)')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
            .style('font-size', '12px')
            .style('z-index', '1000');
        
        infoDiv.html(`
            <strong>Selected: ${selectedPoints.length} videos</strong><br/>
            Avg Views: ${d3.format(',')(Math.round(avgViews))}<br/>
            Avg Likes: ${d3.format(',')(Math.round(avgLikes))}<br/>
            <button onclick="this.parentElement.remove()" style="margin-top: 5px; padding: 2px 8px; font-size: 10px;">Close</button>
        `);
    }

    // Export controls removed per request

    // Helper method to show country details
    showCountryDetails(country, data) {
        // Remove existing modal
        d3.select('body').select('.country-modal').remove();
        
        const modal = d3.select('body')
            .append('div')
            .attr('class', 'country-modal')
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', '100%')
            .style('height', '100%')
            .style('background', 'rgba(0,0,0,0.5)')
            .style('display', 'flex')
            .style('justify-content', 'center')
            .style('align-items', 'center')
            .style('z-index', '10000');

        const modalContent = modal.append('div')
            .style('background', 'white')
            .style('padding', '20px')
            .style('border-radius', '10px')
            .style('max-width', '500px')
            .style('max-height', '80%')
            .style('overflow-y', 'auto');

        modalContent.html(`
            <h3 style="margin-bottom: 15px; color: #2c3e50;">${country} - Detailed Statistics</h3>
            <div style="margin-bottom: 10px;">
                <strong>Average Views:</strong> ${d3.format(',')(Math.round(data.avgViews))}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Total Videos:</strong> ${data.videoCount.toLocaleString()}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Total Views:</strong> ${d3.format(',')(data.avgViews * data.videoCount)}
            </div>
            <div style="margin-bottom: 20px;">
                <strong>Performance Rank:</strong> ${this.getPerformanceRank(data.avgViews)}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="padding: 8px 16px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Close
            </button>
        `);
    }

    // Helper method to get performance rank
    getPerformanceRank(avgViews) {
        if (avgViews >= 1000000) return 'Excellent (1M+ views)';
        if (avgViews >= 500000) return 'Very Good (500K+ views)';
        if (avgViews >= 100000) return 'Good (100K+ views)';
        if (avgViews >= 50000) return 'Average (50K+ views)';
        return 'Below Average (<50K views)';
    }

    // Export methods
    exportSVG(containerId) {
        const container = document.getElementById(containerId);
        const svg = container.querySelector('svg');
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = `visualization_${containerId}_${new Date().toISOString().slice(0,10)}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    exportPNG(containerId) {
        const container = document.getElementById(containerId);
        const svg = container.querySelector('svg');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            canvas.width = svg.width.baseVal.value;
            canvas.height = svg.height.baseVal.value;
            ctx.drawImage(img, 0, 0);
            
            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `visualization_${containerId}_${new Date().toISOString().slice(0,10)}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        };
        
        img.src = url;
    }

    resetZoom(containerId) {
        const container = document.getElementById(containerId);
        const svg = container.querySelector('svg');
        if (svg) {
            svg.dispatchEvent(new CustomEvent('resetZoom'));
        }
    }

    // 4. Timeline - Trending Videos Over Time
    createTimeline(data, container, selectedCountry = null) {
        this.clearVisualization(container);
        
        const margin = { top: 20, right: 30, bottom: 60, left: 70 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        // Create main chart group
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title if country is selected
        if (selectedCountry && selectedCountry !== 'all') {
            const countryNames = {
                'CA': 'Canada', 'DE': 'Germany', 'FR': 'France', 'GB': 'Great Britain',
                'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'MX': 'Mexico',
                'RU': 'Russia', 'US': 'United States'
            };
            const countryName = countryNames[selectedCountry] || selectedCountry;
            
            svg.append('text')
                .attr('x', (width + margin.left + margin.right) / 2)
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .text(`Trending Videos Timeline - ${countryName}`);
        }

        // Create scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([height, 0]);

        // Create zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 10])
            .on('zoom', (event) => {
                const { transform } = event;
                
                // Update scales with zoom transform
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);
                
                // Update axes
                g.select('.x-axis').call(d3.axisBottom(newXScale).tickFormat(d3.timeFormat('%m/%d')));
                g.select('.y-axis').call(d3.axisLeft(newYScale));
                
                // Update line
                const newLine = d3.line()
                    .x(d => newXScale(d.date))
                    .y(d => newYScale(d.count))
                    .curve(d3.curveMonotoneX);
                
                g.select('.timeline-line').attr('d', newLine(data));
                
                // Update points
                g.selectAll('.dot')
                    .attr('cx', d => newXScale(d.date))
                    .attr('cy', d => newYScale(d.count));
            });

        // Apply zoom to SVG
        svg.call(zoom);

        // Add grid lines
        g.append('g')
            .attr('class', 'grid x-grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat('')
            );

        g.append('g')
            .attr('class', 'grid y-grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat('')
            );

        // Axes
        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

        g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(yScale));

        // Line
        g.append('path')
            .datum(data)
            .attr('class', 'timeline-line')
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2)
            .attr('d', d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.count))
                .curve(d3.curveMonotoneX)
            );

        // Points with enhanced interactivity
        g.selectAll('.dot')
            .data(data)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.count))
            .attr('r', 4)
            .attr('fill', '#e74c3c')
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('r', 6)
                    .attr('stroke-width', 2);
                
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>Date: ${d.date.toLocaleDateString()}</strong><br/>
                    Trending Videos: ${d.count}<br/>
                    Total Views: ${d3.format('.2s')(d.totalViews)}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Labels
        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Date');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Number of Trending Videos');
    }

    // 5. Heatmap - Country Activity
    createHeatmap(data, container) {
        this.clearVisualization(container);
        
        console.log('Heatmap data received:', data);
        
        // Validate data
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Data Available</h4>
                        <p>Please wait for data to load or try refreshing the page.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        let heatmapData = data.data;
        let categories = data.categories || [];
        // Apply simple category view filter from dropdown (top10/top5 by overall frequency)
        const view = document.getElementById('heatmap-category-filter')?.value || 'all';
        if (view !== 'all' && categories.length > 0) {
            const countsByCategory = {};
            heatmapData.forEach(d => {
                countsByCategory[d.category] = (countsByCategory[d.category] || 0) + d.count;
            });
            const sortedCats = Object.entries(countsByCategory)
                .sort((a,b) => b[1]-a[1])
                .map(([c]) => c);
            const limit = view === 'top5' ? 5 : 10;
            const chosen = new Set(sortedCats.slice(0, limit));
            categories = categories.filter(c => chosen.has(c));
            heatmapData = heatmapData.filter(d => chosen.has(d.category));
        }
        const countries = data.countries || [];
        
        if (categories.length === 0 || countries.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Categories or Countries Found</h4>
                        <p>Please check your data files.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Balanced margins to keep the plot centered and away from the footer
        const margin = { top: 50, right: 30, bottom: 60, left: 120 };
        const containerRect = container.getBoundingClientRect();
        // Cap the chart height to ensure the footer doesn't overlap and axes remain visible
        const width = containerRect.width - margin.left - margin.right;
        const height = Math.max(300, containerRect.height - margin.top - margin.bottom - 10);

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text(`Category Distribution by Country (${categories.length} Categories)`);

        const maxValue = d3.max(heatmapData, d => d.value) || 0;

        // External legend (outside chart SVG to avoid overlap)
        // Create a full-width, centered legend above the chart for clean alignment
        const legendSvgTop = d3.select(container)
            .insert('svg', ':first-child')
            .attr('width', containerRect.width)
            .attr('height', 46)
            .style('display', 'block')
            .style('margin-bottom', '8px');

        // Inner bar width centered within full width
        const legendInnerWidth = Math.max(240, Math.min(360, containerRect.width - 120));
        const xOffset = Math.max(30, (containerRect.width - legendInnerWidth) / 2);

        const defsTop = legendSvgTop.append('defs');
        const gradientIdTop = 'heatmap-gradient-external';
        const gradientTop = defsTop.append('linearGradient')
            .attr('id', gradientIdTop)
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');

        // Blue to Orange legend gradient
        gradientTop.append('stop').attr('offset', '0%').attr('stop-color', '#2563eb');
        gradientTop.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b');

        legendSvgTop.append('text')
            .attr('x', containerRect.width / 2)
            .attr('y', 14)
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .attr('text-anchor', 'middle')
            .text('Category Percentage');

        const barY = 20;
        legendSvgTop.append('rect')
            .attr('x', xOffset)
            .attr('y', barY)
            .attr('width', legendInnerWidth)
            .attr('height', 12)
            .attr('fill', `url(#${gradientIdTop})`)
            .attr('stroke', '#ccc');

        legendSvgTop.append('text')
            .attr('x', xOffset)
            .attr('y', barY + 22)
            .style('font-size', '11px')
            .text('0%');

        legendSvgTop.append('text')
            .attr('x', xOffset + legendInnerWidth)
            .attr('y', barY + 22)
            .attr('text-anchor', 'end')
            .style('font-size', '11px')
            .text(`${maxValue.toFixed(1)}%`);
        
        // Scales
        const xScale = d3.scaleBand()
            .domain(countries)
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .padding(0.1);

        // Switch to Blue → Orange scale for cells
        const colorScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range(['#2563eb', '#f59e0b']);

        // Rectangles
        g.selectAll('.cell')
            .data(heatmapData)
            .enter().append('rect')
            .attr('class', 'cell')
            .attr('x', d => xScale(d.country))
            .attr('y', d => yScale(d.category))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.value))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.country} - ${d.category}</strong><br/>
                    Percentage: ${d.value.toFixed(1)}%<br/>
                    Videos: ${d.count} / ${d.totalVideos}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Axes
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '11px')
            .style('text-anchor', 'end')
            .attr('dx', '-8px')
            .attr('dy', '0.35em');

        // Labels
        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 16})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Country');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Category');

        // Removed in-chart legend; now using external legend above the chart
    }

    // 6. Treemap - Top Channels
    createTreemap(data, container) {
        this.clearVisualization(container);
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Prepare data for treemap
        const root = d3.hierarchy({ children: data })
            .sum(d => d.totalViews)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(2);

        treemap(root);

        const leaves = svg.selectAll('.leaf')
            .data(root.leaves())
            .enter().append('g')
            .attr('class', 'leaf')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        leaves.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', (d, i) => this.colorScale(i))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.data.name}</strong><br/>
                    Total Views: ${d3.format('.2s')(d.data.totalViews)}<br/>
                    Videos: ${d.data.videoCount}<br/>
                    Countries: ${d.data.countries.join(', ')}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        leaves.append('text')
            .attr('x', 4)
            .attr('y', 14)
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text(d => {
                const rectWidth = d.x1 - d.x0;
                const name = d.data.name;
                if (rectWidth > 60) {
                    return name.length > 12 ? name.substring(0, 12) + '...' : name;
                }
                return '';
            });
    }

    // 7. Publishing Timing Heatmap - When to Publish for Success
    createPublishingTimingHeatmap(data, container) {
        this.clearVisualization(container);
        
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Timing Data Available</h4>
                        <p>Waiting for video data to load...</p>
                    </div>
                </div>
            `;
            return;
        }

        // Responsive margin adjustments for Publishing Timing
        const containerRect = container.getBoundingClientRect();
        const isMobile = containerRect.width < 768;
        const margin = isMobile 
            ? { top: 60, right: 60, bottom: 100, left: 80 }
            : { top: 80, right: 80, bottom: 120, left: 100 };
        const width = containerRect.width - margin.left - margin.right;
        const minHeight = isMobile ? 300 : 350;
        const height = Math.max(minHeight, containerRect.height - margin.top - margin.bottom);
        
        const cellWidth = width / 24; // 24 hours
        const cellHeight = height / 7; // 7 days

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Color scale for success rate (0-100%)
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, 100]);

        // Create heatmap cells
        const cells = chartGroup.selectAll('.timing-cell')
            .data(data.data)
            .enter().append('rect')
            .attr('class', 'timing-cell')
            .attr('x', d => d.hour * cellWidth)
            .attr('y', d => d.day * cellHeight)
            .attr('width', cellWidth - 1)
            .attr('height', cellHeight - 1)
            .attr('fill', d => d.count > 0 ? colorScale(d.successRate) : '#f0f0f0')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.tooltip.style('opacity', .9)
                    .html(`
                        <strong>${d.dayName} ${d.hour}:00</strong><br/>
                        Videos Published: ${d.count}<br/>
                        Avg Views: ${d.avgViews.toLocaleString()}<br/>
                        Avg Likes: ${d.avgLikes.toLocaleString()}<br/>
                        Success Score: ${d.successRate.toFixed(1)}%
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.style('opacity', 0);
            });

        // Add day labels (Y-axis)
        chartGroup.selectAll('.day-label')
            .data(data.days)
            .enter().append('text')
            .attr('class', 'day-label')
            .attr('x', -10)
            .attr('y', (d, i) => i * cellHeight + cellHeight/2)
            .attr('text-anchor', 'end')
            .attr('alignment-baseline', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => d.substring(0, 3)); // Mon, Tue, etc.

        // Add hour labels (X-axis) with smart spacing
        const hours = Array.from({length: 24}, (_, i) => i);
        const labelInterval = Math.max(1, Math.floor(24 / Math.max(8, width / 50))); // Dynamic spacing
        chartGroup.selectAll('.hour-label')
            .data(hours)
            .enter().append('text')
            .attr('class', 'hour-label')
            .attr('x', d => d * cellWidth + cellWidth/2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', cellWidth > 25 ? '10px' : '8px') // Responsive font size
            .style('fill', '#666')
            .text(d => d % labelInterval === 0 ? `${d}:00` : ''); // Smart labeling

        // Add title with enhanced styling
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', width > 600 ? '18px' : '16px') // Responsive title size
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('📅 Publishing Timing Strategy');

        // Add subtitle
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#7f8c8d')
            .text('Optimal times to publish content for maximum engagement');

        // Add legend with safe positioning
        const legendWidth = Math.min(200, width * 0.4); // Responsive legend width
        const legendHeight = 15;
        const legendX = Math.max(20, width + margin.left - legendWidth); // Prevent overflow
        const legend = svg.append('g')
            .attr('transform', `translate(${legendX}, ${margin.top + height + 25})`);

        const legendScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => `${d.toFixed(0)}%`);

        // Create gradient for legend
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'timing-legend-gradient');

        gradient.selectAll('stop')
            .data(d3.range(0, 1.01, 0.1))
            .enter().append('stop')
            .attr('offset', d => `${d * 100}%`)
            .attr('stop-color', d => colorScale(d * 100));

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#timing-legend-gradient)')
            .attr('stroke', '#333')
            .attr('stroke-width', 1);

        legend.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(legendAxis);

        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('Success Rate');

        // Add instructions
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', height + margin.top + margin.bottom - 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#999')
            .text('💡 Hover cells to see publishing stats • Darker colors = better performance');
    }

    // 8. Tag Racing Competition - Horizontal bar racing chart
    createTagAnalysisChart(data, container, chartType = 'racing-bars') {
        // Only Tag Racing Competition is supported now
        this.createTagRacingBars(data, container);
    }

    // 8a. Tag Racing Bar Chart - Animated competition over time
    createTagRacingBars(data, container) {
        this.clearVisualization(container);
        
        if (!data || !data.racingData || data.racingData.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Racing Data Available</h4>
                        <p>Waiting for tag racing data to load...</p>
                    </div>
                </div>
            `;
            return;
        }

        // Responsive margin adjustments for Tag Racing
        const containerRect = container.getBoundingClientRect();
        const isMobile = containerRect.width < 768;
        const margin = isMobile 
            ? { top: 60, right: 80, bottom: 80, left: 100 }
            : { top: 80, right: 100, bottom: 100, left: 150 };
        const width = containerRect.width - margin.left - margin.right;
        const minHeight = isMobile ? 350 : 400;
        const height = Math.max(minHeight, containerRect.height - margin.top - margin.bottom);

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Calculate maximum count across all periods for scaling
        const maxCount = d3.max(data.racingData, period => 
            d3.max(period.tags, tag => tag.count)) || 10;

        const yScale = d3.scaleBand()
            .domain(data.tags)
            .range([0, height])
            .padding(0.1);

        const xScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([0, width]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Calculate average data for display
        const avgData = this.calculateAverageTagData(data.racingData);

        // Create bars with average data
        const bars = chartGroup.selectAll('.racing-bar')
            .data(avgData)
            .enter().append('rect')
            .attr('class', 'racing-bar')
            .attr('x', 0)
            .attr('y', d => yScale(d.tag))
            .attr('width', d => xScale(d.count))
            .attr('height', yScale.bandwidth())
            .attr('fill', (d, i) => colorScale(i))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');

        // Add value labels with average data
        const labels = chartGroup.selectAll('.bar-label')
            .data(avgData)
            .enter().append('text')
            .attr('class', 'bar-label')
            .attr('x', d => xScale(d.count) + 5)
            .attr('y', d => yScale(d.tag) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => d.count);

        // Add tag names with average data
        const tagNames = chartGroup.selectAll('.tag-name')
            .data(avgData)
            .enter().append('text')
            .attr('class', 'tag-name')
            .attr('x', -10)
            .attr('y', d => yScale(d.tag) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .style('cursor', 'pointer')
            .text(d => d.tag.length > 15 ? d.tag.substring(0, 15) + '...' : d.tag);

        // Add axes
        chartGroup.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        // Add title and period indicator
        const title = svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', width > 600 ? '18px' : '16px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('🏆 Tag Racing Competition');

        const periodTitle = svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 50)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#666')
            .text(`Showing: Average Across All Periods`);

        // Calculate average data for cleaner display

        // Update bars to show average data instead of first period
        chartGroup.selectAll('.racing-bar')
            .data(avgData)
            .attr('width', d => xScale(d.count))
            .attr('y', d => yScale(d.tag))
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('stroke', '#2c3e50')
                    .attr('stroke-width', 3)
                    .style('opacity', 0.9);

                this.tooltip.style('opacity', .9)
                    .html(`
                        <div style="font-weight: bold; font-size: 14px; color: #2c3e50; margin-bottom: 8px;">
                            🏆 ${d.tag}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Rank:</strong> #${avgData.indexOf(d) + 1}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Avg Usage Count:</strong> ${d.count.toLocaleString()}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Total Views:</strong> ${d.totalViews.toLocaleString()}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Total Likes:</strong> ${d.totalLikes.toLocaleString()}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Avg Views per Use:</strong> ${Math.round(d.totalViews / d.count).toLocaleString()}
                        </div>
                        <div style="color: #7f8c8d; font-size: 11px; margin-top: 6px;">
                            Average across all time periods<br/>
                            Region: ${data.countryName || 'Global'}
                        </div>
                    `)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', (event, d) => {
                d3.select(event.target)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .style('opacity', 1);
                this.tooltip.style('opacity', 0);
            });

        // Update labels to show average data
        chartGroup.selectAll('.bar-label')
            .data(avgData)
            .attr('x', d => xScale(d.count) + 5)
            .attr('y', d => yScale(d.tag) + yScale.bandwidth() / 2)
            .text(d => d.count);

        // Update tag names to show average data
        chartGroup.selectAll('.tag-name')
            .data(avgData)
            .attr('y', d => yScale(d.tag) + yScale.bandwidth() / 2)
            .text(d => d.tag.length > 15 ? d.tag.substring(0, 15) + '...' : d.tag)
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .style('fill', '#2980b9')
                    .style('font-size', '12px');

                const barIndex = avgData.indexOf(d);
                chartGroup.selectAll('.racing-bar')
                    .filter((barData, i) => i === barIndex)
                    .attr('stroke', '#2c3e50')
                    .attr('stroke-width', 3)
                    .style('opacity', 0.9);

                this.tooltip.style('opacity', .9)
                    .html(`
                        <div style="font-weight: bold; font-size: 14px; color: #2c3e50; margin-bottom: 8px;">
                            🏷️ ${d.tag}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Rank:</strong> #${barIndex + 1} of ${avgData.length}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Avg Usage Count:</strong> ${d.count.toLocaleString()} videos
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Total Views:</strong> ${d.totalViews.toLocaleString()}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Total Likes:</strong> ${d.totalLikes.toLocaleString()}
                        </div>
                        <div style="margin-bottom: 4px;">
                            <strong>Performance:</strong> ${Math.round(d.totalViews / d.count).toLocaleString()} avg views/use
                        </div>
                        <div style="color: #7f8c8d; font-size: 11px; margin-top: 6px;">
                            💡 ${d.tag.length > 15 ? 'Full tag: ' + d.tag : 'Average performance across all periods'}
                        </div>
                    `)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', (event, d) => {
                d3.select(event.target)
                    .style('fill', '#333')
                    .style('font-size', '11px');

                const barIndex = avgData.indexOf(d);
                chartGroup.selectAll('.racing-bar')
                    .filter((barData, i) => i === barIndex)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .style('opacity', 1);

                this.tooltip.style('opacity', 0);
            });

        // Add instructions
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', height + margin.top + margin.bottom - 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#999')
            .text('🏆 Hover bars or tag names for detailed performance metrics across all time periods');
    }

    // Helper function to calculate average tag data across all periods
    calculateAverageTagData(racingData) {
        const tagTotals = {};
        
        // Sum up all data across periods
        racingData.forEach(period => {
            period.tags.forEach(tag => {
                if (!tagTotals[tag.tag]) {
                    tagTotals[tag.tag] = {
                        tag: tag.tag,
                        count: 0,
                        totalViews: 0,
                        totalLikes: 0,
                        periods: 0
                    };
                }
                tagTotals[tag.tag].count += tag.count;
                tagTotals[tag.tag].totalViews += tag.totalViews;
                tagTotals[tag.tag].totalLikes += tag.totalLikes;
                tagTotals[tag.tag].periods++;
            });
        });
        
        // Calculate averages and sort by usage
        const avgTags = Object.values(tagTotals).map(tag => ({
            tag: tag.tag,
            count: Math.round(tag.count / tag.periods),
            totalViews: tag.totalViews,
            totalLikes: tag.totalLikes,
            avgViews: Math.round(tag.totalViews / tag.count),
            avgLikes: Math.round(tag.totalLikes / tag.count)
        })).sort((a, b) => b.count - a.count);
        
        return avgTags;
    }

    // Create Tag Flow Diagram (Sankey) - shows tag-category relationships
    createTagFlowDiagram(data, container, chartType = 'sankey') {
        try {
            // Clear container with fade effect
            d3.select(container).selectAll('*').remove();

            // Set up responsive dimensions with better margins
            const containerRect = container.getBoundingClientRect();
            const isMobile = containerRect.width < 768;
            const isTablet = containerRect.width < 1024;
            
            let margin;
            if (isMobile) {
                margin = { top: 40, right: 100, bottom: 60, left: 100 };
            } else if (isTablet) {
                margin = { top: 50, right: 130, bottom: 70, left: 130 };
            } else {
                margin = { top: 60, right: 150, bottom: 80, left: 150 };
            }
            
            const width = Math.max(isMobile ? 500 : 700, containerRect.width - 40) - margin.left - margin.right;
            const height = Math.max(isMobile ? 400 : 500, Math.min(650, (containerRect.height || 700) - 40)) - margin.top - margin.bottom;

            // Create SVG with proper spacing
            const svg = d3.select(container)
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .style('background', '#fafafa')
                .style('border-radius', '8px')
                .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');

            const g = svg.append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Check if we have data
            if (!data.nodes || data.nodes.length === 0 || !data.links || data.links.length === 0) {
                g.append('text')
                    .attr('x', width / 2)
                    .attr('y', height / 2)
                    .attr('text-anchor', 'middle')
                    .style('font-size', '16px')
                    .style('fill', '#7f8c8d')
                    .text(`No tag-category connections found for ${data.countryName || 'selected region'}`);
                return;
            }

            // Create Sankey generator with optimal spacing
            const sankey = d3.sankey()
                .nodeWidth(25)
                .nodePadding(15)
                .extent([[0, 0], [width, height]])
                .nodeAlign(d3.sankeyLeft)
                .nodeSort((a, b) => {
                    // Sort tags by usage, categories by name
                    if (a.type === 'tag' && b.type === 'tag') {
                        return b.count - a.count;
                    }
                    if (a.type === 'category' && b.type === 'category') {
                        return a.name.localeCompare(b.name);
                    }
                    return a.type === 'tag' ? -1 : 1;
                });

            // Generate the Sankey layout
            const {nodes, links} = sankey({
                nodes: data.nodes.map(d => ({...d})),
                links: data.links.map(d => ({...d}))
            });

            // Define colors with good contrast
            const tagColor = '#3498db';
            const categoryColors = {
                'Gaming': '#27ae60',
                'Entertainment': '#9b59b6', 
                'Music': '#f39c12',
                'Education': '#e74c3c',
                'Comedy': '#e67e22',
                'Sports': '#1abc9c',
                'News & Politics': '#34495e',
                'Science & Technology': '#2c3e50',
                'Film & Animation': '#8e44ad',
                'People & Blogs': '#95a5a6'
            };

            // Create tooltip with enhanced styling
            const tooltip = d3.select('body').append('div')
                .attr('class', 'sankey-tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.9)')
                .style('color', 'white')
                .style('padding', '12px 16px')
                .style('border-radius', '8px')
                .style('font-size', '13px')
                .style('font-family', 'system-ui, -apple-system, sans-serif')
                .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)')
                .style('backdrop-filter', 'blur(4px)')
                .style('z-index', '10000')
                .style('max-width', '300px')
                .style('line-height', '1.4')
                .style('opacity', 0)
                .style('pointer-events', 'none');

            // Create gradient definitions
            const defs = svg.append('defs');
            
            // Add links with gradients
            const link = g.append('g')
                .selectAll('.sankey-link')
                .data(links)
                .enter().append('path')
                .attr('class', 'sankey-link')
                .attr('d', d3.sankeyLinkHorizontal())
                .style('fill', 'none')
                .style('stroke-opacity', 0.4)
                .style('stroke-width', d => Math.max(2, d.width))
                .style('stroke', d => {
                    // Create gradient from tag color to category color
                    const sourceColor = tagColor;
                    const targetColor = categoryColors[d.category] || '#95a5a6';
                    
                    const gradientId = `gradient-${d.source.index}-${d.target.index}`;
                    const gradient = defs.append('linearGradient')
                        .attr('id', gradientId)
                        .attr('gradientUnits', 'userSpaceOnUse')
                        .attr('x1', d.source.x1).attr('y1', d.source.y0 + (d.source.y1 - d.source.y0) / 2)
                        .attr('x2', d.target.x0).attr('y2', d.target.y0 + (d.target.y1 - d.target.y0) / 2);
                    
                    gradient.append('stop')
                        .attr('offset', '0%')
                        .attr('stop-color', sourceColor)
                        .attr('stop-opacity', 0.6);
                    
                    gradient.append('stop')
                        .attr('offset', '100%')
                        .attr('stop-color', targetColor)
                        .attr('stop-opacity', 0.6);
                    
                    return `url(#${gradientId})`;
                })
                .style('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    // Highlight this link
                    d3.select(this)
                        .style('stroke-opacity', 0.8)
                        .style('stroke-width', d.width + 2);
                    
                    // Dim other links
                    link.filter(other => other !== d)
                        .style('stroke-opacity', 0.1);
                    
                    // Show tooltip
                    tooltip.style('opacity', 1)
                        .html(`
                            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; margin-bottom: 8px;">
                                <strong style="color: #3498db;">#${d.tag}</strong> → <strong style="color: ${categoryColors[d.category] || '#95a5a6'};">${d.category}</strong>
                            </div>
                            <div style="font-size: 12px; color: #ecf0f1;">
                                <div><strong>Connection Strength:</strong> ${d.value} videos</div>
                                <div><strong>Total Views:</strong> ${d.totalViews.toLocaleString()}</div>
                                <div><strong>Avg Views:</strong> ${d.avgViews.toLocaleString()}</div>
                                <div><strong>Avg Likes:</strong> ${d.avgLikes.toLocaleString()}</div>
                            </div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; color: #bdc3c7;">
                                💡 This tag appears in ${d.value} ${d.category} videos
                            </div>
                        `)
                        .style('left', (event.pageX + 15) + 'px')
                        .style('top', (event.pageY - 10) + 'px');
                })
                .on('mouseout', function(event, d) {
                    // Reset all links
                    link.style('stroke-opacity', 0.4)
                        .style('stroke-width', d => Math.max(2, d.width));
                    
                    // Hide tooltip
                    tooltip.style('opacity', 0);
                });

            // Add nodes with proper spacing and colors
            const node = g.append('g')
                .selectAll('.sankey-node')
                .data(nodes)
                .enter().append('g')
                .attr('class', 'sankey-node')
                .attr('transform', d => `translate(${d.x0},${d.y0})`);

            // Add node rectangles
            node.append('rect')
                .attr('height', d => Math.max(4, d.y1 - d.y0))
                .attr('width', 25)
                .style('fill', d => {
                    if (d.type === 'tag') return tagColor;
                    return categoryColors[d.name] || '#95a5a6';
                })
                .style('stroke', 'white')
                .style('stroke-width', 1)
                .style('cursor', 'pointer')
                .style('rx', 3)
                .on('mouseover', function(event, d) {
                    // Highlight connected links
                    link.style('stroke-opacity', linkData => {
                        return (linkData.source === d || linkData.target === d) ? 0.8 : 0.1;
                    });
                    
                    // Show node tooltip
                    tooltip.style('opacity', 1)
                        .html(`
                            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; margin-bottom: 8px;">
                                <strong style="color: ${d.type === 'tag' ? '#3498db' : (categoryColors[d.name] || '#95a5a6')};">
                                    ${d.type === 'tag' ? '#' : '📂'} ${d.name}
                                </strong>
                            </div>
                            <div style="font-size: 12px; color: #ecf0f1;">
                                <div><strong>Total Videos:</strong> ${d.count.toLocaleString()}</div>
                                <div><strong>Total Views:</strong> ${d.totalViews.toLocaleString()}</div>
                                <div><strong>Avg Views:</strong> ${d.avgViews.toLocaleString()}</div>
                                <div><strong>Connections:</strong> ${d.type === 'tag' ? d.categories : d.tags} ${d.type === 'tag' ? 'categories' : 'tags'}</div>
                            </div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 11px; color: #bdc3c7;">
                                ${d.type === 'tag' ? '🏷️ Tag used across multiple categories' : '📂 Category with diverse tag usage'}
                            </div>
                        `)
                        .style('left', (event.pageX + 15) + 'px')
                        .style('top', (event.pageY - 10) + 'px');
                })
                .on('mouseout', function() {
                    // Reset all links
                    link.style('stroke-opacity', 0.4);
                    // Hide tooltip
                    tooltip.style('opacity', 0);
                });

            // Add node labels with smart positioning to prevent cutoff
            node.append('text')
                .attr('x', d => {
                    if (d.type === 'tag') {
                        // Position tag labels safely inside left margin
                        return Math.max(-margin.left + 10, -6);
                    } else {
                        // Position category labels safely inside right margin
                        return Math.min(width - margin.right + 10, 31);
                    }
                })
                .attr('y', d => (d.y1 - d.y0) / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', d => d.type === 'tag' ? 'end' : 'start')
                .style('font-family', 'system-ui, -apple-system, sans-serif')
                .style('font-size', '12px')
                .style('font-weight', '500')
                .style('fill', '#2c3e50')
                .style('user-select', 'none')
                .text(d => {
                    // Dynamic truncation based on available space
                    const availableWidth = d.type === 'tag' ? margin.left - 20 : margin.right - 40;
                    const charWidth = 8; // Approximate character width
                    const maxLength = Math.floor(availableWidth / charWidth);
                    return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
                })
                .append('title')
                .text(d => d.name);

            // Add section headers with safe positioning
            g.append('text')
                .attr('x', -margin.left / 2)
                .attr('y', -15)
                .attr('text-anchor', 'middle')
                .style('font-family', 'system-ui, -apple-system, sans-serif')
                .style('font-size', '14px')
                .style('font-weight', '600')
                .style('fill', '#2c3e50')
                .text('🏷️ TAGS');

            g.append('text')
                .attr('x', width + (margin.right / 2))
                .attr('y', -15)
                .attr('text-anchor', 'middle')
                .style('font-family', 'system-ui, -apple-system, sans-serif')
                .style('font-size', '14px')
                .style('font-weight', '600')
                .style('fill', '#2c3e50')
                .text('📂 CATEGORIES');

            // Add stats summary at the bottom
            const statsY = height + 25;
            g.append('text')
                .attr('x', width / 2)
                .attr('y', statsY)
                .attr('text-anchor', 'middle')
                .style('font-family', 'system-ui, -apple-system, sans-serif')
                .style('font-size', '11px')
                .style('fill', '#7f8c8d')
                .text(`${data.stats.totalTags} tags • ${data.stats.totalCategories} categories • ${data.stats.totalFlows} connections • ${data.countryName} data`);

            // Clean up tooltip on container removal
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (node.contains && node.contains(container)) {
                            tooltip.remove();
                            observer.disconnect();
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });

        } catch (error) {
            console.error('Error creating Sankey diagram:', error);
            d3.select(container).selectAll('*').remove();
            d3.select(container)
                .append('div')
                .style('text-align', 'center')
                .style('color', '#e74c3c')
                .style('padding', '40px')
                .style('font-family', 'system-ui, -apple-system, sans-serif')
                .html(`
                    <h3>⚠️ Visualization Error</h3>
                    <p>Unable to render Tag Flow Diagram</p>
                    <small>${error.message}</small>
                `);
        }
    }

}