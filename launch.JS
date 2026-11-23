const launch_now = document.getElementById("launch_now");
const button_background = document.querySelector(".button_background");
let launched = false;

const sfx = {
    countdown: new Audio("audio/countdown.mp3"),
    launch:    new Audio("audio/launch.mp3"),
    roar:      new Audio("audio/roar.mp3"),
    staging:   new Audio("audio/firststaging.mp3"),
};
sfx.roar.loop = true;
sfx.roar.volume = 0.1;
let rocketSound = true;

let staging_sound = false;
sfx.staging.volume = 0.05;

const HeavenHellSong = new Audio("audio/Heaven and Hell - Jeremy Blake.mp3");
HeavenHellSong.volume = 0.4;
let musicStarted1 = false;

const AwaySong = new Audio("audio/Away - Patrick Patrikios.mp3");
AwaySong.volume = 0.4;
let musicStarted2 = false;

const EventDep = new Audio("audio/Event Departure - Silent Partner.mp3");
EventDep.volume = 0.4;
let musicStarted3 = false;

let liftoffSoundPlayed = false;
let countdownSoundPlayed = false;

const decrease_speed = document.getElementById("decrease_speed");
const increase_speed = document.getElementById("increase_speed");
const playback_display = document.getElementById("playback_display");
const pause_button = document.getElementById("pause_button");
let paused = false;

const music_button_id = document.getElementById("music_button_id");

const apoapsis_info = document.getElementById("apoapsis_info");
const periapsis_info = document.getElementById("periapsis_info");

const alt_info = document.getElementById("altitude_info");
const velocity_info = document.getElementById("velocity_info");
const vertical_velocity_info = document.getElementById("vertical_velocity_info");
const acceleration_info = document.getElementById("acceleration_info");
const mass_info = document.getElementById("mass_info");
const pitch_info = document.getElementById("pitch_info");
const pressure_info = document.getElementById("pressure_info");
const max_Q_info = document.getElementById("max_Q_info");
const mach_info = document.getElementById("mach_info");
const gforce_info = document.getElementById("gforce_info");
const percentage_info = document.getElementById("percentage_info");

const time_info = document.getElementById("time_info");
const orbit_question = document.getElementById("orbit_question");

const current_stage_info = document.getElementById("current_stage_info");
const thrust_info = document.getElementById("thrust_info");
const delta_v_info = document.getElementById("delta_v_info");
const twr_info = document.getElementById("twr_info");
const propellant_info = document.getElementById("propellant_info");

const telemetry = document.getElementById("telemetry_container");
const toggleButton = document.getElementById("toggle_telemetry");

const toggle_flight = document.getElementById("toggle_flight");
const flight_content = document.getElementById("flight_content");

const altChartContainer = document.querySelector(".alt_time_chart");
const velChartContainer = document.querySelector(".vel_time_chart");
const massChartContainer = document.querySelector(".mass_time_chart");
const accChartContainer = document.querySelector(".acceleration_time_chart");
const presChartContainer = document.querySelector(".pressure_time_chart");
 
const Alt_T_Drop = document.getElementById("Alt_T_Drop");
const Vel_T_Drop = document.getElementById("Vel_T_Drop");
const Mass_T_Drop = document.getElementById("Mass_T_Drop");
const Acc_T_Drop = document.getElementById("Acc_T_Drop");
const Pres_T_Drop = document.getElementById("Pres_T_Drop");

const flight_dropdown = document.querySelector(".flight_dropdown");
const hide_button = document.querySelector(".hide_button");
const highest_lowest = document.querySelector(".highest_lowest");
const playback_container = document.querySelector(".playback_container");

const sim_canvas = document.getElementById("sim_canvas");

const X_button = document.getElementById("X_button");

const fade_overlay = document.getElementById("fade_overlay");
const thanks_msg = document.getElementById("thanks_msg");

let toast1 = false, toast2 = false, toast3 = false;

const title = document.querySelector(".title_sceen");
title.addEventListener("animationend", e => { if (e.target === title) title.remove(); });

let liftoffEvent = false;
let towerEvent = false;
let machEvent = false;
let maxQEvent = false;
let karmanEvent = false;
let stage1Event = false, stage2intEvent, lesEvent = false, stage2Event = false, stage3Event = false;

let endingStarted = false;
let controlsLocked = false;

let flightData = [];
let missionTime = 0;
const countdown = 10;  
let playbackSpeed = 1;
let lastFrameTime = null;
let nextGraphTime = 0;

const music_by = document.getElementById("music_by");
const launch_event = document.getElementById("launch_event");

function showMusicBy(song){
    music_by.textContent = song;
    music_by.classList.add("show");
    setTimeout(() => music_by.classList.remove("show"), 5000);
}

function showLaunchEvent(event){
    launch_event.textContent = event;
    launch_event.classList.add("show");
    setTimeout(() => launch_event.classList.remove("show"), 4000);
}

Chart.defaults.font.family = "'Space Mono', monospace";
Chart.defaults.font.size = 12;
Chart.defaults.color = "#51cf66";                     
Chart.defaults.borderColor = "#5ae1705a"; 
Chart.defaults.backgroundColor = "#51cf66";

launch_now.onclick = function(){
    button_background.classList.add("hidden");
    launched = true;
    if (launched) requestAnimationFrame(updateFlight);
}

toggleButton.onclick = function(){
    telemetry.classList.toggle("hidden");
    flight_dropdown.classList.toggle("hidden");
    highest_lowest.classList.toggle("hidden");

    if(telemetry.classList.contains("hidden")){
        toggleButton.innerHTML = "<span class=material-symbols-outlined>visibility_off</span>";
        hide_button.classList.add("hide_button_alt");
        playback_container.classList.add("playback_container_alt");
    } 
    else{
        toggleButton.innerHTML = "<span class=material-symbols-outlined>visibility</span>";
        hide_button.classList.remove("hide_button_alt");
        playback_container.classList.remove("playback_container_alt");
    }
};

window.addEventListener('keydown', (event) => {
  
  if (event.key === 'h' || event.key === 'H') {
    
    event.preventDefault(); 
    
    telemetry.classList.toggle("hidden");
    flight_dropdown.classList.toggle("hidden");
    highest_lowest.classList.toggle("hidden");

    if (telemetry.classList.contains("hidden")){
        toggleButton.innerHTML = "<span class=material-symbols-outlined>visibility_off</span>";
        
        playback_container.classList.add("playback_container_alt");
    } 
    else{
        toggleButton.innerHTML = "<span class=material-symbols-outlined>visibility</span>";
        
        playback_container.classList.remove("playback_container_alt");
    }
  }
});

let music_on = true;

music_button_id.onclick = function(){
    if(music_on){
        music_on = false;
        music_button_id.innerHTML = "<span class=material-symbols-outlined>music_off</span>";

        HeavenHellSong.volume = 0;
        AwaySong.volume = 0;
        EventDep.volume = 0;
        sfx.countdown.volume = 0;
        sfx.launch.volume = 0;
        sfx.staging.volume = 0;
        sfx.roar.volume = 0;
        rocketSound = false;
    }
    else{
        music_on = true;
        music_button_id.innerHTML = "<span class=material-symbols-outlined>music_note</span>"

        HeavenHellSong.volume = 0.4;
        AwaySong.volume = 0.4;
        EventDep.volume = 0.4;
        sfx.countdown.volume = 0.5;
        sfx.launch.volume = 0.5;
        sfx.staging.volume = 0.1;
        sfx.roar.volume = 0.1;
        rocketSound = true;
    }
}

window.addEventListener('keydown', (event) => {
  
  if (event.key === 'm' || event.key === 'M') {
    
    event.preventDefault(); 
    
    if(music_on){
        music_on = false;
        music_button_id.innerHTML = "<span class=material-symbols-outlined>music_off</span>";

        HeavenHellSong.volume = 0;
        AwaySong.volume = 0;
        EventDep.volume = 0;
        sfx.countdown.volume = 0;
        sfx.launch.volume = 0;
        sfx.staging.volume = 0;
        sfx.roar.volume = 0;
        rocketSound = false;
    }
    else{
        music_on = true;
        music_button_id.innerHTML = "<span class=material-symbols-outlined>music_note</span>"

        HeavenHellSong.volume = 0.4;
        AwaySong.volume = 0.4;
        EventDep.volume = 0.4;
        sfx.countdown.volume = 0.5;
        sfx.launch.volume = 0.5;
        sfx.staging.volume = 0.1;
        sfx.roar.volume = 0.1;
        rocketSound = true;
    }
  }
});

toggle_flight.onclick = function(){
    flight_content.classList.toggle("hidden_flight");
}

Alt_T_Drop.onclick = function(){
    telemetry.classList.add("hidden");
    toggleButton.classList.add("hidden");
    sim_canvas.classList.add("hidden");
    altChartContainer.classList.add("alt_time_chart_active");
    X_button.classList.add("leave_graph")
    music_by.classList.add("hidden");
    launch_event.classList.add("hidden");

    velChartContainer.classList.remove("alt_time_chart_active");
    massChartContainer.classList.remove("alt_time_chart_active");
    accChartContainer.classList.remove("alt_time_chart_active");
    presChartContainer.classList.remove("alt_time_chart_active");

    flight_dropdown.classList.add("chart_mode");
    hide_button.classList.add("chart_mode");
    highest_lowest.classList.add("chart_mode");
    playback_container.classList.add("chart_mode");
}

Vel_T_Drop.onclick = function(){
    telemetry.classList.add("hidden");
    toggleButton.classList.add("hidden");
    sim_canvas.classList.add("hidden");
    velChartContainer.classList.add("alt_time_chart_active");
    X_button.classList.add("leave_graph");
    music_by.classList.add("hidden");
    launch_event.classList.add("hidden");

    altChartContainer.classList.remove("alt_time_chart_active");
    massChartContainer.classList.remove("alt_time_chart_active");
    accChartContainer.classList.remove("alt_time_chart_active");
    presChartContainer.classList.remove("alt_time_chart_active");

    flight_dropdown.classList.add("chart_mode");
    hide_button.classList.add("chart_mode");
    highest_lowest.classList.add("chart_mode");
    playback_container.classList.add("chart_mode");
}

Mass_T_Drop.onclick = function(){
    telemetry.classList.add("hidden");
    toggleButton.classList.add("hidden");
    sim_canvas.classList.add("hidden");
    massChartContainer.classList.add("alt_time_chart_active");
    X_button.classList.add("leave_graph");
    music_by.classList.add("hidden");
    launch_event.classList.add("hidden");

    altChartContainer.classList.remove("alt_time_chart_active");
    velChartContainer.classList.remove("alt_time_chart_active");
    accChartContainer.classList.remove("alt_time_chart_active");
    presChartContainer.classList.remove("alt_time_chart_active");

    flight_dropdown.classList.add("chart_mode");
    hide_button.classList.add("chart_mode");
    highest_lowest.classList.add("chart_mode");
    playback_container.classList.add("chart_mode");
}

Acc_T_Drop.onclick = function(){
    telemetry.classList.add("hidden");
    toggleButton.classList.add("hidden");
    sim_canvas.classList.add("hidden");
    accChartContainer.classList.add("alt_time_chart_active");
    X_button.classList.add("leave_graph");
    music_by.classList.add("hidden");
    launch_event.classList.add("hidden");

    altChartContainer.classList.remove("alt_time_chart_active");
    velChartContainer.classList.remove("alt_time_chart_active");
    massChartContainer.classList.remove("alt_time_chart_active");
    presChartContainer.classList.remove("alt_time_chart_active");

    flight_dropdown.classList.add("chart_mode");
    hide_button.classList.add("chart_mode");
    highest_lowest.classList.add("chart_mode");
    playback_container.classList.add("chart_mode");
}

Pres_T_Drop.onclick = function(){
    telemetry.classList.add("hidden");
    toggleButton.classList.add("hidden");
    sim_canvas.classList.add("hidden");
    presChartContainer.classList.add("alt_time_chart_active");
    X_button.classList.add("leave_graph");
    music_by.classList.add("hidden");
    launch_event.classList.add("hidden");

    altChartContainer.classList.remove("alt_time_chart_active");
    velChartContainer.classList.remove("alt_time_chart_active");
    massChartContainer.classList.remove("alt_time_chart_active");
    accChartContainer.classList.remove("alt_time_chart_active");

    flight_dropdown.classList.add("chart_mode");
    hide_button.classList.add("chart_mode");
    highest_lowest.classList.add("chart_mode");
    playback_container.classList.add("chart_mode");
}

X_button.onclick = function(){
    altChartContainer.classList.remove("alt_time_chart_active");
    velChartContainer.classList.remove("alt_time_chart_active");
    massChartContainer.classList.remove("alt_time_chart_active");
    accChartContainer.classList.remove("alt_time_chart_active");
    presChartContainer.classList.remove("alt_time_chart_active");
    telemetry.classList.remove("hidden");
    toggleButton.classList.remove("hidden");
    X_button.classList.remove("leave_graph");
    flight_content.classList.remove("hidden_flight");
    music_by.classList.remove("hidden");
    launch_event.classList.remove("hidden");

    sim_canvas.classList.remove("hidden");
    flight_dropdown.classList.remove("hidden");
    highest_lowest.classList.remove("hidden");
    playback_container.classList.remove("hidden");

    flight_dropdown.classList.remove("chart_mode");
    hide_button.classList.remove("chart_mode");
    highest_lowest.classList.remove("chart_mode");
    playback_container.classList.remove("chart_mode");
}

decrease_speed.onclick = function(){
    if(playbackSpeed > 1){
        playbackSpeed -= 1
    }

    playback_display.textContent = `${playbackSpeed}x`;
}

window.addEventListener('keydown', (event) => {
  
  if (event.code === 'ArrowLeft') {
    
    event.preventDefault(); 
    
    if(playbackSpeed > 1){
        playbackSpeed -= 1
    }

    playback_display.textContent = `${playbackSpeed}x`;
  }
});

increase_speed.onclick = function(){
    if(playbackSpeed < 5){
        playbackSpeed += 1
    }

    playback_display.textContent = `${playbackSpeed}x`;
}

window.addEventListener('keydown', (event) => {
  
  if (event.code === 'ArrowRight') {
    
    event.preventDefault(); 
    
    if(playbackSpeed < 5){
        playbackSpeed += 1
    }

    playback_display.textContent = `${playbackSpeed}x`;
  }
});

pause_button.onclick = function(){
    paused = !paused;

    pause_button.innerHTML = paused ? "<span class=material-symbols-outlined>play_arrow</span>" : "<span class=material-symbols-outlined>pause</span>";
};

window.addEventListener('keydown', (event) => {
  
  if (event.code === 'Space') {
    
    event.preventDefault(); 
    
    paused = !paused;

    pause_button.innerHTML = paused ? "<span class=material-symbols-outlined>play_arrow</span>" : "<span class=material-symbols-outlined>pause</span>";
  }
});

// block the speed/pause keys once the ending starts (capture phase runs before your other key listeners)
window.addEventListener("keydown", (event) => {
  if (controlsLocked && (event.code === "Space" || event.code === "ArrowLeft" || event.code === "ArrowRight")) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

function startEnding() {
  endingStarted = true;
  controlsLocked = true;

  // the fade is 10 s of real time, so lock to 1x and un-pause
  playbackSpeed = 1;
  paused = false;
  playback_display.textContent = "1x";
  pause_button.innerHTML = "<span class=material-symbols-outlined>pause</span>";
  [pause_button, decrease_speed, increase_speed].forEach(b => b.disabled = true);

  fade_overlay.classList.add("fade_active");      // 10 s fade to black

  setTimeout(() => {
    thanks_msg.classList.add("thanks_show");      // 1 s of black, then the message
  }, 11000);
}

function playCue(audio, cueTime){
  const late = missionTime - cueTime;                 
  audio.currentTime = Math.max(0, late * playbackSpeed);
  audio.play();
}

async function loadFlightData() {
    const response = await fetch("flight_data.json");

    if(!response.ok){
        throw new Error("Could not load flight data");
    }

    flightData = await response.json();

    missionTime = -countdown;

    createChart();
    createvelChart();
    createmassChart();
    createaccChart();
    createpresChart();

    if(launched == true){
        requestAnimationFrame(updateFlight);
    }
    else{
        return
    }
}

function updateFlight(timestamp){
    if (lastFrameTime === null){
        lastFrameTime = timestamp;
    }

    const elapsed = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    if(!paused){
        missionTime += elapsed * playbackSpeed;
    }

    const endTime = flightData[flightData.length - 1].t;
    if (missionTime > endTime) missionTime = endTime;           
    if (!endingStarted && missionTime >= endTime - 10) startEnding();

    const sign = missionTime < 0 ? "-" : "+";
    const whole = missionTime < 0 ? Math.ceil(-missionTime) : Math.floor(missionTime);

    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const seconds = whole % 60;

    const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const lookupTime = Math.max(missionTime, flightData[0].t);
    const counting = missionTime < flightData[0].t;

    if(!liftoffSoundPlayed && missionTime >= 10 && paused === false){
        liftoffSoundPlayed = true;
        sfx.roar.play();
    }
    else if(paused === true){
        liftoffSoundPlayed = false;
        sfx.roar.pause();
    }

    if(!staging_sound && missionTime >= 150 && missionTime < 151 && paused ===false){
        staging_sound = true;
        sfx.staging.play();
    }
    else if(paused === true){
        staging_sound = false;
        sfx.staging.pause();
    }

    if(!countdownSoundPlayed && missionTime >= -8 && missionTime < 13 && paused === false){
        countdownSoundPlayed = true;
        playCue(sfx.countdown, -8);
        playCue(sfx.launch, -10);
    }
    else if(paused === true){
        countdownSoundPlayed = false;
        sfx.countdown.pause();
        sfx.launch.pause();
    }

    if(!musicStarted1 && missionTime >= 180 && missionTime < 446 && paused === false){
        musicStarted1 = true;
        HeavenHellSong.play();
    }
    else if(paused === true || missionTime > 446){
        musicStarted1 = false;
        HeavenHellSong.pause();
    }

    if(!musicStarted2 && missionTime >= 446 && missionTime < 600 && paused === false){
        musicStarted2 = true;
        AwaySong.play();
    }
    else if(paused === true || missionTime > 600){
        musicStarted2 = false;
        AwaySong.pause();
    }

    if(!musicStarted3 && missionTime >= 610 && paused === false){
        musicStarted3 = true;
        EventDep.play();
    }
    else if(paused === true){
        musicStarted3 = false;
        EventDep.pause();
    }

    if(!toast1 && missionTime >= 180 && music_on){ toast1 = true; showMusicBy("♪ Heaven and Hell — Jeremy Blake"); }
    if(!toast2 && missionTime >= 446 && music_on){ toast2 = true; showMusicBy("♪ Away — Patrick Patrikios"); }
    if(!toast3 && missionTime >= 610 && music_on){ toast3 = true; showMusicBy("♪ Event Departure — Silent Partner"); }

    HeavenHellSong.playbackRate = playbackSpeed;
    AwaySong.playbackRate = playbackSpeed;
    EventDep.playbackRate = playbackSpeed;
    sfx.countdown.playbackRate = playbackSpeed;
    sfx.launch.playbackRate = playbackSpeed;
    sfx.roar.playbackRate = playbackSpeed;
    sfx.staging.playbackRate = playbackSpeed;

    if(!stage3Event && missionTime >= 675){ stage3Event = true; showLaunchEvent("S-IVB cutoff, orbit insertion"); }

    for(let i = 0; i < flightData.length - 1; i++){
        if(flightData[i].t <= lookupTime && lookupTime < flightData[i + 1].t){
            const current = flightData[i];

            const density = Math.exp(-current.alt / 8500);     
            
            if(rocketSound == true){sfx.roar.volume = Math.max(0, Math.min(1, 0.5 * Math.sqrt(density)));};     

            if(window.updateScene) window.updateScene(counting ? { ...current, thrust: 0, mt: missionTime } : { ...current, mt: missionTime });

            const formatNumber = value => value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            const prop_percentagecalc = (current.fuel_in_stage / current.total_fuel_before) * 100;
            const prop_percentage = prop_percentagecalc.toFixed(2);

            alt_info.textContent = `Altitude: ${formatNumber(current.alt / 1000)} km`;
            velocity_info.textContent = `Velocity: ${formatNumber(current.relative_speed)} m/s`;
            vertical_velocity_info.textContent = `Vertical Velocity: ${formatNumber(current.vert_speed)} m/s`;
            acceleration_info.textContent = `Acceleration: ${formatNumber(current.acceleration)} m/s²`;
            mass_info.textContent = `Mass: ${formatNumber(current.mass)} kg`;
            mach_info.textContent = `Mach: ${current.mach}`;
            pressure_info.textContent = `Dynamic Pressure: ${(current.dynamic_pressure / 1000).toFixed(2)} kPa`
            max_Q_info.textContent = current.passed_max_q? `Max Q: ${(current.max_q / 1000).toFixed(2)} kPa` : "Max Q: --";
            pitch_info.textContent = `Pitch: ${current.pitch}°`;
            gforce_info.textContent = `G Force: ${current.G_Force}`

            time_info.textContent = `T${sign} ${formattedTime} s`;

            current_stage_info.textContent = `Stage: ${current.stage}`;
            thrust_info.textContent = `Thrust: ${counting ? 0 : current.thrust.toLocaleString("en-US")} N`;
            delta_v_info.textContent = `Delta-v: ${formatNumber(current.delta_v)} m/s`;
            twr_info.textContent = `TWR: ${counting ? 0 : current.thrust_weight}`;
            propellant_info.textContent = `Propellant: ${current.fuel_in_stage.toLocaleString("en-US")} / ${current.total_fuel_before.toLocaleString("en-US")} kg`;
            percentage_info.textContent = `Fuel percentage: ${prop_percentage}% remaining`

            apoapsis_info.textContent = `Apoapsis: ${formatNumber(current.apoapsis / 1000)} km`;
            periapsis_info.textContent = current.periapsis > 0 ? `Periapsis: ${formatNumber(current.periapsis / 1000)} km` : "Periapsis: --";

            if(current.orbit == false && current.alt > 100000){
                orbit_question.textContent = "Orbital Status: Sub-Orbit"
            }
            else if(current.orbit == true){
                orbit_question.textContent = "Orbital Status: Orbiting Earth"
            }
            else{
                orbit_question.textContent = "Orbital Status: Within-Atmosphere"
            }

            if(!liftoffEvent && missionTime >= 0){ liftoffEvent = true; showLaunchEvent("Liftoff!"); }
            if(!towerEvent && missionTime >= 12){ towerEvent = true; showLaunchEvent("Tower cleared!"); }
            if(!machEvent && missionTime >= 60.6){ machEvent = true; showLaunchEvent("Mach 1 reached!"); }
            if(!maxQEvent && missionTime >= 82.6){ maxQEvent = true; showLaunchEvent("Max Q reached!"); }
            if(!stage1Event && missionTime >= 150.1){ stage1Event = true; showLaunchEvent("S-IC separation"); }
            if(!stage2intEvent && missionTime >= 180){ stage2intEvent = true; showLaunchEvent("S-II interstage jettison"); }
            if(!lesEvent && missionTime >= 186){ lesEvent = true; showLaunchEvent("Launch escape tower jettison"); }
            if(!karmanEvent && current.alt >= 100000){ karmanEvent = true; showLaunchEvent("Kármán line passed!");}
            if(!stage2Event && missionTime >= 540){ stage2Event = true; showLaunchEvent("S-II separation"); }

            break;
        }
    }

    if(!paused && missionTime >= nextGraphTime){
        const current = flightData.find(
            item => item.t >= nextGraphTime
        );

        if(current){
            myChart.data.labels.push(current.t);
            myChart.data.datasets[0].data.push(current.alt);

            myChart.update("none");

            velChart.data.labels.push(current.t);
            velChart.data.datasets[0].data.push(current.relative_speed);

            velChart.update("none");

            massChart.data.labels.push(current.t);
            massChart.data.datasets[0].data.push(current.mass);

            massChart.update("none");

            accChart.data.labels.push(current.t);
            accChart.data.datasets[0].data.push(current.acceleration);

            accChart.update("none");

            pressureChart.data.labels.push(current.t);
            pressureChart.data.datasets[0].data.push(current.dynamic_pressure);

            pressureChart.update("none");

            nextGraphTime += 5;
        }
    }

    requestAnimationFrame(updateFlight);
}

const ctx = document.getElementById("myChart");

let myChart;

function createChart() {
    myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Altitude vs Time",
                data: [],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Mission Time (s)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Altitude (m)"
                    }
                }
            }
        }
    });
}

const velctx = document.getElementById("velChart");

let velChart;

function createvelChart() {
    velChart = new Chart(velctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Velocity vs. Time",
                data: [],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Mission Time (s)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Velocity (m/s)"
                    }
                }
            }
        }
    });
}
  
const mctx = document.getElementById("massChart");

let massChart;

function createmassChart() {
    massChart = new Chart(mctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Mass vs. Time",
                data: [],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Mission Time (s)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Mass (kg)"
                    }
                }
            }
        }
    });
}

const actx = document.getElementById("accelerationChart");

let accChart;

function createaccChart() {
    accChart = new Chart(actx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Acceleration vs. Time",
                data: [],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Mission Time (s)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Acceleration (m/s^2)"
                    }
                }
            }
        }
    });
}

const pctx = document.getElementById("pressureChart");

let pressureChart;

function createpresChart() {
    pressureChart = new Chart(pctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Dynamic Pressure vs. Time",
                data: [],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Mission Time (s)"
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Dynamic Pressure (Pa)"
                    }
                }
            }
        }
    });
}


loadFlightData().catch(console.error);

