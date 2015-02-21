window.BRAND = {}

BRAND.primaryColor = '#40C693';
BRAND.interfaceColors = {
	blue : '#83AFBA',
	red : '#DB8D61',
	yellow : '#B09E52'
}
BRAND.interfaceColorsDark = {
	blue : '#63848C',
	red : '#8F5C40',
	yellow : '#87793F'
}
BRAND.interfaceColorsLight = {
	blue : '#D3E6ED',
	red : '#F2D8C7',
	yellow : '#F2E7B8'
}

BRAND.grayScale = ['#1A2326','#404E54','#53646B','#799099','#9EBBC6','#D3E6ED']

BRAND.dataScale = ['#9385B1','#91E789']

var NewsefulTimelineView = function(options, dataURL) {
	var ntv = {

		// Separated into events and commentary by default
		data : {
			events : [],
			commentary : [],
			rangeMin : Infinity,
			rangeMax : 0
		},

		container : options.container || null,

		timeStampFormat : d3.time.format('%a %b %d %Y %I:%M%p'),
		shortDateFormat : d3.time.format('%b %d'),
		abbreviatedTimeStampFormat : d3.time.format('%I:%M%p %b %d'),

		/****************************************************************/
		/****************************************************************/
		/****************************************************************/
		/************************** DATA ********************************/
		/****************************************************************/
		/****************************************************************/
		/****************************************************************/

		// Anonymous helper functions that do not need knowledge of the
		// greater scope
		helpers : {
			sortReverseChronological : function(a,b) {
				if (a.time.getTime() < b.time.getTime())
					return 1;

				if (a.time.getTime() > b.time.getTime())
					return -1;

				return 0;
			},
			sortChronological : function(a,b) {
				return a.time.getTime() > b.time.getTime();
			},
			elementOffset : function(el, offsetParent) {
				return el.getBoundingClientRect().top - offsetParent.getBoundingClientRect().top;
			},
			lastMidnightForTime : function(t) {
				var date = new Date(t);
				var lastMidnight = new Date(
						date.getFullYear(),
						date.getMonth(),
						date.getDate(),
						0,0,0
					)

				return lastMidnight.getTime();
			}
		},

		// Extract from the loaded csv the events and commentary
		// Sort reverse chronologically
		sortData : function(data) {
			for (var i = 0; i < data.length; ++i) {
				data[i].time = new Date(data[i].time);
				data[i].is_event = data[i].is_event.match(/true/i);

				//Find min range + max range
				if (data[i].time.getTime() < this.data.rangeMin)
					this.data.rangeMin = data[i].time.getTime();

				if (data[i].time.getTime() > this.data.rangeMax)
					this.data.rangeMax = data[i].time.getTime();

				// Ship to this.data
				data[i].is_event ? this.data.events.push(data[i]) : this.data.commentary.push(data[i]);
			}

			this.data.events.sort(this.helpers.sortReverseChronological);
			this.data.commentary.sort(this.helpers.sortReverseChronological);

			this.data.rangeMin = new Date(this.data.rangeMin);
			this.data.rangeMax = new  Date(this.data.rangeMax);
			this.data.daysInRange = [];

			var midnight = this.helpers.lastMidnightForTime( this.data.rangeMax.getTime() );
			while (midnight > this.data.rangeMin) {
				this.data.daysInRange.push(new Date(midnight));
				midnight --;
				midnight = this.helpers.lastMidnightForTime( midnight );
			}
		},

		offsetForTime : function(t) {
			for (var i = 0; i < this.data.events.length; ++i) {
				var e = this.data.events[i];

				if (t < e.time.getTime())
					continue;

				var mostRecent = this.data.events[i-1];
				var leastRecent = e;

				var unitTimeDif = (mostRecent.time.getTime() - t)/(mostRecent.time.getTime() - leastRecent.time.getTime());
				var totalOffsetDif = (leastRecent.offset - mostRecent.offset) * unitTimeDif;

				return totalOffsetDif + mostRecent.offset;
			}
		},

		calculateRelativePositions : function() {
			for (var i = 0; i < this.data.commentary.length; ++i) {
				var c = this.data.commentary[i];
				c.offset = this.offsetForTime(c.time.getTime());
			}

			for (var i = 0; i < this.data.daysInRange.length; ++i) {
				var d = this.data.daysInRange[i];
				d.offset = this.offsetForTime(d.getTime());
			}
		},

		dataDidLoad : function(data) {
			this.sortData(data);
			this.renderEventBlocks();
			this.calculateRelativePositions();
			this.renderTimeline();
			this.renderCommentaryBlocks();
		},

		/****************************************************************/
		/****************************************************************/
		/****************************************************************/
		/************************* DRAWING ******************************/
		/****************************************************************/
		/****************************************************************/
		/****************************************************************/

		renderEventBlocks : function() {
			var _ = this;

			var eventContainer = d3.select(this.container).append('div')
				.classed('newseful-event-container', true);

			eventContainer.append('div')
				.classed('newseful-timeline-label', true)
				.text('Events');

			this.eventBlock = eventContainer.selectAll('.newseful-event-block')
				.data(this.data.events)
				.enter()
					.append('div')
					.classed('newseful-event-block', true)

			this.eventBlock.append('p')
				.classed('newseful-timestamp',true)
				.text(function(d) { return _.timeStampFormat( d.time ) });

			this.eventBlock.append('p')
				.classed('newseful-content', true)
				.text(function(d) { return d.text });

			// Add the vertical offset of each element back into its dataset to position things with later
			this.eventBlock.each(function(d) {
				var offset = _.helpers.elementOffset(this, eventContainer[0][0]);
				d3.select(this).datum().offset = offset;
			})
		},

		renderCommentaryBlocks : function() {
			var _ = this;

			var commentaryContainer = d3.select(this.container).append('div')
				.classed('newseful-commentary-container', true)

			commentaryContainer.append('div')
				.classed('newseful-timeline-label', true)
				.text('Commentary');

			this.commentaryBlock = commentaryContainer.selectAll('.newseful-commentary-block')
				.data(this.data.commentary)
				.enter()
					.append('div')
					.classed('newseful-commentary-block',true)
					.style('top', function(d) { return d.offset + 'px' });

			this.commentaryBlock.append('p')
				.classed('newseful-commentary-title', true)
				.text(function(d) { return d.title });

			var commentaryContent = this.commentaryBlock.append('div')
				.classed('newseful-commentary-content', true)
			
			commentaryContent.append('p')
				.text(function(d) { return d.text });

			commentaryContent.append('p')
				.classed('newseful-timestamp', true)
				.text(function(d) { return _.abbreviatedTimeStampFormat( d.time ) });

			commentaryContent.filter(function(d) { return !!d.source })
				.append('a')
				.classed('newseful-source-button', true)
				.attr('href', function(d){ return d.source })
				.text('Source');
		},

		renderTimeline : function() {
			var _ = this;
			var eventContainer = d3.select('.newseful-event-container');
			var timelineContainer = d3.select(this.container).append('svg','.newseful-event-container')
				.classed('newseful-timeline-container', true)
				.attr('width', '10%')
				.style('margin-top', '24px')

			var eventsTimeline = timelineContainer.append('g')
				.classed('newseful-events-timeline', true)

			// Only draw the actual line if there's more than one event
			if (this.data.events.length > 1) {
				eventsTimeline.append('line')
					.attr('x1', '100%')
					.attr('x2', '100%')
					.attr('y1', this.data.events[0].offset)
					.attr('y2', this.data.events[this.data.events.length - 1].offset);
			}

			eventsTimeline.selectAll('.node')
				.data(this.data.events)
				.enter()
					.append('circle')
					.classed('node', true)
					.attr('cx', '100%')
					.attr('cy', function(d) { return d.offset })
					.attr('r', 5);

			var commentaryTimeline = timelineContainer.append('g')
				.classed('newseful-commentary-timeline', true);

			if (this.data.commentary.length > 1) {
				commentaryTimeline.append('line')
					.attr('x1', '0')
					.attr('x2', '0')
					.attr('y1', this.data.commentary[0].offset)
					.attr('y2', this.data.commentary[this.data.commentary.length - 1].offset);
			}

			commentaryTimeline.selectAll('.node')
				.data(this.data.commentary)
				.enter()
					.append('circle')
					.classed('node', true)
					.attr('cx', 0)
					.attr('cy', function(d) { return d.offset })
					.attr('r', 5);

			var dateTimeline = timelineContainer.append('g')
				.classed('newseful-date-timeline', true)

			dateTimeline.append('line')
				.attr('x1', '50%')
				.attr('x2', '50%')
				.attr('y1', -45)
				.attr('y2', this.data.events[this.data.events.length - 1].offset );

			dateTimeline.append('circle')
				.classed('newseful-range-circle', true)
				.attr('cx', '50%')
				.attr('cy', -45)
				.attr('r', 10);

			dateTimeline.append('circle')
				.classed('newseful-range-circle', true)
				.attr('cx', '50%')
				.attr('cy', this.data.events[this.data.events.length - 1].offset)
				.attr('r', 10)
			
			dateTimeline.selectAll('.newseful-date-marker-bg')
				.data(this.data.daysInRange)
				.enter()
					.append('rect')
					.classed('newseful-date-marker-bg', true)
					.attr('x', '15%')
					.attr('y', function(d) { return d.offset })
					.attr('rx', 4)
					.attr('ry', 4)
					.attr('width', '70%')
					.attr('height', '24')

			dateTimeline.selectAll('.newseful-date-marker')
				.data(this.data.daysInRange)
				.enter()
					.append('text')
					.classed('newseful-date-marker', true)
					.attr('x', '50%')
					.attr('y', function(d){ return d.offset })
					.attr('text-anchor', 'middle')
					.attr('alignment-baseline', 'middle')
					.text(function(d) { return _.shortDateFormat(d) });



		},

		init : function() {
			var tTopOpts = {
				key : dataURL,
				callback : this.dataDidLoad,
				callbackContext : this,
				simpleSheet : true
			};

			Tabletop.init(tTopOpts);

			return this;
		}
	}

	return ntv.init();
}

var opts = {
	container : document.querySelector('#timeline-container')
}

var data = 'https://docs.google.com/spreadsheets/d/1Tlcgk8CrZrx-4XnVlirEO2eRYwNbk5B96Rkv879VGZ8/pubhtml?gid=0&single=true'

var timeline = new NewsefulTimelineView(opts, data);