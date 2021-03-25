const [CELL_W, CELL_H] = [5, 32];
const PADDING = { left: 150, top: 120, right: 50, bottom: 100, legend: 30 };
const BLYLWRD = ['#a50026','#d73027','#f46d43','#fdae61','#fee090','#ffffbf','#e0f3f8','#abd9e9','#74add1','#4575b4','#313695'].reverse();

const TITLE = { size: 36 };
const DESCRIPTION = { size: 28 }

document.addEventListener('DOMContentLoaded', () => {
    fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
        .then(response => response.json())
        .then(({ baseTemperature, monthlyVariance }) => {
            // console.log(baseTemperature);
            console.log(monthlyVariance);

            const [GRAPH_W, GRAPH_H] = [PADDING.left + Math.ceil(monthlyVariance.length / 12) * CELL_W + PADDING.right, PADDING.top + CELL_H * 11.5 + PADDING.bottom];

            const svg = d3.select('body').append('svg').attr('width', GRAPH_W).attr('height', GRAPH_H);

            // title
            svg.append('text')
                .style('text-anchor', 'middle')
                .attr('x', GRAPH_W / 2)
                .attr('y', TITLE.size)
                .style('font-size', TITLE.size)
                .style('font-weight', 'bold')
                .attr('id', 'title')
                .text('Monthly Global Land-Surface Temperature')

            // description
            svg.append('text')
                .style('text-anchor', 'middle')
                .attr('x', GRAPH_W / 2)
                .attr('y', TITLE.size + DESCRIPTION.size + 5)
                .style('font-size', DESCRIPTION.size)
                .attr('id', 'description')
                .text(d3.extent(monthlyVariance.map(a => a.year)).join(' - ') + ': base temperature ' + baseTemperature + ' ℃')

            // year vs month datas
            const [minYear, maxYear] = d3.extent(monthlyVariance.map(a => a.year));

            const xScale = d3.scaleBand()
                .domain(Array(maxYear - minYear + 1).fill()
                    .map((_,i) => i + minYear))
                .range([PADDING.left, GRAPH_W - PADDING.right]);

            // const yScale = d3.scaleTime()
            const yScale = d3.scaleBand()
                .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
                .range([PADDING.top - CELL_H / 2, GRAPH_H - PADDING.bottom]);

            // axis
            const xAxis = d3.axisBottom(xScale)
                .tickValues(
                    xScale.domain().filter(a => a % 10 === 0)
                )
                .tickSize(10)
                .tickSizeOuter(0)
                .tickFormat(d => '' + d);

            const yAxis = d3.axisLeft(yScale)
                .tickSize(10)
                .tickSizeOuter(0)
                .tickFormat(d => {
                    let date = new Date(0);
                    date.setMonth(d);
                    return d3.timeFormat('%B')(date);
                });

            svg.append('g')
                .attr('transform', 'translate(0,' + (GRAPH_H - PADDING.bottom) + ')')
                .call(xAxis)
                .attr('id', 'x-axis');

            svg.append('g')
                .attr('transform', 'translate(' + PADDING.left + ')')
                .call(yAxis)
                .attr('id', 'y-axis');
                
            const extent = d3.extent(monthlyVariance.map(a => a.variance));
            const threshold = extent.reduce((a, b) => Math.abs(b) + a, 0) / BLYLWRD.length;

            // legend
            const legendSVG = svg.append('g')
                .attr('id', 'legend');

            const legendScale = d3.scaleLinear()
                .domain(extent.map(a => a + baseTemperature))
                .range([PADDING.left, PADDING.left + 12 * CELL_H]);

            const legendAxis = d3.axisBottom(legendScale)
                .tickValues(
                    Array(BLYLWRD.length + 1).fill().map((_,i) => (baseTemperature + extent[0]) + i * threshold)
                )
                .tickSize(10)
                .tickSizeOuter(0)
                .tickFormat(d3.format('.1f'));

            legendSVG.append('g')
                .attr('transform', 'translate(0,' + (GRAPH_H - PADDING.legend) + ')')
                .call(legendAxis);

            legendSVG.selectAll('rect')
                .data(Array(BLYLWRD.length).fill().map((_,i) => (baseTemperature + extent[0]) + i * threshold))
                .enter()
                .append('rect')
                .attr('class', 'legend-cell')
                .attr('width', legendScale(baseTemperature + extent[0] + threshold) - PADDING.left)
                .attr('height', CELL_H)
                .attr('x', (d, i) => legendScale(d))
                .attr('y', GRAPH_H - PADDING.legend - CELL_H)
                .attr('fill', (d, i) => BLYLWRD[i]);

            // tooltip
            const tooltip = d3.select('body').append('div')
                .attr('id', 'tooltip')
                .style('position', 'absolute')
                .style('opacity', 0)
            
            // cells
            const map = svg.append('g')
                .attr('id', 'cell-container');

            map.selectAll('rect')
                .data(monthlyVariance)
                .enter()
                .append('rect')
                .attr('class', 'cell')
                .attr('height', CELL_H)
                .attr('width', CELL_W)
                .attr('data-month', d => d.month - 1)
                .attr('data-year', d => d.year)
                .attr('data-temp', d => d.variance + baseTemperature)
                .attr('x', d => xScale(d.year))
                .attr('y', d => yScale(d.month - 1))
                .attr('fill', d => {
                    return BLYLWRD[Math.floor((d.variance + Math.abs(extent[0])) / threshold)] || BLYLWRD[10];
                })
                .on('mouseover', (e, d) => {
                    const x = e.target.getAttribute('x') - document.getElementById('tooltip').offsetWidth/2 + CELL_W;
                    const y = e.target.getAttribute('y') - document.getElementById('tooltip').offsetHeight;
                    tooltip.style('opacity', .8)
                        .html(d.year + ' - ' + d3.timeFormat('%B')(new Date(2000, d.month - 1)) + '<br>' + Math.round((d.variance + baseTemperature) * 1000)/1000 + ' ℃<br>' + d.variance + ' ℃')
                        .style('top', y + 'px')
                        .style('left', x + 'px')
                        .attr('data-year', d.year);
                })
                .on('mouseout', () => {
                    tooltip.html('')
                        .style('opacity', 0);
                })

        });
})