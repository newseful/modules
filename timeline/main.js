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

		numTicksPerSegment : options.numTicksPerSegment || 5,

		chronological : options.chronological || false,

		ticks : options.ticks || false,

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
				if (a.time.getTime() > b.time.getTime())
					return 1;

				if (a.time.getTime() < b.time.getTime())
					return -1;

				return 0;
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

			this.data.events.sort(this.sortFunction);
			this.data.commentary.sort(this.sortFunction);

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

		addTicksForTimeline : function(timeline) {
			var _ = this;
			var timelineTicksData = d3.range(this.data.daysInRange.length + 1);
			timelineTicksData = timelineTicksData.map(function(d) {
				return {
					index : d,
					data : d3.range(_.numTicksPerSegment)
				}
			});

			var timelineTicksGroup = timeline.selectAll('.ticks')
				.data(timelineTicksData)
				.enter()
					.append('g')
					.classed('ticks', true)
					.each(function(data, index) {
						console.log(data, index);

						d3.select(this).selectAll('.tick')
							.data(data.data)
							.enter()
								.append('line')
								.classed('tick', true)
								.attr('x1', '35%')
								.attr('x2', '65%')
								.attr('y1', function(d, i) {
									var pad = 20;

									var startPos = (function() {
										if (index == 0)
											return -45;

										return _.offsetForTime(new Date(_.data.daysInRange[index - 1]).getTime());
									})();

									var endPos = (function() {
										if (index == timelineTicksData.length - 1)
											return _.data.events[_.data.events.length - 1].offset;

										return _.offsetForTime(new Date( _.data.daysInRange[index].getTime() ));
									})();

									var length = (endPos - startPos) - (pad * 2);

									var position = startPos + pad + ((length / (_.numTicksPerSegment - 1)) * i);

									return position;
								})
								.attr('y2', function(d) { return this.getAttribute('y1') });
					})
		},

		renderTimeline : function() {
			var _ = this;
			var eventContainer = d3.select('.newseful-event-container');
			var timelineContainer = d3.select(this.container).append('svg','.newseful-event-container')
				.classed('newseful-timeline-container', true)
				.attr('width', '10%')
				.style('margin-top', '24px')

						var dateTimeline = timelineContainer.append('g')
				.classed('newseful-date-timeline', true)

			if (this.ticks)
				this.addTicksForTimeline(dateTimeline);

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

			dateTimeline.append('circle')
				.classed('newseful-activity-circle', true)
				.attr('cx', '50%')
				.attr('cy', -45)
				.attr('r', 5);
			
			dateTimeline.selectAll('.newseful-date-marker-bg')
				.data(this.data.daysInRange)
				.enter()
					.append('rect')
					.classed('newseful-date-marker-bg', true)
					.attr('x', '10%')
					.attr('y', function(d) { return d.offset })
					.attr('rx', 4)
					.attr('ry', 4)
					.attr('width', '80%')
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

		},

		init : function() {
			var tTopOpts = {
				key : dataURL,
				callback : this.dataDidLoad,
				callbackContext : this,
				simpleSheet : true
			};

			Tabletop.init(tTopOpts);

			this.sortFunction = options.chronological ? this.helpers.sortChronological : this.helpers.sortReverseChronological;

			return this;
		}
	}

	return ntv.init();
}