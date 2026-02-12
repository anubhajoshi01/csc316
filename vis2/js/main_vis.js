// draw an svg

const WIDTH = 1000;
const HEIGHT = 700;

let visSvg = d3.select("#chart-area").append("svg")
			.attr("width", WIDTH)
			.attr("height", HEIGHT);

visSvg.append("circle")
    .attr("r", 30)
    .style("fill", "#efbf44")
    .attr("cy", HEIGHT / 2)
    .attr("cx", 40)

function drawVis(data, planetsOnly) {
    console.log("the data", data);
    
    // filter planets
    let planetsData = data.filter((body) => body.is_planet)
    console.log("planets only", planetsData)

    // lets draw the planets !?
    let planets = visSvg.selectAll(".planet")
        .data(planetsData)

    planets.enter().append("circle")
        .attr("class", "planet")
        .attr("id", (p) => "id" + p.name)
        .style("fill", "black")
        .attr("cy", (p, i) => {     // spread out the planets idk
            let yval = i % 2 == 0 ? -i : i
            return (p.semi_major_axis) + HEIGHT / 2 + yval * 15
        })
        .attr("cx", (p, i) => (p.semi_major_axis * 16) + 70)
        .attr("r", 4)
    
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

    let moons = visSvg.selectAll(".moons")
        .data(moonsData)
    
    moons.enter().append("circle")
        .attr("class", "moon")
        .attr("id", (m) => m.name)
        .style("fill", "teal")
        .style("opacity", 0.5)
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
}