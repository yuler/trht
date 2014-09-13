/*!
  jQuery Slideme 2 plugin
  @name jquery.slideme2.js
  @author Luigi Ferraresi (luigi.ferraresi@gmail.com)
  @version 2.14.14
  @date 24/08/2014
  @category jQuery Plugin
  @copyright (c) 2014 Luigi Ferraresi (http://slideme.luigiferraresi.it)
*/

(function ($) {

    var version = '2.04.14';
    var pluginName = 'slideme';
    var Plugin, defaultOptions, __bind;
    var methods = [ 'init', 
		    'animate', 
		    'arrowClicked', 
		    'arrowTaped',
		    'checkArrows', 
		    'createArrows', 
		    'createNumbers', 
		    'createPagination', 
		    'createThumbs', 
		    'css3Supports', 
		    'destroy',
                    'getBrowser',
		    'getNext', 
		    'getNextById', 
		    'getReadyForNewAnimation',
		    'getTotalSlides',
		    'inquire',
		    'jumpTo',
		    'jumpToId',
		    'onAnimationEnded',
		    'onOrientationchange',
		    'onResize',
		    'onSnapEnd',
		    'onTouchend',
		    'onWindowScroll',
		    'play',
		    'playTo',
		    'playToId',
		    'removeAutoslide',
		    'scrollTo',
		    'setAfter',
		    'setAutoslide',
		    'setBefore',
		    'setCurrent',
		    'setNext',
		    'setPaginationCurrent',
		    'setSibling',
		    'setSwipe',
		    'setSwipeEnd',
		    'setSwipeMove',
		    'setSwipeStart',
		    'snapTo',
		    'stop',
		    'swipeSupport',
		    'swipeTo',
		    'update'
		];

    __bind = function (fn, me) {
        return function () {
            return fn.apply(me, arguments);
        };
    };

    // Plugin default options.
    defaultOptions = {
        arrows: false,
        autoslide: false,
        autoslideHoverStop: true,
        css3: false,
        current: 0,
		direction: 1,
        interval: 1000,
        itemsForSlide: 1,
        labels: {
            prev: 'prev',
            next: 'next'
        },
        loop: false,
        nativeTouchScroll: false,
        totalSlides: 0,
        onCreatedCallback: '',
        onEndCallback: '',
	onInquire: '',
        onStartCallback: '',
        pagination: '',
        ready: false,
        resizable: {
            width: '',
            height: ''
        },
        thumbs: {
            width: 50,
            height: 40
        },
        transition: 'slide',
        speed: 500,
	swipe: true
    };

    Plugin = (function (options) {
	
        function Plugin(options) {
            // Extend default options.
            this.settings = $.extend({}, defaultOptions, options);
            // Bind methods.
	    for (var i=0, n = methods.length; i<n; i++){
		var method = methods[i];
		this[method] = __bind(this[method], this);
	    }
        }; // end slideme.

	$.extend(Plugin.prototype, {

	    init : function (selector) {
		this.dom = {};
		this.dom.slideme_container = $(selector).addClass('slideme_container');
		this.dom.slideme = this.dom.slideme_container.find('.slideme');
		if (this.settings.nativeTouchScroll) {
		    this.settings.swipe = false;
		    this.dom.slideme.addClass('slideme-touch').on('touchend', this.onTouchend);
		    this.settings.loop = false;
		    $(window).on('resize.orientationchange', this.onOrientationchange);
		} else {
		    this.dom.slideme.addClass('slideme-' + this.settings.transition);
		}
		if (this.settings.itemsForSlide > 1) {
		    var slides = this.dom.slideme.children();
		    var k = this.settings.itemsForSlide;
		    for (var i = 0, n = slides.length; i < n; i += k) {
			slides.slice(i, i + k).wrapAll("<li class='new'/>");
		    }
		}
                this.browser = this.getBrowser();
		this.counters = {
		    current: 0,
		    next: 0,
		    total: this.getTotalSlides()
		};
		if (this.counters.total === 0) {
		    this.dom.slideme_container.addClass('single');
		} else if (this.counters.total < 1) {
		    console.info('At last, one slide is needed!');
		}
		if (this.settings.css3 && !this.css3Supports()) {
		    this.settings.css3 = false;
		    if (this.settings.transition === "zoom") {
			this.dom.slideme.removeClass('slideme-zoom').addClass('slideme-slide');
		    }
		    console.info('Please, take notice that this browser don\'t supports css3 transition.');
		}
		if (this.settings.arrows) {
		    var event = this.settings.nativeTouchScroll ? this.arrowTaped : this.arrowClicked;
		    var arrows = this.createArrows(event);
		    this.dom.arrows = arrows;
		}
		if (this.settings.arrows && !this.settings.loop) {
		    this.checkArrows();
		}
		if (this.settings.pagination) {
		    this.createPagination();
		}
		if (this.settings.autoslide) {
		    this.setAutoslide();
		}
		if (this.settings.autoslide && this.settings.autoslideHoverStop) {
		    this.dom.slideme_container.on('mouseenter', this.removeAutoslide).on('mouseleave', this.setAutoslide);
		}
		if (this.settings.resizable.width && this.settings.resizable.height) {
		    this.resize = $(window).on('resize', this.onResize);
		    this.onResize();
		}
		if (this.settings.onCreatedCallback) {
		    this.settings.onCreatedCallback({ 'instance': this.dom.slideme_container, 'index': this.counters.current });
		}
		if(this.settings.swipe && this.swipeSupport()){
		    this.swipe = {
			'startX': 0,
			'startY': 0,
			'endX': 0,
			'endY': 0,
			'deltaX': 0,
			'deltaY': 0
		    };
		    this.setSwipe();
		}
		this.setCurrent();
		this.setSibling();
		this.working = false;
	    },

	    animate : function (data) {
		if(this.counters.current !== this.counters.next) {
		    this.animation = data.direction === 1 ? "nextClicked" : "prevClicked";
		    this.working = true;
		    this.setNext();
		    if (this.settings.onStartCallback) {
			this.settings.onStartCallback({ 'instance': this.dom.slideme_container, 'index': this.counters.current });
		    }
		    if(data.direction === 1){
			this.dom.slideme.children().removeClass('before');
		    } else {
			this.dom.slideme.children().removeClass('after');
		    }
		    this.dom.next.redraw();
		    if (this.settings.css3) {
			this.dom.current.one('otransitionend webkitTransitionEnd transitionend', this.onAnimationEnded);
			this.dom.slideme.addClass(this.animation);
		    } else {
			var currentAnimation = {},
			nextAnimation = {};
			switch (this.settings.transition) {
			    case "fade":
				currentAnimation['opacity'] = 0;
				nextAnimation['opacity'] = 1;
				break;
			    case "page":
				nextAnimation['left'] = '0%';
				break;
			    default:
				currentAnimation['left'] = -100 * data.direction + '%';
				nextAnimation['left'] = 0;
				break;
			}
			this.dom.current.stop(true, false).animate(currentAnimation, this.speed);
			this.dom.next.stop(true, false).animate(nextAnimation, this.speed, this.onAnimationEnded);
		    }
		}
	    },

	    arrowClicked : function (e) {
		if (!this.working) {
		    var direction = e.data.direction;
		    this.counters.next = this.getNext(direction);
		    this.animate({ 'direction': direction });
		    e.preventDefault();
		}
	    },

	    arrowTaped : function (e) {
		if (!this.working) {
		    var direction = e.data.direction;
		    var index = this.getNext(direction);
		    this.scrollTo(index);
		    e.preventDefault();
		}
	    },

	    checkArrows : function () {
		if(this.counters.current === this.counters.total) {
		    this.dom.arrows.next.attr({ 'disabled': 'disabled' });
		} else {
		    this.dom.arrows.next.removeAttr('disabled');
		}
		if(this.counters.current === 0) {
		    this.dom.arrows.prev.attr({ 'disabled': 'disabled' });
		} else {
		    this.dom.arrows.prev.removeAttr('disabled');
		}
	    },

	    createArrows : function (event) {
		var arrows = {};
		for (key in this.settings.labels) {
		    var params = { 'direction': key === "next" ? 1 : -1, 'key': key };
		    var arrow = $('<button class="arrow" />').addClass(key).text(this.settings.labels[key]).on('click', params, event);
		    arrows[key] = arrow;
		    this.dom.slideme_container.append(arrows[key]);
		}
		return arrows;
	    },

	    createNumbers : function (event) {
		var numbers = [];
		for (var i = 0, n = this.counters.total; i <= n; i++) {
		    var params = { 'index': i },
		    number = $('<li/>').text(i + 1).on('click', params, event);
		    numbers.push(number);
		}
		return numbers;
	    },

	    createPagination : function (event) {
		this.dom.slideme_pagination = $('<nav class="pagination"/>');
		if (this.settings.pagination === "numbers" || this.settings.pagination === "both") {
		    var numbers_container = $('<ol class="numbers" />');
		    var event = this.settings.nativeTouchScroll ? this.scrollTo : this.playTo;
		    var numbers = this.createNumbers(event);
		    numbers_container.append(numbers.slice());
		    this.dom.slideme_pagination.append(numbers_container);
		}
		if (this.settings.pagination === "thumbs" || this.settings.pagination === "both") {
		    var thumbs_container = $('<ol class="thumbs" />');
		    var event = this.settings.nativeTouchScroll ? this.scrollTo : this.playTo;
		    var thumbs = this.createThumbs(event);
		    thumbs_container.append(thumbs.slice());
		    this.dom.slideme_pagination.append(thumbs_container);
		}
		this.dom.slideme_container.append(this.dom.slideme_pagination);
		this.setPaginationCurrent(this.counters.current);
	    },

	    createThumbs : function (event) {
		var thumbs = [],
		width = this.settings.thumbs.width,
		height = this.settings.thumbs.height;
		this.dom.slideme.find('>*').each(function (i) {
		    var params = { 'index': i },
		    src = $(this).find('img').eq(0).attr('src'),
		    img = $('<img />').attr({ 'src': src, 'width': width, 'height': height }),
		    thumb = $('<li/>').html(img).on('click', params, event);
		    thumbs.push(thumb);
		});
		return thumbs;
	    },

	    css3Supports : function () {
		var b = document.body || document.documentElement;
		var s = b.style;
		var t = 'transition';
		if (typeof s[t] === "string") {
		    return true;
		}
		var browsers = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
		t = t.charAt(0).toUpperCase() + t.substr(1);
		for (var i = 0, n = browsers.length; i < n; i++) {
		    if (typeof s[browsers[i] + t] === "string") {
			return true;
		    }
		}
		return false;
	    },

	    destroy : function () {
		this.dom.slideme_container.removeClass('slideme_container single').removeData();
		this.dom.slideme.removeClass('slideme-' + this.settings.transition);
		if (this.settings.pagination) {
		    this.dom.slideme_pagination.remove();
		}
		if (this.settings.arrows) {
		     this.dom.arrows.next.prev();
		     this.dom.arrows.next.remove();
		}
		if (this.settings.resizable.width && this.settings.resizable.height) {
			    this.dom.slideme.css({'height': 'auto'});
		    this.resize = null;
		}
		if (this.settings.autoslide) {
		    this.removeAutoslide();
		}
	    },
            
            getBrowser : function () {
                var useragent = navigator.userAgent;
                switch (true){
                    case useragent.lastIndexOf('MSIE') > 0:
                        return 'MSIE';
                        break;
                    case useragent.lastIndexOf('Chrome') > 0:
                        return 'Chrome';
                        break;
                    case useragent.lastIndexOf('Firefox') > 0:
                        return 'Firefox';
                        break;
                    case useragent.lastIndexOf('Safari') > 0:
                        return 'Safari';
                        break;
                    default :
                        return '';
                }
            },

	    getNext : function (direction) {
		var next = this.counters.current + direction;
		switch (true) {
		    case (next > this.counters.total && this.settings.loop):
			next = 0;
			break;
		    case (next < 0 && this.settings.loop):
			next = this.counters.total;
			break;
		    case (next > this.counters.total && !this.settings.loop || next < 0 && !this.settings.loop):
			next = this.counters.current;
			break;
		}
		return next;
	    },

	    getNextById : function (id) {
		var next = this.dom.slideme.find(id).index();
		return next;
	    },

	    getReadyForNewAnimation : function () {
		this.counters.current = this.counters.next;
		this.dom.slideme.children().removeClass('current next after before');
		this.setCurrent();
		this.setSibling();
		if (!this.settings.loop && this.settings.arrows) {
		    this.checkArrows();
		}
		if (this.settings.pagination) {
		    this.setPaginationCurrent(this.counters.current);
		}
		if (this.settings.onEndCallback) {
		    this.settings.onEndCallback({ 'instance': this.dom.slideme_container, 'index': this.counters.current });
		}
		if (this.settings.autoslide && !this.pause) {
		    this.setAutoslide();
		}
		this.working = false;
	    },

	    getTotalSlides : function () {
		return this.dom.slideme.children().length-1;
	    },

	    inquire : function () {
		if(this.settings.onInquire){
		    this.settings.onInquire({ 'instance': this.dom.slideme_container, 'index': this.counters.current, 'version': version });
		} else {
		    console.info('Please, take notice that onInquire callback function must exist.');
		}
	    },

	    jumpTo : function (index) {
		this.counters.next = index;
		this.getReadyForNewAnimation();
	    },

	    jumpToId : function (id) {
		var index = this.getNextById(id);
		this.counters.next = index;
		this.getReadyForNewAnimation();
	    },

	    onAnimationEnded : function (e) {
		if (this.settings.css3) {
		    this.dom.current.off('otransitionend webkitTransitionEnd transitionend');
		    this.dom.slideme.removeClass(this.animation);
		} else {
		    this.dom.slideme.children().removeAttr('style');
		}
		this.getReadyForNewAnimation();
	    },
	    
	    onOrientationchange : function () {
		this.scrollTo(this.counters.current);
	    },

	    onResize : function () {
		var width = this.settings.resizable.width,
		height = this.settings.resizable.height,
		h = Math.round(height * this.dom.slideme.width() / width);
		this.dom.slideme.css({ 'height': h });
	    },

	    onTouchend : function(e) {
		if (!this.working) {
		    var x = e.currentTarget.scrollLeft;
		    var w = Math.round(this.dom.current.width()/1.3);
		    var after = Math.abs(this.dom.after.offset().left+x);
		    var before = Math.abs(this.dom.before.position().left+x);
		    var current = Math.abs(this.dom.current.position().left+x);
		    if(x >= after-w && (this.settings.loop || !this.settings.loop && this.counters.current !== this.counters.total)){
			this.counters.next = this.getNext(1);
			x = after;
		    } else if (x <= before+w && (this.settings.loop || !this.settings.loop && this.counters.current !== 0)) {
			this.counters.next = this.getNext(-1);
			x = before;
		    } else {
			x = current;
		    }
		    this.working = true;
		    this.snapTo(x);
		}
	    },

	    onSnapEnd : function(e) {
		this.dom.slideme.removeClass('snapping');
		this.getReadyForNewAnimation();
	    },
	    
	    onWindowScroll : function(e) {
		if(this.working){
		    this.onAnimationEnded();
		    e.preventDefault();
		}
	    },

	    play : function (e) {
		this.pause = false;
		this.setAutoslide();
	    },

	    playTo : function (e) {
		var index = typeof e.data != "undefined" ? e.data.index : e;
		if (!this.working && index !== this.counters.current && index <= this.counters.total) {
		    var direction = index > this.counters.current ? 1 : -1;
		    direction > 0 ? this.setAfter(index) : this.setBefore(index);
		    this.counters.next = index;
		    this.settings.nativeTouchScroll ? this.scrollTo(index): this.animate({ 'direction': direction });;
		}
	    },

	    playToId : function (id) {
		var index = this.getNextById(id);
		this.playTo(index);
	    },

	    removeAutoslide :  function () {
		clearTimeout(this.timer);
	    },
	    
	    scrollTo : function (e) {
		var index = typeof e.data != "undefined" ? e.data.index : e;
		var x = this.dom.slideme.children().eq(index).position().left+this.dom.slideme.scrollLeft();
		this.counters.next = index;
		this.snapTo(x);
	    },

	    setAfter : function (index) {
		var afterSlide = this.dom.slideme.children().removeClass('after before').eq(index).addClass('after');
		afterSlide.redraw();
	    },

	    setAutoslide : function () {
		if (this.settings.loop || !this.settings.loop && ((this.counters.current !== this.counters.total && this.settings.direction === 1) || (this.counters.current !== 0 && this.settings.direction === -1))) {
		    var direction = this.settings.direction,
		    interval = this.settings.interval,
		    event = this.animate;
		    this.counters.next = this.getNext(direction);
		    this.timer = setTimeout(function () {
			event({ 'direction': direction });
		    }, interval);
		}
	    },

	    setBefore : function (index) {
		var beforeSlide = this.dom.slideme.children().removeClass('after before').eq(index).addClass('before');
		beforeSlide.redraw();
	    },

	    setCurrent : function () {
		this.dom.current = this.dom.slideme.children().eq(this.counters.current).addClass('current');
		this.dom.current.redraw();
	    },

	    setNext : function () {
		this.dom.next = this.dom.slideme.children().eq(this.counters.next).addClass('next');
		this.dom.next.redraw();
	    },

	    setPaginationCurrent : function (index) {
		this.dom.slideme_pagination.find('li').removeClass('current');
		this.dom.slideme_pagination.find('ol.numbers li').eq(index).addClass('current');
		this.dom.slideme_pagination.find('ol.thumbs li').eq(index).addClass('current');
	    },

	    setSibling : function () {
		var after = this.counters.current + 1 > this.counters.total ? 0 : this.counters.current + 1;
		var before = this.counters.current - 1;
		this.dom.after = this.dom.slideme.children().eq(after).addClass('after');
		this.dom.before = this.dom.slideme.children().eq(before).addClass('before');
	    },
	    
	    setSwipe : function () {
		this.dom.slideme.on('touchstart', this.setSwipeStart);
		this.dom.slideme.on('touchmove', this.setSwipeMove);
		this.dom.slideme.on('touchend', this.setSwipeEnd);
                if(this.browser === "Safari" && this.settings.css3){
                    $(window).on('scroll', this.onWindowScroll);
                }
	    },
	    
	    setSwipeEnd : function (e) {
		if(!this.working){
		    this.swipeTo();
		    //e.preventDefault();
		}
	    },
	    
	    setSwipeMove : function (e) {
		var touch = e.originalEvent.touches[0];
		if(!this.working && touch){
		    this.swipe.deltaX = this.swipe.startX-touch.pageX;
		    this.swipe.deltaY = this.swipe.startY-touch.pageY;
		    if (Math.abs(this.swipe.deltaX) > 30){
			e.preventDefault();
		    }
		}
	    },
	    
	    setSwipeStart : function (e) {
		var touch = e.originalEvent.touches[0];
		if(!this.working && touch){
		    this.swipe.deltaX = 0;
		    this.swipe.deltaY = 0;
		    this.swipe.startX = touch.pageX;
		    this.swipe.startY = touch.pageY;
		}
	    },

	    snapTo :  function (x) {
		var speed = Math.round(350 + Math.abs((this.counters.next-this.counters.current)*10));
		this.dom.slideme.addClass('snapping').redraw();
		this.dom.slideme.stop(true, false).animate({
		    scrollLeft: x
		}, speed, this.onSnapEnd);
	    },

	    stop :  function () {
		this.pause = true;
		this.removeAutoslide();
	    },
	    
	    swipeSupport : function () {
		return (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
	    },
	    
	    swipeTo : function (x, y) {
		if(Math.abs(this.swipe.deltaX)>30 && Math.abs(this.swipe.deltaY)<75){
		    var direction = this.swipe.deltaX > 0 ? 1 : -1;
		    this.counters.next = this.getNext(direction);
		    
		    this.animate({ 'direction': direction });
		}
	    },
	    
	    update : function () {
		this.counters.total = this.getTotalSlides();
		if (this.settings.pagination) {
		    this.dom.slideme_pagination.remove();
		    this.createPagination();
		}
	    }
	    
	});

        return Plugin;

    })();

    $.fn[ pluginName ] = function (options) {
        return this.each(function () {
            if (!this.instance) {
                this.instance = new Plugin(options || {});
                this.instance.init(this);
            } else {
                switch (options) {
                    case "destroy":
                        this.instance.destroy();
                        delete this.instance;
                        break;
                    default:
                        this.instance[options](arguments[1]);
                        break;
                }
            }
            return this;
        }, arguments);
    };

    $.fn.redraw = function () {
        $(this).each(function () {
            var redraw = this.offsetHeight;
        });
    };

})(jQuery);