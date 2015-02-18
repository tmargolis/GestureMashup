Gesture Mashup Demo
===================
*Created by Todd Margolis, Qlik Partner Engineering (2015)*

Qlik Sense mashup to control high resolution visualizations via gestural control.

####Gesture platform architecture

![Architecture](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide22.JPG)
This mashup makes extensive use of the following 7 modules:
 - Require.js to load modules
 - Myo.js for gesture recognition and arm/hand tracking
 - Leap and leap-plugins for gesture recognition and hand tracking
 - Famo.us for managing the overall 3D visualization 
 - Publisher for event handling
 - Promises for serializing asynchronous function calls
 - Qlik Engine for data loading and selection handling

![Requirejs](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide23.JPG)
I separated all of the various app logic into their own modules so as to make the overall mashup more legible as well as to enable better reusability. This essentials means using Require.js to define objects that return functions which can be called by other parts of the application. Above you can see where I've included several modules and then later called methods on them to initialize gesture tracking.

![MyoUI](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide24.JPG)
I created my own Myo handler object to manage Myo functions. Once I've created a Myo object there, I can then listen for gesture events and then send those events to other parts of the application. In this file, you'll also see how I've converted the streaming orientation info from the Myo into standard mouse scrollwheel events. I'm also taking the streaming inertial data from the Myo to create custom events when the user moves their arm up or down quickly. In the code example above left, I'm creating the Myo object and then sending an "advance" event when it receives a wave_in gesture. In the example above right, you can see how I'm handling the orientation and gyro data. Here are all the gestures and movements the Myo can currently recognize:
![MyoGestures](https://github.com/tmargolis/GestureMashup/blob/master/documentation/imgs/MyoGestures.jpeg)


![LeapUI](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide25.JPG)
This Leap object manages hand tracking and gesture recognition from the Leap Motion Controller. Most of the logic is contained in the Leap.loop frame() function where I track one or two hands as well as look for gestures. Hand tracking sends data each frame to other parts of the application, while gestures send discreet events. 

![Famo.us](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide26.JPG)
Famo.us is a newish web visualization library optimized for manipulating a lot of html elements in 2D or 3D. Rather than structuring all of your html elements in a traditional hierarchical manner where each child element is positioned relative to it's parent, Famo.us positions each element via CSS 3D transformations so that the DOM appears flattened (all elements are siblings to each other). In the example above left you can see the Famo.us modules I'm using. In the example above right you can see how I create a new surface (<div> in html-speak) and then create a transformation for it and finally add those to the root document element.

![Publisher](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide27.JPG)
Publisher enables the application to send events(with associated data) from one client module to another client module. You just call publisher.publish('EventName') and then subscribe to that event with a function handler. This makes modularized code very easy to use. In the example above left you can see the logic for starting and completing a range selection. In the example above right you can see the handlers for those events.

![Promises](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide28.JPG)
The Qlik engine already relies heavily on Promises to send/receive data from the engine. This methodology also proved useful to serialize both synchronous and asynchronous function calls throughout the application. In the example above left you can see the entire range selection startup sequence. In the example above right, you can see how I've wrapped the qlik engine call within a new Promise which will return either the correct result or an error.

![QlikEngine](https://github.com/tmargolis/GestureMashup/blob/master/documentation/GestureDemoSlides/Slide29.JPG)
In order to map gestures to custom selections(ie Find Top Three or Find Outliers), I created a series of functions to get the required data either from the DOM elements directly or from the qlik engine via API calls. In the example above you can see how I get all of the data contained in the specified object, then filter it based on a specified range (min/max values) and finally make a new selection call to the engine to update the app with the selected data.
*One thing to note is that this uses qGroupFieldDefs to get the dimension name rather than qFallbackTitle because some of the objects being manipulated may use master items which will not show up with qFallbackTitle*


I've tried to use a lot of inline commenting to make the code easily understandable. You'll also notice that I have not included an example Sense application. The platform should work with any Sense apps and most visualization objects. Feel free to contact me with any questions or comments.
