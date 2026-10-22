function createCircleChart(data) {
    const streamsByReleaseDecadeSection = d3.select('#release-by-decade');
    streamsByReleaseDecadeSection.append('h3').text('US on-demand audio streams, by release decade');

   const width = 550;
    const maxCircleRadius = 40;
    const topPadding = 10;
    const labelSpace = 16; // room for the "xx.x%" text above the tallest circle
    const headerOffset = 5;
    const footerOffset = 30;
 
    // the tallest circle reaches 2 * maxCircleRadius above the baseline,
    // so the baseline needs at least that much clearance to avoid clipping
    const baselineY = topPadding + maxCircleRadius + labelSpace;
    const height = baselineY + maxCircleRadius + footerOffset + 14;
 
    const svg = streamsByReleaseDecadeSection.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', height);
 
    // evenly-spaced x-position for each decade
    const xScale = d3.scalePoint()
        .domain(data.map(d => d.year))
        .range([40, width - 40])
        .padding(0.5);
 
    // circle area (not radius) represents the audio-stream value
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.audio_stream_pct)])
        .range([0, maxCircleRadius]);
 
    // horizontal baseline running through the circles
    svg.append('line')
        .attr('x1', 20)
        .attr('x2', width - 20)
        .attr('y1', baselineY)
        .attr('y2', baselineY)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);
 
    // one <g> per decade
    const groups = svg.selectAll('.decade-group')
        .data(data)
        .join('g')
        .attr('class', 'decade-group')
        .attr('transform', d => `translate(${xScale(d.year)}, ${baselineY})`);
 
    // circle representing audio_stream_pct, centered on the baseline
    groups.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', d => radiusScale(d.audio_stream_pct))
        .attr('fill', '#f5794f')
        .attr('fill-opacity', 0.85);
 
    // percentage label above each circle
    groups.append('text')
        .attr('class', 'circle-value-label')
        .attr('x', 0)
        .attr('y', d => -radiusScale(d.audio_stream_pct) - headerOffset)
        .attr('text-anchor', 'middle')
        .text(d => `${d.audio_stream_pct}%`);
 
    // decade label, fixed distance below the baseline (always clear of the largest circle)
    groups.append('text')
        .attr('class', 'circle-decade-label')
        .attr('x', 0)
        .attr('y', maxCircleRadius + footerOffset)
        .attr('text-anchor', 'middle')
        .text(d => d.year);
}