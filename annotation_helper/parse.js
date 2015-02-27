var Parser = function() {

	String.prototype.strip = function() {
		return this.replace('((','').replace('))','');
	}

	String.prototype.underscore = function() {
		return this.split(' ').join('_');
	}

	String.prototype.friendly = function() {
		return this.split('_').join(' ');
	}



	NodeList.prototype.map = Array.prototype.map;

	this.openingExpression = '((';

	this.closingExpression = '))';

	this.reservedKeywords = ['name','title','description','location'];

	this.cut = function(str) {
		return str.split('; ')
	}

	this.keysAndValues = function(str) {
		return str.split(': ')
	}

	this.json = function(arr) {
		var array = arr.map(this.keysAndValues);
		var json = {};
		for (var i = 0; i < array.length; ++i) {
			json[array[i][0].underscore()] = array[i][1];
		}
		return json;
	}

	this.parseExpression = function(str) {
		var cut = this.cut(str);
		return this.json(cut);
	}

	this.renderGenericProperties = function(data) {
		var list = document.createElement('dl');

		for (var key in data) {
			if (data.hasOwnProperty(key) && this.reservedKeywords.indexOf(key) < 0) {
				var value = data[key];
				var dc = document.createElement('div');
				dc.classList.add('newseful-definition-container');

				var dt = document.createElement('dt');
				dt.innerHTML = key.friendly();

				var dd = document.createElement('dd');
				dd.innerHTML = value;

				dc.appendChild(dt);
				dc.appendChild(dd);

				list.appendChild(dc);
			}
		}

		return list;
	}

	this.renderActorAnnotationContents = function(data) {
		var name = document.createElement('h2');
		name.innerHTML = data.name;

		var title = document.createElement('h3')
		title.innerHTML = data.title;

		var description = document.createElement('p')
		description.innerHTML = data.description;

		var genericProperties = this.renderGenericProperties(data);

		var container = document.createElement('div')
		container.classList.add('newseful-annotation-contents');
		container.appendChild(name)
		container.appendChild(title)
		container.appendChild(description);

		if (genericProperties.children.length > 0)
			container.appendChild(genericProperties);


		return container;
	}

	this.renderLocationAnnotationContents = function(data) {
		data.location = data.location.replace(' ', '+')

		var container = document.createElement('div');
		container.classList.add('newseful-annotation-contents');

		var img = document.createElement('img');
		img.classList.add('newseful-location-map');

		img.dataset.location = data.location;

		container.appendChild(img);

		return container;
	}

	this.renderDefaultAnnotationContents = function(data) {
		// return general info contents
	}

	this.annotationForExpression = function(exp) {
		var data = this.parseExpression(exp);
		var _ = this;

		var span = document.createElement('span')
		span.classList.add('newseful-annotation-container');
		span.innerHTML = data.name;

		var annotation = document.createElement('div');
		annotation.classList.add('newseful-annotation-block');

		var annotationContents = (function() {
			if (data.title) {
					return _.renderActorAnnotationContents(data);
			} else if (data.location) {
					return _.renderLocationAnnotationContents(data);
			}
			return _.renderDefaultAnnotationContents(data);
		})();

		annotation.appendChild(annotationContents);

		span.appendChild(annotation);

		return span;
	}

	this.init = function() {
		return this;
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

	this.textNodesInSelection = function(el) {
	  var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
	  while(n=walk.nextNode()) a.push(n);
	  return a;
	}

	this.requestImageForElement = function(el) {
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

	this.addListeners = function() {
		document.querySelectorAll('.newseful-location-map').map(this.requestImageForElement);

		document.querySelectorAll('.newseful-annotation-container').map(function(el) {
			el.addEventListener('mouseenter', function(e) {
				this.classList.add('active');
				var block = this.querySelector('.newseful-annotation-block');
				block.style.left = e.clientX + 'px';
				block.style.top = this.getBoundingClientRect().top + document.body.scrollTop + 'px';

				if (block.getBoundingClientRect().top < 10) {
					block.classList.add('flip');
				}

			});

			el.addEventListener('mouseout', function(e) {
				this.classList.remove('active');
				this.querySelector('.newseful-annotation-block').classList.remove('flip');
			});
		});
	}

	this.parse = function(selection) {
		var nodes = this.textNodesInSelection(selection);
		nodes = nodes.map(function(n) { return n.parentElement }).filter(function(n) { return n !== selection });
		nodes.map(this.extract, this);

		this.addListeners();
	}

	return this.init();

}