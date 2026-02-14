// draw an svg

const WIDTH = 1000;
const HEIGHT = 700;

let visSvg = d3.select("#chart-area").append("svg")
			.attr("width", WIDTH)
			.attr("height", HEIGHT);

visSvg.append("circle")
    .attr("class", "sun")
    .attr("r", 30)
    .attr("cy", HEIGHT / 2)
    .attr("cx", 40);

function drawVis(data, planetsOnly) {
    console.log("the data", data);
    
    // filter planets
    let planetsData = data.filter((body) => body.is_planet)
    console.log("planets only", planetsData)

    // lets draw the planets !?
    let planets = visSvg.selectAll(".planet")
        .data(planetsData)

    planets.enter().append("circle")
        .attr("class", p => `planet ${p.name.toLowerCase()}`)
        .attr("id", (p) => "id" + p.name)
        .attr("cy", (p, i) => {     // spread out the planets idk
            let yval = i % 2 == 0 ? -i : i
            return (p.semi_major_axis) + HEIGHT / 2 + yval * 15
        })
        .attr("cx", (p, i) => (p.semi_major_axis * 16) + 70)
        .attr("r", 8)

    // Sun -> planets
    const SUN_X = 40;
    const SUN_Y = HEIGHT / 2;

    visSvg.selectAll(".planet-link")
        .data(planetsData)
        .enter().append("line")
        .attr("class", "planet-link")
        .attr("x1", SUN_X)
        .attr("y1", SUN_Y)
        .attr("x2", p => +d3.select("#id" + p.name).attr("cx"))
        .attr("y2", p => +d3.select("#id" + p.name).attr("cy"))
        .lower();

    // Saturn ring
    const saturn = d3.select("#idSaturn");

    visSvg.insert("ellipse", "#idSaturn")
        .attr("class", "saturn-ring")
        .attr("cx", saturn.attr("cx"))
        .attr("cy", saturn.attr("cy"))
        .attr("rx", saturn.attr("r") * 3)
        .attr("ry", saturn.attr("r") * 1.5)
        .attr("transform", `rotate(-20 ${saturn.attr("cx")} ${saturn.attr("cy")})`);
    
    // add some labels
    let planetLabels = visSvg.selectAll(".planet-label")
        .data(planetsData)

    planetLabels.enter().append("text")
        .text((p) => p.realName)
        .attr("class", "planet-label")
        .attr("x", (p) => +d3.select("#id" + p.name).attr("cx") + 10)
        .attr("y", (p) => +d3.select("#id" + p.name).attr("cy") + 10)
    
    // some silly asteroids / comets -- non-planets with primary orbits
    // let asteroidData = data.filter((body) => !body.is_planet && body.orbit_type === "Primary")
    // console.log("asteroids etc", asteroidData)

    // let asteroids = visSvg.selectAll(".asteroid")
    //     .data(asteroidData)

    // asteroids.enter().append("circle")
    //     .attr("class", "planet")
    //     .attr("id", (a) => "id" + a.name)
    //     .style("fill", "#efefef")
    //     .attr("cy", (a, i) => {     // spread out the planets idk
    //         let yval = i % 2 == 0 ? -i : i
    //         return (a.semi_major_axis) + HEIGHT / 2 + yval * 5
    //     })
    //     .attr("cx", (a, i) => (a.semi_major_axis * 16) + 70)
    //     .attr("r", 4)
    
    // time to add the orbiting bodies. or whatever
    // dont want to include asteroids that orbit other asteroids (for now, we can talk about this)
    let planetList = ["1-Ceres", "136199-Eris", "Uranus", "Pluto", "Neptune", "136108-Haumea", 
        "136472-Makemake", "Jupiter", "Mars", "Mercury", "Saturn", "Earth", "Venus"
    ]
    let moonsData = data.filter((body) => !body.is_planet && body.orbit_type !== "Primary" 
        && planetList.includes(body.orbits_planet))
    console.log("the moons", moonsData)

    let moons = visSvg.selectAll("moons")
        .data(moonsData)
    
    moons.enter().append("circle")
        .attr("class", "moon")
        .attr("id", (m) => "id" + m.name)
        .attr("cy", (m, i) => {
            // get host planet location
            // console.log(m.name, m.orbits_planet, m.orbit_type, i%15*7)
            let hostY = +d3.select("#id" + m.orbits_planet).attr("cy")
            let offset = 0.5 - Math.random();
            return hostY + offset * 50
        })
        .attr("cx", (m, i) => {
            // get host planet location
            let hostX = +d3.select("#id" + m.orbits_planet).attr("cx")
            let offset = 0.5 - Math.random();
            return hostX + offset * 50
        })
        .attr("r", 2)

    visSvg.selectAll("circle.moon").each(function(m) {
        const moonNode = this;
        const moon = d3.select(moonNode);

        const host = visSvg.select("#id" + m.orbits_planet);
        if (host.empty()) return;

        visSvg.insert("line", () => moonNode)
            .attr("class", "moon-link")
            .attr("x1", +host.attr("cx"))
            .attr("y1", +host.attr("cy"))
            .attr("x2", +moon.attr("cx"))
            .attr("y2", +moon.attr("cy"));
    });
    // add year ranges, for timeline bar at the top 
    let minYear = d3.min(data, (d) => d.discovery_year);
    let maxYear = d3.max(data, (d) => d.discovery_year);
    console.log("minyear", minYear)
    console.log("maxyear", maxYear)
    
    // the number of sections we wanna have? subject to change
    const NUM_TIMEPERIODS = 5;

    const sectionWidth = 800 / NUM_TIMEPERIODS;
    let colors = ["#074665ff", "#1670a1ff", "#3dafd2ff", "#4fcaddff", "#6cdae0ff", "#a4f1f1ff"]

    // make it interactive
    for (let i = 0; i <= NUM_TIMEPERIODS; i++) {
        visSvg.append("rect")
            .attr("id", "time-section-" + i)
            .attr("x", 50 + i * sectionWidth)
            .attr("y", 50)
            .attr("width", sectionWidth)
            .attr("height", 10)
            .style("fill", colors[i]);
        d3.select("#time-section-" + i).on("mouseover", function() {
            d3.select(this).style("fill", "red")
                .attr("height", 15)
                .attr("y", 47.5);
            for (let body of data) {
                if ((body.discovery_year <= minYear + (i) * (maxYear - minYear) / NUM_TIMEPERIODS)
                    && (body.discovery_year > minYear + (i-1) * (maxYear - minYear) / NUM_TIMEPERIODS)) {
                    d3.select("#id" + body.name).style("fill", "red");
                    console.log("body", body.name, body.discovery_year)
                }
            }
        });
        d3.select("#time-section-" + i).on("mouseout", function() {
            d3.select(this).style("fill", colors[i])
                .attr("height", 10)
                .attr("y", 50);
            for (let body of data) {
                if (body.discovery_year <= minYear + (i) * (maxYear - minYear) / NUM_TIMEPERIODS) {
                    d3.select("#id" + body.name).style("fill", null);
                }
            }
        });
    }
}