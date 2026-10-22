function createBubbleChart(data) {

    const metrics = [
        'total_album_consumption_millions',
        'album_sales',
        'song_sales_thousands',
        'on_demand_audio_streams_billions',
        'on_demand_video_streams_millions'
    ];

    const width = 1160;
    const height = 380;

    const margin = {
        top: 40,
        right: 80,
        bottom: 70,
        left: 80
    };

    // parse the numeric columns (d3.csv reads everything as strings)
    data.forEach(d => {
        metrics.forEach(metric => {
            d[metric] = +d[metric];
        });
    });

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const bubbleSection = d3.select('#bubble-chart');

    const svg = bubbleSection.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', height);

    const chart = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // x-scale: on-demand audio streams
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.on_demand_audio_streams_billions) * 1.1])
        .range([0, innerWidth]);

    // y-scale: on-demand video streams
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.on_demand_video_streams_millions) * 1.1])
        .range([innerHeight, 0]);

    // radius scale: album sales, sqrt so that area represents value
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.album_sales)])
        .range([4, 45]);

    // color scale: one color per album
    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.title))
        .range(d3.schemeTableau10);

    // axes
    chart.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));

    chart.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));

    // axis labels
    chart.append('text')
        .attr('class', 'axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 20)
        .attr('text-anchor', 'middle')
        .text('On-demand audio streams (billions)');

    chart.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -margin.left + 20)
        .attr('text-anchor', 'middle')
        .text('On-demand video streams (millions)');

    // one circle per album
    chart.selectAll('.album-bubble')
        .data(data)
        .join('circle')
        .attr('class', 'album-bubble')
        .attr('cx', d => xScale(d.on_demand_audio_streams_billions))
        .attr('cy', d => yScale(d.on_demand_video_streams_millions))
        .attr('r', d => radiusScale(d.album_sales))
        .attr('fill', d => colorScale(d.title))
        .attr('fill-opacity', 0.8)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

    createLegends(data, colorScale, radiusScale);
}

function createLegends(data, colorScale, radiusScale) {

    // color legend - one entry per album
    const legendColorSection = d3.select('#legend .legend-color');

    const colorLegend = legendColorSection.append('svg')
        .attr('viewBox', `0 0 220 ${data.length * 22 + 10}`)
        .attr('width', '100%')
        .attr('height', data.length * 22 + 10);

    const colorEntries = colorLegend.selectAll('.legend-entry')
        .data(data)
        .join('g')
        .attr('class', 'legend-entry')
        .attr('transform', (d, i) => `translate(5, ${i * 22 + 10})`);

    colorEntries.append('circle')
        .attr('r', 7)
        .attr('fill', d => colorScale(d.title))
        .attr('fill-opacity', 0.85);

    colorEntries.append('text')
        .attr('x', 16)
        .attr('y', 4)
        .attr('class', 'legend-label')
        .text(d => `${d.artist} — ${d.title}`);

        // size legend - example sales values represented as circle sizes, stacked vertically
    const legendAreaSection = d3.select('#legend .legend-area');

    const sampleValues = [50, 200, 400];

    const maxR = radiusScale(d3.max(sampleValues));
    const commonLeft = 10;             // all circles share this left edge, growing rightwards
    const rowHeight = 2 * maxR + 16;   // room for the tallest circle in a row, plus spacing
    const legendWidth = commonLeft + 2 * maxR + 70;
    const legendHeight = rowHeight * sampleValues.length;

    const sizeLegend = legendAreaSection.append('svg')
        .attr('viewBox', `0 0 ${legendWidth} ${legendHeight}`)
        .attr('width', '100%')
        .attr('height', legendHeight);

    // one row (<g>) per sample value, stacked top to bottom
    const sizeEntries = sizeLegend.selectAll('.size-entry')
        .data(sampleValues)
        .join('g')
        .attr('class', 'size-entry')
        .attr('transform', (d, i) => `translate(0, ${i * rowHeight + rowHeight / 2})`);

    // circles share a left edge (commonLeft) so their widths are easy to compare
    sizeEntries.append('circle')
        .attr('cx', d => commonLeft + radiusScale(d))
        .attr('cy', 0)
        .attr('r', d => radiusScale(d))
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

    // label placed to the right of the largest possible circle, same x for every row
    sizeEntries.append('text')
        .attr('x', commonLeft + 2 * maxR + 15)
        .attr('y', 0)
        .attr('dominant-baseline', 'middle')
        .attr('class', 'legend-label')
        .text(d => `${d}k`);
    
}