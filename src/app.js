import * as d3 from "d3";
import * as topojson from "topojson";
import "./style.scss";

const height = 500,
  width = 1000;

(async function getData() {
  try {
    const treeData = await d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json"
    );
    let choroData = await d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
    );
    let scatterData = await d3.json(
      "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json"
    );

    let eduData = await d3.json(
      "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
    );
    let featureCollection = topojson.feature(
      choroData,
      choroData.objects["counties"]
    );
    //
    createTreeMap(treeData);
    createChoroPlethMap({ featureCollection, eduData });
    createScatterPlot(scatterData);
    //
  } catch (error) {
    console.log(error);
  }
})();

function createTreeMap(movies) {
  const w = width,
    h = height,
    mt = 100,
    legendBarWidth = 50,
    legendBarHeight = 50,
    legendBarGap = 50;

  var root = d3.hierarchy(movies).sum((d) => d.value);

  const treemap = d3.treemap().size([w, h - mt]);

  treemap(root);

  const category = root.children.map((d) => d.data.name);

  d3.select("body").append("h1").attr("id", "title").text("Movies Sales");

  d3.select("body").append("div").attr("id", "tooltip");

  d3.select("body")
    .append("h3")
    .attr("id", "description")
    .text(`Top Grossing Movies Around the Globe in Various Categories`);

  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

  d3.selectAll(svg)
    .append("g")
    .attr("id", "mainGroup")
    .attr("transform", `translate(0,${mt})`);

  //   ////////////////////pickColor ///////////

  const pickColor = d3
    .scaleOrdinal()
    .domain(category)
    .range(d3.schemeTableau10);
  // //   ///////////////

  d3.select("#mainGroup")
    .selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("data-name", (d) => d.data.name)
    .attr("data-category", (d) => d.data.category)
    .attr("data-value", (d) => d.data.value)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("fill", (d) => pickColor(d.parent.data.name))
    .on("mousemove", showTooltip)
    .on("mouseleave", hideTooltip)
    .attr("class", "tile");

  function shortenName(title) {
    return title.length > 10 ? title.slice(0, 8) + ".." : title;
  }

  d3.select("#mainGroup")
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
    .text((d) => shortenName(d.data.name))
    .attr("font-size", (d) => (d.x1 - d.x0) / 8)
    .attr("x", (d) => (d.x0 + d.x1) / 2)
    .attr("y", (d) => (d.y0 + d.y1) / 2)
    .attr("text-anchor", "middle")
    .style("pointer-events", "none");

  // //   ////////// Legend ///////////
  const ml = 50,
    mtl = 30;

  const legend = d3
    .select("svg")
    .append("g")
    .attr("x", w / 2)
    .attr("id", "legend");

  legend
    .selectAll("rect")
    .data(category)
    .enter()
    .append("rect")
    .attr("class", "legend-item")
    .attr("x", (d, i) => i * (legendBarWidth + legendBarGap))
    .attr("width", legendBarWidth)
    .attr("height", legendBarHeight)
    .attr("fill", (d) => pickColor(d));

  legend
    .selectAll("text")
    .data(category)
    .enter()
    .append("text")
    .attr("x", (d, i) => i * (legendBarWidth + legendBarGap))
    .attr("y", legendBarHeight + mtl)
    .text((d) => d);
  // .attr("text-anchor", "middle");
  // //   // functions for tooltip //////

  function showTooltip(e) {
    const { pageX, pageY } = e;
    const { value, name, category } = e.target.dataset;

    d3.select("#tooltip")
      .attr("style", `position:absolute;top:${pageY - 30}px;left:${pageX}px;`)
      .attr("data-value", value)
      .text(`${name} (${category}), $${d3.format(".2s")(value)}`)
      .style("opacity", ".9");
  }

  function hideTooltip() {
    d3.select("#tooltip").attr("style", "opacity:0;");
  }
}

function createChoroPlethMap(dataCollection) {
  const w = width,
    h = height;

  const { featureCollection, eduData } = dataCollection;
  const features = featureCollection.features;

  d3.select("body")
    .append("h1")
    .attr("id", "title")
    .text("United States Educational Attainment")
    .style("margin-top", "2rem");

  d3.select("body").append("div").attr("id", "tooltip2");

  d3.select("body")
    .append("h3")
    .attr("id", "description")
    .text(`Percentage of adults with a bachelor's degree or higher.`);

  const svg = d3
    .select("body")
    .append("svg")
    .attr("class", "choropleth")
    .attr("width", w)
    .attr("height", h);

  d3.selectAll(svg).append("g").attr("id", "mainGroup");

  //   ////////////////////pickColor ///////////

  const pickColor = d3
    .scaleLinear()
    .domain(d3.ticks(0, 70, 8))
    .range([
      "#f7fbff",
      "#deebf7",
      "#c6dbef",
      "#9ecae1",
      "#6baed6",
      "#4292c6",
      "#2171b5",
      "#084594",
    ]);

  // //   ///////////////

  d3.select(".choropleth")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", (county) => d3.geoPath()(county))
    .attr("class", "county")
    .attr("fill", (d) => {
      let x = eduData.find((edu) => edu.fips == d.id);
      return pickColor(x["bachelorsOrHigher"]);
    })
    .on("mouseleave", hideTooltip)
    .on("mousemove", showTooltip)
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => {
      return eduData.filter((edu) => edu.fips == d.id)[0]["bachelorsOrHigher"];
    })
    .attr("data-area", (d) => {
      return eduData.filter((edu) => edu.fips == d.id)[0]["area_name"];
    })
    .attr("data-state", (d) => {
      return eduData.filter((edu) => edu.fips == d.id)[0]["state"];
    });

  //   ////////// Legend ///////////
  const legendBarWidth = 60,
    legendBarHeight = 10;

  const legend = d3
    .select(".choropleth")
    .append("g")
    .attr("transform", `translate(${w / 3},0)`)
    .attr("id", "legend2");

  legend
    .selectAll("rect")
    .data(d3.range(8))
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * legendBarWidth)
    .attr("width", legendBarWidth)
    .attr("height", legendBarHeight)
    .attr("fill", (d, i) => pickColor(i * (legendBarWidth / 2)));

  legend
    .selectAll("text")
    .data(d3.range(8))
    .enter()
    .append("text")
    .attr("x", (d, i) => i * legendBarWidth + 16)
    .attr("y", legendBarHeight + 20)
    .attr("text-anchor", "end")
    .text((d, i) => `${i * 12}%`);

  d3.select("body")
    .append("p")
    .attr("id", "source")
    .text(`Source: USDA Economic Research Service`);

  //   // functions for tooltip //////

  function showTooltip(e) {
    const { pageX, pageY } = e;
    const { education, state, area } = e.target.dataset;

    d3
      .select("#tooltip2")
      .attr(
        "style",
        `position:absolute;top:${pageY - 30}px;left:${
          pageX + 10
        }px;display:block;`
      )
      .attr("data-education", education).text(`${area} (${state}) 
      ${education}%`);
    // .style("opacity", ".9");
  }

  function hideTooltip(e) {
    d3.select("#tooltip2").attr("style", "opacity:0;display:none;");
  }
}
function createScatterPlot(data) {
  const w = width,
    h = height;

  const margin = { top: 20, left: 80, right: 120, bottom: 40 };
  const innerHeight = h - margin.top - margin.bottom,
    innerWidth = w - margin.left - margin.right;

  const minuteFormat = (d) => d3.utcFormat("%M:%S")(new Date(0).setSeconds(d));

  // creating SVG //
  const title = d3
    .select("body")
    .append("h1")
    .attr("id", "title3")
    .text("Doping Alligations in Bicycling")
    .style("margin-top", "2rem");

  const svg = d3
    .select("body")
    .append("svg")
    .attr("width", w)
    .attr("class", "scatterplot")
    .attr("height", h);

  const groupPrimary = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top}) `)
    .attr("id", "mainGrp");

  d3.select("body").append("div").attr("id", "tooltip3");

  //   SETTING X-Scale //
  const dateAccesor = (d) => d.Year;
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, dateAccesor))
    .range([0, innerWidth])
    .nice();

  //   SETTING y-SCALE//
  const timeAccesor = (d) => d.Seconds;
  const yScale = d3
    .scaleTime()
    .domain(d3.extent(data, timeAccesor))
    .range([0, innerHeight])
    .nice();

  ///////   SETTING  X-AXIS ////////
  const axisX = d3.axisBottom(xScale).tickFormat(d3.format(".0f"));
  groupPrimary
    .append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(axisX);

  //////   SETTING  Y-AXIS /////////
  const axisY = d3.axisLeft(yScale).tickFormat(minuteFormat);

  groupPrimary.append("g").attr("id", "y-axis").call(axisY);

  // GENERATING Dots  /////

  const clculateMins = (d) => {
    let x = new Date();
    x.setMinutes(Math.floor(d / 60));
    x.setSeconds(d % 60);
    return x;
  };

  ///////////////
  d3.select("#mainGrp")
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d.Year))
    .attr("cy", (d) => yScale(d.Seconds))
    .attr("r", 15)
    .attr("class", "dot")
    .attr("data-xvalue", (d) => d.Year)
    .attr("data-yvalue", (d) => clculateMins(d.Seconds))
    .attr("data-name", (d) => d.Name)
    .attr("data-doping", (d) => d.Doping)
    .attr("data-country", (d) => d.Nationality)
    .attr("fill", (d) => (d.Doping ? "#ef233c" : "#52b788"))
    .on("mousemove", showTooltip)
    .on("mouseleave", hideTooltip);

  // Adding Y Axis Label ///
  d3.select("#mainGrp")
    .append("g")
    .attr("transform", `translate(${-50},${innerHeight / 2}) rotate(-90)`)
    .append("text")
    .attr("id", "yAxisLabel")
    .attr("text-anchor", "middle")
    .text("Time (minutes)");

  ////////// Legend ///////////
  const legend = d3
    .select("#mainGrp")
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${innerWidth - 100},${margin.top})`);

  const dopingLegend = legend.append("g");
  dopingLegend.append("circle").attr("r", 8).attr("fill", "#f94144");
  dopingLegend
    .append("text")
    .text("With doping alligations")
    .attr("x", 20)
    .attr("textanchor", "middle")
    .attr("dy", "0.32em");

  const nonDopingLegend = legend
    .append("g")
    .attr("transform", `translate(0,30)`);
  nonDopingLegend.append("circle").attr("r", 8).attr("fill", "#52b788");
  nonDopingLegend
    .append("text")
    .text("Without doping alligations")
    .attr("x", 20)
    .attr("textanchor", "middle")
    .attr("dy", "0.32em");

  // functions for tooltip //////
  function showTooltip(e) {
    const { pageX, pageY } = e;
    const { name, country, doping, xvalue } = e.target.dataset;

    d3.select("#tooltip3")
      .text(name + ",\n" + country + ",\n" + xvalue + ",\n" + doping)
      .attr("style", `top:${pageY - 40}px;left:${pageX + 20}px;`)
      .attr("data-year", xvalue)
      .style("opacity", 1);
  }

  function hideTooltip(e) {
    d3.select("#tooltip3").attr("style", "opacity:0;");
  }
  /////////////////////////////////////////
}
