/*! NProgress (c) 2013, Rico Sta. Cruz
 *  http://ricostacruz.com/nprogress */

;(function($) {
  var NProgress = function(el, options) {
    var _this = this;
    this.el = el;
    this.options = options;

    /**
     * Waits for all supplied jQuery promises and
     * increases the progress as the promises resolve.
     * 
     * @param $promise jQUery Promise
     */
    (function(NProgress) {
      var initial = 0, current = 0;
      
      NProgress.promise = function($promise) {
        if (!$promise || $promise.state() == "resolved") {
          return this;
        }
        
        if (current == 0) {
          NProgress.start();
        }
        
        initial++;
        current++;
        
        $promise.always(function() {
          current--;
          if (current == 0) {
              initial = 0;
              NProgress.done();
          } else {
              NProgress.set((initial - current) / initial);
          }
        });
        
        return NProgress;
      };
      
    })(this);

    return this;
  };

  /**
   * Updates configuration.
   *
   *     NProgress.configure({
   *       minimum: 0.1
   *     });
   */
  NProgress.prototype.configure = function(options) {
    $.extend(this.options, options);
    return this;
  };

  /**
   * Last number.
   */

  NProgress.prototype.status = null;

  /**
   * Sets the progress bar status, where `n` is a number from `0.0` to `1.0`.
   *
   *     NProgress.set(0.4);
   *     NProgress.set(1.0);
   */

  NProgress.prototype.set = function(n) {
    var _this = this;
    var started = this.isStarted();

    n = clamp(n, this.options.minimum, 1);
    this.status = (n === 1 ? null : n);

    var $progress = this.render(!started),
        $bar      = $progress.find('[role="bar"]'),
        speed     = this.options.speed,
        ease      = this.options.easing;

    $progress[0].offsetWidth; /* Repaint */

    $progress.queue(function(next) {
      // Set positionUsing if it hasn't already been set
      if (_this.options.positionUsing === '') _this.options.positionUsing = NProgress.getPositioningCSS();

      // Add transition
      $bar.css(barPositionCSS.call(_this, n, speed, ease));

      if (n === 1) {
        // Fade out
        $progress.css({ transition: 'none', opacity: 1 });
        $progress[0].offsetWidth; /* Repaint */

        setTimeout(function() {
          $progress.css({ transition: 'all '+speed+'ms linear', opacity: 0 });
          setTimeout(function() {
            _this.remove();
            next();
          }, speed);
        }, speed);
      } else {
        setTimeout(next, speed);
      }
    });

    return this;
  };

  NProgress.prototype.isStarted = function() {
    return typeof this.status === 'number';
  };

  /**
   * Shows the progress bar.
   * This is the same as setting the status to 0%, except that it doesn't go backwards.
   *
   *     NProgress.start();
   *
   */
  NProgress.prototype.start = function() {
    if (!this.status) this.set(0);
    var _this = this;

    var work = function() {
      setTimeout(function() {
        if (!_this.status) return;
        _this.trickle();
        work();
      }, _this.options.trickleSpeed);
    };

    if (this.options.trickle) work();

    return this;
  };

  /**
   * Hides the progress bar.
   * This is the *sort of* the same as setting the status to 100%, with the
   * difference being `done()` makes some placebo effect of some realistic motion.
   *
   *     NProgress.done();
   *
   * If `true` is passed, it will show the progress bar even if its hidden.
   *
   *     NProgress.done(true);
   */

  NProgress.prototype.done = function(force) {
    if (!force && !this.status) return this;

    return this.inc(0.3 + 0.5 * Math.random()).set(1);
  };

  /**
   * Increments by a random amount.
   */

  NProgress.prototype.inc = function(amount) {
    var n = this.status;

    if (!n) {
      return this.start();
    } else {
      if (typeof amount !== 'number') {
        amount = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
      }

      n = clamp(n + amount, 0, 0.994);
      return this.set(n);
    }
  };

  NProgress.prototype.trickle = function() {
    return this.inc(Math.random() * this.options.trickleRate);
  };

  /**
   * (Internal) renders the progress bar markup based on the `template`
   * setting.
   */

  NProgress.prototype.render = function(fromStart) {
    if (this.isRendered()) return $(".nprogress", this.el);
    $(this.el).addClass('nprogress-busy');

    var $el = $("<div class='nprogress'>")
      .html(this.options.template);

    var perc = fromStart ? '-100' : toBarPerc(this.status || 0);

    $el.find('[role="bar"]').css({
      transition: 'all 0 linear',
      transform: 'translate3d('+perc+'%,0,0)'
    });

    if (!this.options.showSpinner)
      $el.find('[role="spinner"]').remove();

    $el.appendTo(this.el);

    return $el;
  };

  /**
   * Removes the element. Opposite of render().
   */

  NProgress.prototype.remove = function() {
    $('.nprogress', this.el).remove();
    $(this.el).removeClass('nprogress-busy');
  };

  /**
   * Checks if the progress bar is rendered.
   */

  NProgress.prototype.isRendered = function() {
    return ($('.nprogress', this.el).length > 0);
  };

  /**
   * Determine which positioning CSS rule to use.
   */

  NProgress.getPositioningCSS = function() {
    // Sniff on document.body.style
    var bodyStyle = document.body.style;

    // Sniff prefixes
    var vendorPrefix = ('WebkitTransform' in bodyStyle) ? 'Webkit' :
                       ('MozTransform' in bodyStyle) ? 'Moz' :
                       ('msTransform' in bodyStyle) ? 'ms' :
                       ('OTransform' in bodyStyle) ? 'O' : '';

    if (vendorPrefix + 'Perspective' in bodyStyle) {
      // Modern browsers with 3D support, e.g. Webkit, IE10
      return 'translate3d';
    } else if (vendorPrefix + 'Transform' in bodyStyle) {
      // Browsers without 3D support, e.g. IE9
      return 'translate';
    } else {
      // Browsers without translate() support, e.g. IE7-8
      return 'margin';
    }
  };

  NProgress.version = '0.1.2';

  NProgress.defaults = {
    el: document.body,
    minimum: 0.08,
    easing: 'ease',
    positionUsing: '',
    speed: 200,
    trickle: true,
    trickleRate: 0.02,
    trickleSpeed: 800,
    showSpinner: true,
    template: '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
  };

  /**
   * Helpers
   */

  function clamp(n, min, max) {
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  /**
   * (Internal) converts a percentage (`0..1`) to a bar translateX
   * percentage (`-100%..0%`).
   */

  function toBarPerc(n) {
    return (-1 + n) * 100;
  }


  /**
   * (Internal) returns the correct CSS for changing the bar's
   * position given an n percentage, and speed and ease from Settings
   */

  function barPositionCSS(n, speed, ease) {
    var barCSS;

    if (this.options.positionUsing === 'translate3d') {
      barCSS = { transform: 'translate3d('+toBarPerc(n)+'%,0,0)' };
    } else if (this.options.positionUsing === 'translate') {
      barCSS = { transform: 'translate('+toBarPerc(n)+'%,0)' };
    } else {
      barCSS = { 'margin-left': toBarPerc(n)+'%' };
    }

    barCSS.transition = 'all '+speed+'ms '+ease;

    return barCSS;
  }

  $.fn.NProgress = function(options) {
    if(!$(this).data('nprogress')) {
      var Settings = $.extend( {}, NProgress.defaults, options );
      $(this).data('nprogress', new NProgress(this, Settings));
    } 
    return $(this).data('nprogress');
  };

}(jQuery))

