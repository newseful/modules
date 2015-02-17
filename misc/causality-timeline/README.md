# Causality Timeline

A timeline module that separates events by actor groups and shows direct causal relationships between events.

![image of timeline](img/screenshot-01.jpg)

This module expects two inputs: `data` and an `options` object.

In order to draw the module, the data must be formatted like this:

	data = [
		{
			name : 'group one',
			events : [
				{
					date : 'February 10 2015',
					text : 'Event details'
				},
				{
					date : 'February 12 2015',
					text : 'Event details'
				},
				{
					date : 'February 15 2015',
					text : 'Event details',
					caused : [
						{
							date : 'February 17 2015',
							group : 'group two'
						}
					]
				}
			]
		},
		{
			name : 'group two',
			events : [
				{
					date : 'February 12 2015',
					text : 'Event details'
				},
				{
					date : 'February 15 2015',
					text : 'Event details'
				},
				{
					date : 'February 17 2015',
					text : 'Event details',
				}
			]
		}
	]

The `data` variable itself is an array of actor group objects, each of which has a `name` property and an `events` property. The `events` property lists the events in the timeline of this group. Each `event` is an object containing a `date` string and a `text` string. An event can contain an optional parameter of `caused`, which can be an object or an array of objects containing `date` and `group` strings. The `caused` property is used to draw the causal connections between the group timelines.