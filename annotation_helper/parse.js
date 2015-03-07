var NFAnnotations = function(selector) {

	/////////////////////////////////////////////////////////////////

	//                         CONSTANTS                           //

	/////////////////////////////////////////////////////////////////

	this.openingExpression = '((';

	this.closingExpression = '))';

	this.reservedKeywords = ['name','title','description','location','image'];


	/////////////////////////////////////////////////////////////////

	//                         EXTENSIONS                          //

	/////////////////////////////////////////////////////////////////



	String.prototype.strip = String.prototype.strip || function() {
		return this.replace('((','').replace('))','');
	}

	String.prototype.underscore = String.prototype.underscore || function() {
		return this.split(' ').join('_');
	}

	String.prototype.friendly = String.prototype.friendly || function() {
		return this.split('_').join(' ');
	}

	String.prototype.oneLiner = String.prototype.oneLiner || function() {
		return this.split(' ').join('\240');
	}

	NodeList.prototype.map = NodeList.prototype.map || Array.prototype.map;

	/////////////////////////////////////////////////////////////////

	//                         HELPERS                             //

	/////////////////////////////////////////////////////////////////


	this.isReserved = function(str) {
		if (this.reservedKeywords.indexOf(str.underscore()) >= 0)
			return true

		return false;
	}

	this.cut = function(str) {
		return str.split('; ')
	}

	this.keysAndValues = function(str) {
		return str.split(': ')
	}

	this.json = function(arr) {
		var _ = this;
		return arr.reduce(function(obj, current) {
			var key = current[0],
					val = current[1];

			if (_.isReserved(key))
				obj[ key.underscore() ] = val; 
			else
				obj.generics.push( { key : key, value : val } );

			return obj;
		}, { generics : [] });
	}

	this.textNodesInSelection = function(el) {
	  var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
	  while(n=walk.nextNode()) a.push(n);
	  return a;
	}

	/////////////////////////////////////////////////////////////////

	//                         PARSERS                             //

	/////////////////////////////////////////////////////////////////


	this.parseExpression = function(str) {
		var cut = this.cut(str);
		var snip = cut.map(this.keysAndValues)
		console.log(this.json(snip));
		return this.json(snip);
	}

	this.extract = function(el) {
		var text = el.innerHTML;
		var open = text.indexOf(this.openingExpression);
		var length = (text.indexOf(this.closingExpression) - open) + this.closingExpression.length;
		var close = text.indexOf(this.closingExpression) + this.closingExpression.length;

		var prev, selection, post;

		while (text.indexOf(this.openingExpression) !== -1 && text.indexOf(this.closingExpression) !== -1) {
			open = text.indexOf(this.openingExpression);
			length = (text.indexOf(this.closingExpression) - open) + this.closingExpression.length;
			close = text.indexOf(this.closingExpression) + this.closingExpression.length;

			prev = text.substr(0, open);
			selection = text.substr(open, length).strip();
			post = text.substr(close);

			text = prev + this.annotationForExpression(selection).outerHTML + post;
		}

		el.innerHTML = text;
	}

	this.parse = function(selection) {
		var nodes = this.textNodesInSelection(selection);
		nodes = nodes.map(function(n) { return n.parentElement }).filter(function(n) { return n !== selection });
		nodes.map(this.extract, this);
	}

	/////////////////////////////////////////////////////////////////

	//                         RENDERERS                           //

	/////////////////////////////////////////////////////////////////

	this.renderGenericProperties = function(data) {
		var list = data.generics.reduce(function(list, prop) {
			var dc = document.createElement('div');
			dc.classList.add('newseful-annotation__generic-prop-pair');

			var dt = document.createElement('dt');
			dt.innerHTML = prop.key;
			dt.classList.add('newseful-annotation__generic-prop-title');

			var dd = document.createElement('dd');
			dd.innerHTML = prop.value;
			dd.classList.add('newseful-annotation__generic-prop-def');

			dc.appendChild(dt);
			dc.appendChild(dd);
			list.appendChild(dc);

			return list;
		}, document.createElement('dl'));

		list.classList.add('newseful-annotation__generic-props-list')

		return list;
	}

	this.renderActorAnnotationContents = function(data) {
		var name = document.createElement('h2');
		name.innerHTML = data.name;
		name.classList.add('newseful-annotation__name');

		var title = document.createElement('h3')
		title.innerHTML = data.title;
		title.classList.add('newseful-annotation__title');

		var description = document.createElement('p')
		description.innerHTML = data.description;
		description.classList.add('newseful-annotation__description');

		var container = document.createElement('div')
		container.classList.add('newseful-annotation__block');

		container.appendChild(name)
		container.appendChild(title)
		container.appendChild(description);

		if (data.generics.length > 0)
			container.appendChild(this.renderGenericProperties(data));

		return container;
	}

	this.renderLocationAnnotationContents = function(data) {
		data.location = data.location.replace(' ', '+')

		var container = document.createElement('div');
		container.classList.add('newseful-annotation__block');

		var img = document.createElement('img');
		img.classList.add('newseful-annotation__location-map');

		img.dataset.location = data.location;

		container.appendChild(img);

		return container;
	}

	this.renderDefaultAnnotationContents = function(data) {
		var container = document.createElement('div');
		container.classList.add('newseful-annotation__block');

		var title = document.createElement('h2');
		title.innerHTML = data.name;
		title.classList.add('newseful-annotation__name')

		var description = document.createElement('p');
		description.innerHTML = data.description;
		description.classList.add('newseful-annotation__description');

		container.appendChild(title);
		container.appendChild(description);

		return container;
	}

	this.annotationForExpression = function(exp) {
		var data = this.parseExpression(exp);
		var _ = this;

		var span = document.createElement('span')
		span.classList.add('newseful-module', 'newseful-annotation');
		span.innerHTML = data.name.oneLiner();

		var annotationContents = (function() {
			if (data.title) {
					return _.renderActorAnnotationContents(data);
			} else if (data.location) {
					return _.renderLocationAnnotationContents(data);
			}
			return _.renderDefaultAnnotationContents(data);
		})();

		span.appendChild(annotationContents);

		return span;
	}

	/////////////////////////////////////////////////////////////////

	//                         POST-RENDERERS                      //

	/////////////////////////////////////////////////////////////////

	this.requestMapForElement = function(el) {
		var location = el.dataset.location;

		var request = new XMLHttpRequest();
		request.open('GET', 'http://api.tiles.mapbox.com/v4/geocode/mapbox.places/'+location+'.json?access_token=pk.eyJ1Ijoia2V2aW56d2VlcmluayIsImEiOiJQS0ZwLVpZIn0.k5CgNEeEwLYeOFRz0SHWgA', true);

		request.onload = function() {
		  if (request.status >= 200 && request.status < 400) {
		    var resp = JSON.parse(request.responseText);
		    var center = resp.features[0].center;
		    var imgSrc = 'http://api.tiles.mapbox.com/v4/kevinzweerink.eb9ec811/' + center[0] +','+ center[1] +',5/300x150.jpg?access_token=pk.eyJ1Ijoia2V2aW56d2VlcmluayIsImEiOiJQS0ZwLVpZIn0.k5CgNEeEwLYeOFRz0SHWgA';
		    el.setAttribute('src', imgSrc);
		  } else {
		    console.log('hmm error');
		    var imgSrc = '#';
		    el.setAttribute('src', imgSrc);
		  }
		};

		request.onerror = function() {
		  console.log('connection error');
		  var imgSrc = '#'
		  el.setAttribute('src', imgSrc);
		};

		request.send();
	}

	this.prep = function(selector) {
		selector.querySelectorAll('.newseful-annotation__location-map').map(this.requestMapForElement);
	}

	this.listen = function(selector) {
		selector.querySelectorAll('.newseful-annotation').map(function(el) {
			el.addEventListener('mouseenter', function(e) {
				this.classList.add('newseful-annotation--active');
				var block = this.querySelector('.newseful-annotation__block');
				var rect = this.getBoundingClientRect();
				block.style.left = rect.left + (rect.width / 2) + 'px';
				block.style.top = rect.top + document.body.scrollTop + 'px';

				if (block.getBoundingClientRect().top < 50) {
					block.classList.add('newseful-annotation__block--flip');
				}
			});

			el.addEventListener('mouseleave', function(e) {
				this.classList.remove('newseful-annotation--active');
				this.querySelector('.newseful-annotation__block--flip').classList.remove('newseful-annotation__block--flip');
			});
		});
	}

	/////////////////////////////////////////////////////////////////

	//                       INITIALIZERS                          //

	/////////////////////////////////////////////////////////////////

	this.init = function(selector) {
		this.parse(selector);
		this.prep(selector);
		this.listen(selector);
		return this;
	}

	return this.init(selector);

}