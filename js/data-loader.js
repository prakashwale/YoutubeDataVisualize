// Data Loader Module
class DataLoader {
    constructor() {
        this.countries = ['CA', 'DE', 'FR', 'GB', 'IN', 'JP', 'KR', 'MX', 'RU', 'US'];
        this.categories = {};
        this.videoData = {};
        this.isLoaded = false;
    }

    // Load category mapping for all countries
    async loadCategories() {
        const categoryPromises = this.countries.map(async (country) => {
            try {
                const response = await fetch(`data/${country}_category_id.json`);
                const data = await response.json();
                this.categories[country] = this.processCategoryData(data);
                return { country, success: true };
            } catch (error) {
                console.error(`Error loading categories for ${country}:`, error);
                return { country, success: false, error };
            }
        });

        await Promise.all(categoryPromises);
        console.log('Categories loaded:', this.categories);
    }

    // Process category data to create id-to-name mapping
    processCategoryData(data) {
        const categoryMap = {};
        if (data.items) {
            data.items.forEach(item => {
                categoryMap[item.id] = item.snippet.title;
            });
        }
        return categoryMap;
    }

    // Load video data for specific countries (limited for performance)
    async loadVideoData(countriesToLoad = ['US', 'CA', 'GB', 'DE', 'FR', 'IN', 'JP', 'KR', 'MX', 'RU']) {
        const videoPromises = countriesToLoad.map(async (country) => {
            try {
                const response = await fetch(`data/${country}videos.csv`);
                const text = await response.text();
                this.videoData[country] = this.parseCSV(text, country);
                return { country, success: true, count: this.videoData[country].length };
            } catch (error) {
                console.error(`Error loading video data for ${country}:`, error);
                return { country, success: false, error };
            }
        });

        const results = await Promise.all(videoPromises);
        console.log('Video data loaded:', results);
        this.isLoaded = true;
        return results;
    }

    // Parse CSV data
    parseCSV(text, country) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];

        // Process a subset for performance (first 1000 rows)
        const maxRows = Math.min(lines.length, 1001); // 1000 data rows + header
        
        for (let i = 1; i < maxRows; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                
                // Add country information
                row.country = country;
                
                // Convert numeric fields
                row.views = parseInt(row.views) || 0;
                row.likes = parseInt(row.likes) || 0;
                row.dislikes = parseInt(row.dislikes) || 0;
                row.comment_count = parseInt(row.comment_count) || 0;
                row.category_id = parseInt(row.category_id) || 0;
                
                // Add category name
                row.category_name = this.categories[country] ? 
                    this.categories[country][row.category_id] || 'Unknown' : 'Unknown';
                
                // Parse trending date
                if (row.trending_date) {
                    row.trending_date_parsed = this.parseTrendingDate(row.trending_date);
                }
                
                data.push(row);
            }
        }
        
        return data;
    }

    // Parse CSV line handling quoted fields
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // Parse trending date format (e.g., "17.14.11")
    parseTrendingDate(dateStr) {
        try {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const year = 2000 + parseInt(parts[0]);
                const day = parseInt(parts[1]);
                const month = parseInt(parts[2]);
                return new Date(year, month - 1, day);
            }
        } catch (error) {
            console.warn('Could not parse date:', dateStr);
        }
        return null;
    }

    // Get aggregated data for visualizations
    getViewsByCountry() {
        const result = {};
        Object.keys(this.videoData).forEach(country => {
            const totalViews = this.videoData[country].reduce((sum, video) => sum + video.views, 0);
            const avgViews = totalViews / this.videoData[country].length;
            result[country] = {
                totalViews,
                avgViews,
                videoCount: this.videoData[country].length
            };
        });
        return result;
    }

    // Get category distribution across all countries
    getCategoryDistribution() {
        const categoryCount = {};
        Object.values(this.videoData).flat().forEach(video => {
            const category = video.category_name;
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        return categoryCount;
    }

    // Get category distribution for a specific country
    getCategoryDistributionByCountry(country) {
        if (country === 'all') {
            return this.getCategoryDistribution();
        }
        
        const categoryCount = {};
        if (this.videoData[country]) {
            this.videoData[country].forEach(video => {
                const category = video.category_name;
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
        }
        return categoryCount;
    }

    // Get list of available countries
    getAvailableCountries() {
        return Object.keys(this.videoData).sort();
    }

    // Get views vs likes data for scatter plot
    getViewsVsLikes(sampleSize = 500, country = 'all', filters = {}) {
        let videos;
        
        if (country === 'all') {
            videos = Object.values(this.videoData).flat();
        } else {
            videos = this.videoData[country] || [];
        }
        
        const minViews = Number.isFinite(filters.minViews) ? filters.minViews : 0;
        const maxViews = Number.isFinite(filters.maxViews) ? filters.maxViews : Infinity;
        const minLikes = Number.isFinite(filters.minLikes) ? filters.minLikes : 0;
        const maxLikes = Number.isFinite(filters.maxLikes) ? filters.maxLikes : Infinity;

        // Sample data for performance
        const sampled = videos
            .filter(video => video.views > 0 && video.likes > 0)
            .filter(video => video.views >= minViews && video.views <= maxViews)
            .filter(video => video.likes >= minLikes && video.likes <= maxLikes)
            .sort(() => 0.5 - Math.random())
            .slice(0, sampleSize);
        
        return sampled.map(video => ({
            views: video.views,
            likes: video.likes,
            title: video.title,
            country: video.country,
            category: video.category_name
        }));
    }

    // Get timeline data
    getTimelineData() {
        const timelineData = {};
        Object.values(this.videoData).flat().forEach(video => {
            if (video.trending_date_parsed) {
                const dateKey = video.trending_date_parsed.toISOString().split('T')[0];
                if (!timelineData[dateKey]) {
                    timelineData[dateKey] = {
                        date: video.trending_date_parsed,
                        count: 0,
                        totalViews: 0
                    };
                }
                timelineData[dateKey].count++;
                timelineData[dateKey].totalViews += video.views;
            }
        });
        
        return Object.values(timelineData).sort((a, b) => a.date - b.date);
    }

    // Get timeline data for a specific country
    getTimelineDataByCountry(country) {
        if (country === 'all') {
            return this.getTimelineData();
        }
        
        const timelineData = {};
        if (this.videoData[country]) {
            this.videoData[country].forEach(video => {
                if (video.trending_date_parsed) {
                    const dateKey = video.trending_date_parsed.toISOString().split('T')[0];
                    if (!timelineData[dateKey]) {
                        timelineData[dateKey] = {
                            date: video.trending_date_parsed,
                            count: 0,
                            totalViews: 0
                        };
                    }
                    timelineData[dateKey].count++;
                    timelineData[dateKey].totalViews += video.views;
                }
            });
        }
        
        return Object.values(timelineData).sort((a, b) => a.date - b.date);
    }

    // Get overall engagement metrics
    getEngagementMetrics() {
        const allVideos = Object.values(this.videoData).flat();
        return {
            Likes: allVideos.reduce((sum, v) => sum + v.likes, 0),
            Dislikes: allVideos.reduce((sum, v) => sum + v.dislikes, 0),
            Comments: allVideos.reduce((sum, v) => sum + v.comment_count, 0)
        };
    }

    // Get filtered engagement metrics
    getFilteredEngagementMetrics(country = 'all', category = 'all') {
        let filteredVideos = Object.values(this.videoData).flat();

        // Filter by country
        if (country !== 'all') {
            filteredVideos = filteredVideos.filter(video => video.country === country);
        }

        // Filter by category
        if (category !== 'all') {
            filteredVideos = filteredVideos.filter(video => video.category_name === category);
        }

        return {
            Likes: filteredVideos.reduce((sum, v) => sum + v.likes, 0),
            Dislikes: filteredVideos.reduce((sum, v) => sum + v.dislikes, 0),
            Comments: filteredVideos.reduce((sum, v) => sum + v.comment_count, 0)
        };
    }

    // Get all available categories
    getAvailableCategories() {
        const categories = new Set();
        Object.values(this.videoData).flat().forEach(video => {
            if (video.category_name) {
                categories.add(video.category_name);
            }
        });
        return Array.from(categories).sort();
    }

    // Get top videos by views
    getTopVideosByViews(limit = 10) {
        const allVideos = Object.values(this.videoData).flat();
        return allVideos
            .sort((a, b) => b.views - a.views)
            .slice(0, limit)
            .map(video => ({
                title: video.title.length > 30 ? video.title.substring(0, 30) + '...' : video.title,
                views: video.views,
                likes: video.likes,
                comments: video.comment_count,
                channel: video.channel_title,
                country: video.country,
                category: video.category_name
            }));
    }

    // Top videos by views with optional country filter
    getTopVideosByViewsFiltered(limit = 30, country = 'all') {
        let videos = Object.values(this.videoData).flat();
        if (country !== 'all') {
            videos = videos.filter(v => v.country === country);
        }
        return videos
            .filter(v => v.views > 0)
            .sort((a, b) => b.views - a.views)
            .slice(0, limit)
            .map(video => ({
                id: video.video_id || video.title,
                title: video.title,
                views: video.views,
                likes: video.likes,
                comments: video.comment_count,
                country: video.country,
                category: video.category_name,
                ratio: video.views > 0 ? video.likes / video.views : 0
            }));
    }

    // Engagement by category (likes, dislikes, comments)
    getCategoryEngagementByCountry(country = 'all') {
        const result = {};
        const source = country === 'all' ? Object.values(this.videoData).flat() : (this.videoData[country] || []);
        source.forEach(v => {
            const cat = v.category_name || 'Unknown';
            if (!result[cat]) {
                result[cat] = { Likes: 0, Comments: 0, Dislikes: 0 };
            }
            result[cat].Likes += v.likes || 0;
            result[cat].Comments += v.comment_count || 0;
            result[cat].Dislikes += v.dislikes || 0;
        });
        return result; // { category: { Likes, Comments, Dislikes } }
    }

    // Get top channels by engagement
    getTopChannelsByEngagement(limit = 10) {
        const channelData = {};
        Object.values(this.videoData).flat().forEach(video => {
            const channel = video.channel_title;
            if (!channelData[channel]) {
                channelData[channel] = {
                    name: channel,
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    videoCount: 0
                };
            }
            channelData[channel].totalViews += video.views;
            channelData[channel].totalLikes += video.likes;
            channelData[channel].totalComments += video.comment_count;
            channelData[channel].videoCount++;
        });

        return Object.values(channelData)
            .map(channel => ({
                name: channel.name.length > 20 ? channel.name.substring(0, 20) + '...' : channel.name,
                engagementScore: (channel.totalLikes / channel.totalViews) * 100,
                totalViews: channel.totalViews,
                totalLikes: channel.totalLikes,
                videoCount: channel.videoCount
            }))
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, limit);
    }

    // Get category performance data
    getCategoryPerformance() {
        const categories = this.getAvailableCategories();
        return categories.map(category => {
            const categoryVideos = Object.values(this.videoData).flat()
                .filter(video => video.category_name === category);
            
            if (categoryVideos.length > 0) {
                const totalViews = categoryVideos.reduce((sum, v) => sum + v.views, 0);
                const totalLikes = categoryVideos.reduce((sum, v) => sum + v.likes, 0);
                const totalComments = categoryVideos.reduce((sum, v) => sum + v.comment_count, 0);
                
                return {
                    category: category,
                    totalViews: totalViews,
                    totalLikes: totalLikes,
                    totalComments: totalComments,
                    videoCount: categoryVideos.length,
                    avgViews: totalViews / categoryVideos.length
                };
            }
            return null;
        }).filter(item => item !== null)
        .sort((a, b) => b.totalViews - a.totalViews);
    }

    // Get country performance data
    getCountryPerformance() {
        const countries = Object.keys(this.videoData);
        return countries.map(country => {
            const countryVideos = this.videoData[country] || [];
            if (countryVideos.length > 0) {
                const totalViews = countryVideos.reduce((sum, v) => sum + v.views, 0);
                const totalLikes = countryVideos.reduce((sum, v) => sum + v.likes, 0);
                const totalComments = countryVideos.reduce((sum, v) => sum + v.comment_count, 0);
                
                return {
                    country: country,
                    totalViews: totalViews,
                    totalLikes: totalLikes,
                    totalComments: totalComments,
                    videoCount: countryVideos.length,
                    avgViews: totalViews / countryVideos.length
                };
            }
            return null;
        }).filter(item => item !== null)
        .sort((a, b) => b.totalViews - a.totalViews);
    }

    // Get country video counts for choropleth map
    getCountryVideoCounts() {
        const countryCounts = {};
        Object.keys(this.videoData).forEach(country => {
            countryCounts[country] = this.videoData[country].length;
        });
        return countryCounts;
    }

    // Get country display names mapping
    getCountryDisplayNames() {
        return {
            'CA': 'Canada',
            'DE': 'Germany', 
            'FR': 'France',
            'GB': 'United Kingdom',
            'IN': 'India',
            'JP': 'Japan',
            'KR': 'South Korea',
            'MX': 'Mexico',
            'RU': 'Russia',
            'US': 'United States'
        };
    }

    // Get total number of unique channels
    getTotalChannelCount() {
        const uniqueChannels = new Set();
        Object.values(this.videoData).flat().forEach(video => {
            uniqueChannels.add(video.channel_title);
        });
        return uniqueChannels.size;
    }

    // Get all channels data (without limit)
    getAllChannels() {
        const channelData = {};
        Object.values(this.videoData).flat().forEach(video => {
            const channel = video.channel_title;
            if (!channelData[channel]) {
                channelData[channel] = {
                    name: channel,
                    videoCount: 0,
                    totalViews: 0,
                    countries: new Set()
                };
            }
            channelData[channel].videoCount++;
            channelData[channel].totalViews += video.views;
            channelData[channel].countries.add(video.country);
        });

        return Object.values(channelData)
            .map(channel => ({
                ...channel,
                countries: Array.from(channel.countries)
            }))
            .sort((a, b) => b.totalViews - a.totalViews);
    }

    // Get top channels data for treemap
    getTopChannels(limit = 50) {
        const allChannels = this.getAllChannels();
        return allChannels.slice(0, limit);
    }

    // Get channels filtered by country
    getChannelsByCountry(country, limit = 50) {
        const allChannels = this.getAllChannels();
        return allChannels
            .filter(channel => channel.countries.includes(country))
            .slice(0, limit);
    }

    // Reuse for leaderboard: returns channels like getAllChannels, optionally filtered and limited
    getChannelLeaderboard(limit = 25, country = 'all') {
        let channels = this.getAllChannels();
        if (country !== 'all') {
            channels = channels.filter(ch => ch.countries.includes(country));
        }
        return channels.slice(0, limit);
    }

    // Get heatmap data for category distribution by country
    getHeatmapData() {
        try {
            // Get all unique categories from all videos
            const allCategories = new Set();
            Object.values(this.videoData).flat().forEach(video => {
                if (video && video.category_name) {
                    allCategories.add(video.category_name);
                }
            });
            
            const categories = Array.from(allCategories).sort();
            const countries = Object.keys(this.videoData);
            
            // Create simple heatmap data structure
            const heatmapData = [];
            
            countries.forEach(country => {
                const countryVideos = this.videoData[country] || [];
                const categoryCounts = {};
                
                // Count videos per category
                countryVideos.forEach(video => {
                    if (video && video.category_name) {
                        categoryCounts[video.category_name] = (categoryCounts[video.category_name] || 0) + 1;
                    }
                });
                
                // Create data points for each category
                categories.forEach(category => {
                    const count = categoryCounts[category] || 0;
                    const totalVideos = countryVideos.length;
                    const percentage = totalVideos > 0 ? (count / totalVideos) * 100 : 0;
                    
                    heatmapData.push({
                        country: country,
                        category: category,
                        value: percentage,
                        count: count,
                        totalVideos: totalVideos
                    });
                });
            });
            
            return {
                data: heatmapData,
                categories: categories,
                countries: countries
            };
            
        } catch (error) {
            console.error('Error in getHeatmapData:', error);
            return {
                data: [],
                categories: [],
                countries: []
            };
        }
    }

    // Get publishing timing data for heatmap visualization
    getPublishingTimingData(selectedCountry = 'global') {
        try {
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            // Determine data source based on country selection
            let videosToProcess;
            if (selectedCountry === 'global') {
                videosToProcess = Object.values(this.videoData).flat();
            } else {
                videosToProcess = this.videoData[selectedCountry] || [];
            }
            
            // Initialize 7x24 grid for days and hours
            const timingData = [];
            for (let day = 0; day < 7; day++) {
                timingData[day] = [];
                for (let hour = 0; hour < 24; hour++) {
                    timingData[day][hour] = {
                        count: 0,
                        totalViews: 0,
                        totalLikes: 0,
                        totalComments: 0,
                        videos: []
                    };
                }
            }
            
            // Process videos
            videosToProcess.forEach(video => {
                if (video && video.publish_time) {
                    const publishDate = new Date(video.publish_time);
                    
                    // Validate the date and ensure day/hour are valid numbers
                    if (!isNaN(publishDate.getTime())) {
                        const day = publishDate.getDay(); // 0-6 (Sun-Sat)
                        const hour = publishDate.getHours(); // 0-23
                        
                        // Double check that day and hour are valid indices
                        if (day >= 0 && day <= 6 && hour >= 0 && hour <= 23) {
                            const slot = timingData[day][hour];
                            if (slot) {
                                slot.count++;
                                slot.totalViews += video.views || 0;
                                slot.totalLikes += video.likes || 0;
                                slot.totalComments += video.comment_count || 0;
                                slot.videos.push({
                                    title: video.title,
                                    views: video.views,
                                    country: video.country
                                });
                            }
                        }
                    }
                }
            });
            
            // Calculate overall statistics for proper success rate calculation
            let totalViews = 0;
            let totalVideos = 0;
            
            for (let day = 0; day < 7; day++) {
                for (let hour = 0; hour < 24; hour++) {
                    const slot = timingData[day][hour];
                    if (slot.count > 0) {
                        totalViews += slot.totalViews;
                        totalVideos += slot.count;
                    }
                }
            }
            
            const overallAvgViews = totalVideos > 0 ? totalViews / totalVideos : 0;
            
            // Convert to array format for visualization with proper success rate
            const heatmapArray = [];
            for (let day = 0; day < 7; day++) {
                for (let hour = 0; hour < 24; hour++) {
                    const slot = timingData[day][hour];
                    const avgViews = slot.count > 0 ? slot.totalViews / slot.count : 0;
                    
                    // Calculate success rate as percentage relative to overall average
                    // Cap at 100% for logical interpretation
                    let successRate = 0;
                    if (slot.count > 0 && overallAvgViews > 0) {
                        successRate = Math.min(100, (avgViews / overallAvgViews) * 100);
                    }
                    
                    heatmapArray.push({
                        day: day,
                        dayName: daysOfWeek[day],
                        hour: hour,
                        count: slot.count,
                        avgViews: avgViews,
                        avgLikes: slot.count > 0 ? slot.totalLikes / slot.count : 0,
                        avgComments: slot.count > 0 ? slot.totalComments / slot.count : 0,
                        totalViews: slot.totalViews,
                        successRate: successRate, // Now properly capped at 100%
                        videos: slot.videos
                    });
                }
            }
            
            // Max success rate is now always 100 or less
            const successRates = heatmapArray.map(d => d.successRate).filter(rate => !isNaN(rate) && isFinite(rate));
            const maxSuccess = successRates.length > 0 ? Math.max(...successRates) : 100;
            
            console.log(`Publishing Timing Stats:`);
            console.log(`- Overall average views: ${overallAvgViews.toLocaleString()}`);
            console.log(`- Max success rate: ${maxSuccess.toFixed(1)}%`);
            console.log(`- Success rates range: ${Math.min(...successRates).toFixed(1)}% - ${Math.max(...successRates).toFixed(1)}%`);
            
            return {
                data: heatmapArray,
                days: daysOfWeek,
                maxSuccess: maxSuccess,
                selectedCountry: selectedCountry,
                countryName: selectedCountry === 'global' ? 'Global' : this.getCountryName(selectedCountry)
            };
            
        } catch (error) {
            console.error('Error processing publishing timing data:', error);
            return { data: [], days: [], maxSuccess: 0 };
        }
    }

    // Get tag evolution timeline data
    getTagEvolutionData(filterType = 'overview') {
        try {
            const tagTimelineData = {};
            const allDates = new Set();
            
            // Process all videos to build tag timeline
            Object.values(this.videoData).flat().forEach(video => {
                if (video && video.tags && video.trending_date_parsed) {
                    const trendingDate = video.trending_date_parsed;
                    const dateKey = trendingDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                    allDates.add(dateKey);
                    
                    // Parse tags - split by | and clean quotes, filter out "none" and similar
                    const rawTags = video.tags.split('|').map(tag => tag.replace(/"/g, '').trim().toLowerCase());
                    const videoTags = rawTags.filter(tag => {
                        // Filter out empty, too short/long, and "none" variations
                        if (!tag || tag.length <= 2 || tag.length >= 30) return false;
                        
                        // Filter out various "none" patterns including [none] format
                        const nonePatterns = [
                            'none', '[none]', 'n/a', 'na', 'null', 'undefined', 
                            'no tag', 'no tags', 'notag', 'notags',
                            'empty', 'blank', '-', '_', '.', 
                            '[n/a]', '[na]', '[null]', '[empty]', '[blank]'
                        ];
                        
                        // Check if tag exactly matches any none pattern
                        if (nonePatterns.includes(tag)) return false;
                        
                        // Check for bracketed none variations
                        if (tag.startsWith('[') && tag.endsWith(']')) {
                            const innerTag = tag.slice(1, -1);
                            if (nonePatterns.includes(innerTag)) return false;
                        }
                        
                        // Check if tag contains "none" as a word
                        if (tag.includes('none') && (
                            tag === 'none' || 
                            tag.startsWith('none ') || 
                            tag.endsWith(' none') || 
                            tag.includes(' none ')
                        )) return false;
                        
                        return true;
                    }).slice(0, 8);

                    videoTags.forEach(tag => {
                        if (!tagTimelineData[tag]) {
                            tagTimelineData[tag] = {};
                        }
                        if (!tagTimelineData[tag][dateKey]) {
                            tagTimelineData[tag][dateKey] = {
                                count: 0,
                                totalViews: 0,
                                totalLikes: 0,
                                videos: []
                            };
                        }
                        
                        tagTimelineData[tag][dateKey].count++;
                        tagTimelineData[tag][dateKey].totalViews += video.views || 0;
                        tagTimelineData[tag][dateKey].totalLikes += video.likes || 0;
                        tagTimelineData[tag][dateKey].videos.push({
                            title: video.title,
                            views: video.views,
                            country: video.country
                        });
                    });
                }
            });

            // Filter for significant tags based on filterType and create timeline data
            let tagLimit = 15;
            let minOccurrences = 5;
            
            // Adjust filtering based on dropdown selection
            switch (filterType) {
                case 'top-tags':
                    tagLimit = 10;
                    minOccurrences = 10;
                    break;
                case 'trending':
                    tagLimit = 8;
                    minOccurrences = 15;
                    break;
                case 'overview':
                default:
                    tagLimit = 15;
                    minOccurrences = 5;
                    break;
            }
            
            const significantTags = Object.entries(tagTimelineData)
                .filter(([tag, timeData]) => {
                    const totalCount = Object.values(timeData).reduce((sum, dayData) => sum + dayData.count, 0);
                    return totalCount >= minOccurrences;
                })
                .sort((a, b) => {
                    const aTotal = Object.values(a[1]).reduce((sum, dayData) => sum + dayData.count, 0);
                    const bTotal = Object.values(b[1]).reduce((sum, dayData) => sum + dayData.count, 0);
                    return bTotal - aTotal;
                })
                .slice(0, tagLimit)
                .map(([tag, timeData]) => tag);

            const sortedDates = Array.from(allDates).sort();
            
            // Build timeline data structure
            const timelineData = significantTags.map(tag => {
                const tagData = {
                    tag,
                    timeline: []
                };
                
                sortedDates.forEach(dateKey => {
                    const dayData = tagTimelineData[tag] && tagTimelineData[tag][dateKey] ? 
                        tagTimelineData[tag][dateKey] : { count: 0, totalViews: 0, totalLikes: 0 };
                    
                    tagData.timeline.push({
                        date: new Date(dateKey),
                        dateKey,
                        count: dayData.count,
                        totalViews: dayData.totalViews,
                        totalLikes: dayData.totalLikes,
                        avgViews: dayData.count > 0 ? dayData.totalViews / dayData.count : 0
                    });
                });
                
                return tagData;
            });

            // Calculate statistics
            const totalTagUsage = timelineData.reduce((sum, tagData) => 
                sum + tagData.timeline.reduce((tagSum, day) => tagSum + day.count, 0), 0);
            
            console.log(`Tag Timeline (${filterType}): ${significantTags.length} tags across ${sortedDates.length} dates`);
            console.log(`Filter settings: ${tagLimit} limit, ${minOccurrences} min occurrences`);
            console.log('Sample filtered tags:', significantTags.slice(0, 10));
            console.log('Total unique tags found:', Object.keys(tagTimelineData).length);
            
            return {
                timelineData,
                tags: significantTags,
                dates: sortedDates,
                stats: {
                    totalTags: significantTags.length,
                    totalDates: sortedDates.length,
                    totalUsage: totalTagUsage,
                    avgUsagePerTag: totalTagUsage / significantTags.length,
                    dateRange: {
                        start: sortedDates[0],
                        end: sortedDates[sortedDates.length - 1]
                    }
                }
            };

        } catch (error) {
            console.error('Error processing tag evolution data:', error);
            return { 
                timelineData: [],
                tags: [],
                dates: [],
                stats: {}
            };
        }
    }

    // Get tag racing bar data - shows tag competition over time periods
    getTagRacingData(filterType = 'overview', selectedCountry = 'global') {
        try {
            const tagPeriodData = {};
            const periods = new Set();
            
            // Determine data source based on country selection
            let videosToProcess;
            if (selectedCountry === 'global') {
                videosToProcess = Object.values(this.videoData).flat();
            } else {
                videosToProcess = this.videoData[selectedCountry] || [];
            }
            
            // Process videos to build tag data by time periods (weekly)
            videosToProcess.forEach(video => {
                if (video && video.tags && video.trending_date_parsed) {
                    const trendingDate = video.trending_date_parsed;
                    const weekNumber = Math.floor((trendingDate.getTime() - new Date(trendingDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
                    const periodKey = `Week ${weekNumber + 1}`;
                    periods.add(periodKey);
                    
                    // Parse tags
                    const rawTags = video.tags.split('|').map(tag => tag.replace(/"/g, '').trim().toLowerCase());
                    const videoTags = rawTags.filter(tag => {
                        if (!tag || tag.length <= 2 || tag.length >= 30) return false;
                        const nonePatterns = ['none', '[none]', 'n/a', 'na', 'null', 'undefined', 'no tag', 'no tags', 'notag', 'notags', 'empty', 'blank', '-', '_', '.', '[n/a]', '[na]', '[null]', '[empty]', '[blank]'];
                        if (nonePatterns.includes(tag)) return false;
                        if (tag.startsWith('[') && tag.endsWith(']')) {
                            const innerTag = tag.slice(1, -1);
                            if (nonePatterns.includes(innerTag)) return false;
                        }
                        if (tag.includes('none') && (tag === 'none' || tag.startsWith('none ') || tag.endsWith(' none') || tag.includes(' none '))) return false;
                        return true;
                    }).slice(0, 8);

                    videoTags.forEach(tag => {
                        if (!tagPeriodData[tag]) {
                            tagPeriodData[tag] = {};
                        }
                        if (!tagPeriodData[tag][periodKey]) {
                            tagPeriodData[tag][periodKey] = {
                                count: 0,
                                totalViews: 0,
                                totalLikes: 0
                            };
                        }
                        tagPeriodData[tag][periodKey].count++;
                        tagPeriodData[tag][periodKey].totalViews += video.views || 0;
                        tagPeriodData[tag][periodKey].totalLikes += video.likes || 0;
                    });
                }
            });

            // Filter and sort periods
            const sortedPeriods = Array.from(periods).sort();
            
            // Apply filter settings
            let tagLimit = 15;
            let minOccurrences = 5;
            switch (filterType) {
                case 'top-tags': tagLimit = 10; minOccurrences = 10; break;
                case 'trending': tagLimit = 8; minOccurrences = 15; break;
                default: tagLimit = 15; minOccurrences = 5; break;
            }
            
            // Get significant tags
            const significantTags = Object.entries(tagPeriodData)
                .filter(([tag, periodData]) => {
                    const totalCount = Object.values(periodData).reduce((sum, data) => sum + data.count, 0);
                    return totalCount >= minOccurrences;
                })
                .sort((a, b) => {
                    const aTotal = Object.values(a[1]).reduce((sum, data) => sum + data.count, 0);
                    const bTotal = Object.values(b[1]).reduce((sum, data) => sum + data.count, 0);
                    return bTotal - aTotal;
                })
                .slice(0, tagLimit)
                .map(([tag]) => tag);

            // Build racing data structure
            const racingData = sortedPeriods.map(period => {
                const periodData = significantTags.map(tag => ({
                    tag,
                    count: tagPeriodData[tag] && tagPeriodData[tag][period] ? tagPeriodData[tag][period].count : 0,
                    totalViews: tagPeriodData[tag] && tagPeriodData[tag][period] ? tagPeriodData[tag][period].totalViews : 0,
                    totalLikes: tagPeriodData[tag] && tagPeriodData[tag][period] ? tagPeriodData[tag][period].totalLikes : 0,
                })).sort((a, b) => b.count - a.count);

                return {
                    period,
                    tags: periodData
                };
            });

            console.log(`Tag Racing: ${significantTags.length} tags across ${sortedPeriods.length} periods`);
            console.log('Racing tags:', significantTags.slice(0, 5));

            return {
                racingData,
                tags: significantTags,
                periods: sortedPeriods,
                stats: {
                    totalTags: significantTags.length,
                    totalPeriods: sortedPeriods.length
                }
            };

        } catch (error) {
            console.error('Error processing tag racing data:', error);
            return { racingData: [], tags: [], periods: [], stats: {} };
        }
    }

    // Get available countries for dropdown
    getAvailableCountries() {
        const countries = Object.keys(this.videoData).filter(country => 
            this.videoData[country] && this.videoData[country].length > 0
        );
        
        // Add global option and sort countries
        const countryOptions = [
            { code: 'global', name: '🌍 Global (All Countries)' },
            ...countries.sort().map(code => ({
                code: code,
                name: this.getCountryName(code)
            }))
        ];
        
        return countryOptions;
    }

    // Get available countries (legacy format for backward compatibility)
    getAvailableCountriesLegacy() {
        return Object.keys(this.videoData).filter(country => 
            this.videoData[country] && this.videoData[country].length > 0
        ).sort();
    }

    // Get country display name
    getCountryName(code) {
        const countryNames = {
            'US': '🇺🇸 United States',
            'CA': '🇨🇦 Canada', 
            'GB': '🇬🇧 United Kingdom',
            'DE': '🇩🇪 Germany',
            'FR': '🇫🇷 France',
            'IN': '🇮🇳 India',
            'JP': '🇯🇵 Japan',
            'KR': '🇰🇷 South Korea',
            'MX': '🇲🇽 Mexico',
            'RU': '🇷🇺 Russia'
        };
        return countryNames[code] || `🏳️ ${code}`;
    }

    // Get tag flow data for Sankey diagram - shows tag-category relationships
    getTagFlowData(selectedCountry = 'global', filterType = 'balanced') {
        try {
            // Determine data source based on country selection
            let videosToProcess;
            if (selectedCountry === 'global') {
                videosToProcess = Object.values(this.videoData).flat();
            } else {
                videosToProcess = this.videoData[selectedCountry] || [];
            }

            const tagCategoryPairs = {};
            const tagStats = {};
            const categoryStats = {};

            // Process videos to build tag-category relationships
            videosToProcess.forEach(video => {
                if (video && video.tags && video.category_name) {
                    const category = video.category_name.trim();
                    const views = parseInt(video.views) || 0;
                    const likes = parseInt(video.likes) || 0;

                    // Parse and filter tags
                    const rawTags = video.tags.split('|').map(tag => tag.replace(/"/g, '').trim().toLowerCase());
                    const videoTags = rawTags.filter(tag => {
                        if (!tag || tag.length <= 2 || tag.length >= 25) return false;
                        const nonePatterns = ['none', '[none]', 'n/a', 'na', 'null', 'undefined', 'no tag', 'no tags', 'notag', 'notags', 'empty', 'blank', '-', '_', '.', '[n/a]', '[na]', '[null]', '[empty]', '[blank]'];
                        if (nonePatterns.includes(tag)) return false;
                        if (tag.startsWith('[') && tag.endsWith(']')) {
                            const innerTag = tag.slice(1, -1);
                            if (nonePatterns.includes(innerTag)) return false;
                        }
                        return true;
                    });

                    // Track tag-category relationships
                    videoTags.forEach(tag => {
                        const pairKey = `${tag}→${category}`;
                        
                        if (!tagCategoryPairs[pairKey]) {
                            tagCategoryPairs[pairKey] = {
                                tag: tag,
                                category: category,
                                count: 0,
                                totalViews: 0,
                                totalLikes: 0
                            };
                        }

                        tagCategoryPairs[pairKey].count++;
                        tagCategoryPairs[pairKey].totalViews += views;
                        tagCategoryPairs[pairKey].totalLikes += likes;

                        // Track tag statistics
                        if (!tagStats[tag]) {
                            tagStats[tag] = { count: 0, totalViews: 0, categories: new Set() };
                        }
                        tagStats[tag].count++;
                        tagStats[tag].totalViews += views;
                        tagStats[tag].categories.add(category);

                        // Track category statistics
                        if (!categoryStats[category]) {
                            categoryStats[category] = { count: 0, totalViews: 0, tags: new Set() };
                        }
                        categoryStats[category].count++;
                        categoryStats[category].totalViews += views;
                        categoryStats[category].tags.add(tag);
                    });
                }
            });

            // Filter and limit based on filterType
            let minFlowValue, tagLimit, categoryLimit;
            switch (filterType) {
                case 'focused':
                    minFlowValue = 8;
                    tagLimit = 12;
                    categoryLimit = 6;
                    break;
                case 'detailed':
                    minFlowValue = 3;
                    tagLimit = 20;
                    categoryLimit = 8;
                    break;
                case 'balanced':
                default:
                    minFlowValue = 5;
                    tagLimit = 15;
                    categoryLimit = 7;
            }

            // Get top tags and categories
            const topTags = Object.entries(tagStats)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, tagLimit)
                .map(([tag]) => tag);

            const topCategories = Object.entries(categoryStats)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, categoryLimit)
                .map(([category]) => category);

            // Filter relationships
            const significantFlows = Object.values(tagCategoryPairs)
                .filter(pair => 
                    pair.count >= minFlowValue &&
                    topTags.includes(pair.tag) &&
                    topCategories.includes(pair.category)
                );

            // Build nodes and links for Sankey
            const nodes = [];
            const links = [];
            const nodeIndex = {};

            // Add tag nodes
            topTags.forEach((tag, index) => {
                const tagInfo = tagStats[tag];
                nodes.push({
                    id: `tag_${index}`,
                    name: tag,
                    type: 'tag',
                    count: tagInfo.count,
                    totalViews: tagInfo.totalViews,
                    avgViews: Math.round(tagInfo.totalViews / tagInfo.count),
                    categories: tagInfo.categories.size
                });
                nodeIndex[`tag_${tag}`] = index;
            });

            // Add category nodes
            topCategories.forEach((category, index) => {
                const categoryInfo = categoryStats[category];
                const nodeId = topTags.length + index;
                nodes.push({
                    id: `category_${index}`,
                    name: category,
                    type: 'category',
                    count: categoryInfo.count,
                    totalViews: categoryInfo.totalViews,
                    avgViews: Math.round(categoryInfo.totalViews / categoryInfo.count),
                    tags: categoryInfo.tags.size
                });
                nodeIndex[`category_${category}`] = nodeId;
            });

            // Add links
            significantFlows.forEach(flow => {
                const sourceIndex = nodeIndex[`tag_${flow.tag}`];
                const targetIndex = nodeIndex[`category_${flow.category}`];
                
                if (sourceIndex !== undefined && targetIndex !== undefined) {
                    links.push({
                        source: sourceIndex,
                        target: targetIndex,
                        value: flow.count,
                        tag: flow.tag,
                        category: flow.category,
                        totalViews: flow.totalViews,
                        totalLikes: flow.totalLikes,
                        avgViews: Math.round(flow.totalViews / flow.count),
                        avgLikes: Math.round(flow.totalLikes / flow.count)
                    });
                }
            });

            return {
                nodes: nodes,
                links: links,
                selectedCountry: selectedCountry,
                countryName: selectedCountry === 'global' ? 'Global' : this.getCountryName(selectedCountry),
                stats: {
                    totalTags: topTags.length,
                    totalCategories: topCategories.length,
                    totalFlows: links.length,
                    minFlowValue: minFlowValue
                }
            };

        } catch (error) {
            console.error('Error processing tag flow data:', error);
            return { nodes: [], links: [], selectedCountry: selectedCountry, countryName: 'Error', stats: {} };
        }
    }

    // Initialize all data loading
    async init(countriesToLoad = ['US', 'CA', 'GB', 'DE', 'FR', 'IN', 'JP', 'KR', 'MX', 'RU']) {
        try {
            console.log('Loading categories...');
            await this.loadCategories();
            
            console.log('Loading video data...');
            await this.loadVideoData(countriesToLoad);
            
            console.log('Data loading completed successfully');
            return true;
        } catch (error) {
            console.error('Error initializing data:', error);
            return false;
        }
    }
}

