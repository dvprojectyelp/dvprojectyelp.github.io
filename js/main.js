var width = 900,
    height = 500,
    centered;
var projection = d3.geo.albersUsa()
.scale(1070)
.translate([width/2,height/2]);


var path = d3.geo.path()
.projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("class","float_map")
    .attr("width",width)
.attr("height",height);

svg.append("rect")
.attr("class","background")
.attr("width",width)
.attr("height",height)
.on("click",clicked);

var g = svg.append("g");
var emotDoc = " ";

var states_info = [];

d3.tsv('data/states.tsv', function(data){
    states_info.push(data);
});

getinfo = function(id){
    return states_info[0].filter(function(z){return String(z.id) == id});
};
var business_data = [];
d3.json('data/categorized_checkins_with_attributes.json', function (error,objs) {
   business_data = objs;
});
var states_id = [];
d3.json('data/state_data.json',function (error,states){
    $.each(states, function(ind,val){
        states_id.push(val.id);
    });
});

d3.json("data/us.json",function (error,us) {
   if(error) throw error;
    var all_states = topojson.feature(us, us.objects.states).features;
    all_states.forEach(function(d){d.info = getinfo(d.id)[0]});
    var all_states = all_states.filter(function(d){return d.info != undefined});
    all_states.forEach(function(d){d.state = d.info.state});

    g.append("g")
        .attr("id","states")
        .selectAll("path")
        .data(topojson.feature(us,us.objects.states).features)
        .enter().append("path")
        .attr("d",path)
        .on("click",clicked)
        .attr("style",function (d) {
            if(states_id.indexOf(d.id)!=-1){
               this.setAttribute('class','selected_state')
            }

        });


        g.append("path")
            .datum(topojson.mesh(us, us.objects.states, function (a, b) {
                return a !== b;
            }))
            .attr("id", "state-borders")
            .attr("d", path)
            .attr('class','states');
        g.selectAll('.city')
            .data(topojson.feature(us, us.objects.states).features)
            .enter()
            .append('image')
            .attr('d', path)
            .attr('class', function (d) {
                return 'state'
            })
            .attr('r', 1)
            .each(function (d) {
                var lon = path.centroid(d);
                d3.select(this)
                    .attr('transform', function (d) {
                        return "translate(" + lon + ")";
                    })
            });

  d3.json('data/state_data.json',function (error,states) {
  d3.selectAll('.state')
        .attr('xlink:href', function(d) {
            var img_url = '';
            $.each(states,function(state,state_data) {
                if (getinfo(d.id)[0].state==state_data.name){
                    img_url = 'img/'+state_data.top_cuisine+'.svg';
                }
            });
            return(img_url);
        })
        .attr('height', function(d) {
            return '19'
        })
        .attr('width', '19')
        .attr('x', '-14.5')
        .attr('y', '-9.5')
        .attr('class', function(d) {
            return 'state_image'
        });
  });
    d3.select('.state_image')
        .attr('height', 40)
        .attr('width', 40)
        .attr('y', -20);
});

function add_emoticon(cusine,pos,neg) {
    var d = d3.select("#cusine").append("div").attr('class','row custom_class');
    add_pos(cusine,pos);
    add_neg(cusine,neg);
}
function add_pos(id,pos) {
    $("#cusine").append("<span style='font-size:18px'>"+id+"</span><br>");
    for(var i=0;i<pos;i++){
        var emotDoc = d3.select("#cusine").append("img").attr("src","img/happy.jpg").attr("class","happy_img");
    }
}
function add_neg(id,neg) {
    for(var i=0;i<neg;i++){
        var emotDoc = d3.select("#cusine").append("img").attr("src","img/sad.jpg").attr("class","neg_class");
    }
}

function resto_info(data){
    d3.select('#rest_info').html('');
    html_str  = '';
    var html_str_1 = '';
    var html_str_inside = '';
    $.each(data.top_5_cuisines,function(ind,obj){
        html_str += '<div class="col-md-6 col-sm-6 portfolio-item"><div class="portfolio-caption card" style="display: grid;box-shadow: 2px 5px;color: #777;"><h4 class="card-header" style="background-color: #fed136;">'+obj.name+'</h4><div class="card-body">';
        //html_str_1 +='<div class="portfolio-item"><div class="portfolio-caption card" style="display: grid;box-shadow: 2px 5px;color: #777;"><h4 class="card-header" style="background-color: #fed136;">'+obj.name+'</h4><div class="card-body">';
        var count = 0;
        $.each(obj.top_5_restaurants,function (ind,resto) {
            {
                count +=1;
                $.each(business_data,function (ind,val) {
                    if (val.hasOwnProperty(resto)) {
                        bus_id = resto;
                        var bus_name = val[resto].name;
                        html_str += '<a href="javascript:delay(\'#radial_chart_div\')"><h5 onclick="draw(\''+resto+'\',\''+bus_name+'\')">'+val[resto].name+'</h5></a>';
                        //html_str_1 += '<a href="javascript:delay(\'#radial_chart_div\')"><h5 onclick="draw(\''+resto+'\',\''+bus_name+'\')">'+val[resto].name+'</h5></a>';
                        //html_str += "<a href=\"javascript:delay(\\'#radial_chart_div\\')\"><h5 onclick=\"draw(\\''+resto+'\\',\\''+bus_name+'\\')\">'+val[resto].name+'</h5></a>"
                    }
                });

            }
        });
        // if (count ==1){
        //     html_str =  html_str_1  ;
        // }
        if(count<5){
            for(var i=0;i<5-count;i++){
                html_str+='<a><h5></h5></a>'
            }
        }
        html_str +='</div></div></div>'
    });

    const tableDiv = d3.select('#rest_info')
                .append('div').html(html_str);

}

// Draw Radial Graph
function draw(bus_id,bus_name) {
    var attributes = {};
    var margin = 0,
        width = 600,
        height = 600,
        maxBarHeight = height / 2 - (margin + 70);

    var innerRadius = 0.1 * maxBarHeight; // innermost circle
    $("#radial_chart_title").html(bus_name);

    $("#radial_chart").html("");
    var svg = d3.select('#radial_chart')
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr('id','radial_svg')
        .append("g")
        .attr("class", "chart")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var defs = svg.append("defs");

    var gradients = defs
        .append("linearGradient")
        .attr("id", "gradient-chart-area")
        .attr("x1", "50%")
        .attr("y1", "0%")
        .attr("x2", "50%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    gradients.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#EDF0F0")
        .attr("stop-opacity", 1);

    gradients.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#ACB7BE")
        .attr("stop-opacity", 1);

    gradients = defs
        .append("linearGradient")
        .attr("id", "gradient-questions")
        .attr("x1", "50%")
        .attr("y1", "0%")
        .attr("x2", "50%")
        .attr("y2", "100%")
        .attr("spreadMethod", "pad");

    gradients.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#F6F8F9")
        .attr("stop-opacity", 1);

    gradients.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#D4DAE0")
        .attr("stop-opacity", 1);

    gradients = defs
        .append("radialGradient")
        .attr("id", "gradient-bars")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("cx", "0")
        .attr("cy", "0")
        .attr("r", maxBarHeight)
        .attr("spreadMethod", "pad");

    gradients.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#F3D5AA");

    gradients.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "#F4A636");

    gradients.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#AF4427");

    svg.append("circle")
        .attr("r", maxBarHeight + 70)
        .classed("category-circle", true);

    svg.append("circle")
        .attr("r", maxBarHeight + 40)
        .classed("question-circle", true);

    svg.append("circle")
        .attr("r", maxBarHeight)
        .classed("chart-area-circle", true);

    svg.append("circle")
        .attr("r", innerRadius)
        .classed("center-circle", true);

    //d3.csv(csv, function(error, data) {
    //var bus_id = "-4TMQnQJW1yd6NqGRDvAeA";
    var bus_name = '';
    d3.json('data/categorized_checkins_with_attributes.json', function(error, data_new) {
        var ldab= [];
        console.log(error);
        $.each(data_new,function(ind,val){

            if (val.hasOwnProperty(bus_id)){
                bus_name = val[bus_id].name;
                $.each(val[bus_id].checkins,function(days,times){
                    $.each(times,function(time,value){
                        ldab.push({'category_label':days,'question_label': time,'value':''+value});
                    });
                });
                attributes = val[bus_id].attributes;
            }
        });

        $("#resto_name").html(bus_name);
        var data = ldab;

        var cats = data.map(function(d, i) {
            return d.category_label;
        });

        var catCounts = {};
        for (var i = 0; i < cats.length; i++) {
            var num = cats[i];
            catCounts[num] = catCounts[num] ? catCounts[num] + 1 : 1;
        }
        // remove dupes (not exactly the fastest)
        cats = cats.filter(function(v, i) {
            return cats.indexOf(v) == i;
        });
        var numCatBars = cats.length;

        var angle = 0,
            rotate = 0;

        data.forEach(function(d, i) {
            // bars start and end angles
            d.startAngle = angle;
            angle += (2 * Math.PI) / numCatBars / catCounts[d.category_label];
            d.endAngle = angle;

            // y axis minor lines (i.e. questions) rotation
            d.rotate = rotate;
            rotate += 360 / numCatBars / catCounts[d.category_label];
        });

        // category_label
        var arc_category_label = d3.svg.arc()
            .startAngle(function(d, i) {
                return (i * 2 * Math.PI) / numCatBars;
            })
            .endAngle(function(d, i) {
                return ((i + 1) * 2 * Math.PI) / numCatBars;
            })
            .innerRadius(maxBarHeight + 40)
            .outerRadius(maxBarHeight + 64);

        var category_text = svg.selectAll("path.category_label_arc")
            .data(cats)
            .enter().append("path")
            .classed("category-label-arc", true)
            .attr("id", function(d, i) {
                return "category_label_" + i;
            }) //Give each slice a unique ID
            .attr("fill", "none")
            .attr("d", arc_category_label);

        category_text.each(function(d, i) {
            //Search pattern for everything between the start and the first capital L
            var firstArcSection = /(^.+?)L/;

            //Grab everything up to the first Line statement
            var newArc = firstArcSection.exec(d3.select(this).attr("d"))[1];
            //Replace all the commas so that IE can handle it
            newArc = newArc.replace(/,/g, " ");

            //If the whole bar lies beyond a quarter of a circle (90 degrees or pi/2)
            // and less than 270 degrees or 3 * pi/2, flip the end and start position
            var startAngle = (i * 2 * Math.PI) / numCatBars,
                endAngle = ((i + 1) * 2 * Math.PI) / numCatBars;

            if (startAngle > Math.PI / 2 && startAngle < 3 * Math.PI / 2 && endAngle > Math.PI / 2 && endAngle < 3 * Math.PI / 2) {
                var startLoc = /M(.*?)A/, //Everything between the capital M and first capital A
                    middleLoc = /A(.*?)0 0 1/, //Everything between the capital A and 0 0 1
                    endLoc = /0 0 1 (.*?)$/; //Everything between the 0 0 1 and the end of the string (denoted by $)
                //Flip the direction of the arc by switching the start and end point (and sweep flag)
                var newStart = endLoc.exec(newArc)[1];
                var newEnd = startLoc.exec(newArc)[1];
                var middleSec = middleLoc.exec(newArc)[1];

                //Build up the new arc notation, set the sweep-flag to 0
                newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
            } //if

            //Create a new invisible arc that the text can flow along
            /*                            svg.append("path")
             .attr("class", "hiddenDonutArcs")
             .attr("id", "category_label_"+i)
             .attr("d", newArc)
             .style("fill", "none");*/

            // modifying existing arc instead
            d3.select(this).attr("d", newArc);
        });

        svg.selectAll(".category-label-text")
            .data(cats)
            .enter().append("text")
            .attr("class", "category-label-text")
            //.attr("x", 0)   //Move the text from the start angle of the arc
            //Move the labels below the arcs for those slices with an end angle greater than 90 degrees
            .attr("dy", function(d, i) {
                var startAngle = (i * 2 * Math.PI) / numCatBars,
                    endAngle = ((i + 1) * 2 * Math.PI) / numCatBars;
                return (startAngle > Math.PI / 2 && startAngle < 3 * Math.PI / 2 && endAngle > Math.PI / 2 && endAngle < 3 * Math.PI / 2 ? -4 : 14);
            })
            .append("textPath")
            .attr("startOffset", "50%")
            .style("text-anchor", "middle")
            .attr("xlink:href", function(d, i) {
                return "#category_label_" + i;
            })
            .text(function(d) {
                return d;
            });

        // question_label
        var arc_question_label = d3.svg.arc()
            .startAngle(function(d, i) {
                return d.startAngle;
            })
            .endAngle(function(d, i) {
                return d.endAngle;
            })
            //.innerRadius(maxBarHeight + 2)
            .outerRadius(maxBarHeight + 2);

        var question_text = svg.selectAll("path.question_label_arc")
            .data(data)
            .enter().append("path")
            .classed("question-label-arc", true)
            .attr("id", function(d, i) {
                return "question_label_" + i;
            }) //Give each slice a unique ID
            .attr("fill", "none")
            .attr("d", arc_question_label);

        question_text.each(function(d, i) {
            //Search pattern for everything between the start and the first capital L
            var firstArcSection = /(^.+?)L/;

            //Grab everything up to the first Line statement
            var newArc = firstArcSection.exec(d3.select(this).attr("d"))[1];
            //Replace all the commas so that IE can handle it
            newArc = newArc.replace(/,/g, " ");

            //If the end angle lies beyond a quarter of a circle (90 degrees or pi/2)
            //flip the end and start position
            if (d.startAngle > Math.PI / 2 && d.startAngle < 3 * Math.PI / 2 && d.endAngle > Math.PI / 2 && d.endAngle < 3 * Math.PI / 2) {
                var startLoc = /M(.*?)A/, //Everything between the capital M and first capital A
                    middleLoc = /A(.*?)0 0 1/, //Everything between the capital A and 0 0 1
                    endLoc = /0 0 1 (.*?)$/; //Everything between the 0 0 1 and the end of the string (denoted by $)
                //Flip the direction of the arc by switching the start and end point (and sweep flag)
                var newStart = endLoc.exec(newArc)[1];
                var newEnd = startLoc.exec(newArc)[1];
                var middleSec = middleLoc.exec(newArc)[1];

                //Build up the new arc notation, set the sweep-flag to 0
                newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
            } //if

            //Create a new invisible arc that the text can flow along
            /*                            svg.append("path")
             .attr("class", "hiddenDonutArcs")
             .attr("id", "question_label_"+i)
             .attr("d", newArc)
             .style("fill", "none");*/

            // modifying existing arc instead
            d3.select(this).attr("d", newArc);
        });

        question_text = svg.selectAll(".question-label-text")
            .data(data)
            .enter().append("text")
            .attr("class", "question-label-text")
            //.attr("x", 0)   //Move the text from the start angle of the arc
            //.attr("y", 0)
            //Move the labels below the arcs for those slices with an end angle greater than 90 degrees
            /*                        .attr("dy", function (d, i) {
             return (d.startAngle > Math.PI / 2 && d.startAngle < 3 * Math.PI / 2 && d.endAngle > Math.PI / 2 && d.endAngle < 3 * Math.PI / 2 ? 10 : -10);
             })*/
            .append("textPath")
            //.attr("startOffset", "50%")
            //.style("text-anchor", "middle")
            //.style("dominant-baseline", "central")
            .style('font-size', '7px')
            .style('font-family', 'sans-serif')
            .attr("xlink:href", function(d, i) {
                return "#question_label_" + i;
            })
            .text(function(d) {
                return d.question_label.toUpperCase();
            })
            .call(wrapTextOnArc, maxBarHeight);

        // adjust dy (labels vertical start) based on number of lines (i.e. tspans)
        question_text.each(function(d, i) {
            //console.log(d3.select(this)[0]);
            var textPath = d3.select(this)[0][0],
                tspanCount = textPath.childNodes.length;

            if (d.startAngle > Math.PI / 2 && d.startAngle < 3 * Math.PI / 2 && d.endAngle > Math.PI / 2 && d.endAngle < 3 * Math.PI / 2) {
                // set baseline for one line and adjust if greater than one line
                d3.select(textPath.childNodes[0]).attr("dy", 3 + (tspanCount - 1) * -0.6 + 'em');
            } else {
                d3.select(textPath.childNodes[0]).attr("dy", -2.1 + (tspanCount - 1) * -0.6 + 'em');
            }
        });

        /* bars */
        var arc = d3.svg.arc()
            .startAngle(function(d, i) {
                return d.startAngle;
            })
            .endAngle(function(d, i) {
                return d.endAngle;
            })
            .innerRadius(innerRadius);

        var bars = svg.selectAll("path.bar")
            .data(data)
            .enter().append("path")
            .classed("bars", true)
            .each(function(d) {
                d.outerRadius = innerRadius;
            })
            .attr("d", arc);

        bars.transition().ease("elastic").duration(1000).delay(function(d, i) {
            return i * 100;
        })
            .attrTween("d", function(d, index) {
                var i = d3.interpolate(d.outerRadius, x_scale(+d.value));
                return function(t) {
                    d.outerRadius = i(t);
                    return arc(d, index);
                };
            });

        var x_scale = d3.scale.linear()
            .domain([0, 100])
            .range([innerRadius, maxBarHeight]);


        var y_scale = d3.scale.linear()
            .domain([0, 100])
            .range([-innerRadius, -maxBarHeight]);

        svg.selectAll("circle.x.minor")
            .data(y_scale.ticks(10))
            .enter().append("circle")
            .classed("gridlines minor", true)
            .attr("r", function(d) {
                return x_scale(d);
            });

        // question lines
        svg.selectAll("line.y.minor")
            .data(data)
            .enter().append("line")
            .classed("gridlines minor", true)
            .attr("y1", -innerRadius)
            .attr("y2", -maxBarHeight - 40)
            .attr("transform", function(d, i) {
                return "rotate(" + (d.rotate) + ")";
            });

        // category lines
        svg.selectAll("line.y.major")
            .data(cats)
            .enter().append("line")
            .classed("gridlines major", true)
            .attr("y1", -innerRadius)
            .attr("y2", -maxBarHeight - 70)
            .attr("transform", function(d, i) {
                return "rotate(" + (i * 360 / numCatBars) + ")";
            });
    });
    d3.json('data/categorized_checkins_with_attributes.json', function(error, data_new) {
        $.each(data_new, function (ind, val) {
            if (val.hasOwnProperty(bus_id)) {
                bus_name = val[bus_id].name;
                attributes = val[bus_id].attributes;
                $("#key_features").html('');
                $("#key_features").html('Key Features');
                $('#attrib_table').html('');
                var table = d3.select("#attrib_table");

                var tr_alcohol = table.append('tr');

                tr_alcohol.append('td').append('h5').text('Alcohol:');
                tr_alcohol.append('td').append('h5').text(attributes.Alcohol);
                var BusinessParking = table.append('tr');
                BusinessParking.append('td').append('h5').text('Business Parking:');
                BusinessParking.append('td').append('h5').text(attributes.BusinessParking);
                var GoodForMeal = table.append('tr');
                GoodForMeal.append('td').append('h5').text('Good For Meal:');
                GoodForMeal.append('td').append('h5').text(attributes.GoodForMeal);
                var Music = table.append('tr');
                Music.append('td').append('h5').text('Music:');
                Music.append('td').append('h5').text(attributes.Music);
                var WheelchairAccessible = table.append('tr');
                WheelchairAccessible.append('td').append('h5').text('Wheel chair Accessible:');
                WheelchairAccessible.append('td').append('h5').text(attributes.WheelchairAccessible);
            }
        });
    });

}
function wrapTextOnArc(text, radius) {
    // note getComputedTextLength() doesn't work correctly for text on an arc,
    // hence, using a hidden text element for measuring text length.
    var temporaryText = d3.select('#radial_svg')
        .append("text")
        .attr("class", "temporary-text") // used to select later
        .style("font", "7px sans-serif")
        .style("opacity", 0); // hide element

    var getTextLength = function(string) {
        temporaryText.text(string);
        return temporaryText.node().getComputedTextLength();
    };

    text.each(function(d) {
        var text = d3.select(this),
            words = text.text().split(/[ \f\n\r\t\v]+/).reverse(), //Don't cut non-breaking space (\xA0), as well as the Unicode characters \u00A0 \u2028 \u2029)
            word,
            wordCount = words.length,
            line = [],
            textLength,
            lineHeight = 1.1, // ems
            x = 0,
            y = 0,
            dy = 0,
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em"),
            arcLength = ((d.endAngle - d.startAngle) / (2 * Math.PI)) * (2 * Math.PI * radius),
            paddedArcLength = arcLength - 16;

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            textLength = getTextLength(tspan.text());
            tspan.attr("x", (arcLength - textLength) / 2);

            if (textLength > paddedArcLength && line.length > 1) {
                // remove last word
                line.pop();
                tspan.text(line.join(" "));
                textLength = getTextLength(tspan.text());
                tspan.attr("x", (arcLength - textLength) / 2);

                // start new line with last word
                line = [word];
                tspan = text.append("tspan").attr("dy", lineHeight + dy + "em").text(word);
                textLength = getTextLength(tspan.text());
                tspan.attr("x", (arcLength - textLength) / 2);
            }
        }
    });

    d3.selectAll("text.temporary-text").remove()
}

function clicked(d) {
    console.log(d.id);
    if (states_id.indexOf(d.id)!=-1) {
        this.setAttribute('class', 'states');
        //var state_id  = (d.id+'').slice(0,-3);
        var state_info = (getinfo(d.id))[0];
        var x, y, z;
        if (d && centered !== d) {
            var centroid = path.centroid(d),
                x = centroid[0],
                y = centroid[1],
                k = 4;
            centered = d;
        } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;
        }
        if (centered){
            g.selectAll('path').classed('active', centered && function (d) {
                   return d === centered;
            });
        }
        else{
            this.setAttribute('class','selected_state');
        }


        g.transition()
            .duration(750)
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1.5 / k + "px");
        $("#state_name_title").html(state_info.state);
        $("#cusine").html('');
        $("#state_wise_best_place").html(state_info.state);
        $("#state_wise_sub_title").html("Best places in "+state_info.state);
        var state_data = {};
        $.getJSON('data/state_data.json', function (obj) {
            $.each(obj, function (ind, val) {
                if (val.id == d.id) {
                    state_data = val;
                    $.each(val.top_5_cuisines, function (ind, cusine_data) {
                        console.log(cusine_data);
                        var pos = Math.floor(cusine_data.pos);
                        add_emoticon(cusine_data.name, pos, 10 - pos);
                    });
                    resto_info(state_data);
                    //draw('categorized_checkins.json');
                }
            });
        });

        //this.setAttribute('class','states selected_state');
    }
}


function delay (URL) {
    setTimeout( function() { window.location = URL }, 500 );
}