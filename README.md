Gesture Mashup Demo
===================
*Created by Todd Margolis, Qlik Partner Engineering (2014)*
Qlik Sense mashup to control high resolution visualizations via gestural control.

####Gesture platform architecture

![Architecture](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide22.JPG)
This mashup makes extensive use of the following 7 modules:
 - Require.js to load modules
 - Myo.js for gesture recognition and arm tracking
 - Leap and leap-plugins for gesture recognition and hand tracking
 - Famo.us for managing the overall 3D visualization 
 - Publisher for event handling
 - Promises for serializing function calls
 - Qlik Engine for data loading and selection handling

![Requirejs](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide23.JPG)
I separated all of the various code logic into their own modules so as to make the overall mashup more legible as well as to enable better reusability. This essentials means using Require.js to define objects that return functions which can be called by other parts of the application. Above you can see where I've included several modules and then later called methods on them to start gesture tracking.

![MyoUI](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide24.JPG)
I created my own Myo handler object to manage Myo functions. Once I've created a Myo object there, I can then listen for gesture events and then send those events to other parts of the application. In this file, you'll also see how I've converted the streaming orientation info from the Myo into standard mouse scrollwheel events. I'm also taking the streaming inertial data from the Myo to create custom events when the user moves their arm up or down quickly. Here are the various gestures and movements the Myo can recognize:
![MyoGestures](https://github.com/tmargolis/GestureMashup/blob/master/documentation/imgs/MyoGestures.jpeg)


![LeapUI](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide25.JPG)
This Leap object manages hand tracking and gesture recognition from the Leap Motion Controller. Most of the logic is contained in the Leap.loop frame() function where I track one or two hands as well as look for gestures. Hand tracking sends data each frame to other parts of the application, while gestures send discreet events. 

![Famo.us](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide26.JPG)

![Publisher](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide27.JPG)

![Promises](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide28.JPG)

![QlikEngine](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide29.JPG)
*One thing to note is that this uses qGroupFieldDefs to get the dimension name rather than qFallbackTitle because some of the objects being manipulated may use master items which will not show up with qFallbackTitle*
