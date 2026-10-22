function createBarChart(data) {

    const width = 500;
    const height = 120;
    const barHeight = 20;
    const barSpacing = 5;
    const labelWidth = 100;
    const labelOffset = 5;
    const lineX = 200;

    const topGenresSection = d3.select('#top-genres');

    topGenresSection
        .append('h3')
        .text('Top US genres, by US on-demand audio streams');

    // Create SVG
    const svg = topGenresSection
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // Scale streaming volume to bar width
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.audio_streaming_volume)])
        .range([0, width - lineX - 40]);
        //color green


    // Create one group for each genre
    const bars = svg
        .selectAll('g')
        .data(data)
        .join('g')
        .attr('transform', (d, i) =>
            `translate(0, ${i * (barHeight + barSpacing)})`
        );

    // Genre labels
    bars
        .append('text')
        .attr('x', labelWidth)
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('class', 'label')
        .text(d => d.genre);

    // Bars
    bars
        .append('rect')
        .attr('x', lineX)
        .attr('y', 0)
        .attr('width', d => xScale(d.audio_streaming_volume))
        .attr('height', barHeight)
        .attr('fill', 'green');

    // Value labels
    bars
        .append('text')
        .attr('x', d => lineX + xScale(d.audio_streaming_volume) + labelOffset)
        .attr('y', barHeight / 2)
        .attr('dy', '0.35em')
        .attr('class', 'label')
        .text(d => d.audio_streaming_volume);

    // Reference line
    svg
        .append('line')
        .attr('x1', lineX)
        .attr('x2', lineX)
        .attr('y1', 0)
        .attr('y2', data.length * (barHeight + barSpacing))
        .attr('stroke', 'black');
}