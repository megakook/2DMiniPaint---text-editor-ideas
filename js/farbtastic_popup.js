// $Id: farbtastic.js,v 1.2 2007/01/08 22:53:01 unconed Exp $
// Farbtastic 1.2

jQuery.fn.pfarbtastic = function (callback) {
  $.pfarbtastic(this, callback);
  return this;
};

jQuery.pfarbtastic = function (container, callback) {
  var container = $(container).get(0);
  return container.pfarbtastic || (container.pfarbtastic = new jQuery._pfarbtastic(container, callback));
}

jQuery._pfarbtastic = function (container, callback) {
  // Store farbtastic object
  var pfb = this;

  // Insert markup
  $(container).html('<div class="popup-farbtastic"><div class="popup-color"></div><div class="popup-wheel"></div><div class="popup-overlay"></div><div class="popup-h-marker popup-marker"></div><div class="popup-sl-marker popup-marker"></div></div>');
  var e = $('.popup-farbtastic', container);
  pfb.wheel = $('.popup-wheel', container).get(0);
  // Dimensions
  pfb.radius = 223;
  pfb.square = 220;
  pfb.width = 500;

  // Fix background PNGs in IE6
  if (navigator.appVersion.match(/MSIE [0-6]\./)) {
    $('*', e).each(function () {
      if (this.currentStyle.backgroundImage != 'none') {
        var image = this.currentStyle.backgroundImage;
        image = this.currentStyle.backgroundImage.substring(5, image.length - 2);
        $(this).css({
          'backgroundImage': 'none',
          'filter': "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + image + "')"
        });
      }
    });
  }

  /**
   * Link to the given element(s) or callback.
   */
  pfb.linkTo = function (callback) {
    // Unbind previous nodes
    if (typeof pfb.callback == 'object') {
      $(pfb.callback).unbind('keyup', pfb.updateValue);
    }

    // Reset color
    pfb.color = null;

    // Bind callback or elements
    if (typeof callback == 'function') {
      pfb.callback = callback;
    }
    else if (typeof callback == 'object' || typeof callback == 'string') {
      pfb.callback = $(callback);
      pfb.callback.bind('keyup', pfb.updateValue);
      if (pfb.callback.get(0).value) {
        pfb.setColor(pfb.callback.get(0).value);
      }
    }
    return this;
  }
  pfb.updateValue = function (event) {
    if (this.value && this.value != pfb.color) {
      pfb.setColor(this.value);
    }
  }

  /**
   * Change color with HTML syntax #123456
   */
  pfb.setColor = function (color) {
    var unpack = pfb.unpack(color);
    if (pfb.color != color && unpack) {
      pfb.color = color;
      pfb.rgb = unpack;
      pfb.hsl = pfb.RGBToHSL(pfb.rgb);
      pfb.updateDisplay();
    }
    return this;
  }

  /**
   * Change color with HSL triplet [0..1, 0..1, 0..1]
   */
  pfb.setHSL = function (hsl) {
    pfb.hsl = hsl;
    pfb.rgb = pfb.HSLToRGB(hsl);
    pfb.color = pfb.pack(pfb.rgb);
    pfb.updateDisplay();
    return this;
  }

  /////////////////////////////////////////////////////

  /**
   * Retrieve the coordinates of the given event relative to the center
   * of the widget.
   */
  pfb.widgetCoords = function (event) {
    var x, y;
    var el = event.target || event.srcElement;
    var reference = pfb.wheel;

    if (typeof event.offsetX != 'undefined') {
      // Use offset coordinates and find common offsetParent
      var pos = { x: event.offsetX, y: event.offsetY };

      // Send the coordinates upwards through the offsetParent chain.
      var e = el;
      while (e) {
        e.mouseX = pos.x;
        e.mouseY = pos.y;
        pos.x += e.offsetLeft;
        pos.y += e.offsetTop;
        e = e.offsetParent;
      }

      // Look for the coordinates starting from the wheel widget.
      var e = reference;
      var offset = { x: 0, y: 0 }
      while (e) {
        if (typeof e.mouseX != 'undefined') {
          x = e.mouseX - offset.x;
          y = e.mouseY - offset.y;
          break;
        }
        offset.x += e.offsetLeft;
        offset.y += e.offsetTop;
        e = e.offsetParent;
      }

      // Reset stored coordinates
      e = el;
      while (e) {
        e.mouseX = undefined;
        e.mouseY = undefined;
        e = e.offsetParent;
      }
    }
    else {
      // Use absolute coordinates
      var pos = pfb.absolutePosition(reference);
      x = (event.pageX || 0*(event.clientX + $('html').get(0).scrollLeft)) - pos.x;
      y = (event.pageY || 0*(event.clientY + $('html').get(0).scrollTop)) - pos.y;
    }
    // Subtract distance to middle
    return { x: x - pfb.width / 2, y: y - pfb.width / 2 };
  }

  /**
   * Mousedown handler
   */
  pfb.mousedown = function (event) {
    // Capture mouse
    if (!document.dragging) {
      $(document).bind('mousemove', pfb.mousemove).bind('mouseup', pfb.mouseup);
      document.dragging = true;
    }

    // Check which area is being dragged
    var pos = pfb.widgetCoords(event);
    pfb.circleDrag = Math.max(Math.abs(pos.x), Math.abs(pos.y)) * 2 > pfb.square;

    // Process
    pfb.mousemove(event);
    return false;
  }

  /**
   * Mousemove handler
   */
  pfb.mousemove = function (event) {
    // Get coordinates relative to color picker center
    var pos = pfb.widgetCoords(event);

    // Set new HSL parameters
    if (pfb.circleDrag) {
      var hue = Math.atan2(pos.x, -pos.y) / 6.28;
      if (hue < 0) hue += 1;
      pfb.setHSL([hue, pfb.hsl[1], pfb.hsl[2]]);
    }
    else {
      var sat = Math.max(0, Math.min(1, -(pos.x / pfb.square) + .5));
      var lum = Math.max(0, Math.min(1, -(pos.y / pfb.square) + .5));
      pfb.setHSL([pfb.hsl[0], sat, lum]);
    }
    return false;
  }

  /**
   * Mouseup handler
   */
  pfb.mouseup = function () {
    // Uncapture mouse
    $(document).unbind('mousemove', pfb.mousemove);
    $(document).unbind('mouseup', pfb.mouseup);
    document.dragging = false;
  }

  /**
   * Update the markers and styles
   */
  pfb.updateDisplay = function () {
    // Markers
    var angle = pfb.hsl[0] * 6.28;
    $('.popup-h-marker', e).css({
      left: Math.round(Math.sin(angle) * pfb.radius + pfb.width / 2) + 'px',
      top: Math.round(-Math.cos(angle) * pfb.radius + pfb.width / 2) + 'px'
    });

    $('.popup-sl-marker', e).css({
      left: Math.round(pfb.square * (.5 - pfb.hsl[1]) + pfb.width / 2) + 'px',
      top: Math.round(pfb.square * (.5 - pfb.hsl[2]) + pfb.width / 2) + 'px'
    });

    // Saturation/Luminance gradient
    $('.popup-color', e).css('backgroundColor', pfb.pack(pfb.HSLToRGB([pfb.hsl[0], 1, 0.5])));

    // Linked elements or callback
    if (typeof pfb.callback == 'object') {
      // Set background/foreground color
      $(pfb.callback).css({
        backgroundColor: pfb.color,
        color: pfb.hsl[2] > 0.5 ? '#000' : '#fff'
      });

      // Change linked value
      $(pfb.callback).each(function() {
        if (this.value && this.value != pfb.color) {
          this.value = pfb.color;
        }
      });
    }
    else if (typeof pfb.callback == 'function') {
      pfb.callback.call(pfb, pfb.color);
    }
  }

  /**
   * Get absolute position of element
   */
  pfb.absolutePosition = function (el) {
    var r = { x: el.offsetLeft, y: el.offsetTop };
    // Resolve relative to offsetParent
    if (el.offsetParent) {
      var tmp = pfb.absolutePosition(el.offsetParent);
      r.x += tmp.x;
      r.y += tmp.y;
    }
    return r;
  };

  /* Various color utility functions */
  pfb.pack = function (rgb) {
    var r = Math.round(rgb[0] * 255);
    var g = Math.round(rgb[1] * 255);
    var b = Math.round(rgb[2] * 255);
    return '#' + (r < 16 ? '0' : '') + r.toString(16) +
           (g < 16 ? '0' : '') + g.toString(16) +
           (b < 16 ? '0' : '') + b.toString(16);
  }

  pfb.unpack = function (color) {
    if (color.length == 7) {
      return [parseInt('0x' + color.substring(1, 3)) / 255,
        parseInt('0x' + color.substring(3, 5)) / 255,
        parseInt('0x' + color.substring(5, 7)) / 255];
    }
    else if (color.length == 4) {
      return [parseInt('0x' + color.substring(1, 2)) / 15,
        parseInt('0x' + color.substring(2, 3)) / 15,
        parseInt('0x' + color.substring(3, 4)) / 15];
    }
  }

  pfb.HSLToRGB = function (hsl) {
    var m1, m2, r, g, b;
    var h = hsl[0], s = hsl[1], l = hsl[2];
    m2 = (l <= 0.5) ? l * (s + 1) : l + s - l*s;
    m1 = l * 2 - m2;
    return [this.hueToRGB(m1, m2, h+0.33333),
        this.hueToRGB(m1, m2, h),
        this.hueToRGB(m1, m2, h-0.33333)];
  }

  pfb.hueToRGB = function (m1, m2, h) {
    h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h);
    if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
    if (h * 2 < 1) return m2;
    if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
    return m1;
  }

  pfb.RGBToHSL = function (rgb) {
    var min, max, delta, h, s, l;
    var r = rgb[0], g = rgb[1], b = rgb[2];
    min = Math.min(r, Math.min(g, b));
    max = Math.max(r, Math.max(g, b));
    delta = max - min;
    l = (min + max) / 2;
    s = 0;
    if (l > 0 && l < 1) {
      s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
    }
    h = 0;
    if (delta > 0) {
      if (max == r && max != g) h += (g - b) / delta;
      if (max == g && max != b) h += (2 + (b - r) / delta);
      if (max == b && max != r) h += (4 + (r - g) / delta);
      h /= 6;
    }
    return [h, s, l];
  }

  // Install mousedown handler (the others are set on the document on-demand)
  $('*', e).mousedown(pfb.mousedown);

    // Init color
  pfb.setColor('#000000');

  // Set linked elements/callback
  if (callback) {
    pfb.linkTo(callback);
  }
}