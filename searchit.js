var base = "https://bugzilla.mozilla.org";

var openStatus = ["REOPENED", "NEW", "ASSIGNED", "UNCONFIRMED"];
var closedStatus = ["RESOLVED", "VERIFIED"];

function statusUrl(statuses) {
  var url = "";
  statuses.forEach(function(status) {
    url += "&bug_status=" + status;
  })
  return url;
};

$(document).ready(function() {
  var bugzilla = bz.createClient();

  var cachedConfig = localStorage["searchit-config"];
  if (cachedConfig) {
    populateAutocomplete(JSON.parse(cachedConfig));
  }

  bugzilla.getConfiguration({
     flags: 0,
     cached_ok: 1
  },
  function(err, config) {
    if (err) {
      throw "Error getting Bugzilla configuration: " + err;
    }

    if (config) {
      localStorage["searchit-config"] = JSON.stringify(config);
      if (!cachedConfig) {
        populateAutocomplete(config);
      }
    }
  });

  $("#search-status").click(function(event) {
     var status = $(this).data("status");
     if (status == "open") {
        status = "closed";
     }
     else if (status == "closed") {
        status = "all";
     }
     else if (status == "all") {
        status = "open";
     }

     $(this).data("status", status);
     $(this).text(status);
  });

  $("#search-form").submit(function(event) {
    event.preventDefault();

    var url = base + "/buglist.cgi?" + "query_format=advanced"
              + "&order=changeddate%20DESC";

    var summary = $("#search-summary").val();
    if (summary) {
       url += "&short_desc_type=allwordssubstr&short_desc="
              + encodeURIComponent(summary)
              + "&longdesc_type=allwordssubstr&longdesc="
              + encodeURIComponent(summary);
    }

    var comp = $("#search-component").val();
    if (comp) {
       var yunodestructuring = toComponent(comp);
       url += "&product=" + encodeURIComponent(yunodestructuring[0])
              + "&component=" + encodeURIComponent(yunodestructuring[1]);
    }
    console.log(url);

    var status = $("#search-status").data("status");
    if (status == "open") {
       url += statusUrl(openStatus);
    }
    else if (status == "closed") {
       url += statusUrl(closedStatus);
    }
    window.open(url);
  });
});


function populateAutocomplete(config) {
  var components = [];
  for (product in config.product) {
    var comps = config.product[product].component;
    for (component in comps) {
       components.push({
          product: product,
          component: component,
          string: componentName({product: product, component: component})
       });
    }
  }

  var input = $(".component-search");
  input.autocomplete({
    list: components,
    minCharacters: 2,
    timeout: 200,
    threshold: 200,
    adjustWidth: 360,
    template: function(item) {
      return "<li value='" + item.string + "'><span class='product'>"
         + item.product + "</span>" + "<span class='component'>"
         + item.component + "</span></li>";
    },
    matcher: function(typed) {
      return typed;
    },
    match: function(item, matcher) {
      var words = matcher.split(/\s+/);
      return _(words).all(function(word) {
         return item.string.toLowerCase().indexOf(word.toLowerCase()) >= 0;
      });
    },
    insertText: function(item) {
      return item.string;
    }
 });
}

function componentName(comp) {
  return comp.product + "/" + comp.component;
}

function toComponent (name) {
  return name.split("/");
}
