function orbitData(csvPath, discardNonPlanets = true) {
    return d3.csv(csvPath, function(d) {
        // Select desired features and convert types
        let cleanName = d.eName.replace(/ /g, "-");  
        cleanName = cleanName.replace(/\//g, "-");
        cleanName = cleanName.replace(/\(/g, "-");     // html-friendly for classes/ids
        cleanName = cleanName.replace(/\)/g, "-");     // html-friendly for classes/ids

        let cleanOrbits = d.orbits.replace(/ /g, "-");       // html-friendly for classes/ids
        cleanOrbits = cleanOrbits.replace(/\//g, "-");
        cleanOrbits = cleanOrbits.replace(/\(/g, "-");     // html-friendly for classes/ids
        cleanOrbits = cleanOrbits.replace(/\)/g, "-");     // html-friendly for classes/ids
        return {
            name: cleanName,
            realName: d.eName,
            orbits_planet: cleanOrbits,
            orbit_type: d.orbit_type,
            discovery_year: d.discoveryDate,
            is_planet: d.isPlanet === "TRUE",
            radius: +d.meanRadius,
            mass: +d.mass_kg,
            semi_major_axis: +d.semimajorAxis / 149597870       // in astronomical units
        }
    }).then((data) => {
        // Delete copy of original columns
        delete data.columns;

        // Unify discovery year format and convert to number
        for (let i = 0; i < data.length; i++) {
            data[i].discovery_year = +data[i].discovery_year.slice(-4);
        }

        // Filter out primary bodies that are not planets if desired
        if (discardNonPlanets) {
            data = data.filter(d => d.is_planet && d.orbit_type === "Primary");
        }
        console.log("hello")
        drawVis(data, discardNonPlanets);
        
    });
}

orbitData('data/sol_data.csv', false)