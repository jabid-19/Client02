sal();

const flightPath={
    curviness: 1.25,
    autoRotate: true,
    values:[
        {x: 50, y: -20},
        {x: 500, y: 10},
        {x: 500, y: -50},
        {x: 950, y: 100},
        {x: 550, y: -50},
        {x: 800, y: 0},
        // {x: window.innerWidth, y: 250}
    
    ]
};

const tween= new TimelineLite();

tween.add(
    TweenLite.to(".plane", 1, {
        bezier: flightPath,
        ease: Power1.easeInOut
    })
);

const controller= new ScrollMagic.Controller();

const scene= new ScrollMagic.Scene({
    triggerElement: ".animation",
    duration: 2000,
    triggerHook:0
})
.setTween(tween)
// .addIndicators()
.addTo(controller);