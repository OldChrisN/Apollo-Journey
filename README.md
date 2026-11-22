# Apollo-Journey
https://oldchrisn.github.io/Apollo-Journey/

This website is a simulation I made to try replicating Apollo 11's rocket launch all the way to orbit. This website was also made using python for the backend and HTML, CSS and JS for the frontend and also used
three JS to visualize the rocket launch. Just to describe how I did the python backend code a little bit, I made a class called stages and put in things a rocket stage would have like dry mass, propellant mass,
thrust, etc and made three stages using that class and also made a rocket class for only one rocket called the Saturn v where I made many rocket functions like the current rocket mass and delta v. To import my python 
results to the browser I used a import that jsonifys mt results so I could loop through the outputs in my website.

The reason I made this website was because I wanted to gain experience coding while in high school so I could have a easier time coding in the future and I also wanted to have fun messing around with rocket physics.

For the models and images I used fire and smoke simulations in blender to make the rocket plume particle effects along with using key frames to animate the x location in mapping to animate the s-ii and s-ivb rocket plumes. I also made the image you see when you enter the website, all the rocket stages, the umbilical tower and the launchpad using blender.

## How accurate is it? (Comparison to Apollo 11)

I compared my simulation's output to NASA's recorded Apollo 11 flight data at the main events of the launch.
"Speed" is Earth-fixed speed (speed relative to the rotating Earth).

| Event | Apollo 11 (NASA) | My simulation | Difference |
|---|---|---|---|
| **Max Q** | T+83.0 s, 13.6 km, 504 m/s | T+82.6 s, 14.9 km, 580 m/s | 0.4 s earlier, +10% altitude |
| **S-IC cutoff** | T+161.6 s, 66.1 km, 2,393 m/s | T+150.1 s, 63.7 km, 2,488 m/s | 7% shorter burn, speed +3.9% |
| **S-II cutoff** | T+548.2 s, 187.3 km, 6,513 m/s | T+540.1 s, 183.7 km, 6,484 m/s | 1.5% shorter burn, speed -0.5% |
| **S-IVB cutoff (orbit)** | T+699.3 s, 191.1 km, 7,388 m/s | T+674.9 s, 184.7 km, 7,377 m/s | 3.5% shorter burn, speed -0.15% |

**Final orbit speed** (space-fixed): 7,797 m/s in my sim vs 7,791 m/s for Apollo 11, a difference of **0.07%**.
My simulation ends in a near-circular orbit of about 187 x 181 km.

### What matches well
- Orbital velocity, which is what decides whether the rocket reaches orbit
- The timing of Max Q (within half a second)
- The order of events: staging, S-II ignition, S-IVB burn to orbit

### What's simplified
- My engines burn 1.5% to 7% shorter than the real ones and reach similar speeds, so my rocket accelerates a little harder than the real Saturn V.
- The real rocket shut down its center engines early (the S-IC at T+135 s, the S-II at about T+460 s) to limit the G-forces. My simulation doesn't model that, so my peak acceleration is higher than the real one.
- My atmosphere and drag models are simplified, so altitude at some events is off by a few kilometers.

Source: [NASA SP-4029, Apollo 11 Ascent Phase](https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11d_Ascent_Phase.htm)

Music
Heaven and Hell from Jeremy Blake
Away from Patrick Patrikios
Event Departure from Silent Partner

Sound effects
Countdown from NASA
Rocket roar from newlocknew on freesound.org

MAKE SURE TO READ THIS!

I made the sim mostly by myself in python while using claude to check if my equations were correct. I also wrote JS, HTML by myself. I used claude for about
30% of CSS because I kept running into positioning problems and decided to just vibe code. I also used claude for most of three JS code in main.JS since I didn't
really know how to use it and didn't have the energy to learn another libary, but I did make all the models, and plume effects and the smoke effects during launch 
came from Kenney particles.

What I learned.

I learned how to code objects in python and how to work with libaries like chart JS and three JS and I also learned some rocket science equations. I also learned
how to make interactive UI using JS and CSS.
