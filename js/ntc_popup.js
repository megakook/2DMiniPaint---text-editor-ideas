$(document).ready(function() {
  pntc_main.init();
});

var pntc_main = {

  pfb: null,
  fb: null,

  init: function() {
    srtnm = ntc.names;
    srtnm.sort(pntc_main.nameSort);
    clrop = new Array();

    for(i = 0; i < srtnm.length; i++)
    {
      clr = srtnm[i][0];
      rgb = ntc.rgb("#" + clr);
      alt = ((rgb[0] + rgb[1] + rgb[2])/3 < 128);
      clrop.push("<option value='" + clr + "' " + (alt ? "class='w'" : "") + "style='background:#" + clr + "'>" + srtnm[i][1] + "</option>");
    }

    $("#popup-colorpick").html("<select id=\"popup-colorop\" class=\"popup-colorop\"><option value=\"\">Select a Color:</option>" + clrop.join() + "</select>");

    pntc_main.pfb = $.pfarbtastic('#popup-picker', pntc_main.setColor);
    pntc_main.fb = $.farbtastic('#picker', pntc_main.setColor);
    $("#popup-colorinp").change(pntc_main.inpColor);
    $("#popup-colorinp").keyup(pntc_main.inpColor);
    $("#popup-colorinp").keydown(pntc_main.inpColor);
    $("#popup-colorop").change(pntc_main.inpColorList);
    pntc_main.setWheel((window.location.hash.length == 7 ? window.location.hash : "#6195ED"));
  },

  inpColor: function() {
    var clr =  $("#popup-colorinp").get(0).value;
    if(clr.substring(0, 1) == "#" && clr.length == 7)
      return pntc_main.setWheel(clr);
    if(clr.substring(0, 1) != "#" && clr.length == 6)
      return pntc_main.setWheel("#" + clr);
  },

  inpColorList: function() {
    if($("#popup-colorop").get(0).value != "")
      return pntc_main.setWheel("#" + $("#popup-colorop").get(0).value);
  },

  nameSort: function(a, b) {
    return (a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0));
  },

  setColor: function(clr) {
    GUI.set_color(document.getElementById("popup-colorbox"));
    $("#popup-colorbox").css({backgroundColor: clr});
    var rgb = ntc.rgb(clr);
    $("#popup-colorinp").get(0).value = clr.toUpperCase();

    $("#popup-colorbox").css({backgroundColor: clr});

    n_match = ntc.name(clr);
    $("#popup-colorname").html(n_match[1]);

    $("#colorbox").css({backgroundColor: clr});
    $("#colorinp").get(0).value = clr.toUpperCase();
    $("#colorname").html(n_match[1]);
    pntc_main.fb.setColor(clr);

    window.location.hash = clr.toUpperCase();
  },

  setWheel: function(clr) {
    pntc_main.pfb.setColor(clr);
  }

}