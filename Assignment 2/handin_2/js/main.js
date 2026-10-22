// ---- Global layout constants (tooltip.js relies on margin and innerHeight) ----
const width = 900;
const height = 450;
const margin = { top: 20, right: 30, bottom: 50, left: 55 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const NON_LOVE = 'Non love song';

// Load the data here
d3.csv('data/love_song_categories_for_Billboard_Top_10_hits_1958_2023.csv').then(raw => {
  // Songs without a category become "Non love song" instead of being dropped
  const data = raw.map(d => ({
    ...d,
    love_song_category: d.love_song_category && d.love_song_category.trim() !== ''
      ? d.love_song_category
      : NON_LOVE
  }));

  // Love-song categories first, "Non love song" last
  const loveCats = Array.from(new Set(data.map(d => d.love_song_category)))
    .filter(c => c !== NON_LOVE);
  const songCategories = [...loveCats, NON_LOVE];

  createViz(data, songCategories);
});

// Create your visualization
function createViz(data, songCategories) {
  const grouped = formatDataGroups(data);
  const years = grouped.map(d => d.year);

  let model = {
    data,
    grouped,
    songCategories,
    selectedCategory: 'All',
    selectedYears: [d3.min(years), d3.max(years)]
  };

  // DOM
  function initDOM() {
    return {
      select: d3.select('#selectSongCategory'),
      legend: d3.select('.legend'),
      viz: d3.select('#viz')
    };
  }

  const dom = initDOM();
  const viz = initViz(model);

  function initSlider(model) {
    function onYearsSlider(values) {
      update({ selectedYears: values.split(',').map(Number) });
    }

    const minYear = d3.min(model.grouped, d => d.year);
    const maxYear = d3.max(model.grouped, d => d.year);
    const yearsRange = d3.range(minYear, maxYear + 1);

    return new rSlider({
      target: '#yearsSlider',
      values: yearsRange,
      range: true,
      tooltip: true,
      scale: true,
      labels: false,
      set: [minYear, maxYear],
      onChange: onYearsSlider
    });
  }

  function initLegend(model) {
    const items = dom.legend.selectAll('.legend-item')
      .data(model.songCategories)
      .join('div')
      .attr('class', 'legend-item')
      .style('display', 'inline-flex')
      .style('align-items', 'center')
      .style('margin', '0 14px 6px 0');

    items.append('span')
      .style('width', '14px')
      .style('height', '14px')
      .style('margin-right', '6px')
      .style('display', 'inline-block')
      .style('background', d => viz.color(d));

    items.append('span').text(d => d);
  }

  function initOptions(model) {
    dom.select.selectAll('option')
      .data(['All', ...model.songCategories])
      .join('option')
      .attr('value', d => d)
      .text(d => d);
  }

  function formatDataGroups(data) {
    // rollup: data, reduceFn (how to aggregate each group), keyFns (how to group)
    const counts = d3.rollup(
      data,
      v => v.length,
      d => Math.floor(+d.top_10_debut_date_as_decimal),
      d => d.love_song_category
    );

    const cats = Array.from(new Set(data.map(d => d.love_song_category)));
    const yearExtent = d3.extent(Array.from(counts.keys()));

    // One object per year, zero for missing categories
    const groupedArray = d3.range(yearExtent[0], yearExtent[1] + 1).map(year => {
      const row = { year };
      const byCat = counts.get(year) || new Map();
      cats.forEach(c => { row[c] = byCat.get(c) || 0; });
      row.total = d3.sum(cats, c => row[c]);
      return row;
    });

    return groupedArray;
  }

  // Viz
  function initViz(model) {
    const svg = dom.viz.append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto');

    svg.append('defs').append('clipPath').attr('id', 'clip')
      .append('rect').attr('width', innerWidth).attr('height', innerHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear().range([0, innerWidth]);
    const yScale = d3.scaleLinear().range([innerHeight, 0]);

    // "Non love song" is always grey, the others get palette colors
    const palette = d3.schemeTableau10.concat(d3.schemeSet3);
    const color = d3.scaleOrdinal()
      .domain(model.songCategories)
      .range(model.songCategories.map((c, i) => c === NON_LOVE ? '#bdbdbd' : palette[i]));

    const xAxisG = g.append('g').attr('transform', `translate(0, ${innerHeight})`);
    const yAxisG = g.append('g');

    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 42)
      .attr('text-anchor', 'middle').text('Year');
    g.append('text').attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2).attr('y', -40)
      .attr('text-anchor', 'middle').text('Number of songs');

    const layers = g.append('g').attr('clip-path', 'url(#clip)');

    const area = d3.area()
      .x(d => xScale(d.data.year))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]))
      .curve(d3.curveMonotoneX);

    // Transparent overlay to capture mouse events
    const overlay = g.append('rect')
      .attr('width', innerWidth).attr('height', innerHeight)
      .attr('fill', 'none').attr('pointer-events', 'all');

    // Tooltip (from tooltip.js)
    const tooltip = initializeTooltip(svg);                 // <g> that holds box + text
    const tooltipRoot = d3.select(tooltip.node().parentNode);
    const tooltipLine = initializeTooltipLine(tooltipRoot)
      .style('display', 'none');
    tooltipRoot.style('pointer-events', 'none');

    // Draw the tooltip group on top of the guide line
    tooltip.raise()
      .attr('transform', 'translate(0, 20)')
      .style('display', 'none');

    // White box behind the text
    const tooltipBox = tooltip.append('rect')
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('rx', 6)
      .attr('opacity', 0.95);

    // setTooltipText writes its <text> elements into this group
    const tooltipText = tooltip.append('g');

    return {
      svg, g, xScale, yScale, color, xAxisG, yAxisG, layers, area,
      overlay, tooltip, tooltipLine, tooltipBox, tooltipText,
      current: { rows: [], keys: [], category: 'All' }
    };
  }

  // Update: merge changes into the model, then re-render
  function update(patch) {
    model = { ...model, ...patch };
    view(dom, model, viz);
  }

  // View: render purely from the model
  function view(dom, model, viz) {
    const [y0, y1] = model.selectedYears;
    const rows = model.grouped
      .filter(d => d.year >= y0 && d.year <= y1)
      .map(d => {
        // Unselected categories are zeroed so their areas collapse smoothly
        const r = { year: d.year };
        model.songCategories.forEach(c => {
          r[c] = (model.selectedCategory === 'All' || model.selectedCategory === c) ? d[c] : 0;
        });
        r.total = d3.sum(model.songCategories, c => r[c]);
        return r;
      });

    // The mousemove handler reads from here so it always sees the latest state
    viz.current = { rows, keys: model.songCategories, category: model.selectedCategory };

    viz.xScale.domain([y0, y1 === y0 ? y1 + 1 : y1]);
    viz.yScale.domain([0, d3.max(rows, d => d.total) || 1]).nice();
      
    const series = d3.stack().keys(model.songCategories)(rows);
    const t = d3.transition().duration(750);

    viz.layers.selectAll('path.layer')
      .data(series, d => d.key)
      .join(
        enter => enter.append('path')
          .attr('class', 'layer')
          .attr('fill', d => viz.color(d.key))
          .attr('d', viz.area),
        update => update,
        exit => exit.remove()
      )
      .transition(t)
      .attr('d', viz.area);

    viz.xAxisG.transition(t).call(d3.axisBottom(viz.xScale).tickFormat(d3.format('d')));
    viz.yAxisG.transition(t).call(d3.axisLeft(viz.yScale).ticks(6));
  }

  // Events
  function initEvents(dom, model, viz) {
    dom.select.on('change', function () {
      update({ selectedCategory: this.value });
    });

    viz.overlay
      .on('mousemove', event => {
        const [mx] = d3.pointer(event, viz.g.node());
        const { rows, category, keys } = viz.current;
        if (!rows.length) return;

        const year = Math.round(viz.xScale.invert(mx));
        const row = rows.find(d => d.year === year);
        if (!row) return;

        const xPos = viz.xScale(year);

        // Show line + tooltip (must be visible before getBBox works)
        viz.tooltipLine.style('display', null).attr('x1', xPos).attr('x2', xPos);
        viz.tooltip.style('display', null);

        const datapoints = { year: row.year };
        if (category === 'All') {
          datapoints.total = row.total;
          keys.forEach(c => { datapoints[c] = row[c]; });
        } else {
          datapoints[category] = row[category];
        }

        const toLabel = key => key === 'year' ? 'Year' : key === 'total' ? 'Total songs' : key;
        setTooltipText(datapoints, viz.tooltipText, xPos, xPos < innerWidth / 2, toLabel);

        // Size the white box to fit the text
        const b = viz.tooltipText.node().getBBox();
        const pad = 8;
        viz.tooltipBox
          .attr('x', b.x - pad)
          .attr('y', b.y - pad)
          .attr('width', b.width + 2 * pad)
          .attr('height', b.height + 2 * pad);
      })
      .on('mouseleave', () => {
        viz.tooltipLine.style('display', 'none');
        viz.tooltip.style('display', 'none');
      });
  }

  // Init
  function init(model) {
    initSlider(model);
    initEvents(dom, model, viz);
    initLegend(model);
    initOptions(model);
    view(dom, model, viz);
  }

  init(model);
}